import { formatBRL, formatNum } from './formatadores';
import { linhasDeTributosReforma } from './exportarCsv';
import type { ResultadoReforma } from './tipos';

interface Props {
  reforma: ResultadoReforma;
  instalacao: string;
  aoExportar: () => void;
}

/**
 * Tarifa "Reforma 2027": mostra SÓ a fatura nova, com as colunas na ordem da aba
 * "Modelo Reforma" das planilhas da área (CBS/IBS no lugar de PIS/COFINS).
 */
export default function FaturaReforma({ reforma, instalacao, aoExportar }: Props) {
  if ('indisponivel' in reforma) {
    return (
      <div role="status" className="border border-amber-300 bg-amber-50 text-amber-900 rounded px-4 py-3 text-xs space-y-1">
        <p className="font-bold uppercase tracking-wide">Reforma 2027: ainda não dá para simular esta fatura</p>
        {reforma.indisponivel.map((m, i) => <p key={i}>{m}</p>)}
      </div>
    );
  }

  const { resumo, linhas, ajustes, aliquotas, observacoes } = reforma;

  const cartoes = [
    { rotulo: 'Total energia', valor: resumo.total_energia, borda: 'border-blue-600' },
    { rotulo: 'CBS/IBS', valor: resumo.total_cbs_ibs, borda: 'border-orange-500' },
    { rotulo: 'ICMS', valor: resumo.total_icms, borda: 'border-yellow-500' },
    ...(resumo.valor_fio_b !== null ? [{ rotulo: 'Fio B (informativo)', valor: resumo.valor_fio_b, borda: 'border-purple-500' }] : []),
    ...(resumo.valor_escassez ? [{ rotulo: 'Escassez Hídrica (informativo)', valor: resumo.valor_escassez, borda: 'border-cyan-600' }] : []),
  ];

  // Linha sem kWh (CIP, juros, multas, taxas): só descrição e valor.
  const linhaSemKwh = (chave: string, nome: string, valor: number) => (
    <tr key={chave} className="border-b border-slate-200">
      <td className="p-2 font-semibold">{nome}</td>
      <td colSpan={3}></td>
      <td className="p-2 text-right font-bold font-mono">{formatBRL(valor)}</td>
      <td colSpan={5}></td>
    </tr>
  );

  return (
    <section aria-label="Fatura da Reforma Tributária" className="space-y-8">
      <div role="alert" className="border border-amber-300 bg-amber-50 text-amber-900 rounded px-4 py-3 text-xs space-y-1">
        <p className="font-bold uppercase tracking-wide">Reforma 2027 - simulação preliminar</p>
        {observacoes.map((o, i) => <p key={i}>{o}</p>)}
      </div>

      <div className="flex flex-wrap items-stretch gap-y-3 border-b border-slate-200 pb-4">
        {cartoes.map((c) => (
          <div key={c.rotulo} className={`flex-1 min-w-32 pl-4 border-l-4 ${c.borda} py-1`}>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{c.rotulo}</span>
            <span className="text-xl font-bold text-black">{formatBRL(c.valor)}</span>
          </div>
        ))}
        <div className="flex-1 min-w-32 pl-4 border-l-4 border-emerald-600 py-1 bg-emerald-50/50">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Total fatura</span>
          <span className="text-2xl font-bold text-emerald-800" data-testid="total-reforma">{formatBRL(resumo.total_fatura)}</span>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-[#2f364b] font-bold text-sm px-4 py-2 rounded-md">
            Modelo Reforma
            <span className="mx-3 w-px h-4 bg-slate-300"></span>
            B1 Residencial
            {instalacao && (
              <>
                <span className="mx-3 w-px h-4 bg-slate-300"></span>
                Inst: {instalacao}
              </>
            )}
          </span>
          <button
            type="button"
            onClick={aoExportar}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded shadow transition-colors cursor-pointer"
          >
            Baixar Tabela (CSV / Excel)
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="modern-table w-full text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-center">Unidade</th>
                <th className="p-2 text-right">Quantidade</th>
                <th className="p-2 text-right">Preço Unit (R$) com tributos</th>
                <th className="p-2 text-right">Valor Total (R$)</th>
                <th className="p-2 text-right">CBS/IBS (R$)</th>
                <th className="p-2 text-right">Base de Cálculo ICMS (R$)</th>
                <th className="p-2 text-right">Alíquota ICMS (%)</th>
                <th className="p-2 text-right">ICMS (R$)</th>
                <th className="p-2 text-right">Preço Unit (R$)</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-2 font-semibold">{l.nome}</td>
                  <td className="p-2 text-center">kWh</td>
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
              {ajustes.map((a, i) => linhaSemKwh(`ajuste-${i}`, a.nome, a.valor))}
              {resumo.valor_cip > 0 && linhaSemKwh('cip', 'CIP', resumo.valor_cip)}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-800">
                <td colSpan={4} className="p-2 text-left uppercase">Total</td>
                <td className="p-2 text-right font-mono">{formatBRL(resumo.total_fatura)}</td>
                <td className="p-2 text-right font-mono">{formatBRL(resumo.total_cbs_ibs)}</td>
                <td className="p-2 text-right font-mono">{formatBRL(resumo.total_base_icms)}</td>
                <td></td>
                <td className="p-2 text-right font-mono">{formatBRL(resumo.total_icms)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
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
            {linhasDeTributosReforma(reforma).map((t) => (
              <tr key={t.nome}>
                <td className="font-semibold text-blue-800">{t.nome}</td>
                <td className="currency">{formatBRL(t.base)}</td>
                <td className="currency">{t.aliquota}</td>
                <td className="currency font-semibold">{formatBRL(t.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {aliquotas.icms > 0 && (
          <p className="text-[11px] text-slate-600 mt-3">
            Ponto em aberto: se CBS e IBS <strong>não</strong> entrassem na base do ICMS, o total seria {formatBRL(resumo.total_icms_sem_cbs_ibs)}.
          </p>
        )}
      </div>
    </section>
  );
}
