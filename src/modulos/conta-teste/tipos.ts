/** Formato da resposta de POST /api/conta-teste/calcular (ver motor/calculo.js). */

export interface LinhaDetalhe {
  nome: string;
  unidade: string;
  quantidade: number;
  tarifa_base?: number;
  preco_unit: number;
  valor_total: number;
  base_pis_cofins?: number;
  valor_pis_cofins: number;
  base_icms?: number;
  aliquota_icms?: number;
  valor_icms: number;
  is_informativo?: boolean;
  is_injetada?: boolean;
  is_sudene?: boolean;
}

export interface ResumoFatura {
  total_energia: number;
  total_retencoes?: number;
  total_pis_cofins: number;
  total_base_pis_cofins: number;
  total_pis: number;
  total_cofins: number;
  total_icms: number;
  total_fatura: number;
  valor_cip: number;
  valor_fio_b?: number;
  tarifa_fio_b_unit?: number;
  valor_escassez?: number;
  tarifa_escassez_unit?: number;
  valor_beneficio_tarifa_social?: number;
}

export interface ResultadoCalculo {
  detalhes: LinhaDetalhe[];
  resumo: ResumoFatura;
  avisos?: string[];
  parametros_usados: {
    consumo_faturado: number;
    aliquota_pis_aplicada: number;
    aliquota_cofins_aplicada: number;
    aliquota_icms_aplicada: number;
  };
}

/** Campos do formulário (todos texto, como digitados). */
export interface FormularioContaTeste {
  instalacao: string;
  documento_impressao: string;
  distribuidora: string;
  categoria: string;
  fase: string;
  data_leitura_anterior: string;
  data_leitura_atual: string;
  constante_medidor: string;
  consumo_kwh: string;
  consumo_reservado: string;
  consumo_ponta: string;
  consumo_fora_ponta: string;
  consumo_intermediario: string;
  inj_ponta: string;
  inj_fora_ponta: string;
  inj_intermediario: string;
  bandeira_mes1: string;
  bandeira_mes2: string;
  bandeira_mes3: string;
  /** Dias de cada bandeira como a fatura imprime (vazio = segue a ordem das datas). */
  dias_bandeira1: string;
  dias_bandeira2: string;
  dias_bandeira3: string;
  valor_cip: string;
  icms_opcao: string;
}
