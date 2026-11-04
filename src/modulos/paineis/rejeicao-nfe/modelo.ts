/**
 * Modelo do painel de Rejeição de NF-e.
 *
 * A tabela vem de fora (export do Databricks, planilha do Excel), então os nomes
 * das colunas variam. Cada CAMPO do painel tem uma lista de nomes prováveis;
 * `mapearAutomatico` liga as colunas do arquivo aos campos, e o usuário pode
 * corrigir na tela. Depois `montarNotas` converte as linhas em `Nota`.
 */

export type IdCampo =
  | 'data' | 'status' | 'codigo' | 'motivo' | 'detalhe'
  | 'distribuidora' | 'categoria' | 'lote' | 'numero' | 'chave' | 'valor';

export interface DefinicaoCampo {
  id: IdCampo;
  rotulo: string;
  ajuda: string;
  /** Nomes de coluna reconhecidos (sem acento, minúsculos, separados por _). */
  nomes: string[];
}

export const CAMPOS: DefinicaoCampo[] = [
  { id: 'data', rotulo: 'Data', ajuda: 'Data de emissão, envio ou processamento da nota.',
    nomes: ['data', 'dt', 'data_emissao', 'dt_emissao', 'dhemi', 'dh_emi', 'data_envio', 'dt_envio', 'data_processamento',
      'dt_processamento', 'data_autorizacao', 'dhrecbto', 'data_retorno', 'data_rejeicao', 'dt_rejeicao', 'data_hora', 'dia'] },
  { id: 'status', rotulo: 'Status', ajuda: 'Autorizada / Aprovada ou Rejeitada. Se não houver, o código (cStat) decide.',
    nomes: ['status', 'situacao', 'sit', 'resultado', 'status_nf', 'status_nfe', 'status_nf3e', 'status_nota', 'tipo_retorno', 'retorno'] },
  { id: 'codigo', rotulo: 'Código de retorno (cStat)', ajuda: 'Código da SEFAZ: 100 = autorizada; demais = rejeição (999 = erro não catalogado).',
    nomes: ['cstat', 'c_stat', 'codigo', 'cod', 'codigo_rejeicao', 'cod_rejeicao', 'codigo_erro', 'cod_erro', 'codigo_retorno', 'cod_retorno', 'erro'] },
  { id: 'motivo', rotulo: 'Motivo / mensagem', ajuda: 'Texto do retorno (xMotivo).',
    nomes: ['motivo', 'xmotivo', 'x_motivo', 'descricao', 'mensagem', 'msg', 'descricao_erro', 'motivo_rejeicao', 'mensagem_erro', 'mensagem_retorno'] },
  { id: 'detalhe', rotulo: 'Característica do erro', ajuda: 'Detalhe que explica o erro (principalmente o 999). Se não houver, o painel usa o texto do motivo.',
    nomes: ['detalhe', 'caracteristica', 'caracteristicas', 'caracteristica_erro', 'detalhe_erro', 'detalhamento', 'complemento', 'observacao', 'obs', 'causa'] },
  { id: 'distribuidora', rotulo: 'Distribuidora / empresa', ajuda: 'Ex.: EDP ES, EDP SP.',
    nomes: ['distribuidora', 'empresa', 'geografia', 'uf', 'estado', 'regional', 'unidade'] },
  { id: 'categoria', rotulo: 'Categoria / classe', ajuda: 'Ex.: B1, B3, Grupo A.',
    nomes: ['categoria', 'classe', 'subgrupo', 'grupo', 'tarifa', 'tipo_cliente', 'segmento'] },
  { id: 'lote', rotulo: 'Lote', ajuda: 'Lote ou ciclo de faturamento.',
    nomes: ['lote', 'id_lote', 'nlote', 'n_lote', 'ciclo'] },
  { id: 'numero', rotulo: 'Número da nota', ajuda: 'Número da NF-e / NF3e.',
    nomes: ['numero', 'numero_nf', 'numero_nota', 'nnf', 'n_nf', 'nf', 'nota', 'num_nf'] },
  { id: 'chave', rotulo: 'Chave de acesso', ajuda: 'Chave de 44 dígitos.',
    nomes: ['chave', 'chave_acesso', 'chnfe', 'ch_nfe', 'chnf3e', 'ch_nf3e', 'chave_nfe', 'chave_nf3e'] },
  { id: 'valor', rotulo: 'Valor (R$)', ajuda: 'Valor total da nota.',
    nomes: ['valor', 'valor_total', 'vnf', 'v_nf', 'valor_nf', 'vl_total', 'vl_nf', 'total'] },
];

export type Mapeamento = Partial<Record<IdCampo, number>>;

export type SituacaoNota = 'autorizada' | 'rejeitada' | 'outra';

export interface Nota {
  /** AAAA-MM-DD; vazio quando a data não pôde ser lida. */
  data: string;
  situacao: SituacaoNota;
  statusOriginal: string;
  codigo: string;
  motivo: string;
  /** Característica do erro (detalhe; no 999 sem detalhe, vem do texto do motivo). */
  caracteristica: string;
  distribuidora: string;
  categoria: string;
  lote: string;
  numero: string;
  chave: string;
  valor: number | null;
}

export const CODIGO_ERRO_NAO_CATALOGADO = '999';

export function normalizarNome(texto: string): string {
  return String(texto ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Liga cada campo a uma coluna do arquivo, primeiro por nome exato, depois por nome contido. */
export function mapearAutomatico(colunas: string[]): Mapeamento {
  const normalizadas = colunas.map(normalizarNome);
  const usadas = new Set<number>();
  const mapa: Mapeamento = {};
  for (const exato of [true, false]) {
    for (const campo of CAMPOS) {
      if (mapa[campo.id] !== undefined) continue;
      const idx = normalizadas.findIndex((n, i) => !usadas.has(i) && campo.nomes.some((nome) =>
        exato ? n === nome : nome.length >= 4 && (n.startsWith(nome + '_') || n.endsWith('_' + nome) || n.includes('_' + nome + '_'))));
      if (idx >= 0) {
        mapa[campo.id] = idx;
        usadas.add(idx);
      }
    }
  }
  return mapa;
}

/** O mínimo para o painel funcionar: data e (status ou código). */
export function faltandoNoMapeamento(mapa: Mapeamento): string[] {
  const faltas: string[] = [];
  if (mapa.data === undefined) faltas.push('Data');
  if (mapa.status === undefined && mapa.codigo === undefined) faltas.push('Status ou Código de retorno');
  return faltas;
}

/** Autorizada, rejeitada ou outra (cancelada, denegada...). O texto do status manda; sem ele, o código. */
export function classificarSituacao(status: string, codigo: string): SituacaoNota {
  const s = normalizarNome(status);
  if (s) {
    if (/cancel|deneg|inutiliz/.test(s)) return 'outra';
    if (/rejeit|reprov|recus|negad|erro|falha|invalid/.test(s)) return 'rejeitada';
    if (/autoriz|aprov|sucesso|valid|^ok$|processad/.test(s)) return 'autorizada';
    const numStatus = Number(s);
    if (Number.isInteger(numStatus) && numStatus > 0) return classificarCodigo(numStatus);
  }
  const num = Number(String(codigo ?? '').trim());
  if (Number.isInteger(num) && num > 0) return classificarCodigo(num);
  return 'outra';
}

function classificarCodigo(cStat: number): SituacaoNota {
  // 100 = autorizado o uso; 150 = autorizado fora de prazo; 101/135 = cancelamento; 110/301/302 = denegada.
  if (cStat === 100 || cStat === 150) return 'autorizada';
  if (cStat === 101 || cStat === 135 || cStat === 110 || cStat === 301 || cStat === 302) return 'outra';
  if (cStat >= 200) return 'rejeitada';
  return 'outra';
}

/** Tira o prefixo genérico do 999 ("Rejeição: Erro não catalogado") e deixa só a característica. */
export function caracteristicaDoMotivo(motivo: string): string {
  return String(motivo ?? '')
    .replace(/^\s*rejei[cç][aã]o\s*:?\s*/i, '')
    .replace(/^\s*erro\s+n[aã]o\s+catalogado\s*/i, '')
    .replace(/^[\s\-–:(]+/, '')
    .replace(/\)\s*$/, '')
    .trim();
}

const DIA_MS = 86400000;

/** Lê datas ISO, dd/mm/aaaa (com ou sem hora) e o número de série do Excel. Devolve AAAA-MM-DD. */
export function lerData(valor: string): string {
  const v = String(valor ?? '').trim();
  if (!v) return '';
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  const serial = Number(v.replace(',', '.'));
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    // Excel conta os dias a partir de 30/12/1899.
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * DIA_MS);
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Aceita "1.234,56", "1234,56" e "1234.56". */
export function lerValor(valor: string): number | null {
  let v = String(valor ?? '').trim().replace(/^R\$\s*/i, '');
  if (!v) return null;
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function montarNotas(linhas: string[][], mapa: Mapeamento): Nota[] {
  const pegar = (linha: string[], campo: IdCampo) => {
    const i = mapa[campo];
    return i === undefined ? '' : String(linha[i] ?? '').trim();
  };
  const notas: Nota[] = [];
  for (const linha of linhas) {
    if (linha.every((c) => String(c ?? '').trim() === '')) continue;
    const status = pegar(linha, 'status');
    const codigo = pegar(linha, 'codigo');
    const motivo = pegar(linha, 'motivo');
    const situacao = classificarSituacao(status, codigo);
    const detalhe = pegar(linha, 'detalhe');
    const caracteristica = situacao === 'rejeitada'
      ? (detalhe || (codigo === CODIGO_ERRO_NAO_CATALOGADO ? caracteristicaDoMotivo(motivo) : '') || '(sem detalhe informado)')
      : detalhe;
    notas.push({
      data: lerData(pegar(linha, 'data')),
      situacao,
      statusOriginal: status,
      codigo,
      motivo,
      caracteristica,
      distribuidora: pegar(linha, 'distribuidora'),
      categoria: pegar(linha, 'categoria'),
      lote: pegar(linha, 'lote'),
      numero: pegar(linha, 'numero'),
      chave: pegar(linha, 'chave'),
      valor: mapa.valor === undefined ? null : lerValor(pegar(linha, 'valor')),
    });
  }
  return notas;
}
