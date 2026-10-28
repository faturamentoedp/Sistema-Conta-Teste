import { formatBRL, formatNum } from './formatadores';
import { icmsDaLinha } from './exportarCsv';
import type { ResultadoCalculo } from './tipos';

interface Props {
  resultado: ResultadoCalculo;
  categoria: string;
  instalacao: string;
  aoExportar: () => void;
}

/** Painel da direita: avisos, cartões de totais, tabela da NFe e resumo de PIS/COFINS. */
export default function ResultadoFatura({ resultado, categoria, instalacao, aoExportar }: Props) {
  const linhasDaNota = resultado.detalhes.filter((l) => !l.is_informativo);

  return (
    <div className="space-y-8">

      {/* Dado faltando para o período (tarifa fora de vigência, PIS/COFINS
          do mês): o motor segue calculando com o último valor conhecido,
          então o resultado vem junto de um aviso em vez de parecer certo. */}
      {Array.isArray(resultado.avisos) && resultado.avisos.length > 0 && (
        <div role="alert" className="border border-amber-300 bg-amber-50 text-amber-900 rounded px-4 py-3 text-xs space-y-1">
          <p className="font-bold uppercase tracking-wide">Atenção - resultado pode divergir da fatura</p>
          {resultado.avisos.map((a, i) => <p key={i}>{a}</p>)}
        </div>
      )}

      {/* Cards com os Valores Totais */}
      <div className="flex flex-wrap md:flex-nowrap items-stretch gap-0 border-b border-slate-200 pb-4">

        <div className="flex-1 pl-4 border-l-4 border-blue-600 py-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">TOTAL ENERGIA</span>
          <span className="text-xl font-bold text-black">{formatBRL(resultado.resumo.total_energia)}</span>
        </div>

        <div className="flex-1 pl-4 border-l-4 border-orange-500 py-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">PIS/COFINS</span>
          <span className="text-xl font-bold text-black">{formatBRL(resultado.resumo.total_pis_cofins)}</span>
        </div>

        <div className="flex-1 pl-4 border-l-4 border-yellow-500 py-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ICMS</span>
          <span className="text-xl font-bold text-black">{formatBRL(resultado.resumo.total_icms)}</span>
        </div>

        <div className="flex-1 pl-4 border-l-4 border-purple-500 py-1 bg-purple-50/40">
          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">FIO B (INFORMATIVO)</span>
          <span className="text-xl font-bold text-purple-900">{formatBRL(resultado.resumo.valor_fio_b || 0)}</span>
        </div>

        {!!resultado.resumo.valor_escassez && (
          <div className="flex-1 pl-4 border-l-4 border-cyan-600 py-1 bg-cyan-50/40">
            <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider block">ESCASSEZ HÍDRICA (INFORMATIVO)</span>
            <span className="text-xl font-bold text-cyan-900">{formatBRL(resultado.resumo.valor_escassez)}</span>
          </div>
        )}

        {/* Mensagem "Benefício Tarifário obtido com a Tarifa Social" da
            fatura Baixa Renda (80 kWh isentos x TUSD+TE). Informativo:
            não entra no total. Só aparece em Baixa Renda de ES. */}
        {!!resultado.resumo.valor_beneficio_tarifa_social && (
          <div className="flex-1 pl-4 border-l-4 border-rose-500 py-1 bg-rose-50/40">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">BENEFÍCIO TARIFA SOCIAL (INFORMATIVO)</span>
            <span className="text-xl font-bold text-rose-900">{formatBRL(resultado.resumo.valor_beneficio_tarifa_social)}</span>
          </div>
        )}

        <div className="flex-1 pl-4 border-l-4 border-emerald-600 py-1 bg-emerald-50/50">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">TOTAL FATURA</span>
          <span className="text-2xl font-bold text-emerald-800">{formatBRL(resultado.resumo.total_fatura)}</span>
        </div>

      </div>

      {/* Representação da Tabela NFe */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-[#2f364b] font-bold text-sm px-4 py-2 rounded-md">
            Detalhamento NFe
            <span className="mx-3 w-px h-4 bg-slate-300"></span>
            {categoria}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar Tabela (CSV / Excel)
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="modern-table w-full text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-center">Unid</th>
                <th className="p-2 text-right">Quantidade</th>
                <th className="p-2 text-right">Preço Unit (R$) com tributos</th>
                <th className="p-2 text-right">Valor Total R$</th>
                <th className="p-2 text-right">PIS/COFINS</th>
                <th className="p-2 text-right">Base Calc. ICMS (R$)</th>
                <th className="p-2 text-right">Alíquota ICMS (%)</th>
                <th className="p-2 text-right">ICMS (R$)</th>
                <th className="p-2 text-right">Tarifa Unit. (R$)</th>
              </tr>
            </thead>
            <tbody>
              {linhasDaNota.map((l, i) => {
                const { baseIcmsVal, aliquotaIcmsVal } = icmsDaLinha(l, categoria, resultado.parametros_usados);

                return (
                  <tr key={i} className={l.is_injetada ? "bg-emerald-50/60 text-emerald-900 border-b border-slate-200" : "border-b border-slate-200"}>
                    <td className="p-2 font-semibold flex items-center gap-2">
                      {l.nome}
                      {l.is_injetada && (
                        <span className="text-[9px] uppercase font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Injetada</span>
                      )}
                    </td>
                    <td className="p-2 text-center">{l.unidade}</td>
                    <td className="p-2 text-right font-mono">{formatNum(l.quantidade, 4)}</td>
                    <td className="p-2 text-right font-mono">{formatNum(l.preco_unit, 8)}</td>
                    <td className="p-2 text-right font-bold font-mono">{formatBRL(l.valor_total)}</td>
                    <td className="p-2 text-right font-mono">{formatBRL(l.valor_pis_cofins)}</td>
                    <td className="p-2 text-right font-mono">{baseIcmsVal === 0 ? "0,00" : formatBRL(baseIcmsVal)}</td>
                    <td className="p-2 text-right font-mono">{aliquotaIcmsVal === 0 ? "0,000" : formatNum(aliquotaIcmsVal, 3)}</td>
                    <td className="p-2 text-right font-mono">{formatBRL(l.valor_icms)}</td>
                    <td className="p-2 text-right font-mono">{formatNum(l.tarifa_base || 0, 8)}</td>
                  </tr>
                );
              })}

              {/* Linha da Contribuição de Iluminação Pública (CIP) */}
              {resultado.resumo.valor_cip > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-semibold">Contribuição de Ilum. Pública - Lei Municipal</td>
                  <td className="p-2 text-center"></td>
                  <td className="p-2 text-right font-mono">1,0000</td>
                  <td className="p-2 text-right font-mono">{formatNum(resultado.resumo.valor_cip, 8)}</td>
                  <td className="p-2 text-right font-bold font-mono">{formatBRL(resultado.resumo.valor_cip)}</td>
                  <td className="p-2 text-right font-mono">-</td>
                  <td className="p-2 text-right font-mono">0,00</td>
                  <td className="p-2 text-right font-mono">0,000</td>
                  <td className="p-2 text-right font-mono">-</td>
                  <td className="p-2 text-right font-mono">0,00000000</td>
                </tr>
              )}

              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-800">
                <td colSpan={4} className="p-2 text-left uppercase">TOTAL</td>
                <td className="p-2 text-right font-mono">
                  {formatBRL(resultado.resumo.total_fatura)}
                </td>
                <td className="p-2 text-right font-mono">{formatBRL(resultado.resumo.total_pis_cofins)}</td>
                <td className="p-2 text-right font-mono">
                  {formatBRL(linhasDaNota.reduce((acc, l) => acc + (l.base_icms || (l.valor_icms > 0 ? (categoria.startsWith('B2') ? l.valor_total / 3 : l.valor_total) : 0)), 0))}
                </td>
                <td className="p-2 text-right font-mono">-</td>
                <td className="p-2 text-right font-mono">{formatBRL(resultado.resumo.total_icms)}</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Tributos (PIS/COFINS) */}
      <div className="mt-8">
        <div className="mb-4">
          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-[#2f364b] font-bold text-sm px-4 py-2 rounded-md">
            Resumo de Tributos
            <span className="mx-3 w-px h-4 bg-slate-300"></span>
            PIS / COFINS
          </span>
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
                <td className="font-semibold text-blue-800">PIS</td>
                <td className="currency text-orange-600">{formatBRL(resultado.resumo.total_base_pis_cofins)}</td>
                <td className="currency text-blue-600">{(resultado.parametros_usados.aliquota_pis_aplicada * 100).toFixed(3).replace('.', ',')}</td>
                <td className="currency font-semibold">{formatBRL(resultado.resumo.total_pis)}</td>
              </tr>
              <tr>
                <td className="font-semibold text-blue-800">COFINS</td>
                <td className="currency text-orange-600">{formatBRL(resultado.resumo.total_base_pis_cofins)}</td>
                <td className="currency text-blue-600">{(resultado.parametros_usados.aliquota_cofins_aplicada * 100).toFixed(3).replace('.', ',')}</td>
                <td className="currency font-semibold">{formatBRL(resultado.resumo.total_cofins)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
