'use client';

import { useState } from 'react';
import { lerArquivo, lerTextoDelimitado, type Tabela } from './importar';

/**
 * Tela de carga dos dados de um painel: arquivo (CSV/TXT/XLSX), texto colado do
 * Excel ou dados de exemplo. Tudo é lido no navegador; nada vai para o servidor.
 */
export function Importador({ aoCarregar, gerarExemplo, dica }: {
  aoCarregar: (t: Tabela, exemplo: boolean) => void;
  gerarExemplo?: () => Tabela;
  dica?: React.ReactNode;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [colado, setColado] = useState('');

  const abrir = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro(null);
    setLendo(true);
    try {
      const t = await lerArquivo(arquivo);
      if (t.linhas.length === 0) throw new Error('O arquivo não tem linhas de dados abaixo do cabeçalho.');
      aoCarregar(t, false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui ler o arquivo.');
    } finally {
      setLendo(false);
    }
  };

  const usarColado = () => {
    const t = lerTextoDelimitado(colado, 'Texto colado');
    if (t.linhas.length === 0) { setErro('Cole o cabeçalho e pelo menos uma linha de dados.'); return; }
    setErro(null);
    aoCarregar(t, false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <label
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); abrir(e.dataTransfer.files[0]); }}
        className={`lg:col-span-2 flex flex-col items-center justify-center text-center gap-2 rounded-md border-2 border-dashed p-8 cursor-pointer transition-colors ${
          arrastando ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'
        }`}
      >
        <span className="text-sm font-bold text-black">{lendo ? 'Lendo o arquivo…' : 'Arraste o arquivo aqui ou clique para escolher'}</span>
        <span className="text-xs text-slate-600">CSV, TXT ou Excel (.xlsx). Do Databricks: baixe o resultado da consulta em CSV.</span>
        <input type="file" accept=".csv,.txt,.tsv,.xlsx,.xlsm" className="sr-only" onChange={(e) => abrir(e.target.files?.[0])} />
      </label>

      <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4">
        <span className="text-sm font-bold text-black">Ou cole do Excel</span>
        <textarea
          value={colado}
          onChange={(e) => setColado(e.target.value)}
          placeholder="Selecione as células no Excel (com o cabeçalho), copie e cole aqui"
          className="w-full h-28 text-xs border border-slate-300 rounded p-2 bg-white text-black"
        />
        <button type="button" onClick={usarColado} disabled={!colado.trim()}
          className="bg-[#2f364b] hover:bg-[#1f2536] disabled:opacity-50 text-white text-xs font-semibold py-2 rounded cursor-pointer">
          Usar o texto colado
        </button>
      </div>

      {erro && <p role="alert" className="lg:col-span-3 text-xs text-red-600">{erro}</p>}

      <div className="lg:col-span-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {gerarExemplo && (
          <button type="button" onClick={() => aoCarregar(gerarExemplo(), true)}
            className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded cursor-pointer">
            Ver com dados de exemplo
          </button>
        )}
        <span>Os dados ficam só neste navegador: nada é enviado ao servidor.</span>
        {dica}
      </div>
    </div>
  );
}

/** Ajuste manual: qual coluna do arquivo alimenta cada campo do painel. */
export function MapeadorColunas({ campos, colunas, mapa, aoMudar, amostra }: {
  campos: { id: string; rotulo: string; ajuda: string }[];
  colunas: string[];
  mapa: Partial<Record<string, number>>;
  aoMudar: (id: string, indice: number | undefined) => void;
  amostra: string[][];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {campos.map((c) => (
          <label key={c.id} className="block">
            <span className="block text-xs font-semibold text-black">{c.rotulo}</span>
            <select
              value={mapa[c.id] === undefined ? '' : String(mapa[c.id])}
              onChange={(e) => aoMudar(c.id, e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-full mt-1"
            >
              <option value="">(não usar)</option>
              {colunas.map((col, i) => <option key={i} value={i}>{col}</option>)}
            </select>
            <span className="block text-[11px] text-slate-500 mt-0.5">{c.ajuda}</span>
          </label>
        ))}
      </div>
      {amostra.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-[11px] text-slate-500 mb-1">Primeiras linhas do arquivo:</p>
          <table className="modern-table text-[11px]">
            <thead><tr>{colunas.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>
              {amostra.map((l, i) => <tr key={i}>{colunas.map((_, j) => <td key={j}>{l[j] ?? ''}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
