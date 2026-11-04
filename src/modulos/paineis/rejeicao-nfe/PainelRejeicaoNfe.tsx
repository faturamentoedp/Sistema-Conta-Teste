'use client';

import { useMemo, useState } from 'react';
import { Importador, MapeadorColunas } from '../comum/Importador';
import type { Tabela } from '../comum/importar';
import { Alternador, BarrasHorizontais, CartaoVisual, ChaveAnimacao, ColunasNoTempo, Kpi } from '../comum/graficos';
import {
  CAMPOS, CODIGO_ERRO_NAO_CATALOGADO, faltandoNoMapeamento, mapearAutomatico, montarNotas,
  type Mapeamento, type Nota, type SituacaoNota,
} from './modelo';
import {
  FILTROS_VAZIOS, filtrar, indicadores, moeda, motivoPorCodigo, numero, percentual, ranking, serieTemporal,
  type Filtros, type Granularidade,
} from './agregacoes';
import { gerarExemploRejeicao } from './exemplo';

const COR_AUTORIZADA = 'var(--viz-autorizada)';
const COR_REJEITADA = 'var(--viz-rejeitada)';

const SITUACOES: { id: SituacaoNota; rotulo: string }[] = [
  { id: 'autorizada', rotulo: 'Autorizada' },
  { id: 'rejeitada', rotulo: 'Rejeitada' },
  { id: 'outra', rotulo: 'Outra (cancelada, denegada...)' },
];

type Aba = 'geral' | 'erro999' | 'notas';

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

function somarDias(iso: string, dias: number) {
  return new Date(Date.parse(iso + 'T00:00:00Z') + dias * 86400000).toISOString().slice(0, 10);
}

function dataBr(iso: string) {
  return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
}

export default function PainelRejeicaoNfe() {
  const [tabela, setTabela] = useState<Tabela | null>(null);
  const [exemplo, setExemplo] = useState(false);
  const [mapa, setMapa] = useState<Mapeamento>({});
  const [ajustando, setAjustando] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [aba, setAba] = useState<Aba>('geral');
  const [granularidade, setGranularidade] = useState<Granularidade | null>(null);

  const carregar = (t: Tabela, ehExemplo: boolean) => {
    const m = mapearAutomatico(t.colunas);
    setTabela(t);
    setExemplo(ehExemplo);
    setMapa(m);
    setFiltros(FILTROS_VAZIOS);
    setGranularidade(null);
    setAjustando(faltandoNoMapeamento(m).length > 0);
  };

  const faltas = faltandoNoMapeamento(mapa);
  const notas = useMemo(() => (tabela && faltas.length === 0 ? montarNotas(tabela.linhas, mapa) : []), [tabela, mapa, faltas.length]);

  // ------------------------------------------------------------------ sem dados
  if (!tabela) {
    return (
      <div className="space-y-4">
        <CartaoVisual titulo="Carregar a tabela de notas fiscais"
          subtitulo="Uma linha por nota, com a data, o status (ou o código cStat) e, nas rejeições, o motivo e a característica do erro.">
          <Importador aoCarregar={carregar} gerarExemplo={gerarExemploRejeicao}
            dica={<span>As colunas são reconhecidas pelo nome; dá para ajustar depois.</span>} />
        </CartaoVisual>
      </div>
    );
  }

  // ------------------------------------------------------------------ ajuste de colunas
  if (ajustando || faltas.length > 0) {
    return (
      <CartaoVisual
        titulo="Confira as colunas"
        subtitulo={`${tabela.origem}: ${numero(tabela.linhas.length)} linhas e ${tabela.colunas.length} colunas. Diga qual coluna é cada informação.`}
        acoes={<button type="button" onClick={() => setTabela(null)} className="text-xs text-blue-600 hover:underline cursor-pointer">Trocar arquivo</button>}
      >
        <MapeadorColunas campos={CAMPOS} colunas={tabela.colunas} mapa={mapa} amostra={tabela.linhas.slice(0, 3)}
          aoMudar={(id, i) => setMapa((m) => ({ ...m, [id]: i }))} />
        {faltas.length > 0 && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            Falta indicar: {faltas.join(' e ')}.
          </p>
        )}
        <button type="button" disabled={faltas.length > 0} onClick={() => setAjustando(false)}
          className="mt-4 bg-[#2f364b] hover:bg-[#1f2536] disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded cursor-pointer">
          Ver o painel
        </button>
      </CartaoVisual>
    );
  }

  return (
    <Painel
      notas={notas} mapa={mapa} tabela={tabela} exemplo={exemplo}
      filtros={filtros} setFiltros={setFiltros} aba={aba} setAba={setAba}
      granularidade={granularidade} setGranularidade={setGranularidade}
      aoTrocar={() => setTabela(null)} aoAjustar={() => setAjustando(true)}
    />
  );
}

function Painel({ notas, mapa, tabela, exemplo, filtros, setFiltros, aba, setAba, granularidade, setGranularidade, aoTrocar, aoAjustar }: {
  notas: Nota[]; mapa: Mapeamento; tabela: Tabela; exemplo: boolean;
  filtros: Filtros; setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  aba: Aba; setAba: (a: Aba) => void;
  granularidade: Granularidade | null; setGranularidade: (g: Granularidade) => void;
  aoTrocar: () => void; aoAjustar: () => void;
}) {
  const datas = useMemo(() => notas.map((n) => n.data).filter(Boolean).sort(), [notas]);
  const primeira = datas[0] ?? '';
  const ultima = datas[datas.length - 1] ?? '';
  const diasNoArquivo = primeira ? Math.round((Date.parse(ultima) - Date.parse(primeira)) / 86400000) + 1 : 0;
  const gran: Granularidade = granularidade ?? (diasNoArquivo > 120 ? 'mes' : 'dia');

  const temDistribuidora = mapa.distribuidora !== undefined;
  const temCategoria = mapa.categoria !== undefined;
  const temValor = mapa.valor !== undefined;
  const distribuidoras = useMemo(() => [...new Set(notas.map((n) => n.distribuidora || '(não informada)'))].sort(), [notas]);

  const filtradas = useMemo(() => filtrar(notas, filtros), [notas, filtros]);
  const kpi = useMemo(() => indicadores(filtradas), [filtradas]);
  const motivos = useMemo(() => motivoPorCodigo(notas), [notas]);

  const porCodigo = useMemo(() => {
    const base = filtrar(notas, filtros, 'codigos').filter((n) => n.situacao === 'rejeitada');
    return { total: base.length, itens: ranking(base, (n) => n.codigo || '(sem código)', (k) => `${k} · ${motivos.get(k) ?? ''}`) };
  }, [notas, filtros, motivos]);

  const por999 = useMemo(() => {
    const base = filtrar(notas, filtros, 'caracteristicas').filter((n) => n.situacao === 'rejeitada' && n.codigo === CODIGO_ERRO_NAO_CATALOGADO);
    return { total: base.length, itens: ranking(base, (n) => n.caracteristica, (k) => k, 12) };
  }, [notas, filtros]);

  const porDistribuidora = useMemo(() => {
    const base = filtrar(notas, filtros, 'distribuidoras').filter((n) => n.situacao === 'rejeitada');
    return { total: base.length, itens: ranking(base, (n) => n.distribuidora || '(não informada)', (k) => k) };
  }, [notas, filtros]);

  const porCategoria = useMemo(() => {
    const base = filtrar(notas, filtros, 'categorias').filter((n) => n.situacao === 'rejeitada');
    return { total: base.length, itens: ranking(base, (n) => n.categoria || '(não informada)', (k) => k) };
  }, [notas, filtros]);

  const serie = useMemo(() => serieTemporal(filtrar(notas, filtros, 'periodo'), gran, {
    autorizadas: (n) => n.situacao === 'autorizada',
    rejeitadas: (n) => n.situacao === 'rejeitada',
  }), [notas, filtros, gran]);

  const serie999 = useMemo(() => serieTemporal(filtrar(notas, filtros, 'periodo'), gran, {
    rejeitadas: (n) => n.situacao === 'rejeitada' && n.codigo === CODIGO_ERRO_NAO_CATALOGADO,
  }), [notas, filtros, gran]);

  // Clique numa coluna do tempo: filtra aquele dia/mês; clicar de novo volta ao período todo.
  const periodoSelecionado = serie.find((p) => p.de === filtros.de && p.ate === filtros.ate)?.chave;
  const clicarPeriodo = (chave: string) => {
    const p = serie.find((x) => x.chave === chave);
    if (!p) return;
    setFiltros((f) => (f.de === p.de && f.ate === p.ate ? { ...f, de: '', ate: '' } : { ...f, de: p.de, ate: p.ate }));
  };

  const preset = (dias: number | null) => setFiltros((f) => ({ ...f, de: dias === null ? '' : somarDias(ultima, -(dias - 1)), ate: dias === null ? '' : ultima }));

  const chips: { rotulo: string; limpar: () => void }[] = [];
  if (filtros.de || filtros.ate) chips.push({ rotulo: `Período: ${dataBr(filtros.de) || '…'} a ${dataBr(filtros.ate) || '…'}`, limpar: () => setFiltros((f) => ({ ...f, de: '', ate: '' })) });
  filtros.situacoes.forEach((s) => chips.push({ rotulo: SITUACOES.find((x) => x.id === s)?.rotulo ?? s, limpar: () => setFiltros((f) => ({ ...f, situacoes: f.situacoes.filter((x) => x !== s) })) }));
  filtros.codigos.forEach((c) => chips.push({ rotulo: `Código ${c}`, limpar: () => setFiltros((f) => ({ ...f, codigos: f.codigos.filter((x) => x !== c) })) }));
  filtros.caracteristicas.forEach((c) => chips.push({ rotulo: `999: ${c}`, limpar: () => setFiltros((f) => ({ ...f, caracteristicas: f.caracteristicas.filter((x) => x !== c) })) }));
  filtros.distribuidoras.forEach((d) => chips.push({ rotulo: d, limpar: () => setFiltros((f) => ({ ...f, distribuidoras: f.distribuidoras.filter((x) => x !== d) })) }));
  filtros.categorias.forEach((c) => chips.push({ rotulo: `Categoria ${c}`, limpar: () => setFiltros((f) => ({ ...f, categorias: f.categorias.filter((x) => x !== c) })) }));

  // Assinatura do que está na tela (sem a busca, que muda a cada tecla): mudou, os gráficos se remontam animando.
  const chaveAnimacao = JSON.stringify({ ...filtros, busca: '' }) + gran + aba;

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'geral', rotulo: 'Visão geral' },
    { id: 'erro999', rotulo: 'Erro 999' },
    { id: 'notas', rotulo: 'Notas' },
  ];

  return (
    <div className="space-y-4">
      {exemplo && (
        <p role="status" className="text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded px-3 py-2">
          DADOS DE EXEMPLO (fictícios) — só para mostrar como o painel funciona. Carregue a tabela real em &quot;Trocar dados&quot;.
        </p>
      )}

      {/* Fonte dos dados */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          <strong className="text-black">{tabela.origem}</strong> · {numero(notas.length)} notas
          {primeira && <> · {dataBr(primeira)} a {dataBr(ultima)}</>}
        </span>
        <span className="flex gap-3">
          <button type="button" onClick={aoAjustar} className="text-blue-600 hover:underline cursor-pointer">Ajustar colunas</button>
          <button type="button" onClick={aoTrocar} className="text-blue-600 hover:underline cursor-pointer">Trocar dados</button>
        </span>
      </div>

      {/* Filtros: uma linha acima de tudo, valem para todos os visuais e abas */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-3 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-1">Período</span>
          <div className="flex flex-wrap items-center gap-1">
            {[{ r: 'Tudo', d: null }, { r: '7 dias', d: 7 }, { r: '30 dias', d: 30 }, { r: '90 dias', d: 90 }].map((p) => {
              const ativo = p.d === null ? !filtros.de && !filtros.ate : filtros.ate === ultima && filtros.de === somarDias(ultima, -((p.d as number) - 1));
              return (
                <button key={p.r} type="button" onClick={() => preset(p.d)} aria-pressed={ativo}
                  className={`px-2 py-1 text-[11px] rounded border cursor-pointer ${ativo ? 'bg-[#2f364b] text-white border-transparent' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
                  {p.r}
                </button>
              );
            })}
            <input type="date" value={filtros.de} min={primeira} max={ultima} aria-label="Data inicial"
              onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value }))} className="text-xs !py-1" />
            <span className="text-xs text-slate-500">a</span>
            <input type="date" value={filtros.ate} min={primeira} max={ultima} aria-label="Data final"
              onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))} className="text-xs !py-1" />
          </div>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-1">Situação</span>
          <div className="flex flex-wrap gap-1">
            {SITUACOES.slice(0, 2).map((s) => (
              <button key={s.id} type="button" aria-pressed={filtros.situacoes.includes(s.id)}
                onClick={() => setFiltros((f) => ({ ...f, situacoes: alternar(f.situacoes, s.id) }))}
                className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] rounded border cursor-pointer ${filtros.situacoes.includes(s.id) ? 'bg-slate-100 border-slate-400 text-black font-semibold' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.id === 'autorizada' ? COR_AUTORIZADA : COR_REJEITADA }} />
                {s.rotulo}
              </button>
            ))}
          </div>
        </div>
        {temDistribuidora && distribuidoras.length <= 8 && (
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-1">Distribuidora</span>
            <div className="flex flex-wrap gap-1">
              {distribuidoras.map((d) => (
                <button key={d} type="button" aria-pressed={filtros.distribuidoras.includes(d)}
                  onClick={() => setFiltros((f) => ({ ...f, distribuidoras: alternar(f.distribuidoras, d) }))}
                  className={`px-2 py-1 text-[11px] rounded border cursor-pointer ${filtros.distribuidoras.includes(d) ? 'bg-slate-100 border-slate-400 text-black font-semibold' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="flex-1 min-w-[180px]">
          <span className="block text-[11px] font-semibold text-slate-600 mb-1">Buscar</span>
          <input type="text" value={filtros.busca} placeholder="Nº da nota, chave, código, motivo…"
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} className="w-full text-xs !py-1" />
        </label>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 -mt-1">
          <span className="text-[11px] text-slate-500">Filtros ativos:</span>
          {chips.map((c) => (
            <button key={c.rotulo} type="button" onClick={c.limpar}
              className="inline-flex items-center gap-1 text-[11px] bg-blue-50 border border-blue-200 text-blue-800 rounded-full px-2 py-0.5 cursor-pointer hover:bg-slate-100">
              {c.rotulo} <span aria-hidden="true">×</span><span className="sr-only">(remover)</span>
            </button>
          ))}
          <button type="button" onClick={() => setFiltros(FILTROS_VAZIOS)} className="text-[11px] text-blue-600 hover:underline cursor-pointer">Limpar tudo</button>
        </div>
      )}

      {/* KPIs */}
      <div className="viz-sequencia grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Kpi rotulo="Notas" valor={kpi.total} detalhe={kpi.outras ? `${numero(kpi.outras)} com outra situação` : 'no filtro atual'} />
        <Kpi rotulo="Autorizadas" valor={kpi.autorizadas} detalhe={percentual(kpi.autorizadas, kpi.total)} cor={COR_AUTORIZADA} />
        <Kpi rotulo="Rejeitadas" valor={kpi.rejeitadas} detalhe={`Taxa de rejeição ${percentual(kpi.rejeitadas, kpi.total)}`} cor={COR_REJEITADA} />
        <Kpi rotulo="Erro 999" valor={kpi.erro999} detalhe={`${percentual(kpi.erro999, kpi.rejeitadas)} das rejeições`} cor={COR_REJEITADA} />
        <Kpi rotulo={temValor ? 'Valor rejeitado' : 'Códigos de rejeição'}
          valor={temValor ? (kpi.valorRejeitado ?? 0) : kpi.codigosDistintos}
          formatar={temValor ? moeda : undefined}
          detalhe={temValor ? 'soma das notas rejeitadas' : 'códigos diferentes'} />
      </div>

      {/* Abas, como as páginas de um relatório */}
      <div role="tablist" className="flex gap-1 border-b border-slate-200">
        {abas.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 cursor-pointer ${aba === a.id ? 'border-[#2f364b] text-black' : 'border-transparent text-slate-500 hover:text-black'}`}>
            {a.rotulo}
          </button>
        ))}
      </div>

      <ChaveAnimacao.Provider value={chaveAnimacao}>
      {aba === 'geral' && (
        <div className="viz-sequencia grid gap-4 xl:grid-cols-2">
          <CartaoVisual className="xl:col-span-2" titulo="Notas por período"
            subtitulo="Autorizadas e rejeitadas. Passe o mouse para ver a taxa de rejeição."
            acoes={<Alternador opcoes={[{ id: 'dia', rotulo: 'Dia' }, { id: 'mes', rotulo: 'Mês' }]} valor={gran} aoMudar={setGranularidade} />}>
            <ColunasNoTempo pontos={serie} selecionado={periodoSelecionado} aoClicar={clicarPeriodo}
              descricao="Notas autorizadas e rejeitadas por período"
              series={[{ id: 'autorizadas', rotulo: 'Autorizadas', cor: COR_AUTORIZADA }, { id: 'rejeitadas', rotulo: 'Rejeitadas', cor: COR_REJEITADA }]} />
          </CartaoVisual>
          <CartaoVisual titulo="Rejeições por código" subtitulo="Clique num código para filtrar o painel.">
            <BarrasHorizontais itens={porCodigo.itens} total={porCodigo.total} cor={COR_REJEITADA} selecionados={filtros.codigos}
              aoClicar={(k) => setFiltros((f) => ({ ...f, codigos: alternar(f.codigos, k) }))} vazio="Nenhuma rejeição no filtro atual." />
          </CartaoVisual>
          <CartaoVisual titulo="Erro 999: características" subtitulo="O que está por trás do erro não catalogado.">
            <BarrasHorizontais itens={por999.itens.slice(0, 6)} total={por999.total} cor={COR_REJEITADA} selecionados={filtros.caracteristicas}
              aoClicar={(k) => setFiltros((f) => ({ ...f, caracteristicas: alternar(f.caracteristicas, k) }))} vazio="Nenhum erro 999 no filtro atual." />
            {por999.itens.length > 6 && (
              <button type="button" onClick={() => setAba('erro999')} className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer">Ver todas na aba Erro 999</button>
            )}
          </CartaoVisual>
          {temDistribuidora && (
            <CartaoVisual titulo="Rejeições por distribuidora">
              <BarrasHorizontais itens={porDistribuidora.itens} total={porDistribuidora.total} cor={COR_REJEITADA} selecionados={filtros.distribuidoras}
                aoClicar={(k) => setFiltros((f) => ({ ...f, distribuidoras: alternar(f.distribuidoras, k) }))} />
            </CartaoVisual>
          )}
          {temCategoria && (
            <CartaoVisual titulo="Rejeições por categoria">
              <BarrasHorizontais itens={porCategoria.itens} total={porCategoria.total} cor={COR_REJEITADA} selecionados={filtros.categorias}
                aoClicar={(k) => setFiltros((f) => ({ ...f, categorias: alternar(f.categorias, k) }))} />
            </CartaoVisual>
          )}
        </div>
      )}

      {aba === 'erro999' && (
        <div className="viz-sequencia grid gap-4 xl:grid-cols-2">
          <CartaoVisual className="xl:col-span-2" titulo="Erro 999 por período" subtitulo="Rejeição: erro não catalogado."
            acoes={<Alternador opcoes={[{ id: 'dia', rotulo: 'Dia' }, { id: 'mes', rotulo: 'Mês' }]} valor={gran} aoMudar={setGranularidade} />}>
            <ColunasNoTempo pontos={serie999} selecionado={periodoSelecionado} aoClicar={clicarPeriodo}
              descricao="Rejeições com código 999 por período"
              series={[{ id: 'rejeitadas', rotulo: 'Erro 999', cor: COR_REJEITADA }]} />
          </CartaoVisual>
          <CartaoVisual className="xl:col-span-2" titulo="Características do erro 999" subtitulo="Clique numa característica para filtrar as notas.">
            <BarrasHorizontais itens={por999.itens} total={por999.total} cor={COR_REJEITADA} selecionados={filtros.caracteristicas}
              aoClicar={(k) => setFiltros((f) => ({ ...f, caracteristicas: alternar(f.caracteristicas, k) }))} vazio="Nenhum erro 999 no filtro atual." />
            {mapa.detalhe === undefined && (
              <p className="mt-2 text-[11px] text-slate-500">A tabela não tem coluna de característica: o texto foi tirado da mensagem (motivo) do retorno.</p>
            )}
          </CartaoVisual>
          <div className="xl:col-span-2">
            <TabelaNotas notas={filtradas.filter((n) => n.codigo === CODIGO_ERRO_NAO_CATALOGADO)} mapa={mapa} titulo="Notas com erro 999" />
          </div>
        </div>
      )}

      {aba === 'notas' && <TabelaNotas notas={filtradas} mapa={mapa} titulo="Notas do filtro atual" />}
      </ChaveAnimacao.Provider>
    </div>
  );
}

const POR_PAGINA = 50;

function TabelaNotas({ notas, mapa, titulo }: { notas: Nota[]; mapa: Mapeamento; titulo: string }) {
  const [pagina, setPagina] = useState(0);
  const [soRejeitadas, setSoRejeitadas] = useState(false);
  const lista = useMemo(() => {
    const base = soRejeitadas ? notas.filter((n) => n.situacao === 'rejeitada') : notas;
    return [...base].sort((a, b) => (b.data || '').localeCompare(a.data || '') || a.codigo.localeCompare(b.codigo));
  }, [notas, soRejeitadas]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const atual = Math.min(pagina, paginas - 1);
  const visiveis = lista.slice(atual * POR_PAGINA, (atual + 1) * POR_PAGINA);

  const colunas: { id: string; rotulo: string; valor: (n: Nota) => string }[] = [
    { id: 'data', rotulo: 'Data', valor: (n) => dataBr(n.data) },
    ...(mapa.numero !== undefined ? [{ id: 'numero', rotulo: 'Nº nota', valor: (n: Nota) => n.numero }] : []),
    { id: 'situacao', rotulo: 'Situação', valor: (n) => (n.situacao === 'autorizada' ? 'Autorizada' : n.situacao === 'rejeitada' ? 'Rejeitada' : n.statusOriginal || 'Outra') },
    ...(mapa.codigo !== undefined ? [{ id: 'codigo', rotulo: 'Código', valor: (n: Nota) => n.codigo }] : []),
    ...(mapa.motivo !== undefined ? [{ id: 'motivo', rotulo: 'Motivo', valor: (n: Nota) => n.motivo }] : []),
    { id: 'caracteristica', rotulo: 'Característica do erro', valor: (n) => n.caracteristica },
    ...(mapa.distribuidora !== undefined ? [{ id: 'distribuidora', rotulo: 'Distribuidora', valor: (n: Nota) => n.distribuidora }] : []),
    ...(mapa.categoria !== undefined ? [{ id: 'categoria', rotulo: 'Categoria', valor: (n: Nota) => n.categoria }] : []),
    ...(mapa.lote !== undefined ? [{ id: 'lote', rotulo: 'Lote', valor: (n: Nota) => n.lote }] : []),
    ...(mapa.chave !== undefined ? [{ id: 'chave', rotulo: 'Chave de acesso', valor: (n: Nota) => n.chave }] : []),
    ...(mapa.valor !== undefined ? [{ id: 'valor', rotulo: 'Valor (R$)', valor: (n: Nota) => (n.valor === null ? '' : n.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })) }] : []),
  ];

  const baixar = () => {
    const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = '﻿' + [colunas.map((c) => c.rotulo).join(';'), ...lista.map((n) => colunas.map((c) => esc(c.valor(n))).join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas_filtradas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <CartaoVisual titulo={titulo} subtitulo={`${numero(lista.length)} notas · mais recentes primeiro`}
      acoes={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={soRejeitadas} onChange={(e) => { setSoRejeitadas(e.target.checked); setPagina(0); }} />
            Só rejeitadas
          </label>
          <button type="button" onClick={baixar} disabled={lista.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded cursor-pointer">
            Baixar CSV
          </button>
        </div>
      }>
      <div className="w-full overflow-x-auto">
        <table className="modern-table text-xs">
          <thead><tr>{colunas.map((c) => <th key={c.id}>{c.rotulo}</th>)}</tr></thead>
          <tbody>
            {visiveis.map((n, i) => (
              <tr key={`${n.chave}-${n.numero}-${i}`}>
                {colunas.map((c) => (
                  <td key={c.id} className={c.id === 'valor' ? 'currency' : c.id === 'motivo' || c.id === 'caracteristica' ? 'min-w-[220px]' : 'whitespace-nowrap'}>
                    {c.id === 'situacao' ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: n.situacao === 'autorizada' ? COR_AUTORIZADA : n.situacao === 'rejeitada' ? COR_REJEITADA : 'var(--viz-grade)' }} />
                        {c.valor(n)}
                      </span>
                    ) : c.valor(n)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lista.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">Nenhuma nota no filtro atual.</p>}
      {paginas > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-slate-600">
          <button type="button" disabled={atual === 0} onClick={() => setPagina(atual - 1)} className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40 cursor-pointer">Anterior</button>
          <span>Página {atual + 1} de {paginas}</span>
          <button type="button" disabled={atual >= paginas - 1} onClick={() => setPagina(atual + 1)} className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40 cursor-pointer">Próxima</button>
        </div>
      )}
    </CartaoVisual>
  );
}
