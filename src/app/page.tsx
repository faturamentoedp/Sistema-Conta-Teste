'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [form, setForm] = useState({
    instalacao: '',
    documento_impressao: '',
    distribuidora: 'ES',
    categoria: 'B1C',
    fase: 'monofasico',
    data_leitura_anterior: '',
    data_leitura_atual: '',
    consumo_kwh: '100',
    consumo_reservado: '',
    consumo_ponta: '',
    consumo_fora_ponta: '',
    consumo_intermediario: '',
    inj_ponta: '',
    inj_fora_ponta: '',
    inj_intermediario: '',
    bandeira_mes1: 'VERDE',
    bandeira_mes2: 'AMARELA',
    bandeira_mes3: 'VERDE',
    valor_cip: '0.00',
    icms_opcao: 'auto',
  });
  const [descontoBT, setDescontoBT] = useState(false);
  const [sudeneAtivo, setSudeneAtivo] = useState(false);
  const [ajustes, setAjustes] = useState<{nome: string, valor: string}[]>([{nome: '', valor: ''}]);

  // Geração Distribuída: a unidade pode ser geradora ou receptora, e uma
  // receptora pode receber rateio de várias geradoras, cada uma com o seu
  // enquadramento.
  const [gdAtivo, setGdAtivo] = useState(false);
  const [gdPapel, setGdPapel] = useState<'receptor' | 'gerador'>('receptor');
  const [geradoras, setGeradoras] = useState<{consumo: string, percentual: string, modalidade: string}[]>(
    [{consumo: '', percentual: '100', modalidade: 'GD1'}]
  );

  const brOuTb = form.categoria.startsWith('B1BR') || form.categoria.endsWith('_TB');

  // Quantos meses-calendário o período de leitura cruza. Usado só para avisar
  // quando a Bandeira Mês 3 não vai ter efeito - a conta de verdade é feita
  // por calcular_proporcionalidade_dias no motor.
  const mesesNoPeriodo = (() => {
    if (!form.data_leitura_anterior || !form.data_leitura_atual) return 0;
    const ant = new Date(form.data_leitura_anterior + 'T00:00:00Z');
    const atu = new Date(form.data_leitura_atual + 'T00:00:00Z');
    if (isNaN(ant.getTime()) || isNaN(atu.getTime()) || atu <= ant) return 0;
    const inicio = new Date(ant.getTime() + 86400000);
    return (atu.getUTCFullYear() - inicio.getUTCFullYear()) * 12
      + (atu.getUTCMonth() - inicio.getUTCMonth()) + 1;
  })();

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Qualquer mudança de parâmetro descarta o resultado que está na tela.
  const primeiraRenderizacao = React.useRef(true);
  React.useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    setResultado(null);
    setError(null);
  }, [form, ajustes, gdAtivo, gdPapel, geradoras, descontoBT, sudeneAtivo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNum = (val: number, decimals: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fatorBT = descontoBT ? 0.985 : 1.0;

      const rawKwh = parseFloat(String(form.consumo_kwh).replace(',', '.')) || 0;
      const rawReservado = parseFloat(String(form.consumo_reservado).replace(',', '.')) || 0;
      const rawPonta = parseFloat(String(form.consumo_ponta).replace(',', '.')) || 0;
      const rawForaPonta = parseFloat(String(form.consumo_fora_ponta).replace(',', '.')) || 0;
      const rawInterm = parseFloat(String(form.consumo_intermediario).replace(',', '.')) || 0;

      const payload = {
        ...form,
        consumo_kwh: rawKwh * fatorBT,
        consumo_reservado: rawReservado * fatorBT,
        consumo_ponta: rawPonta * fatorBT,
        consumo_fora_ponta: rawForaPonta * fatorBT,
        consumo_intermediario: rawInterm * fatorBT,
        inj_ponta: parseFloat(String(form.inj_ponta || '').replace(',', '.')) || 0,
        inj_fora_ponta: parseFloat(String(form.inj_fora_ponta || '').replace(',', '.')) || 0,
        inj_intermediario: parseFloat(String(form.inj_intermediario || '').replace(',', '.')) || 0,
        valor_cip: parseFloat(String(form.valor_cip).replace(',', '.')) || 0,
        ajustes: ajustes.filter(a => a.valor !== '').map(a => ({ nome: a.nome || 'Ajustes / Outros Valores', valor: parseFloat(a.valor.replace(',', '.')) || 0 })),
        sudene: sudeneAtivo,
        gd_ativo: gdAtivo,
        gd_papel: gdPapel,
        geradoras: gdAtivo && gdPapel === 'receptor'
          ? geradoras
              .filter(g => g.consumo !== '')
              .map(g => ({
                consumo: (parseFloat(String(g.consumo).replace(',', '.')) || 0) * fatorBT,
                percentual: parseFloat(String(g.percentual).replace(',', '.')) || 0,
                modalidade: brOuTb ? 'GD1' : g.modalidade,
              }))
          : [],
      };

      const res = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.erro) {
        throw new Error(data.erro || 'Erro na simulação');
      }
      setResultado(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (!resultado) return;

    let csv = "\uFEFF"; // UTF-8 BOM

    csv += "=== REGISTRO DA SIMULAÇÃO DE ENERGIA ===\n";
    csv += `Instalação;${form.instalacao || 'Não informada'}\n`;
    csv += `Documento de Impressão;${form.documento_impressao || 'Não informado'}\n`;
    csv += `Geografia;EDP ${form.distribuidora}\n`;
    csv += `Tarifas;${form.categoria}\n`;
    csv += `Fase;${form.fase}\n`;
    csv += `Período de Leitura;${form.data_leitura_anterior} a ${form.data_leitura_atual}\n`;
    csv += `Tributação de ICMS;${form.icms_opcao || 'auto'}\n`;
    csv += `Bandeiras (mês 1 / 2 / 3);${form.bandeira_mes1} / ${form.bandeira_mes2} / ${form.bandeira_mes3}\n`;
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
    csv += `CIP;${formatBRL(resultado.resumo.valor_cip)}\n`;
    csv += `TOTAL FATURA;${formatBRL(resultado.resumo.total_fatura)}\n\n`;

    csv += "=== DETALHAMENTO DA NOTA FISCAL (NFe) ===\n";
    csv += "Descrição;Unid;Quantidade;Preço Unit (R$) com tributos;Valor Total R$;PIS/COFINS;Base Calc. ICMS (R$);Alíquota ICMS (%);ICMS (R$);Tarifa Unit. (R$)\n";

    resultado.detalhes.forEach((l: any) => {
      const baseIcmsVal = l.base_icms !== undefined ? l.base_icms : (l.valor_icms > 0 ? (form.categoria.startsWith('B2') && resultado.parametros_usados?.aliquota_icms_aplicada === 0.04 ? l.valor_total / 3 : l.valor_total) : 0);
      const aliquotaIcmsVal = l.aliquota_icms !== undefined ? l.aliquota_icms : (l.valor_icms > 0 ? (resultado.parametros_usados?.aliquota_icms_aplicada ? resultado.parametros_usados.aliquota_icms_aplicada * 100 : (form.categoria.startsWith('B2') ? 12 : 17)) : 0);

      csv += `"${l.nome}";"${l.unidade}";"${formatNum(l.quantidade, 4)}";"${formatNum(l.preco_unit, 8)}";"${formatBRL(l.valor_total)}";"${l.is_informativo ? '-' : formatBRL(l.valor_pis_cofins)}";"${l.is_informativo || baseIcmsVal === 0 ? '0,00' : formatBRL(baseIcmsVal)}";"${l.is_informativo || aliquotaIcmsVal === 0 ? '0,000' : formatNum(aliquotaIcmsVal, 3)}";"${l.is_informativo ? '-' : formatBRL(l.valor_icms)}";"${formatNum(l.tarifa_base || 0, 8)}"\n`;
    });

    if (resultado.resumo.valor_cip > 0) {
      csv += `"Contribuição de Ilum. Pública - Lei Municipal";"";"1,0000";"${formatNum(resultado.resumo.valor_cip, 8)}";"${formatBRL(resultado.resumo.valor_cip)}";"-";"0,00";"0,000";"-";"0,00000000"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `simulacao_fatura_${form.instalacao || 'registro'}_${form.categoria}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-[#2f364b] px-6 py-4 flex items-center shadow-md">
        <Image
          src="/images/logo.png"
          alt="Logo EDP"
          width={80}
          height={30}
          className="object-contain"
          priority
        />
        <span className="text-slate-500 mx-3 text-2xl font-light">|</span>
        <h1 className="text-lg font-bold text-white">
          Simulador de Energia
        </h1>
      </nav>

      <main className="w-full max-w-[95%] mx-auto px-4 mt-8 pb-12 flex flex-col xl:flex-row gap-12">

        {/* Formulário com os Parâmetros de Entrada */}
        <div className="w-full xl:w-[400px] shrink-0">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-black uppercase tracking-wide">Parâmetros de Entrada</h2>
            <hr className="mt-2 border-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registro de Cálculo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Instalação</label>
                <input type="text" name="instalacao" placeholder="Ex: 1140569" value={form.instalacao} onChange={handleChange} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Documento de Impressão</label>
                <input type="text" name="documento_impressao" placeholder="Ex: 1025326593" value={form.documento_impressao} onChange={handleChange} className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Geografia</label>
                <select name="distribuidora" value={form.distribuidora} onChange={handleChange} className="w-full">
                  <option value="ES">EDP ES</option>
                  <option value="SP">EDP SP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Tarifas</label>
                <select name="categoria" value={form.categoria} onChange={handleChange} className="w-full">
                  <optgroup label="Grupo B (Convencional)">
                    <option value="B1C">Fatura B1 (Res)</option>
                    <option value="B2RURAL">Fatura B2 (Rur)</option>
                    <option value="B2RUIRRG">Fatura B2 (Irr)</option>
                    <option value="B3">Fatura B3</option>
                    <option value="B1CDE">Fatura B1CDE</option>
                    <option value="B1BRN/B1BPC/B1BRQ/B1BRI">Fatura B1BRN MP 1300</option>
                    <option value="B4A">Fatura B4a</option>
                    <option value="B4B">Fatura B4b</option>
                    <option value="B3_CP">Fatura B3 (CP)</option>
                    <option value="B3_PPF">Fatura B3 (PPF)</option>
                    <option value="B3_PPE">Fatura B3 (PPE - Poder Público Estadual)</option>
                  </optgroup>
                  <optgroup label="Grupo B - Tarifa Branca">
                    <option value="B1C_TB">B1 (Res) Branca</option>
                    <option value="B2RURAL_TB">B2 (Rural) Branca</option>
                    <option value="B2RUIRRG_TB">B2 (Rural Irrig) Branca</option>
                    <option value="B3_TB">B3 Branca</option>
                    <option value="B3_PPF_TB">B3 PPF Branca</option>
                    <option value="B3_PPE_TB">B3 PPE Branca</option>
                    <option value="B3_CP_TB">B3CP Branca</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Fase */}
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Fase</label>
              <select name="fase" value={form.fase} onChange={handleChange} className="w-full">
                <option value="monofasico">Monofásico</option>
                <option value="bifasico">Bifásico</option>
                <option value="trifasico">Trifásico</option>
              </select>
            </div>

            {/* Bandeiras Tarifárias (embaixo de Fase) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Bandeira Mês 1</label>
                <select name="bandeira_mes1" value={form.bandeira_mes1} onChange={handleChange} className="w-full">
                  <option value="VERDE">Verde</option>
                  <option value="AMARELA">Amarela</option>
                  <option value="VERMELHA_P1">Vermelha P1</option>
                  <option value="VERMELHA_P2">Vermelha P2</option>
                  <option value="ESCASSEZ">Escassez</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Bandeira Mês 2</label>
                <select name="bandeira_mes2" value={form.bandeira_mes2} onChange={handleChange} className="w-full">
                  <option value="VERDE">Verde</option>
                  <option value="AMARELA">Amarela</option>
                  <option value="VERMELHA_P1">Vermelha P1</option>
                  <option value="VERMELHA_P2">Vermelha P2</option>
                  <option value="ESCASSEZ">Escassez</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Bandeira Mês 3</label>
                <select name="bandeira_mes3" value={form.bandeira_mes3} onChange={handleChange} className="w-full">
                  <option value="VERDE">Verde</option>
                  <option value="AMARELA">Amarela</option>
                  <option value="VERMELHA_P1">Vermelha P1</option>
                  <option value="VERMELHA_P2">Vermelha P2</option>
                  <option value="ESCASSEZ">Escassez</option>
                </select>
              </div>
            </div>

            {/* A bandeira do mês 3 só tem efeito quando o período de leitura
                cruza três meses-calendário. Sem esse aviso, quem preenchesse o
                campo num ciclo normal acharia que o sistema ignorou. */}
            {mesesNoPeriodo > 0 && mesesNoPeriodo < 3 && (
              <p className="text-[11px] text-slate-500 -mt-2">
                O período informado cruza {mesesNoPeriodo === 1 ? 'apenas 1 mês' : '2 meses'} — a Bandeira Mês 3 não será aplicada.
              </p>
            )}

            {/* Datas de Leitura */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Leitura Anterior</label>
                <input type="date" name="data_leitura_anterior" value={form.data_leitura_anterior} onChange={handleChange} required className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Leitura Atual</label>
                <input type="date" name="data_leitura_atual" value={form.data_leitura_atual} onChange={handleChange} required className="w-full" />
              </div>
            </div>

            {/* Consumo Ativo e Injetável (em cima do botão de MMGD) */}
            {!form.categoria.endsWith("TB") ? (
              <div className={`grid ${gdAtivo || form.categoria.startsWith("B2RUIRRG") ? (gdAtivo && form.categoria.startsWith("B2RUIRRG") ? 'grid-cols-3' : 'grid-cols-2') : 'grid-cols-1'} gap-4`}>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Consumo Ativo (kWh)</label>
                  <input type="number" name="consumo_kwh" value={form.consumo_kwh} onChange={handleChange} required className="w-full" />
                </div>
                {gdAtivo && (
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Injetável (kWh)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={geradoras[0]?.consumo || ""}
                      onChange={(e) => {
                        const n = [...geradoras];
                        if (n.length === 0) n.push({ consumo: e.target.value, percentual: '100', modalidade: 'GD1' });
                        else n[0] = { ...n[0], consumo: e.target.value };
                        setGeradoras(n);
                      }}
                      className="w-full"
                    />
                  </div>
                )}
                {form.categoria.startsWith("B2RUIRRG") && (
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Consumo Reservado (kWh)</label>
                    <input type="number" name="consumo_reservado" value={form.consumo_reservado} onChange={handleChange} className="w-full" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`grid ${form.categoria === "B2RUIRRG_TB" ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ponta (kWh)</label>
                    <input type="number" name="consumo_ponta" value={form.consumo_ponta || ""} onChange={handleChange} required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Fora Ponta (kWh)</label>
                    <input type="number" name="consumo_fora_ponta" value={form.consumo_fora_ponta || ""} onChange={handleChange} required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Interm. (kWh)</label>
                    <input type="number" name="consumo_intermediario" value={form.consumo_intermediario || ""} onChange={handleChange} required className="w-full" />
                  </div>
                  {form.categoria === "B2RUIRRG_TB" && (
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Reservado (kWh)</label>
                      <input type="number" name="consumo_reservado" value={form.consumo_reservado} onChange={handleChange} className="w-full" />
                    </div>
                  )}
                </div>
                {gdAtivo && (
                  <div className="grid grid-cols-3 gap-2 bg-emerald-50/50 p-2.5 rounded border border-emerald-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Inj. Ponta (kWh)</label>
                      <input type="text" inputMode="decimal" name="inj_ponta" value={form.inj_ponta} placeholder="0" onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Inj. Fora Ponta (kWh)</label>
                      <input type="text" inputMode="decimal" name="inj_fora_ponta" value={form.inj_fora_ponta} placeholder="0" onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-900 mb-1">Inj. Interm. (kWh)</label>
                      <input type="text" inputMode="decimal" name="inj_intermediario" value={form.inj_intermediario} placeholder="0" onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Geração Distribuída (MMGD) */}
            <div className="border-t border-slate-200 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={gdAtivo} onChange={(e) => setGdAtivo(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-xs font-bold text-black uppercase tracking-wide">Geração Distribuída (MMGD)</span>
              </label>

              {gdAtivo && (
                <div className="mt-3 space-y-4 bg-slate-50 border border-slate-200 rounded p-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Papel da unidade</label>
                    <select value={gdPapel} onChange={(e) => setGdPapel(e.target.value as 'receptor' | 'gerador')} className="w-full">
                      <option value="receptor">Receptora (recebe energia compensada)</option>
                      <option value="gerador">Geradora (apenas injeta)</option>
                    </select>
                  </div>

                  {gdPapel === 'gerador' ? (
                    <p className="text-xs text-slate-600">
                      A unidade geradora não recebe compensação nesta fatura — a energia injetada abate a conta das unidades receptoras.
                    </p>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="block text-xs font-semibold text-black">Geradoras que rateiam para esta unidade</label>
                      </div>

                      {brOuTb && (
                        <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-1 mb-2">
                          Baixa Renda e Tarifa Branca faturam sempre como GD1 — o enquadramento é fixado automaticamente.
                        </p>
                      )}

                      {geradoras.map((g, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                          <div className="col-span-6">
                            <label className="block text-[10px] text-slate-600 mb-1">Injetada (kWh)</label>
                            <input type="text" inputMode="decimal" value={g.consumo} placeholder="0"
                              onChange={(e) => { const n = [...geradoras]; n[idx].consumo = e.target.value; setGeradoras(n); }}
                              className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                          <div className="col-span-5">
                            <label className="block text-[10px] text-slate-600 mb-1">Enquadramento</label>
                            <select value={brOuTb ? 'GD1' : g.modalidade} disabled={brOuTb}
                              onChange={(e) => { const n = [...geradoras]; n[idx].modalidade = e.target.value; setGeradoras(n); }}
                              className="w-full disabled:bg-slate-100 disabled:text-slate-500">
                              <option value="GD1">GD1</option>
                              <option value="GD2">GD2</option>
                              <option value="GD3">GD3</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            {geradoras.length > 1 && (
                              <button type="button" onClick={() => setGeradoras(geradoras.filter((_, i) => i !== idx))}
                                className="text-red-500 font-bold px-2 py-2 hover:bg-red-50 rounded">X</button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={() => setGeradoras([...geradoras, {consumo: '', percentual: '100', modalidade: 'GD1'}])}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer py-1">
                        + Adicionar outra geradora
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Animated Toggle Switch para Desconto BT (Apenas para categorias Convencionais e Baixa Renda) */}
            {!form.categoria.endsWith("TB") && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Desconto BT (-1,5% kWh)</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {descontoBT
                      ? `✓ Aplicado: ${(parseFloat(form.consumo_kwh || '0') * 0.985).toFixed(2)} kWh`
                      : 'Reduz a quantidade de kWh faturada em 1,5%'}
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={descontoBT}
                  onClick={() => setDescontoBT(!descontoBT)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    descontoBT ? 'bg-[#2f364b]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      descontoBT ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Toggle do redutor SUDENE. Fica logo abaixo do Desconto BT, no
                mesmo padrão visual. Ao contrário do BT, vale também para
                Tarifa Branca, por isso está fora daquela condição. */}
            {form.distribuidora === 'ES' && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Redutor SUDENE (-R$ 7,81/MWh)</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {sudeneAtivo
                      ? '✓ Aplicado: abate proporcional aos dias a partir de 30/08/2026'
                      : 'Repactuação UBP/SUDENE para municípios da área no ES'}
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={sudeneAtivo}
                  onClick={() => setSudeneAtivo(!sudeneAtivo)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    sudeneAtivo ? 'bg-[#2f364b]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sudeneAtivo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}


            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">CIP (R$)</label>
                <input type="number" step="0.01" name="valor_cip" value={form.valor_cip} onChange={handleChange} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Tributação de ICMS</label>
                <select name="icms_opcao" value={form.icms_opcao || "auto"} onChange={handleChange} className="w-full">
                  <option value="auto">Automático (Padrão)</option>
                  <option value="isento">Isento de ICMS (0%)</option>
                  <option value="12">12%</option>
                  <option value="17">17% (Integral ES)</option>
                  <option value="18">18% (Integral SP)</option>
                  <option value="4">4% (Reduzido Rural ES)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">Ajustes / Outros Valores (R$)</label>
                {ajustes.map((aj, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Nome (ex: Multa, Devolução)" value={aj.nome || ""} onChange={(e) => {
                      const newAjustes = [...ajustes];
                      newAjustes[idx].nome = e.target.value;
                      setAjustes(newAjustes);
                    }} className="w-1/2 p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                    <input type="text" inputMode="decimal" placeholder="Valor R$ (ex: -10.00 ou 5.00)" value={aj.valor} onChange={(e) => {
                      const newAjustes = [...ajustes];
                      newAjustes[idx].valor = e.target.value;
                      setAjustes(newAjustes);
                    }} className="w-1/2 p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                    {ajustes.length > 1 && (
                      <button type="button" onClick={() => setAjustes(ajustes.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-3 py-1 hover:bg-red-50 rounded">X</button>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 mt-1 text-xs">
                  <button type="button" onClick={() => setAjustes([...ajustes, {nome: 'Multa', valor: ''}])} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Multa</button>
                  <button type="button" onClick={() => setAjustes([...ajustes, {nome: 'Retenção Imposto de Renda', valor: ''}])} className="text-amber-700 font-bold hover:underline cursor-pointer">+ Retenção IR</button>
                  <button type="button" onClick={() => setAjustes([...ajustes, {nome: '', valor: ''}])} className="text-slate-600 font-bold hover:underline cursor-pointer">+ Outro Valor</button>
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="w-full mt-4 bg-[#2f364b] hover:bg-[#1f2536] text-white font-semibold py-3 px-4 rounded transition-colors">
              {loading ? "Processando..." : "Calcular Fatura"}
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div className="w-full flex-1">
          {resultado && (
            <div className="space-y-8">

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
                    {form.categoria}
                    {form.instalacao && (
                      <>
                        <span className="mx-3 w-px h-4 bg-slate-300"></span>
                        Inst: {form.instalacao}
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={exportarCSV}
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
                      {resultado.detalhes.filter((l: any) => !l.is_informativo).map((l: any, i: number) => {
                        const baseIcmsVal = l.base_icms !== undefined ? l.base_icms : (l.valor_icms > 0 ? (form.categoria.startsWith('B2') && resultado.parametros_usados?.aliquota_icms_aplicada === 0.04 ? l.valor_total / 3 : l.valor_total) : 0);
                        const aliquotaIcmsVal = l.aliquota_icms !== undefined ? l.aliquota_icms : (l.valor_icms > 0 ? (resultado.parametros_usados?.aliquota_icms_aplicada ? resultado.parametros_usados.aliquota_icms_aplicada * 100 : (form.categoria.startsWith('B2') ? 12 : 17)) : 0);

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
                          {formatBRL(resultado.detalhes.filter((l: any) => !l.is_informativo).reduce((acc: number, l: any) => acc + (l.base_icms || (l.valor_icms > 0 ? (form.categoria.startsWith('B2') ? l.valor_total / 3 : l.valor_total) : 0)), 0))}
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
          )}
        </div>
      </main>
    </div>
  );
}
