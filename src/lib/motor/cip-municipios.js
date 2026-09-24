/**
 * CIP por município (EDP ES) - base extraída da planilha oficial da área
 * "Atualização valores CIP no site Agosto 2026", conferida linha a linha:
 * cada par (alíquota x Tarifa B4a) foi recalculado e comparado contra o
 * "VALOR CIP (R$)" impresso na própria planilha - 1359/1359 conferências
 * bateram, sem nenhuma divergência.
 *
 * Fórmula (igual nos 51 municípios, GRUPO B / baixa tensão, que é o que
 * este simulador cobre):
 *   CIP = alíquota da faixa de consumo (kWh faturado) x Tarifa B4a vigente
 *
 * DORES DO RIO PRETO tinha DUAS leis na mesma aba (867/2019, com valores
 * fixos zerados, e 1078/2025, vigente a partir de Junho/2026, já no mesmo
 * formato percentual dos demais) - só a lei vigente (1078/2025) entrou aqui.
 *
 * Duas ressalvas que a própria planilha da área já sinalizava e que NÃO
 * foram resolvidas aqui (mantidas como estavam, sem decisão automática):
 *   - ARACRUZ: comentário da área diz "VERIFICAR!!! Lei 3870/2014 está
 *     isentando estas faixas do Baixa Renda. No CCS não está cadastrado."
 *   - Outro município tem a mesma observação marcada como "Isenta?".
 * Ou seja: pelo menos um município pode estar cobrando Baixa Renda errado
 * hoje. Repassado à área, não alterado por conta própria.
 */

// Tarifa B4a usada como base do cálculo (R$/MWh -> aqui já em R$ cheios,
// igual à planilha). Vigência 07/08/2026, mesma virada da REH 3.600 do ES.
export const TARIFA_B4A = {
    atual: 464.04,     // vigente a partir de 07/08/2026
    anterior: 434.13,  // vigente até 06/08/2026
    data_troca: '2026-08-07',
};

/**
 * Mapeia a categoria do formulário para a classe usada na tabela de CIP
 * do município. Decisão validada com a área em 24/09/2026:
 *  - B1CDE (Desconto Social Lei 15.235) usa RESIDENCIAL, não BAIXA RENDA -
 *    é um desconto municipal só na tarifa de energia, a subclasse cadastral
 *    de CIP continua Residencial comum.
 *  - B2RURAL/B2RUIRRG usam RURAL; em município sem essa linha, cai em
 *    DEMAIS CLASSES.
 *  - B4A/B4B (iluminação pública) são isentas - a prefeitura não cobra CIP
 *    de si mesma; confirmado por município que lista isso explicitamente
 *    (ex.: Guarapari tem uma linha 'ILUMINAÇÃO PÚBLICA: ISENTO').
 */
export function classe_cip_por_categoria(categoria) {
    const cat = (categoria || '').toUpperCase();
    if (cat.startsWith('B1BR')) return 'RESIDENCIAL BAIXA RENDA';
    if (cat.startsWith('B1C')) return 'RESIDENCIAL';
    if (cat.startsWith('B2RU')) return 'RURAL';
    if (cat === 'B4A' || cat === 'B4B') return 'ISENTO';
    return 'DEMAIS CLASSES';
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function dias_antes_depois_do_corte(data_leitura_anterior, data_leitura_atual, data_corte) {
    const primeiro_dia = data_leitura_anterior.getTime() + MS_PER_DAY;
    const ultimo_dia = data_leitura_atual.getTime();
    const total = Math.round((ultimo_dia - primeiro_dia) / MS_PER_DAY) + 1;
    if (total <= 0) return { dias_antes: 0, dias_depois: 1, total: 1 };
    const corte = data_corte.getTime();
    if (ultimo_dia < corte) return { dias_antes: total, dias_depois: 0, total };
    if (primeiro_dia >= corte) return { dias_antes: 0, dias_depois: total, total };
    const dias_antes = Math.round((corte - primeiro_dia) / MS_PER_DAY);
    return { dias_antes, dias_depois: total - dias_antes, total };
}

// Rateia a Tarifa B4a pelos dias do período que caem antes/depois de
// 07/08/2026, igual ao critério usado nas outras tarifas do ES.
export function tarifa_b4a_vigente(data_leitura_anterior, data_leitura_atual) {
    if (!(data_leitura_anterior instanceof Date) || !(data_leitura_atual instanceof Date) ||
        isNaN(data_leitura_anterior.getTime()) || isNaN(data_leitura_atual.getTime())) {
        return TARIFA_B4A.atual;
    }
    const data_corte = new Date(TARIFA_B4A.data_troca + 'T00:00:00Z');
    const { dias_antes, dias_depois, total } = dias_antes_depois_do_corte(data_leitura_anterior, data_leitura_atual, data_corte);
    return (dias_antes * TARIFA_B4A.anterior + dias_depois * TARIFA_B4A.atual) / total;
}

// Dentro das faixas de uma classe, acha a que contém o consumo faturado.
// Convenção 'até' (mesma dos outros limites de faixa do motor, ex. ICMS por
// faixa em tarifas-aneel.js): o limite superior de cada faixa é inclusivo.
export function resolver_faixa_cip(faixas, consumo_kwh) {
    if (!faixas || faixas.length === 0) return null;
    const ordenadas = [...faixas].sort((a, b) => (a.max ?? Infinity) - (b.max ?? Infinity));
    for (const f of ordenadas) {
        if (f.max === null || consumo_kwh <= f.max) return f;
    }
    return ordenadas[ordenadas.length - 1];
}

/**
 * Calcula a CIP automática para um município do ES. Retorna null quando
 * não há dado suficiente (município não cadastrado, ou classe sem faixas
 * pra essa categoria) - nesses casos o campo de CIP continua manual.
 */
export function calcular_cip_municipio(municipio, categoria, consumo_kwh, data_leitura_anterior, data_leitura_atual) {
    const dados = CIP_MUNICIPIOS_ES[municipio];
    if (!dados) return null;
    const classe = classe_cip_por_categoria(categoria);
    if (classe === 'ISENTO') return 0;
    let faixas = dados.faixas[classe];
    if (!faixas && classe === 'RURAL') faixas = dados.faixas['DEMAIS CLASSES'];
    if (!faixas) return null;
    const faixa = resolver_faixa_cip(faixas, consumo_kwh || 0);
    if (!faixa) return null;
    if (faixa.isento) return 0;
    const tarifa = tarifa_b4a_vigente(data_leitura_anterior, data_leitura_atual);
    return Math.round(faixa.aliquota * tarifa * 100) / 100;
}

export const MUNICIPIOS_ES_CIP = ["AFONSO CLAUDIO", "AGUA DOCE DO NORTE", "ALEGRE", "ALFREDO CHAVES", "ANCHIETA", "ARACRUZ", "ATILIO VIVACQUA", "BAIXO GUANDU", "BARRA DE SAO FRANCISCO", "BOA ESPERANCA", "BREJETUBA", "CARIACICA", "CASTELO", "COLATINA", "CONCEICAO DA BARRA", "CONCEICAO DO CASTELO", "DIVINO DE SAO LOURENCO", "DORES DO RIO PRETO", "FUNDAO", "GUACUI", "GUARAPARI", "IBATIBA", "IBIRACU", "IBITIRAMA", "ICONHA", "IRUPI", "ITAGUACU", "ITAPEMIRIM", "JAGUARE", "JOAO NEIVA", "LARANJA DA TERRA", "MANTENOPOLIS", "MARATAIZES", "MIMOSO DO SUL", "MONTANHA", "MUCURICI", "MUNIZ FREIRE", "MUQUI", "NOVA VENECIA", "PINHEIROS", "PONTO BELO", "PRESIDENTE KENNEDY", "RIO BANANAL", "RIO NOVO DO SUL", "SANTA MARIA DE JETIBA", "SAO MATEUS", "SOORETAMA", "VARGEM ALTA", "VENDA NOVA DO IMIGRANTE", "VIANA", "VILA PAVAO"];

export const CIP_MUNICIPIOS_ES = {
    'AFONSO CLAUDIO': {
        leis: ['1626/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA, PODER PUBLICO - MUNICIPAL e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0309 }, { max: 70, aliquota: 0.0513 }, { max: 100, aliquota: 0.0604 }, { max: 150, aliquota: 0.0739 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1174 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1684 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0193 }, { max: 100, aliquota: 0.0288 }, { max: 150, aliquota: 0.0412 }, { max: 200, aliquota: 0.0604 }, { max: 300, aliquota: 0.0739 }, { max: 400, aliquota: 0.0996 }, { max: 500, aliquota: 0.1174 }, { max: null, aliquota: 0.1321 }],
        },
    },
    'AGUA DOCE DO NORTE': {
        leis: ['144/2021'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, ILUMINAÇÃO PUBLICA, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0609 }, { max: 50, aliquota: 0.0675 }, { max: 70, aliquota: 0.08855 }, { max: 100, aliquota: 0.1208 }, { max: 150, aliquota: 0.1546 }, { max: 200, aliquota: 0.1695 }, { max: 300, aliquota: 0.1869 }, { max: 400, aliquota: 0.1965 }, { max: 500, aliquota: 0.2052 }, { max: null, aliquota: 0.2173 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0184 }, { max: 50, aliquota: 0.0244 }, { max: 70, aliquota: 0.0366 }, { max: 100, aliquota: 0.0462 }, { max: 150, aliquota: 0.061 }, { max: 200, aliquota: 0.0855 }, { max: 300, aliquota: 0.1 }, { max: 400, aliquota: 0.1242 }, { max: 500, aliquota: 0.131 }, { max: null, aliquota: 0.1393 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0184 }, { max: 70, aliquota: 0.0244 }, { max: 100, aliquota: 0.0366 }, { max: 150, aliquota: 0.061 }, { max: 180, aliquota: 0.0823 }, { max: null, aliquota: 0.0823 }],
        },
    },
    'ALEGRE': {
        leis: ['2582/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0394 }, { max: 50, aliquota: 0.0406 }, { max: 70, aliquota: 0.0706 }, { max: 100, aliquota: 0.0907 }, { max: 150, aliquota: 0.1338 }, { max: 200, aliquota: 0.1782 }, { max: 300, aliquota: 0.2296 }, { max: 400, aliquota: 0.2719 }, { max: 500, aliquota: 0.31 }, { max: null, aliquota: 0.3748 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0312 }, { max: 70, aliquota: 0.0352 }, { max: 100, aliquota: 0.0402 }, { max: 150, aliquota: 0.0501 }, { max: 200, aliquota: 0.0557 }, { max: 300, aliquota: 0.0928 }, { max: 400, aliquota: 0.1654 }, { max: 500, aliquota: 0.1939 }, { max: null, aliquota: 0.2181 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ALFREDO CHAVES': {
        leis: ['635/2017'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL IRRIGANTE',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0459 }, { max: 50, aliquota: 0.0572 }, { max: 70, aliquota: 0.0893 }, { max: 100, aliquota: 0.1084 }, { max: 150, aliquota: 0.1339 }, { max: 200, aliquota: 0.1488 }, { max: 300, aliquota: 0.17 }, { max: 400, aliquota: 0.1913 }, { max: 500, aliquota: 0.2125 }, { max: null, aliquota: 0.2434 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0306 }, { max: 50, aliquota: 0.0363 }, { max: 70, aliquota: 0.0425 }, { max: 100, aliquota: 0.0529 }, { max: 150, aliquota: 0.0822 }, { max: 200, aliquota: 0.1204 }, { max: 300, aliquota: 0.1474 }, { max: 400, aliquota: 0.1655 }, { max: 500, aliquota: 0.1952 }, { max: null, aliquota: 0.2195 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0162 }, { max: 50, aliquota: 0.0165 }, { max: 70, aliquota: 0.0199 }, { max: 100, aliquota: 0.0232 }, { max: 150, aliquota: 0.0265 }, { max: 200, aliquota: 0.0298 }, { max: null, aliquota: 0.0331 }],
            'RURAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.0193 }, { max: 400, aliquota: 0.0712 }, { max: null, aliquota: 0.1494 }],
        },
    },
    'ANCHIETA': {
        leis: ['110/2021'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL | Isenta?',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1305 }, { max: 150, aliquota: 0.1476 }, { max: 200, aliquota: 0.1623 }, { max: 300, aliquota: 0.1742 }, { max: 400, aliquota: 0.176 }, { max: 500, aliquota: 0.1774 }, { max: 750, aliquota: 0.1817 }, { max: null, aliquota: 0.2061 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0505 }, { max: 100, aliquota: 0.0669 }, { max: 150, aliquota: 0.0695 }, { max: 200, aliquota: 0.0852 }, { max: 300, aliquota: 0.0938 }, { max: 400, aliquota: 0.1156 }, { max: 500, aliquota: 0.1228 }, { max: null, aliquota: 0.1436 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0404 }, { max: null, aliquota: 0.0455 }],
        },
    },
    'ARACRUZ': {
        leis: ['3870/2014'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL | Lei 3870/2014 está isentando estas faixas do Baixa Renda. No CCS não está cadastrado. | VERIFICAR!!! Lei 3870/2014 está isentando estas faixas do Baixa Renda. No CCS não está cadastrado.',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1136 }, { max: 150, aliquota: 0.1766 }, { max: 200, aliquota: 0.193 }, { max: 300, aliquota: 0.2221 }, { max: 400, aliquota: 0.2423 }, { max: 500, aliquota: 0.2827 }, { max: null, aliquota: 0.3029 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0741 }, { max: 100, aliquota: 0.0808 }, { max: 150, aliquota: 0.1017 }, { max: 200, aliquota: 0.111 }, { max: 300, aliquota: 0.1295 }, { max: 400, aliquota: 0.1413 }, { max: 500, aliquota: 0.1531 }, { max: null, aliquota: 0.1766 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0 }, { max: 150, aliquota: 0 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ATILIO VIVACQUA': {
        leis: ['583/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0519 }, { max: 50, aliquota: 0.0545 }, { max: 70, aliquota: 0.088 }, { max: 100, aliquota: 0.0924 }, { max: 150, aliquota: 0.1092 }, { max: 200, aliquota: 0.1218 }, { max: 300, aliquota: 0.136 }, { max: 400, aliquota: 0.1588 }, { max: 500, aliquota: 0.1745 }, { max: null, aliquota: 0.1978 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0311 }, { max: 70, aliquota: 0.0322 }, { max: 100, aliquota: 0.0517 }, { max: 150, aliquota: 0.0811 }, { max: 200, aliquota: 0.0959 }, { max: 300, aliquota: 0.1131 }, { max: 400, aliquota: 0.1287 }, { max: 500, aliquota: 0.1443 }, { max: null, aliquota: 0.1599 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'BAIXO GUANDU': {
        leis: ['2.141/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.055 }, { max: 50, aliquota: 0.0562 }, { max: 70, aliquota: 0.1094 }, { max: 100, aliquota: 0.1277 }, { max: 150, aliquota: 0.1576 }, { max: 200, aliquota: 0.2125 }, { max: 300, aliquota: 0.2505 }, { max: 400, aliquota: 0.2819 }, { max: 500, aliquota: 0.308 }, { max: null, aliquota: 0.3489 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0333 }, { max: 50, aliquota: 0.0397 }, { max: 70, aliquota: 0.0583 }, { max: 100, aliquota: 0.0755 }, { max: 150, aliquota: 0.0829 }, { max: 200, aliquota: 0.1216 }, { max: 300, aliquota: 0.1576 }, { max: 400, aliquota: 0.2125 }, { max: null, aliquota: 0.2819 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0248 }, { max: 50, aliquota: 0.0265 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.0373 }, { max: 150, aliquota: 0.0426 }, { max: null, aliquota: 0.048 }],
        },
    },
    'BARRA DE SAO FRANCISCO': {
        leis: ['05/2004'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0172 }, { max: 70, aliquota: 0.0463 }, { max: 150, aliquota: 0.0702 }, { max: 300, aliquota: 0.0792 }, { max: 500, aliquota: 0.0896 }, { max: null, aliquota: 0.1046 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 70, aliquota: 0.0172 }, { max: 150, aliquota: 0.0444 }, { max: 300, aliquota: 0.053 }, { max: 500, aliquota: 0.0881 }, { max: null, aliquota: 0.1046 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 70, aliquota: 0 }, { max: 150, aliquota: 0.0444 }, { max: 180, aliquota: 0.0523 }, { max: null, aliquota: 0.0523 }],
        },
    },
    'BOA ESPERANCA': {
        leis: ['1191/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0367 }, { max: 50, aliquota: 0.0456 }, { max: 70, aliquota: 0.0639 }, { max: 100, aliquota: 0.0876 }, { max: 150, aliquota: 0.1042 }, { max: 200, aliquota: 0.1223 }, { max: 300, aliquota: 0.1689 }, { max: 400, aliquota: 0.2146 }, { max: 500, aliquota: 0.2621 }, { max: null, aliquota: 0.3025 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0216 }, { max: 50, aliquota: 0.0252 }, { max: 70, aliquota: 0.0273 }, { max: 100, aliquota: 0.0321 }, { max: 150, aliquota: 0.0439 }, { max: 200, aliquota: 0.0596 }, { max: 300, aliquota: 0.074 }, { max: 400, aliquota: 0.1174 }, { max: 500, aliquota: 0.1351 }, { max: null, aliquota: 0.1577 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0145 }, { max: 50, aliquota: 0.0154 }, { max: 70, aliquota: 0.0187 }, { max: 100, aliquota: 0.0217 }, { max: 150, aliquota: 0.0248 }, { max: null, aliquota: 0.028 }],
        },
    },
    'BREJETUBA': {
        leis: ['235/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0319 }, { max: 50, aliquota: 0.038 }, { max: 70, aliquota: 0.0631 }, { max: 100, aliquota: 0.0743 }, { max: 150, aliquota: 0.0909 }, { max: 200, aliquota: 0.1225 }, { max: 300, aliquota: 0.1444 }, { max: 400, aliquota: 0.1624 }, { max: 500, aliquota: 0.1776 }, { max: null, aliquota: 0.2071 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0107 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0237 }, { max: 100, aliquota: 0.0354 }, { max: 150, aliquota: 0.0507 }, { max: 200, aliquota: 0.0743 }, { max: 300, aliquota: 0.0909 }, { max: 400, aliquota: 0.1225 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1624 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0107 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0237 }, { max: 100, aliquota: 0.0354 }, { max: 150, aliquota: 0.0507 }, { max: 200, aliquota: 0.0743 }, { max: 300, aliquota: 0.0909 }, { max: 400, aliquota: 0.1225 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1624 }],
        },
    },
    'CARIACICA': {
        leis: ['4376/2006'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, ILUMINAÇÃO PUBLICA, PODER PUBLICO - MUNICIPAL, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0427 }, { max: 50, aliquota: 0.043 }, { max: 70, aliquota: 0.0615 }, { max: 100, aliquota: 0.0931 }, { max: 150, aliquota: 0.1112 }, { max: 200, aliquota: 0.1238 }, { max: 300, aliquota: 0.1378 }, { max: 400, aliquota: 0.1433 }, { max: 500, aliquota: 0.1506 }, { max: null, aliquota: 0.1551 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0212 }, { max: 70, aliquota: 0.0283 }, { max: 100, aliquota: 0.0357 }, { max: 150, aliquota: 0.0444 }, { max: 200, aliquota: 0.0715 }, { max: 300, aliquota: 0.0984 }, { max: 400, aliquota: 0.0999 }, { max: 500, aliquota: 0.1012 }, { max: null, aliquota: 0.1025 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0131 }, { max: 50, aliquota: 0.014 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0196 }, { max: 150, aliquota: 0.0224 }, { max: 200, aliquota: 0.0252 }, { max: 300, aliquota: 0.0252 }, { max: 400, aliquota: 0.0252 }, { max: 500, aliquota: 0.0252 }, { max: null, aliquota: 0.0252 }],
        },
    },
    'CASTELO': {
        leis: ['3131/2011'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.01988 }, { max: 50, aliquota: 0.02373 }, { max: 70, aliquota: 0.03941 }, { max: 100, aliquota: 0.04641 }, { max: 150, aliquota: 0.0567 }, { max: 200, aliquota: 0.07651 }, { max: 300, aliquota: 0.09016 }, { max: 400, aliquota: 0.09128 }, { max: 500, aliquota: 0.09975 }, { max: null, aliquota: 0.126 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.01715 }, { max: 70, aliquota: 0.01827 }, { max: 100, aliquota: 0.0273 }, { max: 150, aliquota: 0.03934 }, { max: 200, aliquota: 0.05754 }, { max: 300, aliquota: 0.07 }, { max: 400, aliquota: 0.0945 }, { max: 500, aliquota: 0.112 }, { max: null, aliquota: 0.126 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.00875 }, { max: 70, aliquota: 0.0105 }, { max: 100, aliquota: 0.0119 }, { max: 150, aliquota: 0.01225 }, { max: 180, aliquota: 0.01365 }, { max: null, aliquota: 0.01365 }],
        },
    },
    'COLATINA': {
        leis: ['4813/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA',
        faixas: {
            'DEMAIS CLASSES': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 800, aliquota: 0.08 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 800, aliquota: 0.08 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
        },
    },
    'CONCEICAO DA BARRA': {
        leis: ['2.806/2018'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA, PODER PUBLICO - MUNICIPAL e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.058 }, { max: 50, aliquota: 0.072 }, { max: 70, aliquota: 0.087 }, { max: 100, aliquota: 0.114 }, { max: 150, aliquota: 0.142 }, { max: 200, aliquota: 0.172 }, { max: 300, aliquota: 0.198 }, { max: 400, aliquota: 0.225 }, { max: 500, aliquota: 0.252 }, { max: null, aliquota: 0.286 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.044 }, { max: 70, aliquota: 0.052 }, { max: 100, aliquota: 0.065 }, { max: 150, aliquota: 0.087 }, { max: 200, aliquota: 0.114 }, { max: 300, aliquota: 0.143 }, { max: 400, aliquota: 0.172 }, { max: 500, aliquota: 0.198 }, { max: null, aliquota: 0.225 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.025 }, { max: 70, aliquota: 0.035 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.055 }, { max: 200, aliquota: 0.065 }, { max: 300, aliquota: 0.075 }, { max: 400, aliquota: 0.087 }, { max: 500, aliquota: 0.098 }, { max: null, aliquota: 0.115 }],
            'RURAL': [{ max: 30, aliquota: 0.055 }, { max: 50, aliquota: 0.07 }, { max: 70, aliquota: 0.085 }, { max: 100, aliquota: 0.11 }, { max: 150, aliquota: 0.14 }, { max: 200, aliquota: 0.17 }, { max: 300, aliquota: 0.19 }, { max: 400, aliquota: 0.22 }, { max: 500, aliquota: 0.25 }, { max: null, aliquota: 0.28 }],
        },
    },
    'CONCEICAO DO CASTELO': {
        leis: ['1034/2005'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.035 }, { max: 50, aliquota: 0.04 }, { max: 70, aliquota: 0.05 }, { max: 100, aliquota: 0.055 }, { max: 150, aliquota: 0.07 }, { max: 200, aliquota: 0.09 }, { max: 300, aliquota: 0.095 }, { max: 400, aliquota: 0.1 }, { max: 500, aliquota: 0.12 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.015 }, { max: 70, aliquota: 0.02 }, { max: 100, aliquota: 0.03 }, { max: 150, aliquota: 0.04 }, { max: 200, aliquota: 0.05 }, { max: 300, aliquota: 0.06 }, { max: 400, aliquota: 0.07 }, { max: 500, aliquota: 0.08 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.01 }, { max: 70, aliquota: 0.015 }, { max: 100, aliquota: 0.02 }, { max: 150, aliquota: 0.025 }, { max: 200, aliquota: 0.03 }, { max: 300, aliquota: 0.035 }, { max: 400, aliquota: 0.04 }, { max: 500, aliquota: 0.05 }, { max: null, aliquota: 0.1 }],
        },
    },
    'DIVINO DE SAO LOURENCO': {
        leis: ['124/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0512 }, { max: 50, aliquota: 0.0541 }, { max: 70, aliquota: 0.0902 }, { max: 100, aliquota: 0.1312 }, { max: 150, aliquota: 0.1536 }, { max: 200, aliquota: 0.1706 }, { max: 300, aliquota: 0.1929 }, { max: 400, aliquota: 0.2104 }, { max: 500, aliquota: 0.2367 }, { max: null, aliquota: 0.2454 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0151 }, { max: 50, aliquota: 0.0178 }, { max: 70, aliquota: 0.0332 }, { max: 100, aliquota: 0.0497 }, { max: 150, aliquota: 0.0787 }, { max: 200, aliquota: 0.0809 }, { max: 300, aliquota: 0.1005 }, { max: 400, aliquota: 0.1128 }, { max: 500, aliquota: 0.1231 }, { max: null, aliquota: 0.1538 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'DORES DO RIO PRETO': {
        leis: ['867/2019', '1078/2025'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL | Classes Isentas: ILUMINAÇÃO PUBLICA, RURAL E PODER PÚBLICO MUNICIPAL.',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0409 }, { max: 50, aliquota: 0.0421 }, { max: 70, aliquota: 0.0494 }, { max: 100, aliquota: 0.0688 }, { max: 150, aliquota: 0.086 }, { max: 200, aliquota: 0.1025 }, { max: 300, aliquota: 0.1289 }, { max: 400, aliquota: 0.145 }, { max: 500, aliquota: 0.1587 }, { max: null, aliquota: 0.1869 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0034 }, { max: 50, aliquota: 0.0038 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0253 }, { max: 150, aliquota: 0.0363 }, { max: 200, aliquota: 0.053 }, { max: 300, aliquota: 0.099 }, { max: 400, aliquota: 0.1177 }, { max: 500, aliquota: 0.1307 }, { max: null, aliquota: 0.198 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0034 }, { max: 50, aliquota: 0.0038 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0253 }, { max: 150, aliquota: 0.0363 }, { max: 200, aliquota: 0.053 }, { max: 300, aliquota: 0.099 }, { max: 400, aliquota: 0.1177 }, { max: 500, aliquota: 0.1307 }, { max: null, aliquota: 0.198 }],
        },
    },
    'FUNDAO': {
        leis: ['1372/2022'],
        nota: 'Classes Isentas: PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.038 }, { max: 50, aliquota: 0.045 }, { max: 70, aliquota: 0.075 }, { max: 100, aliquota: 0.097 }, { max: 150, aliquota: 0.119 }, { max: 200, aliquota: 0.1685 }, { max: 300, aliquota: 0.189 }, { max: 400, aliquota: 0.195 }, { max: 500, aliquota: 0.21 }, { max: null, aliquota: 0.238 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.0275 }, { max: 70, aliquota: 0.041 }, { max: 100, aliquota: 0.0615 }, { max: 150, aliquota: 0.0735 }, { max: 200, aliquota: 0.1075 }, { max: 300, aliquota: 0.1315 }, { max: 400, aliquota: 0.177 }, { max: 500, aliquota: 0.2085 }, { max: null, aliquota: 0.2345 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0205 }, { max: 100, aliquota: 0.024 }, { max: 150, aliquota: 0.0275 }, { max: null, aliquota: 0.031 }],
        },
    },
    'GUACUI': {
        leis: ['3061/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0208 }, { max: 50, aliquota: 0.0248 }, { max: 70, aliquota: 0.0411 }, { max: 100, aliquota: 0.0484 }, { max: 150, aliquota: 0.0592 }, { max: 200, aliquota: 0.0798 }, { max: 300, aliquota: 0.0941 }, { max: 400, aliquota: 0.1058 }, { max: 500, aliquota: 0.1157 }, { max: null, aliquota: 0.1311 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0154 }, { max: 100, aliquota: 0.0231 }, { max: 150, aliquota: 0.0331 }, { max: 200, aliquota: 0.0484 }, { max: 300, aliquota: 0.0592 }, { max: 400, aliquota: 0.0798 }, { max: 500, aliquota: 0.0941 }, { max: null, aliquota: 0.1058 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0154 }, { max: 100, aliquota: 0.0231 }, { max: 150, aliquota: 0.0331 }, { max: 200, aliquota: 0.0484 }, { max: 300, aliquota: 0.0592 }, { max: 400, aliquota: 0.0798 }, { max: 500, aliquota: 0.0941 }, { max: null, aliquota: 0.1058 }],
        },
    },
    'GUARAPARI': {
        leis: ['2370/2004'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA.',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0502 }, { max: 50, aliquota: 0.0516 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.08 }, { max: 150, aliquota: 0.1 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.14 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.18 }, { max: null, aliquota: 0.2 }],
            'ILUMINAÇÃO PÚBLICA': [{ max: null, aliquota: 0, isento: true }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0498 }, { max: 50, aliquota: 0.0511 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.07 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.11 }, { max: 300, aliquota: 0.13 }, { max: 400, aliquota: 0.15 }, { max: 500, aliquota: 0.17 }, { max: null, aliquota: 0.19 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: null, aliquota: 0.0145 }],
            'RURAL': [{ max: 30, aliquota: 0.0502 }, { max: 50, aliquota: 0.0516 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.08 }, { max: 150, aliquota: 0.1 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.14 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.18 }, { max: null, aliquota: 0.2 }],
        },
    },
    'IBATIBA': {
        leis: ['417/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0.0473 }, { max: 70, aliquota: 0.0521 }, { max: 100, aliquota: 0.0568 }, { max: 150, aliquota: 0.0662 }, { max: 200, aliquota: 0.0815 }, { max: 300, aliquota: 0.1036 }, { max: 400, aliquota: 0.1091 }, { max: 500, aliquota: 0.1145 }, { max: null, aliquota: 0.12 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0464 }, { max: 200, aliquota: 0.0481 }, { max: 300, aliquota: 0.0568 }, { max: 400, aliquota: 0.0615 }, { max: 500, aliquota: 0.0663 }, { max: null, aliquota: 0.071 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0464 }, { max: 200, aliquota: 0.0481 }, { max: 300, aliquota: 0.0568 }, { max: 400, aliquota: 0.0615 }, { max: 500, aliquota: 0.0663 }, { max: null, aliquota: 0.071 }],
        },
    },
    'IBIRACU': {
        leis: ['2743/2006'],
        nota: 'Classes Isentas: PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.04 }, { max: 70, aliquota: 0.067 }, { max: 100, aliquota: 0.0885 }, { max: 150, aliquota: 0.1083 }, { max: 200, aliquota: 0.146 }, { max: 300, aliquota: 0.172 }, { max: 400, aliquota: 0.176 }, { max: 500, aliquota: 0.1925 }, { max: null, aliquota: 0.218 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0237 }, { max: 70, aliquota: 0.0308 }, { max: 100, aliquota: 0.046 }, { max: 150, aliquota: 0.055 }, { max: 200, aliquota: 0.0805 }, { max: 300, aliquota: 0.0985 }, { max: 400, aliquota: 0.1326 }, { max: 500, aliquota: 0.1563 }, { max: null, aliquota: 0.1758 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0175 }, { max: 100, aliquota: 0.0205 }, { max: 150, aliquota: 0.0233 }, { max: null, aliquota: 0.0262 }],
        },
    },
    'IBITIRAMA': {
        leis: ['452/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0786 }, { max: 50, aliquota: 0.0917 }, { max: 70, aliquota: 0.0935 }, { max: 100, aliquota: 0.0963 }, { max: 150, aliquota: 0.1043 }, { max: 200, aliquota: 0.1048 }, { max: 300, aliquota: 0.1161 }, { max: 400, aliquota: 0.1173 }, { max: 500, aliquota: 0.1179 }, { max: null, aliquota: 0.132 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0311 }, { max: 70, aliquota: 0.035 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0589 }, { max: 200, aliquota: 0.0654 }, { max: 300, aliquota: 0.0786 }, { max: 400, aliquota: 0.0794 }, { max: 500, aliquota: 0.0817 }, { max: null, aliquota: 0.0888 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ICONHA': {
        leis: ['038/2017'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e PODER PUBLICO - MUNICIPAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0501 }, { max: 70, aliquota: 0.0666 }, { max: 100, aliquota: 0.0979 }, { max: 150, aliquota: 0.1293 }, { max: 200, aliquota: 0.1606 }, { max: 300, aliquota: 0.192 }, { max: 400, aliquota: 0.276 }, { max: 500, aliquota: 0.336 }, { max: null, aliquota: 0.396 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.024 }, { max: 100, aliquota: 0.048 }, { max: 150, aliquota: 0.084 }, { max: 200, aliquota: 0.108 }, { max: 300, aliquota: 0.132 }, { max: 400, aliquota: 0.204 }, { max: 500, aliquota: 0.24 }, { max: null, aliquota: 0.276 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 80, aliquota: 0 }, { max: 100, aliquota: 0.0159 }, { max: 150, aliquota: 0.03 }, { max: 180, aliquota: 0.036 }, { max: null, aliquota: 0.042 }],
            'RURAL': [{ max: 30, aliquota: 0.024 }, { max: 100, aliquota: 0.048 }, { max: 150, aliquota: 0.084 }, { max: 200, aliquota: 0.108 }, { max: 300, aliquota: 0.132 }, { max: 400, aliquota: 0.204 }, { max: 500, aliquota: 0.24 }, { max: null, aliquota: 0.276 }],
        },
    },
    'IRUPI': {
        leis: ['012/2025'],
        nota: 'Classes Isentas: RURAL RESIDENCIAL, ASSOCIAÇÕES ENTIDADES FOLANTRÓPICAS E TEMPLOS RELIGIOSOS.',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0309 }, { max: 70, aliquota: 0.0513 }, { max: 100, aliquota: 0.0604 }, { max: 150, aliquota: 0.0739 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1174 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1684 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0193 }, { max: 100, aliquota: 0.0288 }, { max: 150, aliquota: 0.0412 }, { max: 200, aliquota: 0.0604 }, { max: 300, aliquota: 0.0739 }, { max: 400, aliquota: 0.0996 }, { max: 500, aliquota: 0.1174 }, { max: null, aliquota: 0.1321 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0073 }, { max: 50, aliquota: 0.0077 }, { max: 70, aliquota: 0.0094 }, { max: null, aliquota: 0.0109 }],
        },
    },
    'ITAGUACU': {
        leis: ['800/1998'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0306 }, { max: 50, aliquota: 0.0365 }, { max: 70, aliquota: 0.0606 }, { max: 100, aliquota: 0.0714 }, { max: 150, aliquota: 0.0883 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1386 }, { max: 400, aliquota: 0.156 }, { max: 500, aliquota: 0.1705 }, { max: null, aliquota: 0.1931 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.013 }, { max: 50, aliquota: 0.0138 }, { max: 70, aliquota: 0.0228 }, { max: 100, aliquota: 0.034 }, { max: 150, aliquota: 0.0488 }, { max: 200, aliquota: 0.0714 }, { max: 300, aliquota: 0.0873 }, { max: 400, aliquota: 0.1175 }, { max: 500, aliquota: 0.1386 }, { max: null, aliquota: 0.156 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.013 }, { max: 50, aliquota: 0.0138 }, { max: 70, aliquota: 0.0228 }, { max: 100, aliquota: 0.034 }, { max: 150, aliquota: 0.0488 }, { max: null, aliquota: 0.0714 }],
        },
    },
    'ITAPEMIRIM': {
        leis: ['1718/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0654 }, { max: 100, aliquota: 0.0916 }, { max: 200, aliquota: 0.1177 }, { max: null, aliquota: 0.1439 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0131 }, { max: 100, aliquota: 0.0262 }, { max: 200, aliquota: 0.0523 }, { max: null, aliquota: 0.0785 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0131 }, { max: 100, aliquota: 0.0262 }, { max: 200, aliquota: 0.0523 }, { max: null, aliquota: 0.0785 }],
        },
    },
    'JAGUARE': {
        leis: ['680/2006'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO -AES, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0285 }, { max: 50, aliquota: 0.034 }, { max: 70, aliquota: 0.0565 }, { max: 100, aliquota: 0.0665 }, { max: 150, aliquota: 0.0814 }, { max: 200, aliquota: 0.1096 }, { max: 300, aliquota: 0.1292 }, { max: 400, aliquota: 0.1453 }, { max: 500, aliquota: 0.1589 }, { max: null, aliquota: 0.18 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0212 }, { max: 100, aliquota: 0.0317 }, { max: 150, aliquota: 0.0454 }, { max: 200, aliquota: 0.0665 }, { max: 300, aliquota: 0.0814 }, { max: 400, aliquota: 0.1096 }, { max: 500, aliquota: 0.1292 }, { max: null, aliquota: 0.1453 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0212 }, { max: 100, aliquota: 0.0317 }, { max: 150, aliquota: 0.0454 }, { max: 200, aliquota: 0.0665 }, { max: 300, aliquota: 0.0814 }, { max: 400, aliquota: 0.1096 }, { max: 500, aliquota: 0.1292 }, { max: null, aliquota: 0.1453 }],
        },
    },
    'JOAO NEIVA': {
        leis: ['3827/2025'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1136 }, { max: 150, aliquota: 0.152 }, { max: 200, aliquota: 0.193 }, { max: 300, aliquota: 0.2221 }, { max: 400, aliquota: 0.2423 }, { max: 500, aliquota: 0.2527 }, { max: null, aliquota: 0.2829 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0465 }, { max: 100, aliquota: 0.0795 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.1201 }, { max: 300, aliquota: 0.142 }, { max: 400, aliquota: 0.149 }, { max: 500, aliquota: 0.1531 }, { max: null, aliquota: 0.1766 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0235 }, { max: 100, aliquota: 0.0275 }, { max: 150, aliquota: 0.0313 }, { max: 180, aliquota: 0.0354 }, { max: null, aliquota: 0.0404 }],
        },
    },
    'LARANJA DA TERRA': {
        leis: ['372/2003'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0335 }, { max: 50, aliquota: 0.0385 }, { max: 70, aliquota: 0.0415 }, { max: 100, aliquota: 0.0595 }, { max: 150, aliquota: 0.0755 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1285 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1885 }, { max: 600, aliquota: 0.1885 }, { max: 700, aliquota: 0.2185 }, { max: 800, aliquota: 0.2215 }, { max: 900, aliquota: 0.2385 }, { max: null, aliquota: 0.2465 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0335 }, { max: 50, aliquota: 0.0385 }, { max: 70, aliquota: 0.0415 }, { max: 100, aliquota: 0.0595 }, { max: 150, aliquota: 0.0755 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1285 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1885 }, { max: 600, aliquota: 0.1885 }, { max: 700, aliquota: 0.2185 }, { max: 800, aliquota: 0.2215 }, { max: 900, aliquota: 0.2385 }, { max: null, aliquota: 0.2465 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0156 }, { max: 50, aliquota: 0.0252 }, { max: 70, aliquota: 0.0305 }, { max: 100, aliquota: 0.0316 }, { max: 150, aliquota: 0.0406 }, { max: 200, aliquota: 0.0457 }, { max: null, aliquota: 0.0457 }],
        },
    },
    'MANTENOPOLIS': {
        leis: ['954/2004'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0285 }, { max: 50, aliquota: 0.034 }, { max: 70, aliquota: 0.0565 }, { max: 100, aliquota: 0.0665 }, { max: 150, aliquota: 0.0814 }, { max: 200, aliquota: 0.1096 }, { max: 300, aliquota: 0.1292 }, { max: 400, aliquota: 0.1453 }, { max: 500, aliquota: 0.1589 }, { max: null, aliquota: 0.18 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0215 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.032 }, { max: 150, aliquota: 0.046 }, { max: 200, aliquota: 0.067 }, { max: 300, aliquota: 0.082 }, { max: 400, aliquota: 0.11 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0215 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.032 }, { max: 150, aliquota: 0.046 }, { max: 200, aliquota: 0.067 }, { max: 300, aliquota: 0.082 }, { max: 400, aliquota: 0.11 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
        },
    },
    'MARATAIZES': {
        leis: ['741/2003'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL e PODER PUBLICO - MUNICIPAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0345 }, { max: 70, aliquota: 0.0483 }, { max: 100, aliquota: 0.0483 }, { max: 150, aliquota: 0.1036 }, { max: 200, aliquota: 0.1243 }, { max: 300, aliquota: 0.1519 }, { max: 400, aliquota: 0.1726 }, { max: 500, aliquota: 0.1933 }, { max: null, aliquota: 0.2763 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0345 }, { max: 70, aliquota: 0.0345 }, { max: 100, aliquota: 0.0345 }, { max: 150, aliquota: 0.0587 }, { max: 200, aliquota: 0.0587 }, { max: 300, aliquota: 0.0693 }, { max: 400, aliquota: 0.1694 }, { max: 500, aliquota: 0.1997 }, { max: null, aliquota: 0.2247 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0172 }, { max: 50, aliquota: 0.0172 }, { max: 70, aliquota: 0.0172 }, { max: 100, aliquota: 0.0172 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
            'RURAL': [{ max: 30, aliquota: 0.014 }, { max: 50, aliquota: 0.014 }, { max: 70, aliquota: 0.014 }, { max: 100, aliquota: 0.014 }, { max: 150, aliquota: 0.014 }, { max: 200, aliquota: 0.014 }, { max: 300, aliquota: 0.014 }, { max: 400, aliquota: 0.014 }, { max: 500, aliquota: 0.014 }, { max: null, aliquota: 0.014 }],
        },
    },
    'MIMOSO DO SUL': {
        leis: ['1482/2002'],
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.058 }, { max: 100, aliquota: 0.075 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.155 }, { max: 400, aliquota: 0.185 }, { max: 500, aliquota: 0.215 }, { max: null, aliquota: 0.235 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.045 }, { max: 100, aliquota: 0.065 }, { max: 150, aliquota: 0.085 }, { max: 200, aliquota: 0.105 }, { max: 300, aliquota: 0.145 }, { max: 400, aliquota: 0.165 }, { max: 500, aliquota: 0.185 }, { max: null, aliquota: 0.205 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.006 }, { max: 100, aliquota: 0.008 }, { max: 150, aliquota: 0.01 }, { max: 180, aliquota: 0.0105 }, { max: null, aliquota: 0.0105 }],
        },
    },
    'MONTANHA': {
        leis: ['547/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0366 }, { max: 100, aliquota: 0.0548 }, { max: 200, aliquota: 0.0732 }, { max: null, aliquota: 0.0915 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0183 }, { max: 100, aliquota: 0.0366 }, { max: 200, aliquota: 0.0548 }, { max: null, aliquota: 0.0732 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0183 }, { max: 100, aliquota: 0.0366 }, { max: 200, aliquota: 0.0548 }, { max: null, aliquota: 0.0732 }],
        },
    },
    'MUCURICI': {
        leis: ['399/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.045 }, { max: 50, aliquota: 0.0498 }, { max: 70, aliquota: 0.0868 }, { max: 100, aliquota: 0.1004 }, { max: 150, aliquota: 0.1224 }, { max: 200, aliquota: 0.165 }, { max: 300, aliquota: 0.175 }, { max: null, aliquota: 0.175 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0282 }, { max: 50, aliquota: 0.0353 }, { max: 70, aliquota: 0.041 }, { max: 100, aliquota: 0.0567 }, { max: 150, aliquota: 0.0749 }, { max: 200, aliquota: 0.1098 }, { max: 300, aliquota: 0.1311 }, { max: 400, aliquota: 0.1835 }, { max: 500, aliquota: 0.1917 }, { max: null, aliquota: 0.2274 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0164 }, { max: 50, aliquota: 0.0174 }, { max: 70, aliquota: 0.0211 }, { max: 100, aliquota: 0.0245 }, { max: 150, aliquota: 0.028 }, { max: null, aliquota: 0.0318 }],
        },
    },
    'MUNIZ FREIRE': {
        leis: ['7842/2018'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0.0326 }, { max: 70, aliquota: 0.0424 }, { max: 100, aliquota: 0.0574 }, { max: 200, aliquota: 0.0797 }, { max: 300, aliquota: 0.1034 }, { max: 400, aliquota: 0.1738 }, { max: 500, aliquota: 0.21 }, { max: null, aliquota: 0.2824 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.0217 }, { max: 70, aliquota: 0.0253 }, { max: 100, aliquota: 0.0325 }, { max: 200, aliquota: 0.0435 }, { max: 300, aliquota: 0.0652 }, { max: 500, aliquota: 0.1014 }, { max: null, aliquota: 0.1738 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0.0146 }, { max: 70, aliquota: 0.0203 }, { max: 100, aliquota: 0.0276 }, { max: 200, aliquota: 0.0363 }, { max: 300, aliquota: 0.0543 }, { max: 500, aliquota: 0.076 }, { max: null, aliquota: 0.1448 }],
        },
    },
    'MUQUI': {
        leis: ['296/2006'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0275 }, { max: 50, aliquota: 0.0275 }, { max: 70, aliquota: 0.0481 }, { max: 100, aliquota: 0.0481 }, { max: 150, aliquota: 0.0894 }, { max: 200, aliquota: 0.0894 }, { max: 300, aliquota: 0.1032 }, { max: 400, aliquota: 0.1032 }, { max: 500, aliquota: 0.11 }, { max: null, aliquota: 0.1169 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0103 }, { max: 50, aliquota: 0.0103 }, { max: 70, aliquota: 0.0275 }, { max: 100, aliquota: 0.0344 }, { max: 150, aliquota: 0.0619 }, { max: 200, aliquota: 0.0619 }, { max: 300, aliquota: 0.0619 }, { max: 400, aliquota: 0.0757 }, { max: 500, aliquota: 0.0757 }, { max: null, aliquota: 0.0757 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0 }, { max: 150, aliquota: 0 }, { max: 200, aliquota: 0 }, { max: null, aliquota: 0 }],
        },
    },
    'NOVA VENECIA': {
        leis: ['2569/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0515 }, { max: 50, aliquota: 0.052 }, { max: 70, aliquota: 0.0712 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1304 }, { max: 200, aliquota: 0.1474 }, { max: 300, aliquota: 0.1735 }, { max: 400, aliquota: 0.1962 }, { max: 500, aliquota: 0.2175 }, { max: null, aliquota: 0.2521 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.033 }, { max: 150, aliquota: 0.042 }, { max: 200, aliquota: 0.0755 }, { max: 300, aliquota: 0.0939 }, { max: 400, aliquota: 0.1019 }, { max: 500, aliquota: 0.1109 }, { max: null, aliquota: 0.1657 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.005 }, { max: 50, aliquota: 0.008 }, { max: 70, aliquota: 0.012 }, { max: 100, aliquota: 0.019 }, { max: 150, aliquota: 0.025 }, { max: 180, aliquota: 0.0302 }, { max: null, aliquota: 0.0302 }],
        },
    },
    'PINHEIROS': {
        leis: ['824/2005'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0397 }, { max: 50, aliquota: 0.0517 }, { max: 70, aliquota: 0.0637 }, { max: 100, aliquota: 0.0657 }, { max: 150, aliquota: 0.0777 }, { max: 200, aliquota: 0.0897 }, { max: 300, aliquota: 0.1161 }, { max: 400, aliquota: 0.1351 }, { max: 500, aliquota: 0.1521 }, { max: null, aliquota: 0.2051 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0257 }, { max: 50, aliquota: 0.0257 }, { max: 70, aliquota: 0.0257 }, { max: 100, aliquota: 0.0257 }, { max: 150, aliquota: 0.0543 }, { max: 200, aliquota: 0.0693 }, { max: 300, aliquota: 0.0827 }, { max: 400, aliquota: 0.1174 }, { max: 500, aliquota: 0.1351 }, { max: null, aliquota: 0.1577 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0257 }, { max: 50, aliquota: 0.0257 }, { max: 70, aliquota: 0.0257 }, { max: 100, aliquota: 0.0257 }, { max: 150, aliquota: 0.0543 }, { max: 200, aliquota: 0.0693 }, { max: 300, aliquota: 0.0827 }, { max: 400, aliquota: 0.0931 }, { max: 500, aliquota: 0.1231 }, { max: null, aliquota: 0.1531 }],
        },
    },
    'PONTO BELO': {
        leis: ['467/2016'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.043 }, { max: 50, aliquota: 0.0546 }, { max: 70, aliquota: 0.0546 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1156 }, { max: 200, aliquota: 0.1536 }, { max: 300, aliquota: 0.1734 }, { max: 400, aliquota: 0.1915 }, { max: 500, aliquota: 0.2064 }, { max: null, aliquota: 0.2361 }],
            'INDUSTRIAL': [{ max: 30, aliquota: 0.043 }, { max: 50, aliquota: 0.0546 }, { max: 70, aliquota: 0.0546 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1156 }, { max: 200, aliquota: 0.1536 }, { max: 300, aliquota: 0.1734 }, { max: 400, aliquota: 0.1915 }, { max: 500, aliquota: 0.2064 }, { max: null, aliquota: 0.241 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0249 }, { max: 70, aliquota: 0.0348 }, { max: 100, aliquota: 0.0519 }, { max: 150, aliquota: 0.0744 }, { max: 200, aliquota: 0.1074 }, { max: 300, aliquota: 0.1323 }, { max: 400, aliquota: 0.175 }, { max: 500, aliquota: 0.2006 }, { max: null, aliquota: 0.241 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0249 }, { max: 100, aliquota: 0.0249 }, { max: 150, aliquota: 0.0414 }, { max: 180, aliquota: 0.048 }, { max: null, aliquota: 0.048 }],
        },
    },
    'PRESIDENTE KENNEDY': {
        leis: ['578/2002'],
        nota: 'Classes Isentas: PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.081 }, { max: 100, aliquota: 0.108 }, { max: 300, aliquota: 0.135 }, { max: 500, aliquota: 0.162 }, { max: null, aliquota: 0.1755 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.027 }, { max: 100, aliquota: 0.054 }, { max: 300, aliquota: 0.081 }, { max: 500, aliquota: 0.0945 }, { max: null, aliquota: 0.1008 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 80, aliquota: 0 }, { max: 100, aliquota: 0.027 }, { max: null, aliquota: 0.034 }],
        },
    },
    'RIO BANANAL': {
        leis: ['1358/2017'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.041 }, { max: 50, aliquota: 0.044 }, { max: 70, aliquota: 0.0649 }, { max: 100, aliquota: 0.0956 }, { max: 150, aliquota: 0.1169 }, { max: 200, aliquota: 0.1575 }, { max: 300, aliquota: 0.1857 }, { max: 400, aliquota: 0.209 }, { max: 500, aliquota: 0.2284 }, { max: null, aliquota: 0.2694 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0306 }, { max: 100, aliquota: 0.0456 }, { max: 150, aliquota: 0.0653 }, { max: 200, aliquota: 0.0956 }, { max: 300, aliquota: 0.1169 }, { max: 400, aliquota: 0.1575 }, { max: 500, aliquota: 0.1857 }, { max: null, aliquota: 0.209 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'RIO NOVO DO SUL': {
        leis: ['353/2008'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.04 }, { max: 50, aliquota: 0.05 }, { max: 70, aliquota: 0.075 }, { max: 100, aliquota: 0.09 }, { max: 150, aliquota: 0.12 }, { max: 200, aliquota: 0.15 }, { max: 300, aliquota: 0.175 }, { max: 400, aliquota: 0.2 }, { max: 500, aliquota: 0.22 }, { max: null, aliquota: 0.24 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.03 }, { max: 100, aliquota: 0.05 }, { max: 150, aliquota: 0.07 }, { max: 200, aliquota: 0.1 }, { max: 300, aliquota: 0.12 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.2 }, { max: null, aliquota: 0.24 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.02 }, { max: 100, aliquota: 0.03 }, { max: 150, aliquota: 0.04 }, { max: null, aliquota: 0.05 }],
        },
    },
    'SANTA MARIA DE JETIBA': {
        leis: ['698/2003'],
        nota: 'Classes Isentas: PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0259 }, { max: 70, aliquota: 0.0407 }, { max: 100, aliquota: 0.0554 }, { max: 150, aliquota: 0.0775 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1217 }, { max: 400, aliquota: 0.1365 }, { max: 500, aliquota: 0.1475 }, { max: null, aliquota: 0.1698 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0096 }, { max: 50, aliquota: 0.0096 }, { max: 70, aliquota: 0.0185 }, { max: 100, aliquota: 0.0259 }, { max: 150, aliquota: 0.05 }, { max: 200, aliquota: 0.0648 }, { max: 300, aliquota: 0.0794 }, { max: 400, aliquota: 0.1015 }, { max: 500, aliquota: 0.1309 }, { max: null, aliquota: 0.1383 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.004 }, { max: 50, aliquota: 0.004 }, { max: 70, aliquota: 0.004 }, { max: 100, aliquota: 0.004 }, { max: 150, aliquota: 0.004 }, { max: 200, aliquota: 0.004 }, { max: null, aliquota: 0.004 }],
        },
    },
    'SAO MATEUS': {
        leis: ['351/2005'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0831 }, { max: 150, aliquota: 0.1119 }, { max: 200, aliquota: 0.1676 }, { max: 300, aliquota: 0.181 }, { max: 400, aliquota: 0.1965 }, { max: 500, aliquota: 0.2335 }, { max: null, aliquota: 0.2413 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0658 }, { max: 150, aliquota: 0.087 }, { max: 200, aliquota: 0.0963 }, { max: 300, aliquota: 0.1069 }, { max: 400, aliquota: 0.1218 }, { max: 500, aliquota: 0.1276 }, { max: null, aliquota: 0.1364 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0188 }, { max: 150, aliquota: 0.0398 }, { max: 200, aliquota: 0.0596 }, { max: 300, aliquota: 0.0596 }, { max: 400, aliquota: 0.0596 }, { max: 500, aliquota: 0.0596 }, { max: null, aliquota: 0.0596 }],
        },
    },
    'SOORETAMA': {
        leis: ['070/2003'],
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.03 }, { max: 50, aliquota: 0.041 }, { max: 70, aliquota: 0.0608 }, { max: 100, aliquota: 0.0825 }, { max: 150, aliquota: 0.1035 }, { max: 200, aliquota: 0.1285 }, { max: 300, aliquota: 0.149 }, { max: 400, aliquota: 0.1705 }, { max: 500, aliquota: 0.1995 }, { max: null, aliquota: 0.221 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0113 }, { max: 100, aliquota: 0.025 }, { max: 150, aliquota: 0.045 }, { max: 200, aliquota: 0.0675 }, { max: 300, aliquota: 0.0825 }, { max: 400, aliquota: 0.1045 }, { max: 500, aliquota: 0.1215 }, { max: null, aliquota: 0.146 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0113 }, { max: 100, aliquota: 0.025 }, { max: 150, aliquota: 0.045 }, { max: 200, aliquota: 0.0675 }, { max: 300, aliquota: 0.0825 }, { max: 400, aliquota: 0.1045 }, { max: 500, aliquota: 0.1215 }, { max: null, aliquota: 0.146 }],
        },
    },
    'VARGEM ALTA': {
        leis: ['52/2018'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e PODER PUBLICO - MUNICIPAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 100, aliquota: 0.055 }, { max: 300, aliquota: 0.085 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.035 }, { max: 200, aliquota: 0.055 }, { max: 300, aliquota: 0.065 }, { max: 400, aliquota: 0.085 }, { max: 500, aliquota: 0.125 }, { max: null, aliquota: 0.17 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.035 }, { max: 200, aliquota: 0.055 }, { max: 300, aliquota: 0.065 }, { max: 400, aliquota: 0.085 }, { max: 500, aliquota: 0.125 }, { max: null, aliquota: 0.17 }],
            'RURAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.03 }, { max: 200, aliquota: 0.045 }, { max: 300, aliquota: 0.06 }, { max: 400, aliquota: 0.08 }, { max: 500, aliquota: 0.11 }, { max: null, aliquota: 0.14 }],
        },
    },
    'VENDA NOVA DO IMIGRANTE': {
        leis: ['1532/2022'],
        nota: 'Classes Isentas: PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e ENTIDADES FILANTRÓPICAS',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0364 }, { max: 50, aliquota: 0.0433 }, { max: 70, aliquota: 0.0631 }, { max: 100, aliquota: 0.0688 }, { max: 150, aliquota: 0.0777 }, { max: 200, aliquota: 0.0907 }, { max: 300, aliquota: 0.1028 }, { max: 400, aliquota: 0.1157 }, { max: 500, aliquota: 0.1328 }, { max: null, aliquota: 0.1576 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0116 }, { max: 50, aliquota: 0.0124 }, { max: 70, aliquota: 0.0253 }, { max: 100, aliquota: 0.0328 }, { max: 150, aliquota: 0.0433 }, { max: 200, aliquota: 0.0582 }, { max: 300, aliquota: 0.0712 }, { max: 400, aliquota: 0.0873 }, { max: 500, aliquota: 0.1028 }, { max: null, aliquota: 0.1157 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0105 }, { max: 50, aliquota: 0.0112 }, { max: 70, aliquota: 0.0229 }, { max: 100, aliquota: 0.0297 }, { max: 150, aliquota: 0.0393 }, { max: null, aliquota: 0.0528 }],
            'RURAL': [{ max: 100, aliquota: 0.0364 }, { max: 300, aliquota: 0.0433 }, { max: 500, aliquota: 0.0631 }, { max: null, aliquota: 0.07 }],
        },
    },
    'VIANA': {
        leis: ['2508/2012'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0425 }, { max: 50, aliquota: 0.0476 }, { max: 70, aliquota: 0.0841 }, { max: 100, aliquota: 0.0989 }, { max: 150, aliquota: 0.1212 }, { max: 200, aliquota: 0.1632 }, { max: 300, aliquota: 0.1907 }, { max: 400, aliquota: 0.2002 }, { max: 500, aliquota: 0.2189 }, { max: null, aliquota: 0.248 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0285 }, { max: 100, aliquota: 0.0427 }, { max: 150, aliquota: 0.0613 }, { max: 200, aliquota: 0.0989 }, { max: 300, aliquota: 0.1212 }, { max: 400, aliquota: 0.1509 }, { max: 500, aliquota: 0.1786 }, { max: null, aliquota: 0.2002 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0285 }, { max: 100, aliquota: 0.0427 }, { max: 150, aliquota: 0.0613 }, { max: 200, aliquota: 0.0989 }, { max: 300, aliquota: 0.1212 }, { max: 400, aliquota: 0.1509 }, { max: 500, aliquota: 0.1786 }, { max: null, aliquota: 0.2002 }],
        },
    },
    'VILA PAVAO': {
        leis: ['006/2002'],
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0632 }, { max: 70, aliquota: 0.1049 }, { max: 100, aliquota: 0.1235 }, { max: 150, aliquota: 0.1511 }, { max: 200, aliquota: 0.2073 }, { max: 300, aliquota: 0.24 }, { max: 400, aliquota: 0.27 }, { max: 500, aliquota: 0.2952 }, { max: null, aliquota: 0.329 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0068 }, { max: 70, aliquota: 0.0332 }, { max: 100, aliquota: 0.0497 }, { max: 150, aliquota: 0.0706 }, { max: 200, aliquota: 0.1215 }, { max: 300, aliquota: 0.1487 }, { max: 400, aliquota: 0.2003 }, { max: 500, aliquota: 0.2301 }, { max: null, aliquota: 0.2657 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0064 }, { max: 70, aliquota: 0.0077 }, { max: 100, aliquota: 0.009 }, { max: 150, aliquota: 0.0103 }, { max: null, aliquota: 0.011 }],
        },
    },
};
