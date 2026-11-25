import { formatBRL, formatNum } from './formatadores';
import type { ResultadoReforma as Reforma } from './tipos';

const percentual = (v: number, casas = 1) => `${(v * 100).toFixed(casas).replace('.', ',')}%`;

/** Comparação "Atual x Reforma 2027" (preliminar), mostrada acima do resultado atual. */
export default function ResultadoReforma({ reforma }: { reforma: Reforma }) {
  if ('indisponivel' in reforma) {
    return (
      <div role="status" className="border border-amber-300 bg-amber-50 text-amber-900 rounded px-4 py-3 text-xs space-y-1">
        <p className="font-bold uppercase tracking-wide">Reforma 2027: ainda não dá para simular esta fatura</p>
        {reforma.indisponivel.map((m, i) => <p key={i}>{m}</p>)}
        <p>O resultado abaixo é o cálculo atual.</p>
      </div>
    );
  }

  const { resumo, aliquotas, linhas, observacoes } = reforma;
  const sinal = resumo.diferenca > 0 ? '+' : '';

  return (
    <section aria-label="Simulação da Reforma Tributária" className="space-y-4 border-b-2 border-slate-300 pb-8">
      <div role="alert" className="border border-amber-300 bg-amber-50 text-amber-900 rounded px-4 py-3 text-xs space-y-1">
        <p className="font-bold uppercase tracking-wide">Reforma 2027 - simulação preliminar</p>
        {observacoes.map((o, i) => <p key={i}>{o}</p>)}
      </div>

      <div className="flex flex-wrap items-stretch gap-y-3 border-b border-slate-200 pb-4">
        <div className="flex-1 min-w-36 pl-4 border-l-4 border-slate-400 py-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total atual</span>
          <span className="text-xl font-bold text-black">{formatBRL(resumo.total_atual)}</span>
        </div>
        <div className="flex-1 min-w-36 pl-4 border-l-4 border-emerald-600 py-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Total reforma</span>
          <span className="text-2xl font-bold text-emerald-800" data-testid="total-reforma">{formatBRL(resumo.total_fatura)}</span>
        </div>
        <div className="flex-1 min-w-36 pl-4 border-l-4 border-blue-600 py-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Diferença</span>
          <span className="text-xl font-bold text-black">
            {sinal}{formatBRL(resumo.diferenca)} ({sinal}{formatNum(resumo.diferenca_percentual, 2)}%)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="modern-table w-full text-xs">
          <thead>
            <tr className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
              <th className="p-2 text-left">Descrição (reforma)</th>
              <th className="p-2 text-right">Quantidade (kWh)</th>
              <th className="p-2 text-right">Preço Unit (R$) com tributos</th>
              <th className="p-2 text-right">Valor Total R$</th>
              <th className="p-2 text-right">CBS/IBS (R$)</th>
              <th className="p-2 text-right">Base Calc. ICMS (R$)</th>
              <th className="p-2 text-right">Alíquota ICMS (%)</th>
              <th className="p-2 text-right">ICMS (R$)</th>
              <th className="p-2 text-right">Tarifa Unit. (R$)</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="p-2 font-semibold">{l.nome}</td>
                <td className="p-2 text-right font-mono">{formatNum(l.quantidade, 4)}</td>
                <td className="p-2 text-right font-mono">{formatNum(l.preco_unit, 8)}</td>
                <td className="p-2 text-right font-bold font-mono">{formatBRL(l.valor_total)}</td>
                <td className="p-2 text-right font-mono">{formatBRL(l.valor_cbs_ibs)}</td>
                <td className="p-2 text-right font-mono">{formatBRL(l.base_icms)}</td>
                <td className="p-2 text-right font-mono">{formatNum(l.aliquota_icms, 3)}</td>
                <td className="p-2 text-right font-mono">{formatBRL(l.valor_icms)}</td>
                <td className="p-2 text-right font-mono">{formatNum(l.tarifa_base, 8)}</td>
              </tr>
            ))}
            {resumo.valor_cip > 0 && (
              <tr className="border-b border-slate-200">
                <td className="p-2 font-semibold" colSpan={3}>Contribuição de Ilum. Pública (sem CBS/IBS)</td>
                <td className="p-2 text-right font-bold font-mono">{formatBRL(resumo.valor_cip)}</td>
                <td colSpan={5}></td>
              </tr>
            )}
            {resumo.outros_valores !== 0 && (
              <tr className="border-b border-slate-200">
                <td className="p-2 font-semibold" colSpan={3}>Ajustes / Outros Valores (tributação indefinida)</td>
                <td className="p-2 text-right font-bold font-mono">{formatBRL(resumo.outros_valores)}</td>
                <td colSpan={5}></td>
              </tr>
            )}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-800">
              <td className="p-2 text-left uppercase" colSpan={3}>Total</td>
              <td className="p-2 text-right font-mono">{formatBRL(resumo.total_fatura)}</td>
              <td colSpan={3}></td>
              <td className="p-2 text-right font-mono">{formatBRL(resumo.total_icms)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="w-full xl:w-1/2">
        <table className="modern-table">
          <thead>
            <tr>
              <th>TRIBUTOS</th>
              <th className="text-right">BASE DE CALC. (R$)</th>
              <th className="text-right">ALIQUOTA (%)</th>
              <th className="text-right">VALOR (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold text-blue-800">CBS</td>
              <td className="currency">{formatBRL(resumo.base_cbs_ibs)}</td>
              <td className="currency">{percentual(aliquotas.cbs)}</td>
              <td className="currency font-semibold">{formatBRL(resumo.valor_cbs)}</td>
            </tr>
            <tr>
              <td className="font-semibold text-blue-800">IBS</td>
              <td className="currency">{formatBRL(resumo.base_cbs_ibs)}</td>
              <td className="currency">{percentual(aliquotas.ibs)}</td>
              <td className="currency font-semibold">{formatBRL(resumo.valor_ibs)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {aliquotas.icms > 0 && (
        <p className="text-[11px] text-slate-600">
          Ponto em aberto: se CBS e IBS <strong>não</strong> entrassem na base do ICMS, o total seria {formatBRL(resumo.total_icms_sem_cbs_ibs)}.
        </p>
      )}
    </section>
  );
}
