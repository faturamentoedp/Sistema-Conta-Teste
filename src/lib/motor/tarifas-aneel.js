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
 * A faixa de isenção vem da planilha "Regra de tributação 1.xlsx", validada
 * pelo Tributário e confirmada pela área em 10/09/2026:
 *   ES - Residencial isento até 50 kWh, 17% acima.
 *   SP - Residencial isento de 0 a 90 kWh, 12% de 91 a 200, 18% acima de 200.
 *   SP - Baixa Renda segue exatamente as mesmas faixas do Residencial.
 *
 * ⚠️ ATENÇÃO AO HISTÓRICO: o documento antigo "Regras e Premissas.txt" dizia o
 * contrário - "até 90 kWh para ES e 50 kWh para SP" - e foi essa versão
 * trocada que o motor usou até 10/09/2026. Nenhuma fatura real validada cai na
 * faixa de 50 a 90 kWh, então o erro nunca apareceu nos testes: todas as
 * contas conferidas estão acima dos dois limites e dão o mesmo resultado nas
 * duas regras. Se alguém reabrir essa discussão, a fonte boa é a planilha do
 * Tributário, não o premissas.
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
        { ate: 50, aliquota: 0 },
        { ate: Infinity, aliquota: 0.17 }
    ],
    SP: [
        { ate: 90, aliquota: 0 },
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
 * Informativo "Benefício Tarifário obtido com a Tarifa Social" - a nota de
 * rodapé (ATENÇÃO) da fatura Baixa Renda, que também aparece no modelo da
 * área como "Benefício Tarifa Social (mensagem na fatura)". Não soma no total.
 *
 * Valor = kWh isentos (FAIXA_TARIFA_SOCIAL_KWH) x (TUSD + TE), SEM a
 * bandeira. Conferido em duas fontes:
 *  - Modelo da área, 450 kWh em out/2026: 80 x (0,34895 + 0,32532) = 53,94,
 *    igual ao "Benefício Tarifa Social" do modelo. A bandeira (BAM, 1,28) fica
 *    numa linha separada e só entra no total de 55,22 usado pra calcular o
 *    ICMS do desconto - não na mensagem.
 *  - Fatura real ES, 413 kWh, 04/08 a 03/09/2026: 80 x 0,669844 (tarifa
 *    ponderada 2/28 dias entre REH 3.508 e 3.600) = 53,59, contra R$ 53,58
 *    impresso na conta. Com a bandeira daria 55,10 - não bate.
 *
 * Só confirmado em ES. Em SP não temos uma fatura Baixa Renda com a mensagem
 * pra conferir, então fica desligado até aparecer uma.
 */
export const BENEFICIO_TARIFA_SOCIAL_INFORMATIVO = { ES: true, SP: false };

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
 * ⚠️ Antes de 05/10/2026 as duas vigências abaixo traziam o MESMO valor
 * (tusd + te = -0,00241043), que é a média ponderada do ciclo de referência
 * (16 dias na REH 3.508 + 14 na REH 3.600) - o que só acerta aquele ciclo.
 * Para qualquer leitura inteira dentro de uma das vigências o informativo
 * saía errado: no modelo Baixa Renda da área (450 kWh, out/2026) o simulador
 * dava -1,08 contra -0,20, e na fatura real ES de 413 kWh (04/08 a
 * 03/09/2026) dava -1,00 contra -0,26 impresso.
 *
 * Separando por resolução, três pontos fecham juntos (só a SOMA tusd + te é
 * usada no cálculo; o TUSD fica fixo e o resto vai no TE):
 *   1. ciclo B1 de referência, 16/14 dias: 16/30 x r_3508 + 14/30 x r_3600
 *      = -0,00241043 (o valor que já bateu com o Doc 1025308715);
 *   2. modelo Baixa Renda, 370 kWh faturados todos na REH 3.600:
 *      370 x r_3600 = -0,20  ->  r_3600 = -0,000542;
 *   3. fatura real Baixa Renda, 333 kWh faturados, 2 dias na REH 3.508 e 28
 *      na 3.600: 333 x (2/30 x r_3508 + 28/30 x r_3600) = -0,258 (impresso
 *      -0,26), com r_3508 = -0,004045 vindo de (1) e (2).
 * Com isso o TE ponderado do ciclo de referência volta a dar exatamente
 * -0,00259652, o número da planilha "B1 Res" que antes parecia "inexplicável".
 *
 * Os dois valores por resolução são DERIVADOS (não lidos de uma tabela
 * publicada) - a fonte primária continua sendo a planilha da área. Os pontos
 * (2) e (3) são de Baixa Renda; para B1 residencial só o ciclo (1) está
 * comprovado em fatura, então confira com a próxima fatura B1 do ES que
 * trouxer o informativo depois de 07/08/2026.
 *
 * Em Baixa Renda o informativo incide só nos kWh efetivamente faturados (sem
 * os 80 kWh isentos): o encargo está embutido no TUSD/TE e, nos kWh a tarifa
 * zero, ele zera junto. Sem essa exclusão (413 kWh no lugar de 333) o ponto
 * (3) daria -0,32 em vez dos -0,26 impressos.
 *
 * Só temos o valor publicado para B1 residencial no ES, mas por pedido da
 * equipe (26/08/2026) ele é aplicado pra qualquer categoria no ES - sem
 * confirmação de que o valor por kWh é o mesmo fora do B1. Fora do ES o
 * informativo não aparece.
 */
export const ENCARGO_ESCASSEZ_HIDRICA = {
    ES: [
        // REH 3.508 (até 06/08/2026): soma -0,004045. O TUSD é o mesmo nas duas
        // linhas e o resto vai no TE - só a soma é evidenciada, ver acima.
        { inicio: '2026-01-01', fim: '2026-08-06', tusd: 0.00018609, te: -0.0042314 },
        // REH 3.600 (a partir de 07/08/2026): soma -0,000542.
        { inicio: '2026-08-07', fim: '2027-08-06', tusd: 0.00018609, te: -0.00072809 }
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

/**
 * Redutor tarifário SUDENE (recursos da repactuação UBP homologados pela ANEEL para EDP ES).
 *
 * Aplica-se aos municípios do Espírito Santo pertencentes à área de atuação da SUDENE.
 * O desconto base aprovado para baixa tensão (Grupo B) é de R$ 7,81/MWh (R$ 0,00781/kWh).
 * Vigência oficial homologada com início em 30/08/2026.
 *
 * Fonte: Planilhas/Grupo B/EDP ES_Modelo_NFe_Grupo B SUDENE Atualizado 1.xlsm
 *
 * ⚠️ CONSTANTES NÃO CONFERIDAS NA FONTE. Essa planilha está criptografada com
 * DRM corporativo (o container OLE2 traz DRMEncryptedDataSpace e
 * EncryptedPackage, sem stream de workbook), e não foi possível abri-la para
 * validar. A matemática do redutor foi auditada e é consistente com o resto do
 * motor, mas a TARIFA (R$ 7,81/MWh) e a DATA DE INÍCIO (30/08/2026) vieram do
 * plano de implementação, não da planilha. Conferir contra uma fatura real com
 * SUDENE antes de tratar como validado.
 */
export const SUDENE_CONFIG = {
    ES: {
        tarifa_base_mwh: 7.81,
        tarifa_base_kwh: 0.00781,
        inicio_vigencia: '2026-08-30'
    }
};
