/**
 * ============================================================================
 *  PIS/COFINS MENSAL POR DISTRIBUIDORA
 * ============================================================================
 *
 *  As alíquotas efetivas mudam TODO MÊS e não têm fonte automática: vêm do
 *  comunicado da EDP, calculado conforme a Nota Técnica 115-SFF/SRE/ANEEL e
 *  lançado na transação SAP ZCCS_PISCOFINS.
 *
 *  A chave é o mês da LEITURA ATUAL da conta - foi assim que as faturas
 *  validadas fecharam:
 *    ES, leitura até 23/06/2026 -> 0,66% / 3,02%  (fatura Doc 265002360732)
 *    ES, leitura até 06/07/2026 -> 1,09% / 5,04%  (fatura Doc 257002385025)
 *    ES, leitura até 20/08/2026 -> 1,10% / 5,07%  (fatura Doc 0.000.005.988.054-67)
 *
 *  Só a SOMA entra no cálculo do imposto por dentro; a separação entre PIS e
 *  COFINS aparece apenas no resumo de tributos da tela.
 *
 *  COMO ATUALIZAR: acrescente a linha do mês novo no bloco da distribuidora.
 * ============================================================================
 */

/** Usado quando o mês não está cadastrado. */
export const TRIBUTOS_PADRAO = { pis: 0.0063, cofins: 0.0289 };

/** ICMS padrão por estado: 17% no Espírito Santo, 18% em São Paulo. */
export const ICMS_PADRAO = { ES: 0.17, SP: 0.18 };

export const TRIBUTOS_MENSAIS = {
    ES: {
        '2024-01': { pis: 0.0082, cofins: 0.0375 }, '2024-02': { pis: 0.0080, cofins: 0.0367 },
        '2024-03': { pis: 0.0085, cofins: 0.0395 }, '2024-04': { pis: 0.0115, cofins: 0.0529 },
        '2024-05': { pis: 0.0121, cofins: 0.0557 }, '2024-06': { pis: 0.0052, cofins: 0.0240 },
        // ⚠️ jul/24 veio com PIS 1,40% e COFINS 1,86% na tabela recebida. A
        // proporção foge de todos os outros meses (COFINS costuma ser ~4,6x o
        // PIS), o que sugere erro de digitação na origem. Mantido como veio -
        // conferir se alguma conta de julho/2024 precisar ser simulada.
        '2024-07': { pis: 0.0140, cofins: 0.0186 },
        '2024-08': { pis: 0.0081, cofins: 0.0373 }, '2024-09': { pis: 0.0112, cofins: 0.0515 },
        '2024-10': { pis: 0.0100, cofins: 0.0459 }, '2024-11': { pis: 0.0065, cofins: 0.0299 },
        '2024-12': { pis: 0.0084, cofins: 0.0390 },

        '2025-01': { pis: 0.0056, cofins: 0.0259 }, '2025-02': { pis: 0.0059, cofins: 0.0270 },
        '2025-03': { pis: 0.0090, cofins: 0.0412 }, '2025-04': { pis: 0.0105, cofins: 0.0485 },
        '2025-05': { pis: 0.0102, cofins: 0.0472 }, '2025-06': { pis: 0.0062, cofins: 0.0285 },
        '2025-07': { pis: 0.0062, cofins: 0.0284 }, '2025-08': { pis: 0.0104, cofins: 0.0479 },
        '2025-09': { pis: 0.0101, cofins: 0.0467 }, '2025-10': { pis: 0.0129, cofins: 0.0596 },
        '2025-11': { pis: 0.0108, cofins: 0.0496 }, '2025-12': { pis: 0.0087, cofins: 0.0403 },

        '2026-01': { pis: 0.0092, cofins: 0.0422 }, '2026-02': { pis: 0.0126, cofins: 0.0581 },
        '2026-03': { pis: 0.0114, cofins: 0.0526 }, '2026-04': { pis: 0.0094, cofins: 0.0432 },
        '2026-05': { pis: 0.0063, cofins: 0.0289 }, '2026-06': { pis: 0.0066, cofins: 0.0302 },
        '2026-07': { pis: 0.0109, cofins: 0.0504 }, '2026-08': { pis: 0.0110, cofins: 0.0507 },
        // Setembro/2026 estava faltando e o simulador caía na alíquota
        // genérica (0,630/2,890), o que a área identificou em 14/09/2026 numa
        // simulação do ES. Valores confirmados pela chefia.
        '2026-09': { pis: 0.0128, cofins: 0.0587 }
    },

    // Tabela oficial de SP (exercício/período K4/MM.AAAA).
    SP: {
        '2014-01': { pis: 0.0093, cofins: 0.0499 }, '2014-02': { pis: 0.0071, cofins: 0.0322 },
        '2014-03': { pis: 0.0039, cofins: 0.0201 }, '2014-04': { pis: 0.0020, cofins: 0.0090 },
        '2014-05': { pis: 0.0018, cofins: 0.0063 }, '2014-06': { pis: 0.0016, cofins: 0.0071 },
        '2014-07': { pis: 0.0014, cofins: 0.0075 }, '2014-08': { pis: 0.0088, cofins: 0.0409 },
        '2014-09': { pis: 0.0115, cofins: 0.0521 }, '2014-10': { pis: 0.0036, cofins: 0.0164 },
        '2014-11': { pis: 0.0018, cofins: 0.0091 }, '2014-12': { pis: 0.0042, cofins: 0.0193 },

        '2015-01': { pis: 0.0106, cofins: 0.0481 }, '2015-02': { pis: 0.0120, cofins: 0.0554 },
        '2015-03': { pis: 0.0042, cofins: 0.0198 }, '2015-04': { pis: 0.0027, cofins: 0.0125 },
        '2015-05': { pis: 0.0165, cofins: 0.0760 }, '2015-06': { pis: 0.0112, cofins: 0.0516 },
        '2015-07': { pis: 0.0043, cofins: 0.0198 }, '2015-08': { pis: 0.0040, cofins: 0.0183 },
        '2015-09': { pis: 0.0118, cofins: 0.0541 }, '2015-10': { pis: 0.0137, cofins: 0.0634 },
        '2015-11': { pis: 0.0096, cofins: 0.0443 }, '2015-12': { pis: 0.0068, cofins: 0.0312 },

        '2016-01': { pis: 0.0086, cofins: 0.0393 }, '2016-02': { pis: 0.0097, cofins: 0.0447 },
        '2016-03': { pis: 0.0087, cofins: 0.0401 }, '2016-04': { pis: 0.0116, cofins: 0.0537 },
        '2016-05': { pis: 0.0124, cofins: 0.0569 }, '2016-06': { pis: 0.0085, cofins: 0.0391 },
        '2016-07': { pis: 0.0082, cofins: 0.0380 }, '2016-08': { pis: 0.0120, cofins: 0.0553 },
        '2016-09': { pis: 0.0108, cofins: 0.0497 }, '2016-10': { pis: 0.0079, cofins: 0.0364 },
        '2016-11': { pis: 0.0082, cofins: 0.0376 }, '2016-12': { pis: 0.0097, cofins: 0.0445 },

        '2017-01': { pis: 0.0042, cofins: 0.0193 }, '2017-02': { pis: 0.0049, cofins: 0.0229 },
        '2017-03': { pis: 0.0104, cofins: 0.0480 }, '2017-04': { pis: 0.0099, cofins: 0.0454 },
        '2017-05': { pis: 0.0057, cofins: 0.0261 }, '2017-06': { pis: 0.0032, cofins: 0.0151 },
        '2017-07': { pis: 0.0095, cofins: 0.0438 }, '2017-08': { pis: 0.0092, cofins: 0.0419 },
        '2017-09': { pis: 0.0065, cofins: 0.0300 }, '2017-10': { pis: 0.0052, cofins: 0.0242 },
        '2017-11': { pis: 0.0028, cofins: 0.0129 }, '2017-12': { pis: 0.0031, cofins: 0.0144 },

        '2018-01': { pis: 0.0053, cofins: 0.0243 }, '2018-02': { pis: 0.0068, cofins: 0.0313 },
        '2018-03': { pis: 0.0101, cofins: 0.0466 }, '2018-04': { pis: 0.0096, cofins: 0.0443 },
        '2018-05': { pis: 0.0066, cofins: 0.0301 }, '2018-06': { pis: 0.0059, cofins: 0.0273 },
        '2018-07': { pis: 0.0087, cofins: 0.0402 }, '2018-08': { pis: 0.0108, cofins: 0.0499 },
        '2018-09': { pis: 0.0097, cofins: 0.0445 }, '2018-10': { pis: 0.0065, cofins: 0.0297 },
        '2018-11': { pis: 0.0072, cofins: 0.0331 }, '2018-12': { pis: 0.0102, cofins: 0.0469 },

        '2019-01': { pis: 0.0094, cofins: 0.0434 }, '2019-02': { pis: 0.0061, cofins: 0.0283 },
        '2019-03': { pis: 0.0085, cofins: 0.0389 }, '2019-04': { pis: 0.0099, cofins: 0.0455 },
        '2019-05': { pis: 0.0098, cofins: 0.0452 }, '2019-06': { pis: 0.0078, cofins: 0.0361 },
        '2019-07': { pis: 0.0086, cofins: 0.0396 }, '2019-08': { pis: 0.0086, cofins: 0.0395 },
        '2019-09': { pis: 0.0092, cofins: 0.0425 }, '2019-10': { pis: 0.0097, cofins: 0.0450 },
        '2019-11': { pis: 0.0089, cofins: 0.0410 }, '2019-12': { pis: 0.0070, cofins: 0.0318 },

        '2020-01': { pis: 0.0086, cofins: 0.0394 }, '2020-02': { pis: 0.0082, cofins: 0.0382 },
        '2020-03': { pis: 0.0036, cofins: 0.0168 }, '2020-04': { pis: 0.0041, cofins: 0.0186 },
        '2020-05': { pis: 0.0053, cofins: 0.0242 }, '2020-06': { pis: 0.0064, cofins: 0.0297 },
        '2020-07': { pis: 0.0077, cofins: 0.0357 }, '2020-08': { pis: 0.0029, cofins: 0.0134 },
        '2020-09': { pis: 0.0044, cofins: 0.0202 }, '2020-10': { pis: 0.0091, cofins: 0.0420 },
        '2020-11': { pis: 0.0085, cofins: 0.0389 }, '2020-12': { pis: 0.0058, cofins: 0.0266 },

        '2021-01': { pis: 0.0112, cofins: 0.0520 }, '2021-02': { pis: 0.0088, cofins: 0.0406 },
        '2021-03': { pis: 0.0116, cofins: 0.0533 }, '2021-04': { pis: 0.0088, cofins: 0.0407 },
        '2021-05': { pis: 0.0071, cofins: 0.0327 }, '2021-06': { pis: 0.0052, cofins: 0.0240 },
        '2021-07': { pis: 0.0057, cofins: 0.0262 }, '2021-08': { pis: 0.0075, cofins: 0.0345 },
        '2021-09': { pis: 0.0081, cofins: 0.0372 }, '2021-10': { pis: 0.0134, cofins: 0.0616 },
        '2021-11': { pis: 0.0134, cofins: 0.0616 }, '2021-12': { pis: 0.0134, cofins: 0.0616 },

        '2022-01': { pis: 0.0050, cofins: 0.0230 }, '2022-02': { pis: 0.0044, cofins: 0.0203 },
        '2022-03': { pis: 0.0092, cofins: 0.0425 }, '2022-04': { pis: 0.0128, cofins: 0.0589 },
        '2022-05': { pis: 0.0127, cofins: 0.0583 }, '2022-06': { pis: 0.0059, cofins: 0.0271 },
        '2022-07': { pis: 0.0029, cofins: 0.0134 }, '2022-08': { pis: 0.0084, cofins: 0.0386 },
        '2022-09': { pis: 0.0127, cofins: 0.0585 }, '2022-10': { pis: 0.0124, cofins: 0.0569 },
        '2022-11': { pis: 0.0097, cofins: 0.0447 }, '2022-12': { pis: 0.0078, cofins: 0.0362 },

        '2023-01': { pis: 0.0037, cofins: 0.0291 }, '2023-02': { pis: 0.0022, cofins: 0.0099 },
        '2023-03': { pis: 0.0079, cofins: 0.0364 }, '2023-04': { pis: 0.0094, cofins: 0.0433 },
        '2023-05': { pis: 0.0076, cofins: 0.0349 }, '2023-06': { pis: 0.0016, cofins: 0.0072 },
        '2023-07': { pis: 0.0030, cofins: 0.0139 }, '2023-08': { pis: 0.0076, cofins: 0.0353 },
        '2023-09': { pis: 0.0095, cofins: 0.0436 }, '2023-10': { pis: 0.0062, cofins: 0.0282 },
        '2023-11': { pis: 0.0036, cofins: 0.0167 }, '2023-12': { pis: 0.0062, cofins: 0.0291 },

        '2024-01': { pis: 0.0119, cofins: 0.0550 }, '2024-02': { pis: 0.0109, cofins: 0.0500 },
        '2024-03': { pis: 0.0075, cofins: 0.0344 }, '2024-04': { pis: 0.0048, cofins: 0.0222 },
        '2024-05': { pis: 0.0080, cofins: 0.0371 }, '2024-06': { pis: 0.0106, cofins: 0.0487 },
        '2024-07': { pis: 0.0113, cofins: 0.0521 }, '2024-08': { pis: 0.0066, cofins: 0.0303 },
        '2024-09': { pis: 0.0053, cofins: 0.0246 }, '2024-10': { pis: 0.0098, cofins: 0.0452 },
        '2024-11': { pis: 0.0101, cofins: 0.0465 }, '2024-12': { pis: 0.0095, cofins: 0.0437 },

        '2025-01': { pis: 0.0037, cofins: 0.0169 }, '2025-02': { pis: 0.0044, cofins: 0.0202 },
        '2025-03': { pis: 0.0111, cofins: 0.0510 }, '2025-04': { pis: 0.0124, cofins: 0.0573 },
        '2025-05': { pis: 0.0102, cofins: 0.0472 }, '2025-06': { pis: 0.0045, cofins: 0.0206 },
        '2025-07': { pis: 0.0067, cofins: 0.0305 }, '2025-08': { pis: 0.0119, cofins: 0.0548 },
        '2025-09': { pis: 0.0105, cofins: 0.0484 }, '2025-10': { pis: 0.0124, cofins: 0.0569 },
        '2025-11': { pis: 0.0114, cofins: 0.0525 }, '2025-12': { pis: 0.0103, cofins: 0.0477 },

        '2026-01': { pis: 0.0090, cofins: 0.0417 }, '2026-02': { pis: 0.0106, cofins: 0.0491 },
        '2026-03': { pis: 0.0102, cofins: 0.0471 }, '2026-04': { pis: 0.0071, cofins: 0.0376 },
        '2026-05': { pis: 0.0071, cofins: 0.0326 }, '2026-06': { pis: 0.0070, cofins: 0.0323 },

        // ⚠️ JULHO/2026 NÃO ESTÁ NA TABELA OFICIAL RECEBIDA, que termina em
        // K4/006.2026. A soma abaixo (5,586%) foi obtida da própria fatura
        // Doc 0.002.601.383.004-71 de JUL/2026 (R$ 172,82): com ICMS de 12%,
        // os preços unitários impressos implicam divisor 0,830843. O rateio
        // entre PIS e COFINS seguiu a proporção dos meses vizinhos.
        // SUBSTITUIR quando o comunicado de julho chegar.
        '2026-07': { pis: 0.0100, cofins: 0.0459 },

        '2026-08': { pis: 0.0106, cofins: 0.0487 },
        '2026-09': { pis: 0.0121, cofins: 0.0559 }
    }
};
