import { NOMES_MUNICIPIOS_ES, CIP_MUNICIPIOS_ES } from './motor/cip-municipios.js';

// Constante do medidor: vazio, zero ou inválido valem 1 (sem multiplicar).
export function constanteDoMedidor(valor: string): number {
  const n = parseFloat(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Perda de 1,5% no ramal de ligação (toggle "Desconto BT"), arredondada para
// kWh inteiro. Extraída para função de módulo porque tanto o cálculo final
// (handleSubmit) quanto a CIP automática por município (que precisa do
// consumo já faturado, não o medido) têm que aplicar exatamente a mesma
// regra - ver desconto-bt-perda-ramal na memória do projeto.
export function aplicarPerdaBT(valor: number, descontoBT: boolean): number {
  return descontoBT ? Math.round(valor * 0.985) : valor;
}

// Nome de exibição (com acento, como na página da EDP) do município da lista
// de CIP. A chave interna é sem acento e em caixa alta (ex.: "SAO MATEUS").
export function nomeMunicipio(chave: string): string {
  return (NOMES_MUNICIPIOS_ES as Record<string, string>)[chave] ?? chave;
}

// Município em que a CIP não é por faixa de kWh (hoje, São José do Calçado: é
// um percentual sobre o valor da fatura) - o campo de CIP segue manual.
export function cipManualNoMunicipio(chave: string): boolean {
  return !!(CIP_MUNICIPIOS_ES as Record<string, { incompativel?: string }>)[chave]?.incompativel;
}

export interface TrechoBandeira {
  rotulo: string;
  ini: string;
  fim: string;
  dias: number;
}

// Quantos meses-calendário o período de leitura cruza. Usado só para avisar
// quando a Bandeira Mês 3 não vai ter efeito - a conta de verdade é feita
// por calcular_proporcionalidade_dias no motor.
export function mesesNoPeriodo(dataAnterior: string, dataAtual: string): number {
  if (!dataAnterior || !dataAtual) return 0;
  const ant = new Date(dataAnterior + 'T00:00:00Z');
  const atu = new Date(dataAtual + 'T00:00:00Z');
  if (isNaN(ant.getTime()) || isNaN(atu.getTime()) || atu <= ant) return 0;
  const inicio = new Date(ant.getTime() + 86400000);
  return (atu.getUTCFullYear() - inicio.getUTCFullYear()) * 12
    + (atu.getUTCMonth() - inicio.getUTCMonth()) + 1;
}

// Em que dias cai cada "Mês" de bandeira - o mesmo critério do motor
// (calcular_proporcionalidade_dias): conta a partir do DIA SEGUINTE à leitura
// anterior, e o Mês 1 é o mês desse primeiro dia faturado, que NÃO é
// necessariamente o mês da leitura anterior (leitura em 30/09 -> Mês 1 =
// outubro). Espelha o "Nº dias Fat. Bandeira ... dd/mm a dd/mm" que a fatura
// imprime, pra quem confere conta saber qual bandeira vai em qual campo.
export function trechosDeBandeira(dataAnterior: string, dataAtual: string): TrechoBandeira[] {
  if (!dataAnterior || !dataAtual) return [];
  const ant = new Date(dataAnterior + 'T00:00:00Z');
  const atu = new Date(dataAtual + 'T00:00:00Z');
  if (isNaN(ant.getTime()) || isNaN(atu.getTime()) || atu <= ant) return [];
  const DIA = 86400000;
  const primeiro = ant.getTime() + DIA;
  const fmt = (t: number) => {
    const d = new Date(t);
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const trechos: TrechoBandeira[] = [];
  let cursor = Date.UTC(new Date(primeiro).getUTCFullYear(), new Date(primeiro).getUTCMonth(), 1);
  while (cursor <= atu.getTime() && trechos.length < 6) {
    const c = new Date(cursor);
    const proximo = Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1);
    const ini = Math.max(cursor, primeiro);
    const fim = Math.min(proximo - DIA, atu.getTime());
    if (fim >= ini) trechos.push({ rotulo: `Mês ${trechos.length + 1}`, ini: fmt(ini), fim: fmt(fim), dias: Math.round((fim - ini) / DIA) + 1 });
    cursor = proximo;
  }
  return trechos;
}
