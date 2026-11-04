import type { Tabela } from '../comum/importar';

/**
 * Dados FICTÍCIOS para demonstrar o painel antes de existir a tabela real do
 * Databricks. Gerados com semente fixa (sempre os mesmos números). Os códigos e
 * textos imitam o formato de retorno da SEFAZ, mas as quantidades e as
 * características do erro 999 são inventadas - o painel avisa na tela.
 */

function aleatorio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortear<T>(r: () => number, itens: [T, number][]): T {
  const total = itens.reduce((a, [, p]) => a + p, 0);
  let x = r() * total;
  for (const [v, p] of itens) { x -= p; if (x <= 0) return v; }
  return itens[itens.length - 1][0];
}

const REJEICOES: [[string, string], number][] = [
  [['999', 'Rejeição: Erro não catalogado'], 38],
  [['225', 'Rejeição: Falha no Schema XML da NF3e'], 16],
  [['539', 'Rejeição: Duplicidade de NF3e com diferença na Chave de Acesso'], 12],
  [['204', 'Rejeição: Duplicidade de NF3e'], 9],
  [['233', 'Rejeição: IE do destinatário não cadastrada'], 8],
  [['297', 'Rejeição: Assinatura difere do calculado'], 6],
  [['610', 'Rejeição: Total da NF3e difere do somatório dos valores dos itens'], 6],
  [['215', 'Rejeição: Falha no schema XML'], 5],
];

const CARACTERISTICAS_999: [string, number][] = [
  ['Tempo limite na comunicação com a SEFAZ', 24],
  ['Grupo de medição sem leitura atual', 18],
  ['Valor da bandeira divergente entre itens', 14],
  ['Código do município do consumidor inválido', 12],
  ['CFOP incompatível com a classe de consumo', 10],
  ['Tarifa sem vigência na data de leitura', 9],
  ['Campo de CEP vazio no endereço de entrega', 7],
  ['Item de CIP sem lei municipal informada', 6],
];

export function gerarExemploRejeicao(): Tabela {
  const r = aleatorio(20261031);
  const colunas = ['data_emissao', 'numero_nf', 'chave_acesso', 'distribuidora', 'categoria', 'lote',
    'status', 'cstat', 'xmotivo', 'caracteristica_erro', 'valor_total'];
  const linhas: string[][] = [];
  const inicio = Date.UTC(2026, 7, 1);
  let numero = 63000000;
  for (let dia = 0; dia < 92; dia++) {
    const d = new Date(inicio + dia * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const fimDeSemana = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const qtd = Math.round((fimDeSemana ? 8 : 32) + r() * 10);
    // Um pico de rejeições no meio de setembro, para o painel ter o que mostrar.
    const taxa = dia >= 42 && dia <= 46 ? 0.22 : 0.07;
    for (let k = 0; k < qtd; k++) {
      numero++;
      const dist = r() < 0.58 ? 'EDP ES' : 'EDP SP';
      const categoria = sortear(r, [['B1', 60], ['B2', 10], ['B3', 22], ['B4', 4], ['Grupo A', 4]]);
      const lote = String(1 + Math.floor((d.getUTCDate() - 1) / 1.6)).padStart(2, '0');
      const valor = (40 + r() * (categoria === 'Grupo A' ? 9000 : 520)).toFixed(2).replace('.', ',');
      const chave = `${dist === 'EDP ES' ? '32' : '35'}2610${String(numero).padStart(38, '0')}`.slice(0, 44);
      if (r() < taxa) {
        const [cstat, motivo] = sortear(r, REJEICOES);
        const carac = cstat === '999' ? sortear(r, CARACTERISTICAS_999) : '';
        linhas.push([iso, String(numero), chave, dist, categoria, lote, 'Rejeitada', cstat, motivo, carac, valor]);
      } else {
        linhas.push([iso, String(numero), chave, dist, categoria, lote, 'Autorizada', '100', 'Autorizado o uso da NF3e', '', valor]);
      }
    }
  }
  return { colunas, linhas, origem: 'Dados de exemplo (fictícios)' };
}
