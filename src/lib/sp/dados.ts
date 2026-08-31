/**
 * ============================================================================
 *  BASE DE DADOS TARIFÁRIA — EDP SÃO PAULO
 * ============================================================================
 *
 *  Fonte: Planilha "CTESTE SP CONV 2.xlsm" (abas TARIFAS 2024 / TARIFAS 2025)
 *         Resolução Homologatória ANEEL nº 3541/2025 — vigência a partir de
 *         23/10/2025.
 *
 *  ---------------------------------------------------------------------------
 *  COMO ATUALIZAR QUANDO SAIR UM REAJUSTE NOVO
 *  ---------------------------------------------------------------------------
 *  1. Em TARIFAS[], mova o bloco `atual` para `anterior` e cadastre o novo
 *     como `atual`.
 *  2. Atualize VIGENCIA_ATUAL com a data de início da nova resolução.
 *  3. Não mexa em mais nada: o motor faz o rateio proporcional sozinho quando
 *     o período de leitura cruza a data de vigência.
 *
 *  ---------------------------------------------------------------------------
 *  ATENÇÃO — PIS/COFINS
 *  ---------------------------------------------------------------------------
 *  As alíquotas de PIS/COFINS mudam TODO MÊS e não têm fonte automática.
 *  Precisam ser lançadas à mão em TRIBUTOS_MENSAIS abaixo.
 *  ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. VIGÊNCIA DA TARIFA ATUAL
// ---------------------------------------------------------------------------

/** Início de vigência da tarifa vigente (REH 3541/2025). Formato AAAA-MM-DD. */
export const VIGENCIA_ATUAL = '2025-10-23';

// ---------------------------------------------------------------------------
// 2. TARIFAS (R$/kWh)
// ---------------------------------------------------------------------------

export type Posto = 'Não se aplica' | 'Ponta' | 'Intermediário' | 'Fora ponta';

export interface ValorTarifa {
  tusd: number;
  te: number;
}

export interface EntradaTarifa {
  /** Código interno da categoria. */
  categoria: string;
  posto: Posto;
  /** Tarifa em vigor (REH 3541/2025, a partir de 23/10/2025). */
  atual: ValorTarifa;
  /**
   * Tarifa da resolução anterior — usada apenas quando o período de leitura
   * cruza a data de vigência. Se ausente, o motor usa `atual` nos dois lados
   * (o rateio vira inócuo).
   */
  anterior?: ValorTarifa;
}

export const TARIFAS: EntradaTarifa[] = [
  // ---- B1 Residencial ------------------------------------------------------
  {
    categoria: 'B1C',
    posto: 'Não se aplica',
    atual: { tusd: 0.45667, te: 0.33003 },
    anterior: { tusd: 0.39695, te: 0.28093 },
  },
  {
    categoria: 'B1C_GERAR',
    posto: 'Não se aplica',
    atual: { tusd: 0, te: 0 },
    anterior: { tusd: 0, te: 0 },
  },
  {
    categoria: 'B1C_TB',
    posto: 'Ponta',
    atual: { tusd: 0.86563, te: 0.49484 },
    anterior: { tusd: 0.80696, te: 0.43036 },
  },
  {
    categoria: 'B1C_TB',
    posto: 'Intermediário',
    atual: { tusd: 0.5998, te: 0.31504 },
    anterior: { tusd: 0.54045, te: 0.26735 },
  },
  {
    categoria: 'B1C_TB',
    posto: 'Fora ponta',
    atual: { tusd: 0.33398, te: 0.31504 },
    anterior: { tusd: 0.27395, te: 0.26735 },
  },

  // ---- B1 Baixa Renda (tarifa cheia; descontos em DESCONTOS_BAIXA_RENDA) ----
  {
    categoria: 'B1BR',
    posto: 'Não se aplica',
    atual: { tusd: 0.3008, te: 0.30475 },
    anterior: { tusd: 0.29441, te: 0.27303 },
  },

  // ---- B1 CDE / Desconto Social (bloco subsidiado até 120 kWh) -------------
  {
    categoria: 'B1CDE',
    posto: 'Não se aplica',
    atual: { tusd: 0.31629, te: 0.30475 },
  },

  // ---- B2 Rural ------------------------------------------------------------
  {
    categoria: 'B2RURAL',
    posto: 'Não se aplica',
    atual: { tusd: 0.45667, te: 0.33003 },
    anterior: { tusd: 0.39695, te: 0.28093 },
  },
  {
    categoria: 'B2RURAL_GERAR',
    posto: 'Não se aplica',
    atual: { tusd: 0, te: 0 },
    anterior: { tusd: 0, te: 0 },
  },
  {
    categoria: 'B2RURAL_TB',
    posto: 'Ponta',
    atual: { tusd: 0.99343, te: 0.49484 },
    anterior: { tusd: 0.93509, te: 0.43036 },
  },
  { categoria: 'B2RURAL_TB', posto: 'Intermediário', atual: { tusd: 0.67648, te: 0.31504 } },
  { categoria: 'B2RURAL_TB', posto: 'Fora ponta', atual: { tusd: 0.35954, te: 0.31504 } },

  // ---- B2 Serviço Público de Irrigação ------------------------------------
  {
    categoria: 'B2RUIRRG',
    posto: 'Não se aplica',
    atual: { tusd: 0.45667, te: 0.33003 },
    anterior: { tusd: 0.39695, te: 0.28093 },
  },
  {
    categoria: 'B2RUIRRG_GERAR',
    posto: 'Não se aplica',
    atual: { tusd: 0, te: 0 },
    anterior: { tusd: 0, te: 0 },
  },
  { categoria: 'B2RUIRRG_TB', posto: 'Ponta', atual: { tusd: 0.99343, te: 0.49484 } },
  { categoria: 'B2RUIRRG_TB', posto: 'Intermediário', atual: { tusd: 0.67648, te: 0.31504 } },
  { categoria: 'B2RUIRRG_TB', posto: 'Fora ponta', atual: { tusd: 0.35954, te: 0.31504 } },

  // ---- B3 Demais Classes ---------------------------------------------------
  // B3, B3_IR, B3_PPF, B3_CP e B3_AES compartilham a mesma tarifa; o que muda
  // entre elas são apenas as retenções tributárias (ver RETENCOES).
  {
    categoria: 'B3',
    posto: 'Não se aplica',
    atual: { tusd: 0.45667, te: 0.33003 },
    anterior: { tusd: 0.39695, te: 0.28093 },
  },
  {
    categoria: 'B3_TB',
    posto: 'Ponta',
    atual: { tusd: 1.04455, te: 0.49484 },
    anterior: { tusd: 0.98634, te: 0.43036 },
  },
  {
    categoria: 'B3_TB',
    posto: 'Intermediário',
    atual: { tusd: 0.70716, te: 0.31504 },
    anterior: { tusd: 0.64808, te: 0.26735 },
  },
  {
    categoria: 'B3_TB',
    posto: 'Fora ponta',
    atual: { tusd: 0.36976, te: 0.31504 },
    anterior: { tusd: 0.30982, te: 0.26735 },
  },

  // ---- B4 Iluminação Pública ----------------------------------------------
  {
    categoria: 'B4A',
    posto: 'Não se aplica',
    atual: { tusd: 0.25117, te: 0.18152 },
    anterior: { tusd: 0.21832, te: 0.15451 },
  },
  {
    categoria: 'B4B',
    posto: 'Não se aplica',
    atual: { tusd: 0.274, te: 0.19802 },
    anterior: { tusd: 0.23817, te: 0.16856 },
  },
];

/** Categorias que herdam a tarifa de outra (só mudam as regras tributárias). */
export const TARIFA_HERDADA: Record<string, string> = {
  B3_IR: 'B3',
  B3_PPF: 'B3',
  B3_CP: 'B3',
  B3_AES: 'B3',
};

// ---------------------------------------------------------------------------
// 3. TRIBUTOS MENSAIS  ←←← ATUALIZAR TODO MÊS
// ---------------------------------------------------------------------------

export interface TributoMensal {
  ano: number;
  /** 1 = janeiro … 12 = dezembro */
  mes: number;
  pis: number;
  cofins: number;
}

/**
 * PIS/COFINS de EDP SP por competência.
 *
 * Os dois pares abaixo foram extraídos das abas da planilha, que NÃO indicam
 * a que mês pertencem — estão marcados como PENDENTE_CONFIRMACAO.
 * Ao confirmar a competência de cada um, corrija ano/mês e remova a marcação.
 *
 * Meses não cadastrados caem em TRIBUTO_PADRAO.
 */
export const TRIBUTOS_MENSAIS: TributoMensal[] = [
  // PENDENTE_CONFIRMACAO — par encontrado nas abas B1C / B1C ICMS / B1CTB /
  // B2 ICMS / B3 / B3 IR / B3 TB / B3 PPF / B3 CP / B3 AES / B4A / B4B
  { ano: 2026, mes: 7, pis: 0.01, cofins: 0.0459 },
  // PENDENTE_CONFIRMACAO — par encontrado nas abas B1CDE e B2
  { ano: 2026, mes: 6, pis: 0.007, cofins: 0.0323 },
];

/** Usado quando a competência da leitura atual não está em TRIBUTOS_MENSAIS. */
export const TRIBUTO_PADRAO = { pis: 0.01, cofins: 0.0459 };

/** Alíquota cheia de ICMS em São Paulo. */
export const ICMS_PADRAO_SP = 0.18;

// ---------------------------------------------------------------------------
// 4. BANDEIRAS TARIFÁRIAS (R$/kWh)
// ---------------------------------------------------------------------------

export const BANDEIRAS_SP: Record<string, number> = {
  VERDE: 0.0,
  AMARELA: 0.01885, // BAM
  VERMELHA_P1: 0.04463, // BVM 1
  VERMELHA_P2: 0.07877, // BVM 2
  ESCASSEZ: 0.142, // Escassez Hídrica
};

/** Rótulo que aparece na linha da NF-e para cada bandeira. */
export const ROTULO_BANDEIRA: Record<string, string> = {
  AMARELA: 'Adicional BAM',
  VERMELHA_P1: 'Adicional BVM 1',
  VERMELHA_P2: 'Adicional BVM 2',
  ESCASSEZ: 'Adicional Escassez',
};

// ---------------------------------------------------------------------------
// 5. REGRAS POR CATEGORIA
// ---------------------------------------------------------------------------

export type RegraIcms =
  | { tipo: 'normal' } // 18%
  | { tipo: 'isento_ate'; limiteKwh: number } // 18%, isento até N kWh
  | { tipo: 'isento' } // sempre 0%
  | { tipo: 'base_reduzida'; aliquotaNominal: number; aliquotaEfetiva: number };

export interface Retencao {
  nome: string;
  aliquota: number;
}

export interface RegraCategoria {
  rotulo: string;
  /** Categoria com postos tarifários (branca). */
  tarifaBranca: boolean;
  icms: RegraIcms;
  /** Retenções na fonte, aplicadas sobre o total das linhas de energia. */
  retencoes?: Retencao[];
  /** Possui consumo reservado com desconto (irrigante). */
  consumoReservado?: boolean;
  /** Fatiamento em bloco subsidiado (B1CDE). */
  blocoSubsidiado?: { limiteKwh: number; categoriaBloco: string; categoriaExcedente: string };
  /** Desconto escalonado de baixa renda. */
  baixaRenda?: boolean;
  /** Marca categorias cuja regra ainda não foi validada contra a planilha. */
  naoValidado?: string;
}

export const REGRAS_SP: Record<string, RegraCategoria> = {
  B1C: {
    rotulo: 'B1 Residencial — Convencional',
    tarifaBranca: false,
    icms: { tipo: 'isento_ate', limiteKwh: 50 },
  },
  B1C_GERAR: {
    rotulo: 'B1 Residencial — Gerar (Isento TUSG/TE)',
    tarifaBranca: false,
    icms: { tipo: 'isento_ate', limiteKwh: 50 },
  },
  B1C_TB: {
    rotulo: 'B1 Residencial — Tarifa Branca',
    tarifaBranca: true,
    icms: { tipo: 'isento_ate', limiteKwh: 50 },
  },
  B1CDE: {
    rotulo: 'B1 CDE — Desconto Social (bloco 120 kWh)',
    tarifaBranca: false,
    icms: { tipo: 'isento_ate', limiteKwh: 50 },
    blocoSubsidiado: { limiteKwh: 120, categoriaBloco: 'B1CDE', categoriaExcedente: 'B1C' },
  },
  B1BR: {
    rotulo: 'B1 Baixa Renda / Tarifa Social',
    tarifaBranca: false,
    icms: { tipo: 'isento_ate', limiteKwh: 50 },
    baixaRenda: true,
    naoValidado:
      'A planilha SP não tem aba de Baixa Renda. Os descontos escalonados vêm da ' +
      'Tabela 3 (65% / 40% / 10% / 0%) da aba TARIFAS 2025, mas não há exemplo ' +
      'calculado para conferir. Confirmar com a gestora antes de usar em produção.',
  },

  B2RURAL: {
    rotulo: 'B2 Rural — Convencional',
    tarifaBranca: false,
    icms: { tipo: 'isento' },
  },
  B2RURAL_GERAR: {
    rotulo: 'B2 Rural — Gerar (Isento TUSG/TE)',
    tarifaBranca: false,
    icms: { tipo: 'isento' },
  },
  B2RURAL_TB: {
    rotulo: 'B2 Rural — Tarifa Branca',
    tarifaBranca: true,
    icms: { tipo: 'isento' },
  },
  B2RUIRRG: {
    rotulo: 'B2 Serviço de Irrigação',
    tarifaBranca: false,
    icms: { tipo: 'base_reduzida', aliquotaNominal: 0.12, aliquotaEfetiva: 0.04 },
    consumoReservado: true,
  },
  B2RUIRRG_GERAR: {
    rotulo: 'B2 Serviço de Irrigação — Gerar (Isento TUSG/TE)',
    tarifaBranca: false,
    icms: { tipo: 'base_reduzida', aliquotaNominal: 0.12, aliquotaEfetiva: 0.04 },
    consumoReservado: true,
  },
  B2RUIRRG_TB: {
    rotulo: 'B2 Serviço de Irrigação — Tarifa Branca',
    tarifaBranca: true,
    icms: { tipo: 'base_reduzida', aliquotaNominal: 0.12, aliquotaEfetiva: 0.04 },
    consumoReservado: true,
  },

  B3: { rotulo: 'B3 Demais Classes', tarifaBranca: false, icms: { tipo: 'normal' } },
  B3_TB: { rotulo: 'B3 — Tarifa Branca', tarifaBranca: true, icms: { tipo: 'normal' } },
  B3_CP: { rotulo: 'B3 — Consumo Próprio', tarifaBranca: false, icms: { tipo: 'normal' } },
  B3_IR: {
    rotulo: 'B3 — com Retenção de IR',
    tarifaBranca: false,
    icms: { tipo: 'normal' },
    retencoes: [{ nome: 'Retenção IR', aliquota: 0.012 }],
  },
  B3_AES: {
    rotulo: 'B3 — Água, Esgoto e Saneamento',
    tarifaBranca: false,
    icms: { tipo: 'normal' },
    retencoes: [{ nome: 'Retenção IR', aliquota: 0.012 }],
  },
  B3_PPF: {
    rotulo: 'B3 — Poder Público Federal',
    tarifaBranca: false,
    icms: { tipo: 'normal' },
    retencoes: [
      { nome: 'Retenção IR', aliquota: 0.012 },
      { nome: 'Retenção CSLL', aliquota: 0.01 },
      { nome: 'Retenção PIS/PASEP', aliquota: 0.0065 },
      { nome: 'Retenção COFINS', aliquota: 0.03 },
    ],
  },

  B4A: {
    rotulo: 'B4a — Iluminação Pública (Rede de Distribuição)',
    tarifaBranca: false,
    icms: { tipo: 'normal' },
    retencoes: [{ nome: 'Retenção IR', aliquota: 0.012 }],
  },
  B4B: {
    rotulo: 'B4b — Iluminação Pública (Bulbo de Lâmpada)',
    tarifaBranca: false,
    icms: { tipo: 'normal' },
  },
};

// ---------------------------------------------------------------------------
// 6. DESCONTOS ESCALONADOS DE BAIXA RENDA (Tabela 3 — REH 3541/2025)
// ---------------------------------------------------------------------------

/** Blocos cumulativos: os primeiros 30 kWh têm 65% de desconto, e assim por diante. */
export const DESCONTOS_BAIXA_RENDA = [
  { ate: 30, desconto: 0.65, rotulo: 'até 30 kWh' },
  { ate: 100, desconto: 0.4, rotulo: 'de 31 a 100 kWh' },
  { ate: 220, desconto: 0.1, rotulo: 'de 101 a 220 kWh' },
  { ate: Infinity, desconto: 0.0, rotulo: 'acima de 220 kWh' },
];

// ---------------------------------------------------------------------------
// 7. OUTRAS CONSTANTES
// ---------------------------------------------------------------------------

/** Consumo mínimo faturável por tipo de ligação (kWh). */
export const MINIMO_FASE: Record<string, number> = {
  monofasico: 30,
  bifasico: 50,
  trifasico: 100,
};

/** Desconto sobre a tarifa do consumo reservado do irrigante. */
export const DESCONTO_RESERVADO_IRRIGANTE = 0.6;
