/**
 * ============================================================================
 *  MOTOR DE CÁLCULO DA FATURA - fonte única
 * ============================================================================
 *
 *  Usado por dois consumidores:
 *    1. a API do Next (src/app/api/calcular/route.ts), com as tarifas vindas
 *       do SQL Server;
 *    2. a versão autônoma em HTML, com as tarifas embutidas por
 *       scripts/exportar-tarifas.mjs.
 *
 *  Por isso este arquivo é JavaScript puro, sem tipos e sem importar nada:
 *  o gerador do HTML injeta o conteúdo dele direto na página.
 *
 *  NÃO altere as regras aqui sem rodar `npm run verificar`, que compara os dois
 *  caminhos linha a linha.
 * ============================================================================
 */

import {
    FAIXA_TARIFA_SOCIAL_KWH,
    FAIXA_DESCONTO_SOCIAL_KWH,
    CATEGORIA_DESCONTO_SOCIAL,
    SUBVENCAO_INCLUI_BANDEIRA,
    OVERRIDES_TARIFA,
    REPRODUZIR_FALLBACK_POSTO,
    PERC_REDUCAO_GD,
    SEMPRE_GD1,
    ICMS_FAIXAS_RESIDENCIAL,
    ENCARGO_ESCASSEZ_HIDRICA,
    FIO_B_TUSD
} from './tarifas-aneel.js';
import { VIGENCIAS } from './vigencias.js';
import { TRIBUTOS_MENSAIS, TRIBUTOS_PADRAO, ICMS_PADRAO } from './tributos.js';

export { TRIBUTOS_MENSAIS, ICMS_PADRAO };

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Dias do período de leitura que caem dentro de uma vigência.
 *
 * O período de faturamento é aberto na leitura anterior e fechado na atual:
 * o dia da leitura anterior não conta, o da leitura atual conta. É assim que o
 * modelo oficial da EDP conta - numa leitura de 24/07 a 25/08/2026, com virada
 * em 07/08, ele registra 13 dias na tarifa antiga e 19 na nova, somando 32.
 */
function dias_na_vigencia(leitura_anterior, leitura_atual, vig_inicio, vig_fim) {
    const ini = Math.max(leitura_anterior.getTime() + MS_POR_DIA, vig_inicio.getTime());
    const fim = Math.min(leitura_atual.getTime(), vig_fim.getTime());
    if (fim < ini) return 0;
    return Math.round((fim - ini) / MS_POR_DIA) + 1;
}

/**
 * Devolve a tarifa vigente no período de leitura.
 *
 * Quando o período cruza a virada de uma resolução - o caso da REH 3.508 para
 * a REH 3.600 no ES, em 07/08/2026 - a tarifa sai ponderada pelos dias em cada
 * vigência, que é como a conta rateia. Fora da virada, é a tarifa do período,
 * sem cálculo nenhum.
 *
 * @param {string} distribuidora  'ES' ou 'SP'
 * @param {string} categoria      categoria do formulário
 * @param {Date}   data_anterior  leitura anterior
 * @param {Date}   data_atual     leitura atual
 * @param {string} bloco          'tarifas' (normal) ou 'tarifas_scee' (GD)
 */
export function resolver_tarifas(distribuidora, categoria, data_anterior, data_atual, bloco = 'tarifas') {
    let cat_busca = categoria;
    if (categoria === 'B3_CP' || categoria === 'B3_PPF' || categoria === 'B3_PPE') cat_busca = 'B3';
    else if (categoria === 'B3_CP_TB' || categoria === 'B3CP_TB' || categoria === 'B3_PPF_TB' || categoria === 'B3PPF_TB' || categoria === 'B3_PPE_TB' || categoria === 'B3PPE_TB') cat_busca = 'B3_TB';

    const override = OVERRIDES_TARIFA[distribuidora]?.[cat_busca] || OVERRIDES_TARIFA[distribuidora]?.[categoria];
    if (override && bloco === 'tarifas') return override;

    const lista = VIGENCIAS[distribuidora] || [];
    const ini = data_anterior instanceof Date ? data_anterior : new Date(data_anterior);
    const fim = data_atual instanceof Date ? data_atual : new Date(data_atual);

    const pedacos = [];
    for (const v of lista) {
        const linhas = v[bloco]?.[cat_busca] || v[bloco]?.[categoria];
        if (!linhas || linhas.length === 0) continue;
        const dias = dias_na_vigencia(ini, fim, new Date(v.inicio + 'T00:00:00Z'), new Date(v.fim + 'T00:00:00Z'));
        if (dias > 0) pedacos.push({ dias, linhas });
    }

    // Período fora de qualquer vigência cadastrada: usa a mais recente que
    // tenha a categoria, para o simulador não parar de responder.
    if (pedacos.length === 0) {
        for (let i = lista.length - 1; i >= 0; i--) {
            const linhas = lista[i][bloco]?.[cat_busca] || lista[i][bloco]?.[categoria];
            if (linhas && linhas.length > 0) return linhas;
        }
        return [];
    }

    if (pedacos.length === 1) return pedacos[0].linhas;

    // Cruzou a virada: pondera cada tarifa pelos dias da sua vigência.
    const total_dias = pedacos.reduce((acc, p) => acc + p.dias, 0);
    const chave = (l) => `${l.posto}|${l.faixa || ''}`;
    const acumulado = new Map();

    for (const p of pedacos) {
        const peso = p.dias / total_dias;
        for (const l of p.linhas) {
            const k = chave(l);
            const atual = acumulado.get(k) || { posto: l.posto, faixa: l.faixa, tusd: 0, te: 0 };
            atual.tusd += l.tusd * peso;
            atual.te += l.te * peso;
            acumulado.set(k, atual);
        }
    }

    return [...acumulado.values()].map((l) => ({
        posto: l.posto,
        ...(l.faixa ? { faixa: l.faixa } : {}),
        tusd: l.tusd,
        te: l.te
    }));
}

/**
 * Percentual de compensação da energia injetada, ponderado pelos dias em cada
 * vigência - do mesmo jeito que a tarifa.
 *
 * @returns {{tusd:number, te:number}|null} null quando o enquadramento não tem
 *          percentual definido (é o caso do GD3).
 */
export function perc_reducao_gd(modalidade, data_anterior, data_atual) {
    const faixas = PERC_REDUCAO_GD[modalidade];
    if (!faixas) return null;

    const pedacos = [];
    for (const f of faixas) {
        const dias = dias_na_vigencia(
            data_anterior, data_atual,
            new Date(f.inicio + 'T00:00:00Z'), new Date(f.fim + 'T00:00:00Z')
        );
        if (dias > 0) pedacos.push({ dias, f });
    }
    if (pedacos.length === 0) return { tusd: faixas[faixas.length - 1].tusd, te: faixas[faixas.length - 1].te };

    const total = pedacos.reduce((acc, p) => acc + p.dias, 0);
    return {
        tusd: pedacos.reduce((acc, p) => acc + p.f.tusd * (p.dias / total), 0),
        te: pedacos.reduce((acc, p) => acc + p.f.te * (p.dias / total), 0)
    };
}

/**
 * Encargo CDE - Escassez Hídrica do período, ponderado pelos dias em cada
 * vigência - do mesmo jeito que a tarifa e o percentual de GD.
 *
 * @returns {{tusd:number, te:number}|null} null quando não há valor publicado
 *          para a distribuidora/período (ver ENCARGO_ESCASSEZ_HIDRICA).
 */
export function resolver_encargo_escassez(distribuidora, data_anterior, data_atual) {
    const faixas = ENCARGO_ESCASSEZ_HIDRICA[distribuidora];
    if (!faixas) return null;

    const pedacos = [];
    for (const f of faixas) {
        const dias = dias_na_vigencia(
            data_anterior, data_atual,
            new Date(f.inicio + 'T00:00:00Z'), new Date(f.fim + 'T00:00:00Z')
        );
        if (dias > 0) pedacos.push({ dias, f });
    }
    if (pedacos.length === 0) return null;

    const total = pedacos.reduce((acc, p) => acc + p.dias, 0);
    return {
        tusd: pedacos.reduce((acc, p) => acc + p.f.tusd * (p.dias / total), 0),
        te: pedacos.reduce((acc, p) => acc + p.f.te * (p.dias / total), 0)
    };
}

/**
 * TUSD Fio B publicada para o período, ponderada pelos dias em cada vigência
 * - do mesmo jeito que a tarifa normal e o encargo de Escassez Hídrica.
 *
 * @returns {number|null} null quando não há valor publicado para a
 *          distribuidora/categoria/período (ver FIO_B_TUSD).
 */
export function resolver_fio_b_tusd(distribuidora, categoria, data_anterior, data_atual) {
    const faixas = FIO_B_TUSD[distribuidora]?.[categoria];
    if (!faixas) return null;

    const pedacos = [];
    for (const f of faixas) {
        const dias = dias_na_vigencia(
            data_anterior, data_atual,
            new Date(f.inicio + 'T00:00:00Z'), new Date(f.fim + 'T00:00:00Z')
        );
        if (dias > 0) pedacos.push({ dias, f });
    }
    if (pedacos.length === 0) return null;

    const total = pedacos.reduce((acc, p) => acc + p.dias, 0);
    return pedacos.reduce((acc, p) => acc + p.f.tusd * (p.dias / total), 0);
}

/**
 * Consolida as geradoras que rateiam energia para a unidade.
 *
 * Cada geradora entra com o seu consumo, o percentual de rateio destinado a
 * esta unidade e o próprio enquadramento (GD1, GD2 ou GD3) - uma receptora
 * pode receber de geradoras em enquadramentos diferentes. O percentual de
 * compensação sai ponderado pela energia que cada uma injeta.
 *
 * @returns {{injetada:number, perc_tusd:number, perc_te:number}|{erro:string}}
 */
export function consolidar_geradoras(geradoras, modalidade_padrao, data_anterior, data_atual) {
    if (!Array.isArray(geradoras) || geradoras.length === 0) {
        return { injetada: 0, perc_tusd: 1, perc_te: 1 };
    }

    let injetada = 0;
    let acum_tusd = 0;
    let acum_te = 0;

    for (const g of geradoras) {
        const kwh = parseFloat(g.consumo) || 0;
        if (kwh <= 0) continue;

        const perc_rateio = (g.percentual === undefined || g.percentual === '') ? 100 : (parseFloat(g.percentual) || 0);
        const contribuicao = kwh * (perc_rateio / 100);
        if (contribuicao <= 0) continue;

        const modalidade = g.modalidade || modalidade_padrao || 'GD1';
        const perc = perc_reducao_gd(modalidade, data_anterior, data_atual);
        if (!perc) {
            return {
                erro: `Enquadramento ${modalidade} ainda não tem percentual de compensação cadastrado. ` +
                      `Os modelos oficiais recebidos cobrem apenas GD1 e GD2.`
            };
        }

        injetada += contribuicao;
        acum_tusd += contribuicao * perc.tusd;
        acum_te += contribuicao * perc.te;
    }

    if (injetada <= 0) return { injetada: 0, perc_tusd: 1, perc_te: 1 };

    return { injetada, perc_tusd: acum_tusd / injetada, perc_te: acum_te / injetada };
}

export const BANDEIRAS = {
    "VERDE": 0.0,
    "AMARELA": 0.01885,
    "VERMELHA_P1": 0.04463,
    "VERMELHA_P2": 0.07877,
    "ESCASSEZ": 0.142
};

export function buscar_tributos_mensais(distribuidora, data_atual) {
    const ano = data_atual.getUTCFullYear();
    const mes = String(data_atual.getUTCMonth() + 1).padStart(2, '0');
    const icms_padrao = ICMS_PADRAO[distribuidora] ?? 0.17;

    const doMes = TRIBUTOS_MENSAIS[distribuidora]?.[`${ano}-${mes}`];
    if (doMes) return { ...doMes, icms_padrao };

    return { ...TRIBUTOS_PADRAO, icms_padrao };
}

export function calcular_proporcionalidade_dias(data_anterior, data_atual) {
    const data_divisao = new Date(Date.UTC(data_atual.getUTCFullYear(), data_atual.getUTCMonth(), 1));
    const time_ant = data_anterior.getTime();
    const time_atu = data_atual.getTime();
    const time_div = data_divisao.getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    if (data_anterior.getUTCMonth() === data_atual.getUTCMonth() && data_anterior.getUTCFullYear() === data_atual.getUTCFullYear()) {
        const dias = Math.floor(Math.abs(time_atu - time_ant) / MS_PER_DAY);
        return { dias_mes1: 0, dias_mes2: dias, dias_totais: Math.max(dias, 1) };
    }
    const dias_mes1 = Math.max(Math.floor((time_div - time_ant) / MS_PER_DAY) - 1, 0);
    const dias_mes2 = Math.floor((time_atu - time_div) / MS_PER_DAY) + 1;
    return { dias_mes1, dias_mes2, dias_totais: Math.max(dias_mes1 + dias_mes2, 1) };
}

/**
 * Aplica sobre as linhas de tarifa as duas correções que a API já fazia:
 * a divisão das tarifas importadas sem decimais e o acerto do TE do B2RUIRRG.
 */
export function normalizar_tarifas(linhas, categoria) {
    return (linhas || []).map((r) => {
        const parsedTusd = r.tusd > 10 ? r.tusd / 100000 : r.tusd;
        let parsedTe = r.te > 10 ? r.te / 100000 : r.te;

        // O banco está com o TE da categoria B2RUIRRG desatualizado (0.29749).
        // A conta real e o Excel antigo usam 0.32068.
        if (categoria === 'B2RUIRRG' && Math.abs(parsedTe - 0.29749) < 0.0001) {
            parsedTe = 0.32068;
        }

        return { posto: r.posto, faixa: r.faixa, tusd: parsedTusd, te: parsedTe };
    });
}

/**
 * @param {object} params  Os mesmos campos que a API recebe no corpo do POST.
 * @param {Array}  dbRows  Tarifas já normalizadas por normalizar_tarifas().
 */
export function calcular_fatura(params, dbRows) {
    const distribuidora = (params.distribuidora || "ES").toUpperCase();
    const categoria = (params.categoria || "B1C").toUpperCase();
    const data_anterior = new Date(params.data_leitura_anterior);
    const data_atual = new Date(params.data_leitura_atual);

    const is_tb = categoria.endsWith("_TB");
    const is_baixa_renda = categoria.startsWith("B1BR");
    const is_desconto_social = categoria === CATEGORIA_DESCONTO_SOCIAL;

    // Busca da tarifa por posto. Quando o nome não bate exatamente com o do
    // banco, cai na primeira linha da categoria - comportamento herdado da API
    // e mantido de propósito para os valores não mudarem.
    const getTarifaConsolidada = (posto = "Não se aplica") => {
        const linhas = dbRows || [];
        let row;

        // Comportamento herdado: na Tarifa Branca, o Intermediário e o Consumo
        // Reservado eram faturados com a tarifa de Ponta, porque a busca pelo
        // nome do posto falhava e caía na primeira linha. Isto é intencional -
        // ver REPRODUZIR_FALLBACK_POSTO em tarifas-aneel.js.
        if (REPRODUZIR_FALLBACK_POSTO && is_tb && posto !== 'Ponta' && posto !== 'Fora ponta') {
            row = linhas.find((r) => r.posto === 'Ponta');
        }

        if (!row) row = linhas.find((r) => r.posto === posto);
        if (!row) row = linhas[0];
        if (row) return { tusd: row.tusd, te: row.te };

        if (categoria === "B2RUIRRG" || categoria === "B2RUIRRG_TB") {
            if (posto === "Ponta") return { tusd: 1.06103, te: 0.48448 };
            if (posto === "Intermediário") return { tusd: 0.72534, te: 0.30579 };
            if (posto === "Fora ponta") return { tusd: 0.38965, te: 0.30579 };
            return { tusd: 0.46863, te: 0.32068 };
        } else if (categoria === "B2RURAL" || categoria === "B2RURAL_TB") {
            if (posto === "Ponta") return { tusd: 1.06103, te: 0.48448 };
            if (posto === "Intermediário") return { tusd: 0.72534, te: 0.30579 };
            if (posto === "Fora ponta") return { tusd: 0.38965, te: 0.30579 };
            return { tusd: 0.46863, te: 0.32068 };
        } else if (categoria === "B4A" || categoria === "B4B") {
            return { tusd: 0.25775, te: 0.17638 };
        } else if (is_tb) {
            if (distribuidora === "SP") {
                if (posto === "Ponta") return { tusd: 0.86563, te: 0.49484 };
                if (posto === "Intermediário") return { tusd: 0.59980, te: 0.31504 };
                if (posto === "Fora ponta") return { tusd: 0.33398, te: 0.31504 };
            }
            if (posto === "Ponta") return { tusd: 0.93761, te: 0.48448 };
            if (posto === "Intermediário") return { tusd: 0.65129, te: 0.30579 };
            if (posto === "Fora ponta") return { tusd: 0.36496, te: 0.30579 };
        } else if (categoria.startsWith("B1BR")) {
            if (distribuidora === "SP") {
                return { tusd: 0.30080, te: 0.29060 };
            }
            return { tusd: 0.46863, te: 0.32068 };
        }
        if (distribuidora === "SP") {
            return { tusd: 0.30080, te: 0.29060 };
        }
        return { tusd: 0.46863, te: 0.32068 };
    };

    let postos;
    if (is_tb) {
        postos = [
            { nome: "Ponta", qtd: parseFloat(params.consumo_ponta) || 0 },
            { nome: "Fora ponta", qtd: parseFloat(params.consumo_fora_ponta) || 0 },
            { nome: "Intermediário", qtd: parseFloat(params.consumo_intermediario) || 0 }
        ];
    } else if (is_desconto_social) {
        // Desconto Social (Lei 15.235/2025): tarifa reduzida até 120 kWh e
        // tarifa cheia de B1C no que passar disso. As duas faixas viram linhas
        // separadas de TUSD e TE, como na fatura impressa.
        const consumo = parseFloat(params.consumo_kwh) || 0;
        postos = [
            { nome: `até ${FAIXA_DESCONTO_SOCIAL_KWH} KWh`, faixa: 'ate', qtd: Math.min(consumo, FAIXA_DESCONTO_SOCIAL_KWH) },
            { nome: `acima de ${FAIXA_DESCONTO_SOCIAL_KWH} KWh`, faixa: 'acima', qtd: Math.max(consumo - FAIXA_DESCONTO_SOCIAL_KWH, 0) }
        ];
    } else {
        postos = [{ nome: "Não se aplica", qtd: parseFloat(params.consumo_kwh) || 0 }];
    }

    // Na faixa do Desconto Social a tarifa é escolhida pela faixa, não pelo posto.
    const buscar_tarifa_do_posto = (p) => {
        if (p.faixa) {
            const linha = (dbRows || []).find((r) => r.faixa === p.faixa);
            if (linha) return { tusd: linha.tusd, te: linha.te };
        }
        return getTarifaConsolidada(p.nome);
    };

    const is_irrigante = categoria.startsWith("B2RUIRRG");
    const consumo_reservado = is_irrigante ? (parseFloat(params.consumo_reservado) || 0) : 0;
    let valor_ajuste_total = parseFloat(params.valor_ajuste) || 0;
    const is_b4 = categoria.startsWith("B4");
    const fase = (params.fase || "monofasico").toLowerCase();
    const minimo_fase = is_b4 ? 0 : (fase === "monofasico" ? 30 : (fase === "bifasico" ? 50 : 100));
    const consumo_medido_total = postos.reduce((acc, p) => acc + p.qtd, 0);
    const diff_minimo = Math.max(minimo_fase - consumo_medido_total, 0);

    if (diff_minimo > 0 && postos.length > 0) {
        const idx = is_tb ? postos.findIndex((p) => p.nome === "Fora ponta") : 0;
        postos[Math.max(0, idx)].qtd += diff_minimo;
    }

    const consumo_faturado_total = postos.reduce((acc, p) => acc + p.qtd, 0);

    const { pis, cofins, icms_padrao } = buscar_tributos_mensais(distribuidora, data_atual);

    // ICMS: o residencial convencional é por faixa de consumo (em SP são três
    // faixas; no ES só a isenção inicial). Tarifa Branca, comercial e
    // iluminação pública usam a alíquota cheia do estado. Ver
    // ICMS_FAIXAS_RESIDENCIAL em tarifas-aneel.js para as comprovações.
    // B3 PPE (Poder Público Estadual - 520) é isento de ICMS (alíquota 0%) em
    // qualquer distribuidora. B3 CP só é isento no ES - em SP a colega
    // confirmou que a fatura real cobra ICMS normalmente (sem isenção).
    const is_isento_icms = ((categoria === "B3_CP" || categoria === "B3CP_TB" || categoria === "B3_CP_TB") && distribuidora !== "SP") ||
                           categoria === "B3_PPE" || categoria === "B3PPE_TB" || categoria === "B3_PPE_TB" ||
                           params.icms_opcao === "isento" || params.icms_opcao === "0" || params.is_isento_icms === true;
    const is_ppf = categoria === "B3_PPF" || categoria === "B3PPF_TB" || categoria === "B3_PPF_TB";
    const is_ppe = categoria === "B3_PPE" || categoria === "B3PPE_TB" || categoria === "B3_PPE_TB";
    // B4A é iluminação pública faturada à Prefeitura - em SP a colega
    // confirmou que também tem a mesma retenção de IR (1,2%) do Poder
    // Público Estadual. Sem confirmação para o ES, mantido só para SP.
    const is_b4a_retencao = categoria === "B4A" && distribuidora === "SP";

    let icms = icms_padrao;
    const is_residencial_convencional = !is_tb && (categoria.startsWith("B1C") || is_baixa_renda);

    if (params.icms_opcao && params.icms_opcao !== "auto") {
        if (params.icms_opcao === "isento" || params.icms_opcao === "0") {
            icms = 0.0;
        } else if (params.icms_opcao === "12") {
            icms = 0.12;
        } else if (params.icms_opcao === "17") {
            icms = 0.17;
        } else if (params.icms_opcao === "18") {
            icms = 0.18;
        } else if (params.icms_opcao === "4") {
            icms = 0.04;
        } else {
            const parsed = parseFloat(params.icms_opcao);
            if (!isNaN(parsed)) {
                icms = parsed > 1 ? parsed / 100 : parsed;
            }
        }
    } else if (is_isento_icms) {
        icms = 0;
    } else if (is_residencial_convencional) {
        const faixas = ICMS_FAIXAS_RESIDENCIAL[distribuidora];
        if (faixas) {
            const faixa = faixas.find((f) => consumo_faturado_total <= f.ate);
            if (faixa) icms = faixa.aliquota;
        }
    } else if (categoria.startsWith("B2RUIRRG") || categoria.startsWith("B2RURAL")) {
        if (distribuidora === "SP") {
            icms = 0.12;
        } else {
            icms = 0.04;
        }
    }

    const cip = parseFloat(params.valor_cip) || 0;
    const bases = [];
    let isencao_br_restante = is_baixa_renda ? FAIXA_TARIFA_SOCIAL_KWH : 0;
    let base_br_pura = 0;
    let consumo_br_total = 0;

    let payload_tarifas = {};
    if (Array.isArray(params.tarifas)) {
        params.tarifas.forEach((item) => {
            const posto = item.Posto || item.posto;
            if (posto) {
                payload_tarifas[posto] = {
                    tusd: item.Valor_TUSD ?? item.tusd,
                    te: item.Valor_TE ?? item.te
                };
            }
        });
    } else {
        payload_tarifas = params.tarifas || {};
    }

    for (const p of postos) {
        if (p.qtd === 0) continue;

        let t_tusd = payload_tarifas[p.nome]?.tusd;
        let t_te = payload_tarifas[p.nome]?.te;

        if (t_tusd === undefined || t_te === undefined) {
            const db_tarifa = buscar_tarifa_do_posto(p);
            if (t_tusd === undefined) t_tusd = db_tarifa.tusd;
            if (t_te === undefined) t_te = db_tarifa.te;
        }

        let qtd_faturada = p.qtd;

        let isencao_nesta_faixa = 0;
        if (is_baixa_renda && isencao_br_restante > 0) {
            isencao_nesta_faixa = Math.min(qtd_faturada, isencao_br_restante);
            isencao_br_restante -= isencao_nesta_faixa;
            qtd_faturada -= isencao_nesta_faixa;

            base_br_pura += isencao_nesta_faixa * t_tusd;
            base_br_pura += isencao_nesta_faixa * t_te;
            consumo_br_total += isencao_nesta_faixa;
        }

        const sufixo_posto = (is_tb || is_desconto_social) ? ` ${p.nome}` : "";
        const sufixo_ativo = categoria.includes("B2RUIRRG") ? " Ativo" : "";

        if (isencao_nesta_faixa > 0) {
            bases.push({ nome: `TUSD-Consumo MP1300${sufixo_posto}`, qtd: isencao_nesta_faixa, tarifa: 0 });
            bases.push({ nome: `TE - Consumo MP 1300${sufixo_posto}`, qtd: isencao_nesta_faixa, tarifa: 0 });
        }

        if (qtd_faturada > 0) {
            const prefixo_br = is_baixa_renda ? " MP1300" : "";
            bases.push({ nome: `TUSD - Consumo${sufixo_ativo}${prefixo_br}${sufixo_posto}`, qtd: Math.round(qtd_faturada * 100) / 100, tarifa: t_tusd });
            bases.push({ nome: `TE - Consumo${sufixo_ativo}${prefixo_br}${sufixo_posto}`, qtd: Math.round(qtd_faturada * 100) / 100, tarifa: t_te });
        }
    }

    if ((categoria === "B2RUIRRG" || categoria === "B2RUIRRG_TB") && consumo_reservado > 0) {
        let res_tusd = payload_tarifas["Não se aplica"]?.tusd;
        let res_te = payload_tarifas["Não se aplica"]?.te;

        if (res_tusd === undefined || res_te === undefined) {
            const res_db = getTarifaConsolidada("Não se aplica");
            if (res_tusd === undefined) res_tusd = res_db.tusd;
            if (res_te === undefined) res_te = res_db.te;
        }

        bases.push({ nome: "TUSD - Consumo Reservado", qtd: consumo_reservado, tarifa: res_tusd * 0.4 });
        bases.push({ nome: "TE - Consumo Reservado", qtd: consumo_reservado, tarifa: res_te * 0.4 });
    }

    const band_mes1 = (params.bandeira_mes1 || "VERDE").toUpperCase();
    const band_mes2 = (params.bandeira_mes2 || "VERDE").toUpperCase();
    const { dias_mes1, dias_mes2, dias_totais } = calcular_proporcionalidade_dias(data_anterior, data_atual);

    const consumo_faturado_liquido = bases.filter((b) => b.nome.startsWith("TUSD - Consumo") && !b.nome.includes("Reservado") && b.tarifa > 0).reduce((acc, b) => acc + b.qtd, 0);
    const consumo_total_bandeira = consumo_faturado_liquido + consumo_reservado + consumo_br_total;

    // Bandeira efetiva do período (soma das bandeiras vezes a fração de dias de
    // cada uma). Usada para valorar a bandeira da energia injetada.
    let tarifa_bandeira_efetiva = 0;

    const add_bandeira = (nome, tarifa_padrao) => {
        if (consumo_total_bandeira <= 0) return;

        let tarifa_ponderada = tarifa_padrao;
        if ((categoria === "B2RUIRRG" || categoria === "B2RUIRRG_TB") && consumo_reservado > 0 && consumo_faturado_liquido > 0) {
            const tarifa_res = tarifa_padrao * 0.4;
            tarifa_ponderada = (consumo_faturado_liquido * tarifa_padrao + consumo_reservado * tarifa_res) / (consumo_faturado_liquido + consumo_reservado);
        }

        let fator_mes = 0;
        if (band_mes1 === nome) fator_mes += (dias_mes1 / dias_totais);
        if (band_mes2 === nome) fator_mes += (dias_mes2 / dias_totais);

        if (fator_mes > 0) {
            tarifa_bandeira_efetiva += tarifa_padrao * fator_mes;
            const nomeCapitalizado = nome.split('_')[0];
            const sufixo = nome.includes('_P1') ? ' P1' : (nome.includes('_P2') ? ' P2' : '');
            const finalName = nomeCapitalizado.charAt(0) + nomeCapitalizado.slice(1).toLowerCase() + sufixo;

            if (consumo_br_total > 0) {
                const qtd_br = consumo_br_total * fator_mes;
                // Em ES a bandeira entra na base da Subvenção Tarifária; em SP não.
                // Ver a justificativa em tarifas-aneel.js (as duas faturas divergem).
                if (SUBVENCAO_INCLUI_BANDEIRA[distribuidora] ?? true) {
                    base_br_pura += qtd_br * tarifa_padrao;
                }
                bases.push({ nome: `Adic.Band. ${finalName} MP1300`, qtd: Number(qtd_br.toFixed(4)), tarifa: 0 });
            }

            const qtd_fat = (consumo_faturado_liquido + consumo_reservado) * fator_mes;
            if (qtd_fat > 0) {
                bases.push({ nome: `Adic.Band. ${finalName}${is_baixa_renda ? ' MP1300' : ''}`, qtd: Number(qtd_fat.toFixed(4)), tarifa: tarifa_ponderada });
            }
        }
    };

    add_bandeira("AMARELA", BANDEIRAS["AMARELA"]);
    add_bandeira("VERMELHA_P1", BANDEIRAS["VERMELHA_P1"]);
    add_bandeira("VERMELHA_P2", BANDEIRAS["VERMELHA_P2"]);
    add_bandeira("ESCASSEZ", BANDEIRAS["ESCASSEZ"]);

    bases.forEach((b) => {
        b.valor_base = b.qtd * b.tarifa;
    });
    const total_base = bases.reduce((acc, b) => acc + b.valor_base, 0);

    let divisor = icms > 0 ? (1 - icms - (1 - icms) * (pis + cofins)) : (1 - pis - cofins);
    if (divisor <= 0) divisor = 1.0;

    const total_energia_faturado = Math.round((total_base / divisor) * 100) / 100;

    const linhas = [];
    let acumulado_faturado = 0;

    if (is_baixa_renda && consumo_br_total > 0) {
        let divisor_full = distribuidora === "SP"
            ? (icms > 0 ? (1 - icms) : 1.0)
            : (icms > 0 ? (1 - icms - (1 - icms) * (pis + cofins)) : (1 - pis - cofins));
        if (divisor_full <= 0) divisor_full = 1.0;

        const base_icms_br = Math.round((base_br_pura / divisor_full) * 100) / 100;
        const icms_br = Math.round((base_icms_br * icms) * 100) / 100;
        const valor_baixa_renda = Math.round((base_br_pura + icms_br) * 100) / 100;
        const base_arr = Math.round(base_br_pura * 100) / 100;

        linhas.push({
            nome: distribuidora === "SP" ? "Subvenção Tarifária" : "Valor Baixa Renda",
            unidade: "",
            quantidade: Math.round(base_br_pura * 10000) / 10000,
            tarifa_base: 0,
            preco_unit: base_br_pura > 0 ? (valor_baixa_renda / base_br_pura) : 0,
            valor_total: valor_baixa_renda,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            base_icms: icms_br > 0 ? base_icms_br : 0,
            aliquota_icms: icms_br > 0 ? Math.round(icms * 100 * 1000) / 1000 : 0,
            valor_icms: icms_br
        });

        linhas.push({
            nome: distribuidora === "SP" ? "Crédito Subvenção Tarifária" : "Desconto Baixa Renda",
            unidade: "",
            quantidade: -Math.round(base_br_pura * 10000) / 10000,
            tarifa_base: 1,
            preco_unit: 1,
            valor_total: -base_arr,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            base_icms: 0,
            aliquota_icms: 0,
            valor_icms: 0
        });
    }

    bases.forEach((b, i) => {
        let valor_total = 0;
        if (b.tarifa === 0) {
            valor_total = 0;
        } else if (i === bases.length - 1) {
            valor_total = Math.round((total_energia_faturado - acumulado_faturado) * 100) / 100;
        } else {
            const peso = total_base > 0 ? (b.valor_base / total_base) : 0;
            valor_total = Math.round((total_energia_faturado * peso) * 100) / 100;
            acumulado_faturado += valor_total;
        }

        const preco_unit = b.qtd > 0 ? (valor_total / b.qtd) : 0;
        const icms_linha = Math.round((valor_total * icms) * 100) / 100;
        let base_icms_linha = 0;
        let aliquota_icms_pct = 0;

        if (icms_linha > 0) {
            if (icms === 0.04) {
                aliquota_icms_pct = 12.0;
                base_icms_linha = Math.round((valor_total / 3) * 100) / 100;
            } else {
                aliquota_icms_pct = Math.round(icms * 100 * 1000) / 1000;
                base_icms_linha = valor_total;
            }
        }

        let v_pis = 0;
        let v_cofins = 0;
        let base_pis_cofins = 0;

        if (valor_total !== 0) {
            base_pis_cofins = Math.round((valor_total - icms_linha) * 100) / 100;
            v_pis = Math.round((base_pis_cofins * pis) * 100) / 100;
            v_cofins = Math.round((base_pis_cofins * cofins) * 100) / 100;
        }

        linhas.push({
            nome: b.nome,
            unidade: "kWh",
            quantidade: b.qtd,
            tarifa_base: b.tarifa,
            preco_unit: preco_unit,
            valor_total: valor_total,
            base_pis_cofins: base_pis_cofins,
            valor_pis_cofins: Math.round((v_pis + v_cofins) * 100) / 100,
            base_icms: base_icms_linha,
            aliquota_icms: aliquota_icms_pct,
            valor_icms: icms_linha
        });
    });

    // ---- Retenções Federais (Poder Público Federal - PPF) ----
    let total_retencoes = 0;
    if (is_ppf) {
        const ret_pis = Math.round(total_energia_faturado * 0.0065 * 100) / 100;
        const ret_csll = Math.round(total_energia_faturado * 0.0100 * 100) / 100;
        const ret_ir = Math.round(total_energia_faturado * 0.0120 * 100) / 100;
        const ret_cofins = Math.round(total_energia_faturado * 0.0300 * 100) / 100;
        total_retencoes = ret_pis + ret_csll + ret_ir + ret_cofins;

        linhas.push({
            nome: "Retenção PIS/PASEP",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0,
            preco_unit: 0,
            valor_total: -ret_pis,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            valor_icms: 0
        });
        linhas.push({
            nome: "Retenção CSLL",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0,
            preco_unit: 0,
            valor_total: -ret_csll,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            valor_icms: 0
        });
        linhas.push({
            nome: "Retenção IR",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0,
            preco_unit: 0,
            valor_total: -ret_ir,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            valor_icms: 0
        });
        linhas.push({
            nome: "Retenção COFINS",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0,
            preco_unit: 0,
            valor_total: -ret_cofins,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            valor_icms: 0
        });
    }

    // ---- Retenção de IR (Poder Público Estadual - PPE / B4A em SP) ----
    // Diferente da União (PPF), o Estado e o Município só são obrigados a
    // reter o IR na fonte (Lei 9.430/96, art. 64) - sem convênio,
    // PIS/COFINS/CSLL continuam cobrados normalmente na fatura, sem retenção.
    // Confirmado na fatura real da Defensoria Pública SP (NF-e 023.686.755,
    // jul/2026): retenção de R$1,02 sobre R$85,32 de energia = 1,2%.
    if (is_ppe || is_b4a_retencao) {
        const ret_ir_ppe = Math.round(total_energia_faturado * 0.0120 * 100) / 100;
        total_retencoes += ret_ir_ppe;

        linhas.push({
            nome: "Retenção Imposto de Renda",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0,
            preco_unit: 0,
            valor_total: -ret_ir_ppe,
            base_pis_cofins: 0,
            valor_pis_cofins: 0,
            valor_icms: 0
        });
    }

    // ---- Geração Distribuída: energia injetada ----
    // A injetada entra como linhas negativas, abatendo a conta. O modelo
    // oficial da EDP mostra dois tratamentos tributários distintos:
    //   TUSD injetada - sem ICMS (base de ICMS zerada), então o preço unitário
    //                   é bruteado só por PIS/COFINS;
    //   TE injetada   - com ICMS, igual ao consumo.
    // No GD2 o TUSD injetado ainda é multiplicado pelo percentual de redução,
    // e o que sobra é o Fio B que o cliente paga.
    if (params.gd_ativo && params.gd_papel !== 'gerador') {
        // Baixa Renda e Tarifa Branca faturam sempre como GD1, qualquer que
        // seja o enquadramento informado nas geradoras.
        const modalidade_padrao = SEMPRE_GD1(categoria) ? 'GD1' : (params.gd_modalidade || 'GD1');
        const geradoras = SEMPRE_GD1(categoria)
            ? (params.geradoras || []).map((g) => ({ ...g, modalidade: 'GD1' }))
            : params.geradoras;

        const consolidado = consolidar_geradoras(geradoras, modalidade_padrao, data_anterior, data_atual);
        if (consolidado.erro) return { erro: consolidado.erro };

        const injetada = consolidado.injetada;
        if (injetada > 0) {
            const perc = { tusd: consolidado.perc_tusd, te: consolidado.perc_te };
            const divisor_sem_icms = (1 - pis - cofins) > 0 ? (1 - pis - cofins) : 1;
            const getTarifaPorFaixa = (faixa) => {
                const linhasTar = dbRows || [];
                const r = linhasTar.find(row => row.faixa === faixa);
                if (r) return { tusd: r.tusd, te: r.te };
                return getTarifaConsolidada();
            };

            const tarifa_ref = getTarifaConsolidada(is_tb ? "Fora ponta" : "Não se aplica");

            const injetar = (nome, qtd, tarifa_base, com_icms) => {
                if (qtd === 0 || !tarifa_base) return;
                const div = com_icms ? divisor : divisor_sem_icms;
                const preco_unit = tarifa_base / div;
                const valor_total = Math.round((-qtd * preco_unit) * 100) / 100;
                const icms_linha = com_icms ? Math.round((valor_total * icms) * 100) / 100 : 0;
                const base_pis_cofins = Math.round((valor_total - icms_linha) * 100) / 100;

                linhas.push({
                    nome,
                    unidade: "kWh",
                    quantidade: -qtd,
                    tarifa_base,
                    preco_unit,
                    valor_total,
                    base_pis_cofins,
                    valor_pis_cofins: Math.round((base_pis_cofins * (pis + cofins)) * 100) / 100,
                    base_icms: icms_linha !== 0 ? Math.abs(valor_total) : 0,
                    aliquota_icms: icms_linha !== 0 ? Math.round(icms * 100 * 1000) / 1000 : 0,
                    valor_icms: icms_linha,
                    is_injetada: true
                });
            };

            if (is_desconto_social) {
                const consumo_total = parseFloat(params.consumo_kwh) || 0;
                const consumo_acima = Math.max(consumo_total - FAIXA_DESCONTO_SOCIAL_KWH, 0);
                const consumo_ate = Math.min(consumo_total, FAIXA_DESCONTO_SOCIAL_KWH);
                const inj_acima = Math.min(injetada, consumo_acima);
                const inj_ate = Math.min(injetada - inj_acima, consumo_ate);

                const t_ate = getTarifaPorFaixa('ate');
                const t_acima = getTarifaPorFaixa('acima');

                if (inj_ate > 0) {
                    injetar("TUSD - Consumo inj até 120kwh", inj_ate, t_ate.tusd * perc.tusd, false);
                    injetar("TE - Consumo inj até 120kwh", inj_ate, t_ate.te * perc.te, true);
                }
                if (inj_acima > 0) {
                    injetar("TUSD - Consumo inj acima 120kwh", inj_acima, t_acima.tusd * perc.tusd, false);
                    injetar("TE - Consumo inj acima 120kwh", inj_acima, t_acima.te * perc.te, true);
                }
            } else if (is_tb) {
                const t_ponta = getTarifaConsolidada("Ponta");
                const t_interm = getTarifaConsolidada("Intermediário");
                const t_fora = getTarifaConsolidada("Fora ponta");

                let inj_ponta = parseFloat(params.inj_ponta) || 0;
                let inj_interm = parseFloat(params.inj_intermediario) || 0;
                let inj_fora = parseFloat(params.inj_fora_ponta) || 0;

                if (inj_ponta === 0 && inj_interm === 0 && inj_fora === 0 && injetada > 0) {
                    inj_fora = injetada;
                }

                if (inj_ponta > 0) {
                    injetar("TUSD - Ponta inj", inj_ponta, t_ponta.tusd * perc.tusd, false);
                    injetar("TE - Ponta inj", inj_ponta, t_ponta.te * perc.te, true);
                }
                if (inj_interm > 0) {
                    injetar("TUSD - Intermediário inj", inj_interm, t_interm.tusd * perc.tusd, false);
                    injetar("TE - Intermediário inj", inj_interm, t_interm.te * perc.te, true);
                }
                if (inj_fora > 0) {
                    injetar("TUSD - Fora Ponta inj", inj_fora, t_fora.tusd * perc.tusd, false);
                    injetar("TE - Fora Ponta inj", inj_fora, t_fora.te * perc.te, true);
                }
            } else {
                injetar("TUSD - Consumo inj", injetada, tarifa_ref.tusd * perc.tusd, false);
                injetar("TE - Consumo inj", injetada, tarifa_ref.te * perc.te, true);
            }

            if (tarifa_bandeira_efetiva > 0) {
                const total_inj_kwh = is_tb && (parseFloat(params.inj_ponta) || parseFloat(params.inj_intermediario) || parseFloat(params.inj_fora_ponta))
                    ? ((parseFloat(params.inj_ponta) || 0) + (parseFloat(params.inj_intermediario) || 0) + (parseFloat(params.inj_fora_ponta) || 0))
                    : injetada;
                injetar("Adic.Band. inj", total_inj_kwh, tarifa_bandeira_efetiva, true);
            }
        }
    }

    const ajustes = Array.isArray(params.ajustes) ? params.ajustes : [];
    ajustes.forEach((aj) => {
        const v = parseFloat(aj.valor) || 0;
        if (v !== 0) {
            valor_ajuste_total += v;
            linhas.push({
                nome: aj.nome || "Ajuste",
                unidade: "",
                quantidade: 1,
                tarifa_base: 0.0,
                preco_unit: 0.0,
                valor_total: v,
                base_pis_cofins: 0.0,
                valor_pis_cofins: 0.0,
                base_icms: 0.0,
                aliquota_icms: 0.0,
                valor_icms: 0.0
            });
        }
    });

    if (parseFloat(params.valor_ajuste) > 0) {
        linhas.push({
            nome: "Ajustes / Outros Valores",
            unidade: "",
            quantidade: 1,
            tarifa_base: 0.0,
            preco_unit: 0.0,
            valor_total: parseFloat(params.valor_ajuste),
            base_pis_cofins: 0.0,
            valor_pis_cofins: 0.0,
            base_icms: 0.0,
            aliquota_icms: 0.0,
            valor_icms: 0.0
        });
    }

    // ---- Cálculo Informativo do Fio B (TUSD Fio B) ----
    // Quando temos a TUSD Fio B publicada pela ANEEL para a categoria (ver
    // FIO_B_TUSD, em tarifas-aneel.js), ela já sai líquida de tributos - é só
    // consumo x tusd_fio_b, do mesmo jeito que o Encargo CDE Escassez
    // Hídrica. Fora isso, cai na estimativa antiga de 45% da TUSD de
    // consumo, brutada pelos tributos - uma aproximação, não um valor
    // publicado por categoria.
    const fio_b_publicado = resolver_fio_b_tusd(distribuidora, categoria, data_anterior, data_atual);
    let tarifa_fio_b_base, preco_unit_fio_b;
    if (fio_b_publicado !== null) {
        tarifa_fio_b_base = fio_b_publicado;
        preco_unit_fio_b = fio_b_publicado;
    } else {
        const db_tarifa_padrao = getTarifaConsolidada("Não se aplica");
        const tusd_base_referencia = db_tarifa_padrao?.tusd || 0.46863;
        tarifa_fio_b_base = tusd_base_referencia * 0.45;
        const divisor_fio_b = icms > 0 ? (1 - icms - (1 - icms) * (pis + cofins)) : (1 - pis - cofins);
        preco_unit_fio_b = divisor_fio_b > 0 ? (tarifa_fio_b_base / divisor_fio_b) : 0;
    }
    const valor_fio_b_calc = Math.round((consumo_faturado_total * preco_unit_fio_b) * 100) / 100;

    if (consumo_faturado_total > 0 && tarifa_fio_b_base > 0) {
        linhas.push({
            nome: "TUSD - Fio B (Item Informativo)",
            unidade: "kWh",
            quantidade: consumo_faturado_total,
            tarifa_base: tarifa_fio_b_base,
            preco_unit: preco_unit_fio_b,
            valor_total: valor_fio_b_calc,
            base_pis_cofins: 0.0,
            valor_pis_cofins: 0.0,
            base_icms: 0.0,
            aliquota_icms: 0.0,
            valor_icms: 0.0,
            is_informativo: true
        });
    }

    // ---- Cálculo Informativo do Encargo CDE - Escassez Hídrica ----
    // Ao contrário do Fio B, esse componente já vem líquido de tributos na
    // fatura oficial (é consumo x (tusd + te) direto) - ver a nota em
    // ENCARGO_ESCASSEZ_HIDRICA, em tarifas-aneel.js. Só temos o valor
    // comprovado para B1 residencial convencional (Doc 1025308715), mas por
    // pedido da equipe ele é aplicado pra qualquer categoria no ES - sem
    // confirmação por fatura real de cada uma.
    const encargo_escassez = resolver_encargo_escassez(distribuidora, data_anterior, data_atual);
    const tarifa_escassez_unit = encargo_escassez ? (encargo_escassez.tusd + encargo_escassez.te) : 0;
    const valor_escassez_calc = encargo_escassez && consumo_faturado_total > 0
        ? Math.round((consumo_faturado_total * tarifa_escassez_unit) * 100) / 100
        : 0;

    if (encargo_escassez && consumo_faturado_total > 0) {
        linhas.push({
            nome: "Informativo: Encargo CDE - Escassez Hídrica",
            unidade: "kWh",
            quantidade: consumo_faturado_total,
            tarifa_base: tarifa_escassez_unit,
            preco_unit: tarifa_escassez_unit,
            valor_total: valor_escassez_calc,
            base_pis_cofins: 0.0,
            valor_pis_cofins: 0.0,
            base_icms: 0.0,
            aliquota_icms: 0.0,
            valor_icms: 0.0,
            is_informativo: true
        });
    }

    const total_pis_cofins = linhas.reduce((acc, l) => acc + (l.is_informativo ? 0 : l.valor_pis_cofins), 0);
    const total_energia = linhas.filter((l) => !l.is_informativo && l.nome !== "Ajustes / Outros Valores" && !l.nome.startsWith("Retenção") && !ajustes.some((aj) => aj.nome === l.nome && parseFloat(aj.valor) === l.valor_total)).reduce((acc, l) => acc + l.valor_total, 0);
    const total_icms = linhas.reduce((acc, l) => acc + (l.is_informativo ? 0 : (l.valor_icms || 0)), 0);

    const total_base_pis_cofins = linhas.reduce((acc, l) => acc + (l.is_informativo ? 0 : (l.base_pis_cofins || 0)), 0);
    const total_pis = Math.round(total_base_pis_cofins * pis * 100) / 100;
    const total_cofins = Math.round(total_base_pis_cofins * cofins * 100) / 100;

    const total_fatura = total_energia - total_retencoes + cip + valor_ajuste_total;

    return {
        detalhes: linhas,
        resumo: {
            total_energia: total_energia,
            ...(total_retencoes > 0 ? { total_retencoes: Math.round(total_retencoes * 100) / 100 } : {}),
            total_pis_cofins: Math.round(total_pis_cofins * 100) / 100,
            total_base_pis_cofins: Math.round(total_base_pis_cofins * 100) / 100,
            total_pis: total_pis,
            total_cofins: total_cofins,
            total_icms: total_icms,
            total_fatura: Math.round(total_fatura * 100) / 100,
            valor_cip: cip,
            valor_fio_b: valor_fio_b_calc,
            tarifa_fio_b_unit: preco_unit_fio_b,
            valor_escassez: valor_escassez_calc,
            tarifa_escassez_unit: tarifa_escassez_unit
        },
        parametros_usados: {
            consumo_faturado: consumo_faturado_total,
            aliquota_pis_aplicada: pis,
            aliquota_cofins_aplicada: cofins,
            aliquota_icms_aplicada: icms
        }
    };
}
