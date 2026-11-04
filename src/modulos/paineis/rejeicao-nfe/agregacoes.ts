import { CODIGO_ERRO_NAO_CATALOGADO, type Nota, type SituacaoNota } from './modelo';

/**
 * Filtros do painel. Valem para todos os visuais ao mesmo tempo (como no Power BI).
 * Cada visual que também é um filtro (ex.: barras de motivo) é calculado SEM o
 * próprio filtro, para continuar mostrando as outras barras com a selecionada
 * em destaque - ver `filtrar(..., ignorar)`.
 */
export interface Filtros {
  de: string;
  ate: string;
  situacoes: SituacaoNota[];
  codigos: string[];
  caracteristicas: string[];
  distribuidoras: string[];
  categorias: string[];
  busca: string;
}

export type Dimensao = 'periodo' | 'situacoes' | 'codigos' | 'caracteristicas' | 'distribuidoras' | 'categorias';

export const FILTROS_VAZIOS: Filtros = {
  de: '', ate: '', situacoes: [], codigos: [], caracteristicas: [], distribuidoras: [], categorias: [], busca: '',
};

export function filtrar(notas: Nota[], f: Filtros, ignorar?: Dimensao): Nota[] {
  const busca = f.busca.trim().toLowerCase();
  return notas.filter((n) => {
    if (ignorar !== 'periodo') {
      if (f.de && (!n.data || n.data < f.de)) return false;
      if (f.ate && (!n.data || n.data > f.ate)) return false;
    }
    if (ignorar !== 'situacoes' && f.situacoes.length && !f.situacoes.includes(n.situacao)) return false;
    if (ignorar !== 'codigos' && f.codigos.length && !f.codigos.includes(n.codigo || '(sem código)')) return false;
    if (ignorar !== 'caracteristicas' && f.caracteristicas.length && !f.caracteristicas.includes(n.caracteristica)) return false;
    if (ignorar !== 'distribuidoras' && f.distribuidoras.length && !f.distribuidoras.includes(n.distribuidora || '(não informada)')) return false;
    if (ignorar !== 'categorias' && f.categorias.length && !f.categorias.includes(n.categoria || '(não informada)')) return false;
    if (busca) {
      const alvo = `${n.numero} ${n.chave} ${n.codigo} ${n.motivo} ${n.caracteristica} ${n.lote}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

export interface Indicadores {
  total: number;
  autorizadas: number;
  rejeitadas: number;
  outras: number;
  erro999: number;
  valorRejeitado: number | null;
  codigosDistintos: number;
}

export function indicadores(notas: Nota[]): Indicadores {
  let autorizadas = 0, rejeitadas = 0, outras = 0, erro999 = 0;
  let valorRejeitado: number | null = null;
  const codigos = new Set<string>();
  for (const n of notas) {
    if (n.situacao === 'autorizada') autorizadas++;
    else if (n.situacao === 'rejeitada') {
      rejeitadas++;
      if (n.codigo) codigos.add(n.codigo);
      if (n.codigo === CODIGO_ERRO_NAO_CATALOGADO) erro999++;
      if (n.valor !== null) valorRejeitado = (valorRejeitado ?? 0) + n.valor;
    } else outras++;
  }
  return { total: notas.length, autorizadas, rejeitadas, outras, erro999, valorRejeitado, codigosDistintos: codigos.size };
}

export interface ItemRanking {
  chave: string;
  rotulo: string;
  valor: number;
}

/** Ranking por uma chave, com "Outros" somando o que passar do limite. */
export function ranking(notas: Nota[], chave: (n: Nota) => string, rotulo: (k: string) => string, limite = 10): ItemRanking[] {
  const contagem = new Map<string, number>();
  for (const n of notas) {
    const k = chave(n);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  const ordenado = [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const topo = ordenado.slice(0, limite).map(([k, v]) => ({ chave: k, rotulo: rotulo(k), valor: v }));
  const resto = ordenado.slice(limite).reduce((acc, [, v]) => acc + v, 0);
  if (resto > 0) topo.push({ chave: '__outros__', rotulo: `Outros (${ordenado.length - limite})`, valor: resto });
  return topo;
}

/** Texto mais frequente do motivo para cada código - vira o rótulo da barra. */
export function motivoPorCodigo(notas: Nota[]): Map<string, string> {
  const freq = new Map<string, Map<string, number>>();
  for (const n of notas) {
    if (!n.motivo) continue;
    const k = n.codigo || '(sem código)';
    const m = freq.get(k) ?? new Map<string, number>();
    m.set(n.motivo, (m.get(n.motivo) ?? 0) + 1);
    freq.set(k, m);
  }
  const saida = new Map<string, string>();
  for (const [k, m] of freq) saida.set(k, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  return saida;
}

export type Granularidade = 'dia' | 'mes';

export interface PontoSerie {
  chave: string;
  rotulo: string;
  de: string;
  ate: string;
  valores: Record<string, number>;
}

const DIA_MS = 86400000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Série temporal por dia ou mês, com os períodos sem nota preenchidos com zero. */
export function serieTemporal(notas: Nota[], granularidade: Granularidade, series: Record<string, (n: Nota) => boolean>): PontoSerie[] {
  const datas = notas.map((n) => n.data).filter(Boolean).sort();
  if (datas.length === 0) return [];
  const pontos = new Map<string, PontoSerie>();
  const nomes = Object.keys(series);
  const novo = (chave: string, rotulo: string, de: string, ate: string): PontoSerie =>
    ({ chave, rotulo, de, ate, valores: Object.fromEntries(nomes.map((s) => [s, 0])) });

  if (granularidade === 'dia') {
    let t = Date.parse(datas[0] + 'T00:00:00Z');
    const fim = Date.parse(datas[datas.length - 1] + 'T00:00:00Z');
    for (let i = 0; t <= fim && i < 1000; t += DIA_MS, i++) {
      const d = new Date(t).toISOString().slice(0, 10);
      pontos.set(d, novo(d, `${d.slice(8, 10)}/${d.slice(5, 7)}`, d, d));
    }
  } else {
    let [a, m] = datas[0].slice(0, 7).split('-').map(Number);
    const [af, mf] = datas[datas.length - 1].slice(0, 7).split('-').map(Number);
    for (let i = 0; (a < af || (a === af && m <= mf)) && i < 240; i++) {
      const chave = `${a}-${String(m).padStart(2, '0')}`;
      const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
      pontos.set(chave, novo(chave, `${MESES[m - 1]}/${String(a).slice(2)}`, `${chave}-01`, `${chave}-${String(ultimo).padStart(2, '0')}`));
      m++;
      if (m > 12) { m = 1; a++; }
    }
  }
  for (const n of notas) {
    if (!n.data) continue;
    const p = pontos.get(granularidade === 'dia' ? n.data : n.data.slice(0, 7));
    if (!p) continue;
    for (const s of nomes) if (series[s](n)) p.valores[s]++;
  }
  return [...pontos.values()];
}

export function percentual(parte: number, todo: number): string {
  if (!todo) return '0,0%';
  return (100 * parte / todo).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

export function numero(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
