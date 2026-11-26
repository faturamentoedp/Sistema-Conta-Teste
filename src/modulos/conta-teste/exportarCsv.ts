import { formatBRL, formatNum } from './formatadores';
import type { FormularioContaTeste, LinhaDetalhe, ReformaCalculada, ResultadoCalculo } from './tipos';

/**
 * Base e alíquota de ICMS mostradas para uma linha. Quando o motor não manda
 * os dois campos (versões antigas da resposta), reconstrói: no rural/irrigante
 * com ICMS de 4% a fatura imprime 12% sobre 1/3 do valor.
 */
export function icmsDaLinha(l: LinhaDetalhe, categoria: string, parametros: ResultadoCalculo['parametros_usados']) {
  const baseIcmsVal = l.base_icms !== undefined
    ? l.base_icms
    : (l.valor_icms > 0 ? (categoria.startsWith('B2') && parametros?.aliquota_icms_aplicada === 0.04 ? l.valor_total / 3 : l.valor_total) : 0);
  const aliquotaIcmsVal = l.aliquota_icms !== undefined
    ? l.aliquota_icms
    : (l.valor_icms > 0 ? (parametros?.aliquota_icms_aplicada ? parametros.aliquota_icms_aplicada * 100 : (categoria.startsWith('B2') ? 12 : 17)) : 0);
  return { baseIcmsVal, aliquotaIcmsVal };
}

interface OpcoesCsv {
  resultado: ResultadoCalculo;
  form: FormularioContaTeste;
  descontoBT: boolean;
  sudeneAtivo: boolean;
  /** Bandeiras com os dias da fatura, quando o usuário os informou. */
  bandeirasDias?: { bandeira: string; dias: number }[];
}

/** Monta o CSV (UTF-8 com BOM, separador ";") e dispara o download. */
export function exportarCSV({ resultado, form, descontoBT, sudeneAtivo, bandeirasDias }: OpcoesCsv) {
  let csv = "﻿"; // UTF-8 BOM

  csv += "=== REGISTRO DA SIMULAÇÃO DE ENERGIA ===\n";
  csv += `Instalação;${form.instalacao || 'Não informada'}\n`;
  csv += `Documento de Impressão;${form.documento_impressao || 'Não informado'}\n`;
  csv += `Geografia;EDP ${form.distribuidora}\n`;
  csv += `Tarifas;${form.categoria}\n`;
  csv += `Fase;${form.fase}\n`;
  csv += `Período de Leitura;${form.data_leitura_anterior} a ${form.data_leitura_atual}\n`;
  csv += `Tributação de ICMS;${form.icms_opcao || 'auto'}\n`;
  if (bandeirasDias && bandeirasDias.length > 0) {
    csv += `Bandeiras (dias na fatura);${bandeirasDias.map((b) => `${b.bandeira} ${b.dias} ${b.dias === 1 ? 'dia' : 'dias'}`).join(' / ')}\n`;
  } else {
    csv += `Bandeiras (mês 1 / 2 / 3);${form.bandeira_mes1} / ${form.bandeira_mes2} / ${form.bandeira_mes3 || 'Nenhum'}\n`;
  }
  csv += `Desconto BT (-1.5% kWh);${descontoBT ? 'SIM (Ativado)' : 'NÃO'}\n`;
  csv += `Redutor SUDENE (-R$ 7,81/MWh);${sudeneAtivo ? 'SIM (Ativado)' : 'NÃO'}\n`;
  csv += `TOTAL FATURA;${formatBRL(resultado.resumo.total_fatura)}\n\n`;

  csv += "=== RESUMO DE TOTAIS ===\n";
  csv += `Total Energia;${formatBRL(resultado.resumo.total_energia)}\n`;
  csv += `PIS/COFINS Total;${formatBRL(resultado.resumo.total_pis_cofins)}\n`;
  csv += `ICMS Total;${formatBRL(resultado.resumo.total_icms)}\n`;
  csv += `Fio B (Informativo);${formatBRL(resultado.resumo.valor_fio_b || 0)}\n`;
  if (resultado.resumo.valor_escassez) {
    csv += `Escassez Hídrica (Informativo);${formatBRL(resultado.resumo.valor_escassez)}\n`;
  }
  if (resultado.resumo.valor_beneficio_tarifa_social) {
    csv += `Benefício Tarifa Social (Informativo);${formatBRL(resultado.resumo.valor_beneficio_tarifa_social)}\n`;
  }
  csv += `CIP;${formatBRL(resultado.resumo.valor_cip)}\n`;
  csv += `TOTAL FATURA;${formatBRL(resultado.resumo.total_fatura)}\n\n`;

  csv += "=== DETALHAMENTO DA NOTA FISCAL (NFe) ===\n";
  csv += "Descrição;Unid;Quantidade;Preço Unit (R$) com tributos;Valor Total R$;PIS/COFINS;Base Calc. ICMS (R$);Alíquota ICMS (%);ICMS (R$);Tarifa Unit. (R$)\n";

  resultado.detalhes.forEach((l) => {
    const { baseIcmsVal, aliquotaIcmsVal } = icmsDaLinha(l, form.categoria, resultado.parametros_usados);

    csv += `"${l.nome}";"${l.unidade}";"${formatNum(l.quantidade, 4)}";"${formatNum(l.preco_unit, 8)}";"${formatBRL(l.valor_total)}";"${l.is_informativo ? '-' : formatBRL(l.valor_pis_cofins)}";"${l.is_informativo || baseIcmsVal === 0 ? '0,00' : formatBRL(baseIcmsVal)}";"${l.is_informativo || aliquotaIcmsVal === 0 ? '0,000' : formatNum(aliquotaIcmsVal, 3)}";"${l.is_informativo ? '-' : formatBRL(l.valor_icms)}";"${formatNum(l.tarifa_base || 0, 8)}"\n`;
  });

  if (resultado.resumo.valor_cip > 0) {
    csv += `"Contribuição de Ilum. Pública - Lei Municipal";"";"1,0000";"${formatNum(resultado.resumo.valor_cip, 8)}";"${formatBRL(resultado.resumo.valor_cip)}";"-";"0,00";"0,000";"-";"0,00000000"\n`;
  }

  baixarArquivo(csv, `simulacao_fatura_${form.instalacao || 'registro'}_${form.categoria}.csv`);
}

function baixarArquivo(csv: string, nome: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nome);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Quadro de tributos da fatura da reforma (usado na tela e no CSV). */
export function linhasDeTributosReforma({ resumo, aliquotas }: ReformaCalculada) {
  const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')}%`;
  return [
    { nome: 'CBS', base: resumo.base_cbs_ibs, aliquota: pct(aliquotas.cbs), valor: resumo.valor_cbs },
    { nome: 'IBS', base: resumo.base_cbs_ibs, aliquota: pct(aliquotas.ibs), valor: resumo.valor_ibs },
  ];
}

/** CSV da tarifa "Reforma 2027": só a fatura nova, nas colunas da planilha da área. */
export function exportarCSVReforma({ reforma, form, descontoBT }: { reforma: ReformaCalculada; form: FormularioContaTeste; descontoBT: boolean }) {
  const { resumo, linhas, ajustes, observacoes } = reforma;
  let csv = "\uFEFF"; // UTF-8 BOM

  csv += "=== REFORMA 2027 - SIMULAÇÃO PRELIMINAR ===\n";
  observacoes.forEach((o) => { csv += `"${o}"\n`; });
  csv += `Instalação;${form.instalacao || 'Não informada'}\n`;
  csv += `Documento de Impressão;${form.documento_impressao || 'Não informado'}\n`;
  csv += `Geografia;EDP ${form.distribuidora}\n`;
  csv += "Tarifas;B1 Residencial - Reforma 2027\n";
  csv += `Período de Leitura;${form.data_leitura_anterior} a ${form.data_leitura_atual}\n`;
  csv += `Desconto BT (-1.5% kWh);${descontoBT ? 'SIM (Ativado)' : 'NÃO'}\n\n`;

  csv += "Descrição;Unidade;Quantidade;Preço Unit (R$) com tributos;Valor Total (R$);CBS/IBS (R$);Base de Cálculo ICMS (R$);Alíquota ICMS (%);ICMS (R$);Preço Unit (R$)\n";
  linhas.forEach((l) => {
    csv += `"${l.nome}";"kWh";"${formatNum(l.quantidade, 4)}";"${formatNum(l.preco_unit, 8)}";"${formatBRL(l.valor_total)}";"${formatBRL(l.valor_cbs_ibs)}";"${formatBRL(l.base_icms)}";"${formatNum(l.aliquota_icms, 3)}";"${formatBRL(l.valor_icms)}";"${formatNum(l.tarifa_base, 8)}"\n`;
  });
  const semKwh = [...ajustes, ...(resumo.valor_cip > 0 ? [{ nome: 'CIP', valor: resumo.valor_cip }] : [])];
  semKwh.forEach((a) => {
    csv += `"${a.nome}";"";"";"";"${formatBRL(a.valor)}";"";"";"";"";""\n`;
  });
  csv += `"TOTAL";"";"";"";"${formatBRL(resumo.total_fatura)}";"${formatBRL(resumo.total_cbs_ibs)}";"${formatBRL(resumo.total_base_icms)}";"";"${formatBRL(resumo.total_icms)}";""\n\n`;

  csv += "Tributos;Base de Cálc (R$);Alíquota;Valor (R$)\n";
  linhasDeTributosReforma(reforma).forEach((t) => {
    csv += `${t.nome};${formatBRL(t.base)};${t.aliquota};${formatBRL(t.valor)}\n`;
  });
  if (resumo.valor_fio_b !== null) csv += `\nFio B (Informativo);${formatBRL(resumo.valor_fio_b)}\n`;
  if (resumo.valor_escassez) csv += `Escassez Hídrica (Informativo);${formatBRL(resumo.valor_escassez)}\n`;

  baixarArquivo(csv, `simulacao_reforma2027_${form.instalacao || 'registro'}.csv`);
}
