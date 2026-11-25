/**
 * ============================================================================
 *  REFORMA TRIBUTÁRIA (CBS/IBS) - SIMULAÇÃO PRELIMINAR, Grupo B
 * ============================================================================
 *
 *  Fonte: aba "Modelo Reforma" das planilhas "EDP ES_Modelo_NFe_B1C.xlsm" e
 *  "EDP SP_Modelo_NFe_B1C.xlsm", recebidas em 25/11/2026. As regras ainda NÃO
 *  foram validadas pela área - ver docs/conta-teste/reforma-tributaria.md.
 *
 *  Este módulo NÃO altera o cálculo atual: ele pede as linhas ao motor
 *  (quantidade e tarifa sem impostos) e só troca a tributação.
 *
 *  Para cada linha de consumo ou bandeira, como na tabela da fatura do modelo:
 *      líquido   = quantidade x tarifa sem impostos
 *      CBS + IBS = líquido x (CBS + IBS)                    -> "por fora"
 *      base ICMS = (líquido + CBS + IBS) / (1 - ICMS)       -> ICMS "por dentro"
 *      ICMS      = base ICMS x ICMS
 *      total     = líquido + CBS/IBS + ICMS, cada parcela com 2 casas
 *  PIS e COFINS não entram. A CIP fica fora da base.
 *
 *  Nas planilhas, as linhas de bandeira vermelha e Escassez ainda têm a fórmula
 *  antiga (imposto por dentro). Aqui TODAS as bandeiras seguem a regra acima.
 * ============================================================================
 */

import { calcular_fatura } from './calculo.js';

/**
 * Alíquotas de 2027. A planilha da área usa CBS 11,3% (alíquota de referência
 * calculada pelo TCU). Há a leitura de que a cobrada em 2027 seja 11,2%
 * (redução de 0,1 ponto). Pendente de resolução do Senado e da área fiscal.
 */
export const REFORMA_ALIQUOTAS = { cbs: 0.113, ibs: 0.001 };
export const REFORMA_OPCOES_CBS = [0.113, 0.112];

const INICIO_REFORMA = new Date('2027-01-01T00:00:00Z');

/** Categorias sem regra especial pendente. Só o B1 tem modelo da área. */
const CATEGORIAS_SIMULAVEIS = ['B1C', 'B1C_TB', 'B3', 'B3_TB', 'B4A', 'B4B'];

const r2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Situações em que falta regra: melhor não dar número do que dar um errado. */
function motivos_sem_simulacao(categoria, atual) {
    const motivos = [];
    if (categoria.startsWith('B1BR') || categoria === 'B1CDE') {
        motivos.push('Baixa Renda e Desconto Social: falta definir o tratamento de CBS/IBS e de eventual devolução (cashback) na fatura.');
    } else if (categoria.startsWith('B2')) {
        motivos.push('Rural e Irrigante: falta definir o tratamento de CBS/IBS.');
    } else if (!CATEGORIAS_SIMULAVEIS.includes(categoria)) {
        motivos.push('Poder Público e Consumo Próprio: falta definir isenções e retenções na reforma.');
    }
    if (atual.resumo.total_retencoes) {
        motivos.push('Fatura com retenção na fonte: falta definir as retenções na reforma.');
    }
    if (atual.detalhes.some((l) => l.is_injetada)) {
        motivos.push('Geração Distribuída: falta definir como a energia injetada é tributada.');
    }
    if (atual.detalhes.some((l) => l.is_sudene)) {
        motivos.push('Redutor SUDENE: falta definir se ele reduz a base de CBS/IBS. Desligue o redutor para simular sem ele.');
    }
    return motivos;
}

/**
 * @param {object} params    mesmos parâmetros de calcular_fatura
 * @param {Array}  dbRows    tarifas já normalizadas
 * @param {object} atual     resultado de calcular_fatura (calculado aqui se omitido)
 * @param {object} aliquotas { cbs, ibs }
 * @returns {object} { indisponivel: string[] } ou { linhas, resumo, aliquotas, observacoes }
 */
export function calcular_reforma(params, dbRows, atual = calcular_fatura(params, dbRows), aliquotas = REFORMA_ALIQUOTAS) {
    if (atual.erro) return { indisponivel: [atual.erro] };

    const categoria = (params.categoria || 'B1C').toUpperCase();
    const motivos = motivos_sem_simulacao(categoria, atual);
    if (motivos.length > 0) return { indisponivel: motivos };

    const { cbs, ibs } = aliquotas;
    const icms = atual.parametros_usados.aliquota_icms_aplicada;

    let base_liquida = 0;
    let icms_sem_arredondar = 0;

    const linhas = atual.detalhes
        .filter((l) => l.unidade === 'kWh' && !l.is_informativo && l.tarifa_base > 0)
        .map((l) => {
            const liquido = l.quantidade * l.tarifa_base;
            const cbs_ibs = liquido * (cbs + ibs);
            const base_icms = (liquido + cbs_ibs) / (1 - icms);
            const valor_icms = base_icms * icms;
            const valor_total = r2(r2(liquido) + r2(cbs_ibs) + r2(valor_icms));

            base_liquida += r2(liquido);
            icms_sem_arredondar += valor_icms;

            return {
                nome: l.nome,
                quantidade: l.quantidade,
                tarifa_base: l.tarifa_base,
                preco_unit: l.quantidade > 0 ? valor_total / l.quantidade : 0,
                valor_total,
                valor_cbs_ibs: r2(cbs_ibs),
                base_icms: icms > 0 ? r2(base_icms) : 0,
                aliquota_icms: r2(icms * 100),
                valor_icms: r2(valor_icms)
            };
        });

    base_liquida = r2(base_liquida);
    const total_energia = r2(linhas.reduce((acc, l) => acc + l.valor_total, 0));
    const valor_cbs = r2(base_liquida * cbs);
    const valor_ibs = r2(base_liquida * ibs);
    const cip = atual.resumo.valor_cip;
    const outros = r2(
        (parseFloat(params.valor_ajuste) || 0) +
        (Array.isArray(params.ajustes) ? params.ajustes : []).reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0)
    );
    const total_fatura = r2(total_energia + cip + outros);
    const total_atual = atual.resumo.total_fatura;
    const diferenca = r2(total_fatura - total_atual);

    // A outra leitura possível do ICMS (CBS/IBS fora da base), que é a do quadro
    // "Fatura B1" do modelo do ES. Serve para a área decidir vendo o valor.
    // Como no quadro da planilha, só o total é arredondado.
    const total_icms_sem_cbs_ibs = r2(
        base_liquida * (1 + cbs + ibs) + (base_liquida / (1 - icms)) * icms + cip + outros
    );

    const data_anterior = new Date(params.data_leitura_anterior);
    const data_atual = new Date(params.data_leitura_atual);
    const observacoes = [
        'Simulação preliminar: alíquotas e regras ainda não validadas pela área. Não use como valor de fatura.',
        'A CIP é somada sem CBS, IBS ou ICMS.'
    ];
    if (categoria !== 'B1C') {
        observacoes.push('O modelo da área cobre apenas o B1 residencial. Para esta tarifa, a mesma regra foi aplicada sem modelo de referência.');
    }
    if (outros !== 0) {
        observacoes.push('Os ajustes foram somados sem CBS, IBS ou ICMS: a lista de itens tributáveis ainda não foi definida.');
    }
    if (data_atual < INICIO_REFORMA) {
        observacoes.push('A leitura atual é anterior a 2027: a comparação é hipotética.');
    } else if (data_anterior < INICIO_REFORMA) {
        observacoes.push('O período cruza 2026 e 2027 e a regra de transição não está definida: CBS/IBS foram aplicados sobre a fatura inteira.');
    }
    // Os avisos de tarifa valem para os dois cálculos; os de PIS/COFINS só para o atual.
    for (const aviso of atual.avisos || []) {
        if (aviso.startsWith('PIS/COFINS')) {
            observacoes.push('O total "Atual" usa PIS/COFINS genérico, porque o mês não está cadastrado: a diferença mostrada é só uma referência.');
        } else {
            observacoes.push(aviso);
        }
    }

    return {
        linhas,
        resumo: {
            total_energia,
            base_cbs_ibs: base_liquida,
            valor_cbs,
            valor_ibs,
            total_icms: r2(icms_sem_arredondar),
            valor_cip: cip,
            outros_valores: outros,
            total_fatura,
            total_atual,
            diferenca,
            diferenca_percentual: total_atual !== 0 ? (diferenca / total_atual) * 100 : 0,
            total_icms_sem_cbs_ibs
        },
        aliquotas: { cbs, ibs, icms },
        observacoes
    };
}
