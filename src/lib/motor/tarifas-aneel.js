/**
 * ============================================================================
 *  PARÂMETROS E EXCEÇÕES DA BASE TARIFÁRIA
 * ============================================================================
 *
 *  A base em si é gerada por scripts/exportar-vigencias.py a partir do export
 *  oficial da ANEEL e vive em vigencias.js. Aqui ficam só as constantes de
 *  regra e as exceções que não saem da planilha.
 * ============================================================================
 */

/** Isenção da Tarifa Social (MP 1300 / Lei 10.438). */
export const FAIXA_TARIFA_SOCIAL_KWH = 80;

/** Faixa reduzida do Desconto Social (Lei 15.235/2025). */
export const FAIXA_DESCONTO_SOCIAL_KWH = 120;

/** Categoria do formulário que é Desconto Social. */
export const CATEGORIA_DESCONTO_SOCIAL = 'B1CDE';

/**
 * O TE do B2RUIRRG vem desatualizado na dimensão do SQL (0,29749). A conta real
 * e o Excel antigo usam 0,32068, que é o valor da ANEEL.
 */
export const TE_B2RUIRRG_CORRIGIDO = { de: 0.29749, para: 0.32068 };

/**
 * Exceções à planilha da ANEEL.
 *
 * B2RURAL: a dimensão do SQL traz 0,36647/0,28189 enquanto a ANEEL publica
 * 0,46863/0,32068 para B2 Convencional Rural. A diferença não é um percentual
 * uniforme (78,2% no TUSD e 87,9% no TE), então não dá para deduzir a regra.
 * Pode ser desconto rural legal já embutido na dimensão, ou o mesmo tipo de
 * erro de cadastro que existia no B1CDE e na Baixa Renda.
 *
 * Enquanto a gestora não confirma, o valor histórico é mantido para não mudar
 * silenciosamente o que já era faturado. AO CONFIRMAR: se for erro, basta
 * apagar a entrada abaixo e a tarifa da ANEEL passa a valer.
 */
export const OVERRIDES_TARIFA = {
    ES: {}
};

/**
 * ============================================================================
 *  GERAÇÃO DISTRIBUÍDA (MMGD) - Lei 14.300/2022
 * ============================================================================
 *
 *  A energia injetada abate a conta, mas o quanto ela abate depende do
 *  enquadramento. O percentual abaixo é quanto da tarifa é efetivamente
 *  compensado; o que sobra é o Fio B que o cliente paga.
 *
 *    GD1 - direito adquirido, compensação integral (100%).
 *    GD2 - transição da Lei 14.300, compensa menos ao longo dos anos.
 *
 *  Fonte: modelos oficiais em "Grupo B/EDP_ES_RTA_2026_Modelo_Grupo B_MMGD_*",
 *  linha "Perc. de Redução da Energia". O TE é sempre compensado integralmente;
 *  a redução incide só sobre o TUSD.
 *
 *  ATENÇÃO - GD3 ainda não tem percentual definido. Os modelos recebidos só
 *  cobrem GD1 e GD2. Enquanto não houver a informação, selecionar GD3 no
 *  formulário devolve erro em vez de calcular um número inventado.
 */
export const PERC_REDUCAO_GD = {
    GD1: [
        { inicio: '2000-01-01', fim: '2099-12-31', tusd: 1, te: 1 }
    ],
    GD2: [
        { inicio: '2026-01-01', fim: '2026-08-06', tusd: 0.739, te: 1 },
        { inicio: '2026-08-07', fim: '2027-08-06', tusd: 0.7522, te: 1 }
    ],
    GD3: null
};

/**
 * ICMS do residencial convencional, por faixa de consumo.
 *
 * São Paulo cobra por faixa; o Espírito Santo tem só a isenção inicial.
 * Comprovado por:
 *   SP  97 kWh -> 12%  (modelo "Lote 09 ... B1C_TB.xlsm", aba B1C)
 *   SP 158 kWh -> 12%  (fatura Doc 0.002.601.383.004-71, R$ 172,82)
 *   SP 291 kWh -> 18%  (fatura de SP da Subvenção Tarifária)
 *   ES 154 kWh -> 17%  (fatura Doc 265002360732)
 *
 * A faixa de isenção vem das regras internas do projeto: até 90 kWh no ES e
 * até 50 kWh em SP.
 *
 * ⚠️ O limite de 200 kWh entre 12% e 18% em SP é o valor clássico da
 * legislação paulista, mas não foi comprovado por fatura: os pontos que temos
 * são 158 (12%) e 291 (18%). Se aparecer uma conta entre 159 e 290 kWh, vale
 * conferir.
 *
 * Fora do residencial convencional valem as alíquotas fixas: B2 Rural 0%,
 * B2 Irrigante 4%, e as demais categorias usam ICMS_PADRAO (17% ES, 18% SP) -
 * confirmado nos modelos de B3, B4A e Tarifa Branca de SP.
 */
export const ICMS_FAIXAS_RESIDENCIAL = {
    ES: [
        { ate: 90, aliquota: 0 },
        { ate: Infinity, aliquota: 0.17 }
    ],
    SP: [
        { ate: 50, aliquota: 0 },
        { ate: 200, aliquota: 0.12 },
        { ate: Infinity, aliquota: 0.18 }
    ]
};

/** Categorias que, tendo GD, faturam obrigatoriamente como GD1. */
export const SEMPRE_GD1 = (categoria) =>
    categoria.startsWith('B1BR') || categoria.endsWith('_TB');

/**
 * COMPORTAMENTO HERDADO - Tarifa Branca, posto Intermediário.
 *
 * A dimensão do SQL gravava o posto como "Intermediario", sem acento, enquanto
 * o motor procurava por "Intermediário". A busca falhava e caía na primeira
 * linha da categoria, que era a de Ponta - ou seja, o Intermediário era
 * faturado com tarifa de Ponta (0,93761 em vez de 0,65129 no B1C_TB, 44% a
 * mais). O mesmo acontecia com o Consumo Reservado do B2RUIRRG_TB.
 *
 * A planilha da ANEEL grava "Intermediário" com acento, então migrar para ela
 * corrige o problema sozinho. A decisão tomada na validação foi MANTER os
 * valores como estavam, para não mudar contas já conferidas.
 *
 * Coloque em false para passar a usar a tarifa correta de cada posto. Ao
 * fazer isso, recapture a referência: os cenários de Tarifa Branca vão mudar.
 */
export const REPRODUZIR_FALLBACK_POSTO = false;

/**
 * A base da Subvenção Tarifária (linha "Valor Baixa Renda") difere entre os
 * estados, e as duas faturas validadas comprovam a diferença:
 *
 *   SP - 80 x (TUSD + TE) = 47,31. Exigência escrita na validação de SP:
 *        "considerar apenas a tarifa (TUSD e TE) multiplicado por 80 kWh".
 *   ES - 80 x (TUSD + TE + bandeira) = 50,13, que é o valor impresso na
 *        fatura Doc 257002385025.
 *
 * Incluir a bandeira em SP daria 48,01 e excluí-la em ES daria 48,63 - nenhum
 * dos dois bate. Por isso o comportamento é por distribuidora.
 */
export const SUBVENCAO_INCLUI_BANDEIRA = { ES: true, SP: false };

/**
 * Informativo: Encargo CDE - Escassez Hídrica.
 *
 * Componente embutido no TUSD/TE (itens SAP ZIEH11 e ZIEH01) que a fatura só
 * divulga como nota de rodapé - "Informativo: Encargo CDE - Escassez Hídrica
 * incluso da tarifa" - sem somar no total, do mesmo jeito que o Fio B.
 *
 * Ao contrário do Fio B, o valor já vem líquido de tributos: é só
 * consumo x (tusd + te). Conferido no Doc de impressão 1025308715 (B1
 * residencial, ES, leitura 21/07 a 20/08/2026): 121 kWh x (0,00018609 -
 * 0,00259652) = -R$0,29, batendo com o rodapé impresso.
 *
 * ⚠️ Valor fixo, não uma tarifa por vigência: a planilha "B1 Res" também
 * lista um TUSD e um TE separados por resolução (REH 3.508 x REH 3.600), mas
 * só o TUSD bate com a média ponderada pelos dias de cada uma - o TE
 * proporcionalizado da planilha (-0,002597) é ~5,6x maior que essa média
 * (-0,000463), então tem algo na conta do TE que essas duas colunas não
 * mostram. Sem a fórmula real, gravamos direto o resultado final já
 * proporcionalizado (tusd + te = -0,00241043) que bateu com a fatura, em vez
 * de tentar recalcular a partir da REH 3.508/REH 3.600 separadamente.
 *
 * Isso funciona para qualquer leitura dentro dessas vigências, mas não foi
 * validado fora do ciclo de referência (21/07 a 20/08/2026) - se aparecer
 * outra fatura de B1 no ES com o informativo, confira antes de confiar.
 *
 * Só temos o valor publicado para B1 residencial no ES, mas por pedido da
 * equipe (26/08/2026) ele é aplicado pra qualquer categoria no ES - sem
 * confirmação de que o valor por kWh é o mesmo fora do B1. Fora do ES o
 * informativo não aparece.
 */
export const ENCARGO_ESCASSEZ_HIDRICA = {
    ES: [
        { inicio: '2026-01-01', fim: '2026-08-06', tusd: 0.00018609, te: -0.00259652 },
        { inicio: '2026-08-07', fim: '2027-08-06', tusd: 0.00018609, te: -0.00259652 }
    ]
};

/**
 * TUSD Fio B publicado pela ANEEL - o item "TUSD - Fio B (Item Informativo)".
 *
 * Até aqui o motor estimava o Fio B como 45% da TUSD de consumo (número
 * genérico, sem fonte por categoria) e ainda dividia pelos tributos como se
 * fosse um valor cobrado. A planilha interna "B1 Res" e a transação SAP
 * (item Z0FIOB) do Doc de impressão 1025308715 mostram que não é bem assim:
 * o Fio B do B1 no ES tem uma TUSD própria publicada por resolução -
 * 0,203831 na REH 3.508/2025 e 0,209512 na REH 3.600/2026 - e o valor final
 * já sai líquido de tributos (é só consumo x tusd_fio_b, do mesmo jeito que
 * o Encargo CDE Escassez Hídrica). Ponderando pelos 16/14 dias da virada:
 * 121 kWh x 0,206483 = R$24,98, batendo com a planilha (R$24,98) e com o SAP
 * (R$24,96, a diferença é só arredondamento de uma casa a mais na tarifa).
 *
 * 43,5%/41,4% da TUSD cheia dessas duas resoluções - bem longe dos 45% que o
 * motor usava. Diferente da Escassez Hídrica, aqui a ponderação simples por
 * dias bateu certinho (é a mesma conta que já fazíamos para a tarifa normal).
 *
 * Só temos o valor publicado para B1 no ES. Fora disso, o motor continua
 * usando a estimativa de 45% (ver calcular_fatura, em calculo.js) até
 * aparecer a fonte oficial de outra categoria.
 */
export const FIO_B_TUSD = {
    ES: {
        B1C: [
            { inicio: '2026-01-01', fim: '2026-08-06', tusd: 0.203831 }, // REH 3.508/2025
            { inicio: '2026-08-07', fim: '2027-08-06', tusd: 0.209512 }  // REH 3.600/2026
        ]
    }
};
