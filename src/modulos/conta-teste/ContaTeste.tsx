'use client';

import React, { useState } from 'react';
import { MUNICIPIOS_ES_CIP, calcular_cip_municipio } from './motor/cip-municipios.js';
import TituloSecao from '@/plataforma/componentes/TituloSecao';
import ResultadoFatura from './ResultadoFatura';
import { exportarCSV } from './exportarCsv';
import {
  aplicarPerdaBT,
  cipManualNoMunicipio,
  constanteDoMedidor,
  mesesNoPeriodo,
  nomeMunicipio,
  trechosDeBandeira,
} from './utilitarios';
import type { FormularioContaTeste, ResultadoCalculo } from './tipos';


export default function ContaTeste() {
  const [form, setForm] = useState<FormularioContaTeste>({
    instalacao: '',
    documento_impressao: '',
    distribuidora: 'ES',
    categoria: 'B1C',
    fase: 'monofasico',
    data_leitura_anterior: '',
    data_leitura_atual: '',
    constante_medidor: '1',
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
    bandeira_mes3: '',
    valor_cip: '0.00',
    icms_opcao: 'auto',
  });
  const [descontoBT, setDescontoBT] = useState(false);
  const [sudeneAtivo, setSudeneAtivo] = useState(false);
  // Município usado para preencher a CIP automaticamente (só ES). Vazio =
  // comportamento de sempre, CIP 100% manual - nada muda pra quem não usa.
  const [municipioCip, setMunicipioCip] = useState('');
  const [ajustes, setAjustes] = useState<{ nome: string, valor: string }[]>([{ nome: '', valor: '' }]);

  // Geração Distribuída: a unidade pode ser geradora ou receptora, e uma
  // receptora pode receber rateio de várias geradoras, cada uma com o seu
  // enquadramento.
  const [gdAtivo, setGdAtivo] = useState(false);
  const [gdPapel, setGdPapel] = useState<'receptor' | 'gerador'>('receptor');
  const [geradoras, setGeradoras] = useState<{ consumo: string, percentual: string, modalidade: string }[]>(
    [{ consumo: '', percentual: '100', modalidade: 'GD1' }]
  );

  const brOuTb = form.categoria.startsWith('B1BR') || form.categoria.endsWith('_TB');

  const qtdMeses = mesesNoPeriodo(form.data_leitura_anterior, form.data_leitura_atual);
  const trechosBandeira = trechosDeBandeira(form.data_leitura_anterior, form.data_leitura_atual);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
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

  // CIP automática por município (só ES). Município em branco = nada muda,
  // continua 100% manual. Escolhido um município, recalcula sempre que
  // categoria, consumo ou datas mudarem - o campo de CIP continua um input
  // normal, então o valor preenchido pode ser sobrescrito à mão a qualquer
  // momento (só volta a ser recalculado na próxima mudança de um desses
  // campos, ou ao trocar o município de novo).
  React.useEffect(() => {
    if (!municipioCip || form.distribuidora !== 'ES') return;
    if (!form.data_leitura_anterior || !form.data_leitura_atual) return;
    const dataAnt = new Date(form.data_leitura_anterior + 'T00:00:00Z');
    const dataAtu = new Date(form.data_leitura_atual + 'T00:00:00Z');
    if (isNaN(dataAnt.getTime()) || isNaN(dataAtu.getTime())) return;

    const constMedidor = constanteDoMedidor(form.constante_medidor);
    const consumo = form.categoria.endsWith('_TB')
      ? ((parseFloat(String(form.consumo_ponta).replace(',', '.')) || 0)
        + (parseFloat(String(form.consumo_fora_ponta).replace(',', '.')) || 0)
        + (parseFloat(String(form.consumo_intermediario).replace(',', '.')) || 0)) * constMedidor
      : aplicarPerdaBT((parseFloat(String(form.consumo_kwh).replace(',', '.')) || 0) * constMedidor, descontoBT);

    const cip = calcular_cip_municipio(municipioCip, form.categoria, consumo, dataAnt, dataAtu);
    if (cip !== null) {
      // Intencional: o campo de CIP é um input normal que esta sugestão
      // preenche; o usuário pode sobrescrever e só é recalculada na próxima
      // mudança de uma das dependências abaixo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, valor_cip: cip.toFixed(2) }));
    }
  }, [
    municipioCip,
    form.distribuidora,
    form.categoria,
    form.constante_medidor,
    form.consumo_kwh,
    form.consumo_ponta,
    form.consumo_fora_ponta,
    form.consumo_intermediario,
    form.data_leitura_anterior,
    form.data_leitura_atual,
    descontoBT,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // A perda de 1,5% do ramal incide sobre o consumo medido e o resultado é
      // arredondado para kWh INTEIRO antes de qualquer outra regra. Conferido
      // na fatura da Inst. 151389514 (SP, Baixa Renda): 394 x 0,985 = 388,09,
      // que a conta fatura como 388 - daí 388 - 80 isentos = 308,0000. Sem o
      // arredondamento o simulador levava 308,0900 adiante e fechava R$ 0,06
      // acima da fatura.
      //
      // Só arredonda quando o desconto está ligado: com ele desligado, um
      // consumo com decimais informado à mão continua passando como está.
      const aplicaBT = (valor: number) => aplicarPerdaBT(valor, descontoBT);

      // Constante do medidor (ex.: 40 em medição indireta): a fatura imprime a
      // diferença de leitura e a constante; o consumo é o produto. Com 1 (o
      // padrão) nada muda. O consumo mínimo (30/50/100 kWh) é aplicado pelo
      // motor depois, sobre o resultado já multiplicado.
      const constMedidor = constanteDoMedidor(form.constante_medidor);
      const rawKwh = (parseFloat(String(form.consumo_kwh).replace(',', '.')) || 0) * constMedidor;
      const rawReservado = (parseFloat(String(form.consumo_reservado).replace(',', '.')) || 0) * constMedidor;
      const rawPonta = (parseFloat(String(form.consumo_ponta).replace(',', '.')) || 0) * constMedidor;
      const rawForaPonta = (parseFloat(String(form.consumo_fora_ponta).replace(',', '.')) || 0) * constMedidor;
      const rawInterm = (parseFloat(String(form.consumo_intermediario).replace(',', '.')) || 0) * constMedidor;

      const payload = {
        ...form,
        consumo_kwh: aplicaBT(rawKwh),
        consumo_reservado: aplicaBT(rawReservado),
        consumo_ponta: aplicaBT(rawPonta),
        consumo_fora_ponta: aplicaBT(rawForaPonta),
        consumo_intermediario: aplicaBT(rawInterm),
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
              consumo: aplicaBT(parseFloat(String(g.consumo).replace(',', '.')) || 0),
              percentual: parseFloat(String(g.percentual).replace(',', '.')) || 0,
              modalidade: brOuTb ? 'GD1' : g.modalidade,
            }))
          : [],
      };

      const res = await fetch('/api/conta-teste/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.erro) {
        throw new Error(data.erro || 'Erro na simulação');
      }
      setResultado(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro na simulação');
    } finally {
      setLoading(false);
    }
  };

  const baixarCSV = () => {
    if (!resultado) return;
    exportarCSV({ resultado, form, descontoBT, sudeneAtivo });
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-12">

      {/* Formulário com os Parâmetros de Entrada */}
      <div className="w-full xl:w-[400px] shrink-0">
        <TituloSecao>Parâmetros de Entrada</TituloSecao>

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
                {/* Padrão: fatura com três bandeiras é rara, então o campo
                      nasce desligado e só entra no cálculo se for escolhido. */}
                <option value="">Nenhum</option>
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
          {trechosBandeira.length > 0 && (
            <p className="text-[11px] text-slate-600 -mt-2">
              Pelas datas informadas:{' '}
              {trechosBandeira.map((t, i) => (
                <span key={t.rotulo}>
                  {i > 0 && ' · '}
                  <strong>{t.rotulo}</strong> {t.ini} a {t.fim} ({t.dias} {t.dias === 1 ? 'dia' : 'dias'})
                </span>
              ))}
              . Use a bandeira que a fatura traz para cada um desses trechos.
            </p>
          )}

          {qtdMeses > 0 && qtdMeses < 3 && form.bandeira_mes3 !== '' && (
            <p className="text-[11px] text-slate-500 -mt-2">
              O período informado cruza {qtdMeses === 1 ? 'apenas 1 mês' : '2 meses'} — a Bandeira Mês 3 não será aplicada.
            </p>
          )}

          {/* O contrário também precisa de aviso: se o ciclo cruza três meses
                e a bandeira 3 ficou em "Nenhum", os dias do terceiro mês saem
                sem bandeira nenhuma e a conta fica menor que a real. */}
          {qtdMeses >= 3 && form.bandeira_mes3 === '' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 -mt-2">
              Este período cruza {qtdMeses} meses. Com a Bandeira Mês 3 em &quot;Nenhum&quot;, os dias do último mês ficam sem bandeira.
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

          {/* Constante do medidor - só aparece como campo comum; "1" = sem efeito. */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Constante do medidor (opcional)</label>
            <input type="text" inputMode="decimal" name="constante_medidor" value={form.constante_medidor} onChange={handleChange} className="w-full" />
            {constanteDoMedidor(form.constante_medidor) !== 1 && (
              <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-1 mt-1">
                Constante {constanteDoMedidor(form.constante_medidor)}: lance abaixo a diferença de leitura (atual − anterior) - o simulador multiplica pela constante antes de calcular.
              </p>
            )}
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

                    <button type="button" onClick={() => setGeradoras([...geradoras, { consumo: '', percentual: '100', modalidade: 'GD1' }])}
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
                <span className="text-xs font-bold text-slate-800">Desconto BT0 (-1,5% kWh)</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {descontoBT
                    ? `✓ Aplicado: ${Math.round((parseFloat(form.consumo_kwh || '0') || 0) * constanteDoMedidor(form.constante_medidor) * 0.985)} kWh`
                    : 'Reduz a quantidade de kWh faturada em 1,5%'}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={descontoBT}
                onClick={() => setDescontoBT(!descontoBT)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${descontoBT ? 'bg-[#2f364b]' : 'bg-slate-300'
                  }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${descontoBT ? 'translate-x-5' : 'translate-x-0'
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sudeneAtivo ? 'bg-[#2f364b]' : 'bg-slate-300'
                  }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sudeneAtivo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          )}


          {/* CIP automática por município - só ES, e só como atalho: o
                campo de CIP ao lado continua editável e nada muda pra quem
                deixar em "Nenhum" (comportamento manual de sempre). */}
          {form.distribuidora === 'ES' && (
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Município (CIP automática)</label>
              <select value={municipioCip} onChange={(e) => setMunicipioCip(e.target.value)} className="w-full">
                <option value="">Nenhum (informar CIP manualmente)</option>
                {MUNICIPIOS_ES_CIP.map((m: string) => (
                  <option key={m} value={m}>{nomeMunicipio(m)}{cipManualNoMunicipio(m) ? ' (CIP manual)' : ''}</option>
                ))}
              </select>
              {municipioCip && !cipManualNoMunicipio(municipioCip) && (
                <p className="text-[11px] text-slate-500 mt-1">
                  ✓ CIP calculada pela tabela de {nomeMunicipio(municipioCip)} - ainda pode ser ajustada à mão no campo CIP (R$) abaixo.
                </p>
              )}
              {municipioCip && cipManualNoMunicipio(municipioCip) && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
                  Em {nomeMunicipio(municipioCip)} a CIP é um percentual sobre o valor da fatura, não uma tabela por faixa de kWh - informe o valor da CIP à mão no campo abaixo.
                </p>
              )}
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
                <button type="button" onClick={() => setAjustes([...ajustes, { nome: 'Multa', valor: '' }])} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Multa</button>
                <button type="button" onClick={() => setAjustes([...ajustes, { nome: 'Retenção Imposto de Renda', valor: '' }])} className="text-amber-700 font-bold hover:underline cursor-pointer">+ Retenção IR</button>
                <button type="button" onClick={() => setAjustes([...ajustes, { nome: '', valor: '' }])} className="text-slate-600 font-bold hover:underline cursor-pointer">+ Outro Valor</button>
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
          <ResultadoFatura
            resultado={resultado}
            categoria={form.categoria}
            instalacao={form.instalacao}
            aoExportar={baixarCSV}
          />
        )}
      </div>

    </div>
  );
}
