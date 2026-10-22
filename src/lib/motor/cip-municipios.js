/**
 * CIP por município (EDP ES) - 70 municípios, tabela publicada pela EDP em
 * https://www.edp.com.br/tabela-de-calculo-cip/ (conferida em 22/10/2026) e
 * cruzada com a planilha da área "Atualização valores CIP no site Agosto 2026".
 *
 * Os dados são gerados por scripts/importar-cip-site.py + gerar-cip-municipios.py
 * - não edite o bloco de dados à mão. A planilha trazia 51 municípios; a página
 * traz 70 (faltavam Vitória, Serra, Vila Velha, Linhares, Cachoeiro de Itapemirim
 * e outros 14). Nos 51 em comum os números batem (a página arredonda a alíquota
 * em 4 casas, a planilha guarda mais - onde os dois coincidem ficou a da planilha).
 *
 * DOIS MÉTODOS DE CÁLCULO (GRUPO B / baixa tensão, o que este simulador cobre):
 *   - 'percentual' (51 municípios): CIP = alíquota da faixa de consumo (kWh
 *     faturado) x Tarifa B4a vigente;
 *   - 'fixo' (18 municípios, ex.: Vitória, Serra, Vila Velha): a prefeitura fixa
 *     o valor em R$ por faixa de consumo, sem depender da Tarifa B4a.
 *   - São José do Calçado fica de fora ('incompativel'): lá a CIP é um percentual
 *     sobre o VALOR DA FATURA, e este cálculo é por faixa de kWh - o campo de CIP
 *     segue manual nesse município.
 *
 * Cada município também tem as suas ISENÇÕES - a REGRA muda, não só o número:
 * o texto "Classes Isentas: ..." da página vira os flags isenta_rural,
 * isenta_irrigante (Alfredo Chaves isenta só o Rural Irrigante), isenta_ppf e
 * isenta_ppe. Isenção declarada vale mesmo se existir tabela da classe: em
 * Conceição da Barra a tabela de Rural vem sob o título "(ISENÇÃO PARA AS CLASSES
 * RURAL AGROPECUÁRIA, RURAL IRRIGAÇÃO E RURAL AQUICULTURA)" - não é cobrança.
 *
 * Inconsistências da própria página tratadas no gerador: classe "BAIXA RENDA"
 * (Alfredo Chaves) = RESIDENCIAL BAIXA RENDA; Fundão repete DEMAIS CLASSES no
 * grupo B com faixas de grupo A (1.000/5.000) - essas linhas são descartadas;
 * Cachoeiro de Itapemirim (sem coluna de grupo) foi transcrito à mão.
 *
 * Ressalvas que a planilha da área já sinalizava e NÃO foram resolvidas aqui:
 *   - ARACRUZ: "VERIFICAR!!! Lei 3870/2014 está isentando estas faixas do Baixa
 *     Renda. No CCS não está cadastrado." Pode estar cobrando Baixa Renda errado.
 *   - 'PODER PÚBLICO MUNICIPAL' é isento em muitos municípios, mas o formulário
 *     não tem categoria de Poder Público Municipal (só PPF e PPE).
 *   - Município sem tabela de Rural e sem isenção de Rural declarada: o Rural
 *     cai em DEMAIS CLASSES por falta de dado (aproximação, não regra confirmada).
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
 *  - B2RURAL/B2RUIRRG usam RURAL.
 *  - B3_PPF (Poder Público Federal) e B3_PPE (Estadual) usam DEMAIS CLASSES
 *    como ponto de partida, mas ficam isentas quando o município registrou
 *    isso (ver isenta_ppf/isenta_ppe em CIP_MUNICIPIOS_ES).
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
    if (cat.startsWith('B3_PPF') || cat.startsWith('B3PPF')) return 'PPF';
    if (cat.startsWith('B3_PPE') || cat.startsWith('B3PPE')) return 'PPE';
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
 * Calcula a CIP automática para um município do ES. Retorna null quando não há
 * dado suficiente (município não cadastrado, município 'incompativel', ou classe
 * sem faixas) - nesses casos o campo de CIP continua manual.
 *
 * Ordem de decisão:
 *   1. B4A/B4B: isento.
 *   2. RURAL: isenção declarada (isenta_rural; B2 irrigante também isenta_irrigante)
 *      -> 0, mesmo que exista tabela. PPF/PPE: isenta_ppf/isenta_ppe -> 0.
 *   3. Tabela de faixas da classe (percentual x Tarifa B4a, ou valor fixo em R$).
 *   4. Rural sem tabela e sem isenção declarada: DEMAIS CLASSES (aproximação).
 */
export function calcular_cip_municipio(municipio, categoria, consumo_kwh, data_leitura_anterior, data_leitura_atual) {
    const dados = CIP_MUNICIPIOS_ES[municipio];
    if (!dados || dados.incompativel) return null;
    const classe = classe_cip_por_categoria(categoria);
    if (classe === 'ISENTO') return 0;
    if (classe === 'RURAL') {
        const irrigante = (categoria || '').toUpperCase().startsWith('B2RUIRRG');
        if (irrigante ? dados.isenta_irrigante : dados.isenta_rural) return 0;
    }
    if (classe === 'PPF') { if (dados.isenta_ppf) return 0; return calcular_cip_municipio(municipio, 'B3', consumo_kwh, data_leitura_anterior, data_leitura_atual); }
    if (classe === 'PPE') { if (dados.isenta_ppe) return 0; return calcular_cip_municipio(municipio, 'B3', consumo_kwh, data_leitura_anterior, data_leitura_atual); }
    let faixas = dados.faixas[classe];
    if (!faixas && classe === 'RURAL') faixas = dados.faixas['DEMAIS CLASSES'];
    if (!faixas) return null;
    const faixa = resolver_faixa_cip(faixas, consumo_kwh || 0);
    if (!faixa) return null;
    if (faixa.isento) return 0;
    if (faixa.valor !== undefined) return Math.round(faixa.valor * 100) / 100;
    const tarifa = tarifa_b4a_vigente(data_leitura_anterior, data_leitura_atual);
    return Math.round(faixa.aliquota * tarifa * 100) / 100;
}

export const NOMES_MUNICIPIOS_ES = {
    'AFONSO CLAUDIO': 'Afonso Cláudio',
    'AGUA DOCE DO NORTE': 'Água Doce do Norte',
    'ALEGRE': 'Alegre',
    'ALFREDO CHAVES': 'Alfredo Chaves',
    'ANCHIETA': 'Anchieta',
    'APIACA': 'Apiacá',
    'ARACRUZ': 'Aracruz',
    'ATILIO VIVACQUA': 'Atílio Vivácqua',
    'BAIXO GUANDU': 'Baixo Guandu',
    'BARRA DE SAO FRANCISCO': 'Barra de São Francisco',
    'BOA ESPERANCA': 'Boa Esperança',
    'BOM JESUS DO NORTE': 'Bom Jesus do Norte',
    'BREJETUBA': 'Brejetuba',
    'CACHOEIRO DE ITAPEMIRIM': 'Cachoeiro de Itapemirim',
    'CARIACICA': 'Cariacica',
    'CASTELO': 'Castelo',
    'COLATINA': 'Colatina',
    'CONCEICAO DA BARRA': 'Conceição da Barra',
    'CONCEICAO DO CASTELO': 'Conceição do Castelo',
    'DIVINO DE SAO LOURENCO': 'Divino de São Lourenço',
    'DOMINGOS MARTINS': 'Domingos Martins',
    'DORES DO RIO PRETO': 'Dores do Rio Preto',
    'ECOPORONGA': 'Ecoporonga',
    'FUNDAO': 'Fundão',
    'GUACUI': 'Guaçuí',
    'GUARAPARI': 'Guarapari',
    'IBATIBA': 'Ibatiba',
    'IBIRACU': 'Ibiraçu',
    'IBITIRAMA': 'Ibitirama',
    'ICONHA': 'Iconha',
    'IRUPI': 'Irupi',
    'ITAGUACU': 'Itaguaçu',
    'ITAPEMIRIM': 'Itapemirim',
    'ITARANA': 'Itarana',
    'IUNA': 'Iúna',
    'JAGUARE': 'Jaguaré',
    'JERONIMO MONTEIRO': 'Jerônimo Monteiro',
    'JOAO NEIVA': 'João Neiva',
    'LARANJA DA TERRA': 'Laranja da Terra',
    'LINHARES': 'Linhares',
    'MANTENOPOLIS': 'Mantenópolis',
    'MARATAIZES': 'Marataízes',
    'MARECHAL FLORIANO': 'Marechal Floriano',
    'MIMOSO DO SUL': 'Mimoso do Sul',
    'MONTANHA': 'Montanha',
    'MUCURICI': 'Mucurici',
    'MUNIZ FREIRE': 'Muniz Freire',
    'MUQUI': 'Muqui',
    'NOVA VENECIA': 'Nova Venécia',
    'PEDRO CANARIO': 'Pedro Canário',
    'PINHEIROS': 'Pinheiros',
    'PIUMA': 'Piúma',
    'PONTO BELO': 'Ponto Belo',
    'PRESIDENTE KENNEDY': 'Presidente Kennedy',
    'RIO BANANAL': 'Rio Bananal',
    'RIO NOVO DO SUL': 'Rio Novo do Sul',
    'SANTA LEOPOLDINA': 'Santa Leopoldina',
    'SANTA MARIA DE JETIBA': 'Santa Maria do Jetibá',
    'SANTA TERESA': 'Santa Teresa',
    'SAO JOSE DO CALCADO': 'São José do Calçado',
    'SAO MATEUS': 'São Mateus',
    'SERRA': 'Serra',
    'SOORETAMA': 'Sooretama',
    'VARGEM ALTA': 'Vargem Alta',
    'VENDA NOVA DO IMIGRANTE': 'Venda Nova de Imigrante',
    'VIANA': 'Viana',
    'VILA PAVAO': 'Vila Pavão',
    'VILA VALERIO': 'Vila Valério',
    'VILA VELHA': 'Vila Velha',
    'VITORIA': 'Vitória',
};

export const MUNICIPIOS_ES_CIP = Object.keys(NOMES_MUNICIPIOS_ES);

export const CIP_MUNICIPIOS_ES = {
    'AFONSO CLAUDIO': {
        nome: 'Afonso Cláudio',
        metodo: 'percentual',
        lei: '1626/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - MUNICIPAL e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0309 }, { max: 70, aliquota: 0.0513 }, { max: 100, aliquota: 0.0604 }, { max: 150, aliquota: 0.0739 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1174 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1684 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0193 }, { max: 100, aliquota: 0.0288 }, { max: 150, aliquota: 0.0412 }, { max: 200, aliquota: 0.0604 }, { max: 300, aliquota: 0.0739 }, { max: 400, aliquota: 0.0996 }, { max: 500, aliquota: 0.1174 }, { max: null, aliquota: 0.1321 }],
        },
    },
    'AGUA DOCE DO NORTE': {
        nome: 'Água Doce do Norte',
        metodo: 'percentual',
        lei: '144/2021',
        vigencia: 'Março de 2022',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0609 }, { max: 50, aliquota: 0.0675 }, { max: 70, aliquota: 0.08855 }, { max: 100, aliquota: 0.1208 }, { max: 150, aliquota: 0.1546 }, { max: 200, aliquota: 0.1695 }, { max: 300, aliquota: 0.1869 }, { max: 400, aliquota: 0.1965 }, { max: 500, aliquota: 0.2052 }, { max: null, aliquota: 0.2173 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0184 }, { max: 50, aliquota: 0.0244 }, { max: 70, aliquota: 0.0366 }, { max: 100, aliquota: 0.0462 }, { max: 150, aliquota: 0.061 }, { max: 200, aliquota: 0.0855 }, { max: 300, aliquota: 0.1 }, { max: 400, aliquota: 0.1242 }, { max: 500, aliquota: 0.131 }, { max: null, aliquota: 0.1393 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0184 }, { max: 70, aliquota: 0.0244 }, { max: 100, aliquota: 0.0366 }, { max: 150, aliquota: 0.061 }, { max: 180, aliquota: 0.0823 }, { max: null, aliquota: 0.0823 }],
        },
    },
    'ALEGRE': {
        nome: 'Alegre',
        metodo: 'percentual',
        lei: '2582/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0394 }, { max: 50, aliquota: 0.0406 }, { max: 70, aliquota: 0.0706 }, { max: 100, aliquota: 0.0907 }, { max: 150, aliquota: 0.1338 }, { max: 200, aliquota: 0.1782 }, { max: 300, aliquota: 0.2296 }, { max: 400, aliquota: 0.2719 }, { max: 500, aliquota: 0.31 }, { max: null, aliquota: 0.3748 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0312 }, { max: 70, aliquota: 0.0352 }, { max: 100, aliquota: 0.0402 }, { max: 150, aliquota: 0.0501 }, { max: 200, aliquota: 0.0557 }, { max: 300, aliquota: 0.0928 }, { max: 400, aliquota: 0.1654 }, { max: 500, aliquota: 0.1939 }, { max: null, aliquota: 0.2181 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ALFREDO CHAVES': {
        nome: 'Alfredo Chaves',
        metodo: 'percentual',
        lei: '635/2017',
        vigencia: 'Março de 2018',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL IRRIGANTE',
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0459 }, { max: 50, aliquota: 0.0572 }, { max: 70, aliquota: 0.0893 }, { max: 100, aliquota: 0.1084 }, { max: 150, aliquota: 0.1339 }, { max: 200, aliquota: 0.1488 }, { max: 300, aliquota: 0.17 }, { max: 400, aliquota: 0.1913 }, { max: 500, aliquota: 0.2125 }, { max: null, aliquota: 0.2434 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0306 }, { max: 50, aliquota: 0.0363 }, { max: 70, aliquota: 0.0425 }, { max: 100, aliquota: 0.0529 }, { max: 150, aliquota: 0.0822 }, { max: 200, aliquota: 0.1204 }, { max: 300, aliquota: 0.1474 }, { max: 400, aliquota: 0.1655 }, { max: 500, aliquota: 0.1952 }, { max: null, aliquota: 0.2195 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0162 }, { max: 50, aliquota: 0.0165 }, { max: 70, aliquota: 0.0199 }, { max: 100, aliquota: 0.0232 }, { max: 150, aliquota: 0.0265 }, { max: 200, aliquota: 0.0298 }, { max: null, aliquota: 0.0331 }],
            'RURAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.0193 }, { max: 400, aliquota: 0.0712 }, { max: null, aliquota: 0.1494 }],
        },
    },
    'ANCHIETA': {
        nome: 'Anchieta',
        metodo: 'percentual',
        lei: '110/2021',
        vigencia: 'Fevereiro de 2022',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1305 }, { max: 150, aliquota: 0.1476 }, { max: 200, aliquota: 0.1623 }, { max: 300, aliquota: 0.1742 }, { max: 400, aliquota: 0.176 }, { max: 500, aliquota: 0.1774 }, { max: 750, aliquota: 0.1817 }, { max: null, aliquota: 0.2061 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0505 }, { max: 100, aliquota: 0.0669 }, { max: 150, aliquota: 0.0695 }, { max: 200, aliquota: 0.0852 }, { max: 300, aliquota: 0.0938 }, { max: 400, aliquota: 0.1156 }, { max: 500, aliquota: 0.1228 }, { max: null, aliquota: 0.1436 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0404 }, { max: null, aliquota: 0.0455 }],
        },
    },
    'APIACA': {
        nome: 'Apiacá',
        metodo: 'fixo',
        lei: '5125/2019',
        vigencia: 'Dezembro de 2019',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 14.48 }, { max: 50, valor: 14.48 }],
            'RESIDENCIAL': [{ max: 30, valor: 14.48 }, { max: 50, valor: 14.48 }, { max: 70, valor: 14.48 }, { max: 100, valor: 14.48 }, { max: 150, valor: 14.48 }, { max: 200, valor: 14.48 }, { max: 300, valor: 14.48 }, { max: 400, valor: 14.48 }, { max: 500, valor: 14.48 }, { max: null, valor: 14.48 }],
        },
    },
    'ARACRUZ': {
        nome: 'Aracruz',
        metodo: 'percentual',
        lei: '3870/2014',
        vigencia: 'Setembro de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1136 }, { max: 150, aliquota: 0.1766 }, { max: 200, aliquota: 0.193 }, { max: 300, aliquota: 0.2221 }, { max: 400, aliquota: 0.2423 }, { max: 500, aliquota: 0.2827 }, { max: null, aliquota: 0.3029 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0741 }, { max: 100, aliquota: 0.0808 }, { max: 150, aliquota: 0.1017 }, { max: 200, aliquota: 0.111 }, { max: 300, aliquota: 0.1295 }, { max: 400, aliquota: 0.1413 }, { max: 500, aliquota: 0.1531 }, { max: null, aliquota: 0.1766 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0 }, { max: 150, aliquota: 0 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ATILIO VIVACQUA': {
        nome: 'Atílio Vivácqua',
        metodo: 'percentual',
        lei: '583/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0519 }, { max: 50, aliquota: 0.0545 }, { max: 70, aliquota: 0.088 }, { max: 100, aliquota: 0.0924 }, { max: 150, aliquota: 0.1092 }, { max: 200, aliquota: 0.1218 }, { max: 300, aliquota: 0.136 }, { max: 400, aliquota: 0.1588 }, { max: 500, aliquota: 0.1745 }, { max: null, aliquota: 0.1978 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0311 }, { max: 70, aliquota: 0.0322 }, { max: 100, aliquota: 0.0517 }, { max: 150, aliquota: 0.0811 }, { max: 200, aliquota: 0.0959 }, { max: 300, aliquota: 0.1131 }, { max: 400, aliquota: 0.1287 }, { max: 500, aliquota: 0.1443 }, { max: null, aliquota: 0.1599 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'BAIXO GUANDU': {
        nome: 'Baixo Guandu',
        metodo: 'percentual',
        lei: '2.141/2002',
        vigencia: 'Julho de 2017',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.055 }, { max: 50, aliquota: 0.0562 }, { max: 70, aliquota: 0.1094 }, { max: 100, aliquota: 0.1277 }, { max: 150, aliquota: 0.1576 }, { max: 200, aliquota: 0.2125 }, { max: 300, aliquota: 0.2505 }, { max: 400, aliquota: 0.2819 }, { max: 500, aliquota: 0.308 }, { max: null, aliquota: 0.3489 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0333 }, { max: 50, aliquota: 0.0397 }, { max: 70, aliquota: 0.0583 }, { max: 100, aliquota: 0.0755 }, { max: 150, aliquota: 0.0829 }, { max: 200, aliquota: 0.1216 }, { max: 300, aliquota: 0.1576 }, { max: 400, aliquota: 0.2125 }, { max: null, aliquota: 0.2819 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0248 }, { max: 50, aliquota: 0.0265 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.0373 }, { max: 150, aliquota: 0.0426 }, { max: null, aliquota: 0.048 }],
        },
    },
    'BARRA DE SAO FRANCISCO': {
        nome: 'Barra de São Francisco',
        metodo: 'percentual',
        lei: '05/2004',
        vigencia: 'Fevereiro de 2005',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0172 }, { max: 70, aliquota: 0.0463 }, { max: 150, aliquota: 0.0702 }, { max: 300, aliquota: 0.0792 }, { max: 500, aliquota: 0.0896 }, { max: null, aliquota: 0.1046 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 70, aliquota: 0.0172 }, { max: 150, aliquota: 0.0444 }, { max: 300, aliquota: 0.053 }, { max: 500, aliquota: 0.0881 }, { max: null, aliquota: 0.1046 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 70, aliquota: 0 }, { max: 150, aliquota: 0.0444 }, { max: 180, aliquota: 0.0523 }, { max: null, aliquota: 0.0523 }],
        },
    },
    'BOA ESPERANCA': {
        nome: 'Boa Esperança',
        metodo: 'percentual',
        lei: '1191/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0367 }, { max: 50, aliquota: 0.0456 }, { max: 70, aliquota: 0.0639 }, { max: 100, aliquota: 0.0876 }, { max: 150, aliquota: 0.1042 }, { max: 200, aliquota: 0.1223 }, { max: 300, aliquota: 0.1689 }, { max: 400, aliquota: 0.2146 }, { max: 500, aliquota: 0.2621 }, { max: null, aliquota: 0.3025 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0216 }, { max: 50, aliquota: 0.0252 }, { max: 70, aliquota: 0.0273 }, { max: 100, aliquota: 0.0321 }, { max: 150, aliquota: 0.0439 }, { max: 200, aliquota: 0.0596 }, { max: 300, aliquota: 0.074 }, { max: 400, aliquota: 0.1174 }, { max: 500, aliquota: 0.1351 }, { max: null, aliquota: 0.1577 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0145 }, { max: 50, aliquota: 0.0154 }, { max: 70, aliquota: 0.0187 }, { max: 100, aliquota: 0.0217 }, { max: 150, aliquota: 0.0248 }, { max: null, aliquota: 0.028 }],
        },
    },
    'BOM JESUS DO NORTE': {
        nome: 'Bom Jesus do Norte',
        metodo: 'fixo',
        lei: '006/2017',
        vigencia: 'Dezembro de 2017',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 10.92 }, { max: 50, valor: 11.41 }, { max: 70, valor: 14.63 }, { max: 100, valor: 16.03 }, { max: 150, valor: 17.99 }, { max: 200, valor: 19.74 }, { max: 300, valor: 22.19 }, { max: 400, valor: 23.73 }, { max: 500, valor: 25.06 }, { max: null, valor: 27.79 }],
            'RESIDENCIAL': [{ max: 79, valor: 0 }, { max: 100, valor: 8.33 }, { max: 150, valor: 11.13 }, { max: 200, valor: 11.97 }, { max: 300, valor: 13.85 }, { max: 400, valor: 14.77 }, { max: 500, valor: 15.61 }, { max: null, valor: 16.73 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 79, valor: 0 }, { max: 100, valor: 8.33 }, { max: 150, valor: 11.13 }, { max: 200, valor: 11.97 }, { max: 300, valor: 13.85 }, { max: 400, valor: 14.77 }, { max: 500, valor: 15.61 }, { max: null, valor: 16.73 }],
        },
    },
    'BREJETUBA': {
        nome: 'Brejetuba',
        metodo: 'percentual',
        lei: '235/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0319 }, { max: 50, aliquota: 0.038 }, { max: 70, aliquota: 0.0631 }, { max: 100, aliquota: 0.0743 }, { max: 150, aliquota: 0.0909 }, { max: 200, aliquota: 0.1225 }, { max: 300, aliquota: 0.1444 }, { max: 400, aliquota: 0.1624 }, { max: 500, aliquota: 0.1776 }, { max: null, aliquota: 0.2071 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0107 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0237 }, { max: 100, aliquota: 0.0354 }, { max: 150, aliquota: 0.0507 }, { max: 200, aliquota: 0.0743 }, { max: 300, aliquota: 0.0909 }, { max: 400, aliquota: 0.1225 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1624 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0107 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0237 }, { max: 100, aliquota: 0.0354 }, { max: 150, aliquota: 0.0507 }, { max: 200, aliquota: 0.0743 }, { max: 300, aliquota: 0.0909 }, { max: 400, aliquota: 0.1225 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1624 }],
        },
    },
    'CACHOEIRO DE ITAPEMIRIM': {
        nome: 'Cachoeiro de Itapemirim',
        metodo: 'fixo',
        lei: '7.800/2019',
        vigencia: 'Janeiro de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - MUNICIPAL e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 70, valor: 13.64 }, { max: 150, valor: 27.27 }, { max: 300, valor: 40.91 }, { max: 500, valor: 54.54 }, { max: 1000, valor: 68.18 }, { max: 3000, valor: 109.08 }, { max: 5000, valor: 190.89 }, { max: null, valor: 272.7 }],
            'RESIDENCIAL': [{ max: 70, valor: 0 }, { max: 150, valor: 8.18 }, { max: 300, valor: 24.54 }, { max: 500, valor: 38.18 }, { max: 1000, valor: 46.36 }, { max: 3000, valor: 54.54 }, { max: 5000, valor: 81.81 }, { max: null, valor: 136.35 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 70, valor: 0 }, { max: 150, valor: 8.18 }, { max: 300, valor: 24.54 }, { max: 500, valor: 38.18 }, { max: 1000, valor: 46.36 }, { max: 3000, valor: 54.54 }, { max: 5000, valor: 81.81 }, { max: null, valor: 136.35 }],
        },
    },
    'CARIACICA': {
        nome: 'Cariacica',
        metodo: 'percentual',
        lei: '4376/2006',
        vigencia: 'Janeiro de 2021',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO- AES, CONSUMO PROPRIO, ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - MUNICIPAL, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0427 }, { max: 50, aliquota: 0.043 }, { max: 70, aliquota: 0.0615 }, { max: 100, aliquota: 0.0931 }, { max: 150, aliquota: 0.1112 }, { max: 200, aliquota: 0.1238 }, { max: 300, aliquota: 0.1378 }, { max: 400, aliquota: 0.1433 }, { max: 500, aliquota: 0.1506 }, { max: null, aliquota: 0.1551 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0212 }, { max: 70, aliquota: 0.0283 }, { max: 100, aliquota: 0.0357 }, { max: 150, aliquota: 0.0444 }, { max: 200, aliquota: 0.0715 }, { max: 300, aliquota: 0.0984 }, { max: 400, aliquota: 0.0999 }, { max: 500, aliquota: 0.1012 }, { max: null, aliquota: 0.1025 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0131 }, { max: 50, aliquota: 0.014 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0196 }, { max: 150, aliquota: 0.0224 }, { max: 200, aliquota: 0.0252 }, { max: 300, aliquota: 0.0252 }, { max: 400, aliquota: 0.0252 }, { max: 500, aliquota: 0.0252 }, { max: null, aliquota: 0.0252 }],
        },
    },
    'CASTELO': {
        nome: 'Castelo',
        metodo: 'percentual',
        lei: '3131/2011',
        vigencia: 'Fevereiro de 2012',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.01988 }, { max: 50, aliquota: 0.02373 }, { max: 70, aliquota: 0.03941 }, { max: 100, aliquota: 0.04641 }, { max: 150, aliquota: 0.0567 }, { max: 200, aliquota: 0.07651 }, { max: 300, aliquota: 0.09016 }, { max: 400, aliquota: 0.09128 }, { max: 500, aliquota: 0.09975 }, { max: null, aliquota: 0.126 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.01715 }, { max: 70, aliquota: 0.01827 }, { max: 100, aliquota: 0.0273 }, { max: 150, aliquota: 0.03934 }, { max: 200, aliquota: 0.05754 }, { max: 300, aliquota: 0.07 }, { max: 400, aliquota: 0.0945 }, { max: 500, aliquota: 0.112 }, { max: null, aliquota: 0.126 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.00875 }, { max: 70, aliquota: 0.0105 }, { max: 100, aliquota: 0.0119 }, { max: 150, aliquota: 0.01225 }, { max: 180, aliquota: 0.01365 }, { max: null, aliquota: 0.01365 }],
        },
    },
    'COLATINA': {
        nome: 'Colatina',
        metodo: 'percentual',
        lei: '4813/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA',
        faixas: {
            'DEMAIS CLASSES': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 800, aliquota: 0.08 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 40, aliquota: 0.03 }, { max: 100, aliquota: 0.043 }, { max: 200, aliquota: 0.06 }, { max: 500, aliquota: 0.07 }, { max: 800, aliquota: 0.08 }, { max: 1200, aliquota: 0.09 }, { max: null, aliquota: 0.1 }],
        },
    },
    'CONCEICAO DA BARRA': {
        nome: 'Conceição da Barra',
        metodo: 'percentual',
        lei: '2.806/2018',
        vigencia: 'Janeiro de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - MUNICIPAL e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.058 }, { max: 50, aliquota: 0.072 }, { max: 70, aliquota: 0.087 }, { max: 100, aliquota: 0.114 }, { max: 150, aliquota: 0.142 }, { max: 200, aliquota: 0.172 }, { max: 300, aliquota: 0.198 }, { max: 400, aliquota: 0.225 }, { max: 500, aliquota: 0.252 }, { max: null, aliquota: 0.286 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.044 }, { max: 70, aliquota: 0.052 }, { max: 100, aliquota: 0.065 }, { max: 150, aliquota: 0.087 }, { max: 200, aliquota: 0.114 }, { max: 300, aliquota: 0.143 }, { max: 400, aliquota: 0.172 }, { max: 500, aliquota: 0.198 }, { max: null, aliquota: 0.225 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.025 }, { max: 70, aliquota: 0.035 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.055 }, { max: 200, aliquota: 0.065 }, { max: 300, aliquota: 0.075 }, { max: 400, aliquota: 0.087 }, { max: 500, aliquota: 0.098 }, { max: null, aliquota: 0.115 }],
        },
    },
    'CONCEICAO DO CASTELO': {
        nome: 'Conceição do Castelo',
        metodo: 'percentual',
        lei: '1034/2005',
        vigencia: 'Abril de 2006',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.035 }, { max: 50, aliquota: 0.04 }, { max: 70, aliquota: 0.05 }, { max: 100, aliquota: 0.055 }, { max: 150, aliquota: 0.07 }, { max: 200, aliquota: 0.09 }, { max: 300, aliquota: 0.095 }, { max: 400, aliquota: 0.1 }, { max: 500, aliquota: 0.12 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.015 }, { max: 70, aliquota: 0.02 }, { max: 100, aliquota: 0.03 }, { max: 150, aliquota: 0.04 }, { max: 200, aliquota: 0.05 }, { max: 300, aliquota: 0.06 }, { max: 400, aliquota: 0.07 }, { max: 500, aliquota: 0.08 }, { max: null, aliquota: 0.1 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.01 }, { max: 70, aliquota: 0.015 }, { max: 100, aliquota: 0.02 }, { max: 150, aliquota: 0.025 }, { max: 200, aliquota: 0.03 }, { max: 300, aliquota: 0.035 }, { max: 400, aliquota: 0.04 }, { max: 500, aliquota: 0.05 }, { max: null, aliquota: 0.1 }],
        },
    },
    'DIVINO DE SAO LOURENCO': {
        nome: 'Divino de São Lourenço',
        metodo: 'percentual',
        lei: '124/2002',
        vigencia: 'Março de 2018',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0512 }, { max: 50, aliquota: 0.0541 }, { max: 70, aliquota: 0.0902 }, { max: 100, aliquota: 0.1312 }, { max: 150, aliquota: 0.1536 }, { max: 200, aliquota: 0.1706 }, { max: 300, aliquota: 0.1929 }, { max: 400, aliquota: 0.2104 }, { max: 500, aliquota: 0.2367 }, { max: null, aliquota: 0.2454 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0151 }, { max: 50, aliquota: 0.0178 }, { max: 70, aliquota: 0.0332 }, { max: 100, aliquota: 0.0497 }, { max: 150, aliquota: 0.0787 }, { max: 200, aliquota: 0.0809 }, { max: 300, aliquota: 0.1005 }, { max: 400, aliquota: 0.1128 }, { max: 500, aliquota: 0.1231 }, { max: null, aliquota: 0.1538 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'DOMINGOS MARTINS': {
        nome: 'Domingos Martins',
        metodo: 'fixo',
        lei: '3337/2018',
        vigencia: 'Março de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 8.81 }, { max: 50, valor: 10.51 }, { max: 70, valor: 17.32 }, { max: 100, valor: 19.85 }, { max: 150, valor: 24.74 }, { max: 200, valor: 32.1 }, { max: 300, valor: 36.03 }, { max: 400, valor: 39.52 }, { max: 500, valor: 42 }, { max: null, valor: 46.98 }],
            'RESIDENCIAL': [{ max: 30, valor: 2.1 }, { max: 50, valor: 2.2 }, { max: 70, valor: 6.83 }, { max: 100, valor: 9.71 }, { max: 150, valor: 13.92 }, { max: 200, valor: 19.85 }, { max: 300, valor: 24.83 }, { max: 400, valor: 32.1 }, { max: 500, valor: 36.03 }, { max: null, valor: 39.43 }],
        },
    },
    'DORES DO RIO PRETO': {
        nome: 'Dores do Rio Preto',
        metodo: 'percentual',
        lei: '1078/2025',
        vigencia: 'Junho de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0409 }, { max: 50, aliquota: 0.0421 }, { max: 70, aliquota: 0.0494 }, { max: 100, aliquota: 0.0688 }, { max: 150, aliquota: 0.086 }, { max: 200, aliquota: 0.1025 }, { max: 300, aliquota: 0.1289 }, { max: 400, aliquota: 0.145 }, { max: 500, aliquota: 0.1587 }, { max: null, aliquota: 0.1869 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0034 }, { max: 50, aliquota: 0.0038 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0253 }, { max: 150, aliquota: 0.0363 }, { max: 200, aliquota: 0.053 }, { max: 300, aliquota: 0.099 }, { max: 400, aliquota: 0.1177 }, { max: 500, aliquota: 0.1307 }, { max: null, aliquota: 0.198 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0034 }, { max: 50, aliquota: 0.0038 }, { max: 70, aliquota: 0.0169 }, { max: 100, aliquota: 0.0253 }, { max: 150, aliquota: 0.0363 }, { max: 200, aliquota: 0.053 }, { max: 300, aliquota: 0.099 }, { max: 400, aliquota: 0.1177 }, { max: 500, aliquota: 0.1307 }, { max: null, aliquota: 0.198 }],
        },
    },
    'ECOPORONGA': {
        nome: 'Ecoporonga',
        metodo: 'fixo',
        lei: '1109/2004',
        vigencia: 'Novembro de 2015',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'RESIDENCIAL': [{ max: 30, valor: 0 }, { max: 50, valor: 0 }, { max: 70, valor: 6.38 }, { max: 100, valor: 6.38 }, { max: 150, valor: 6.38 }, { max: 200, valor: 6.38 }, { max: 300, valor: 6.38 }, { max: 400, valor: 6.38 }, { max: 500, valor: 6.38 }, { max: null, valor: 6.38 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, valor: 0 }, { max: 30, valor: 0 }, { max: 50, valor: 0 }, { max: 50, valor: 0 }, { max: 70, valor: 6.39 }, { max: 70, valor: 9.58 }, { max: 100, valor: 6.39 }, { max: 100, valor: 9.58 }, { max: 150, valor: 6.39 }, { max: 150, valor: 9.58 }, { max: 200, valor: 6.39 }, { max: 200, valor: 6.39 }, { max: 200, valor: 9.58 }, { max: 300, valor: 9.58 }, { max: 400, valor: 6.39 }, { max: 400, valor: 9.58 }, { max: 500, valor: 6.39 }, { max: 500, valor: 9.58 }, { max: null, valor: 6.39 }, { max: null, valor: 9.58 }],
        },
    },
    'FUNDAO': {
        nome: 'Fundão',
        metodo: 'percentual',
        lei: '1372/2022',
        vigencia: 'Janeiro de 2023',
        nota: 'Classes Isentas: PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.038 }, { max: 50, aliquota: 0.045 }, { max: 70, aliquota: 0.075 }, { max: 100, aliquota: 0.097 }, { max: 150, aliquota: 0.119 }, { max: 200, aliquota: 0.1685 }, { max: 300, aliquota: 0.189 }, { max: 400, aliquota: 0.195 }, { max: 500, aliquota: 0.21 }, { max: null, aliquota: 0.238 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.0275 }, { max: 70, aliquota: 0.041 }, { max: 100, aliquota: 0.0615 }, { max: 150, aliquota: 0.0735 }, { max: 200, aliquota: 0.1075 }, { max: 300, aliquota: 0.1315 }, { max: 400, aliquota: 0.177 }, { max: 500, aliquota: 0.2085 }, { max: null, aliquota: 0.2345 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0205 }, { max: 100, aliquota: 0.024 }, { max: 150, aliquota: 0.0275 }, { max: null, aliquota: 0.031 }],
        },
    },
    'GUACUI': {
        nome: 'Guaçuí',
        metodo: 'percentual',
        lei: '3061/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0208 }, { max: 50, aliquota: 0.0248 }, { max: 70, aliquota: 0.0411 }, { max: 100, aliquota: 0.0484 }, { max: 150, aliquota: 0.0592 }, { max: 200, aliquota: 0.0798 }, { max: 300, aliquota: 0.0941 }, { max: 400, aliquota: 0.1058 }, { max: 500, aliquota: 0.1157 }, { max: null, aliquota: 0.1311 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0154 }, { max: 100, aliquota: 0.0231 }, { max: 150, aliquota: 0.0331 }, { max: 200, aliquota: 0.0484 }, { max: 300, aliquota: 0.0592 }, { max: 400, aliquota: 0.0798 }, { max: 500, aliquota: 0.0941 }, { max: null, aliquota: 0.1058 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0115 }, { max: 70, aliquota: 0.0154 }, { max: 100, aliquota: 0.0231 }, { max: 150, aliquota: 0.0331 }, { max: 200, aliquota: 0.0484 }, { max: 300, aliquota: 0.0592 }, { max: 400, aliquota: 0.0798 }, { max: 500, aliquota: 0.0941 }, { max: null, aliquota: 0.1058 }],
        },
    },
    'GUARAPARI': {
        nome: 'Guarapari',
        metodo: 'percentual',
        lei: '2370/2004',
        vigencia: 'Dezembro de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0502 }, { max: 50, aliquota: 0.0516 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.08 }, { max: 150, aliquota: 0.1 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.14 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.18 }, { max: null, aliquota: 0.2 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0498 }, { max: 50, aliquota: 0.0511 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.07 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.11 }, { max: 300, aliquota: 0.13 }, { max: 400, aliquota: 0.15 }, { max: 500, aliquota: 0.17 }, { max: null, aliquota: 0.19 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: null, aliquota: 0.0145 }],
            'RURAL': [{ max: 30, aliquota: 0.0502 }, { max: 50, aliquota: 0.0516 }, { max: 70, aliquota: 0.06 }, { max: 100, aliquota: 0.08 }, { max: 150, aliquota: 0.1 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.14 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.18 }, { max: null, aliquota: 0.2 }],
        },
    },
    'IBATIBA': {
        nome: 'Ibatiba',
        metodo: 'percentual',
        lei: '417/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0.0473 }, { max: 70, aliquota: 0.0521 }, { max: 100, aliquota: 0.0568 }, { max: 150, aliquota: 0.0662 }, { max: 200, aliquota: 0.0815 }, { max: 300, aliquota: 0.1036 }, { max: 400, aliquota: 0.1091 }, { max: 500, aliquota: 0.1145 }, { max: null, aliquota: 0.12 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0464 }, { max: 200, aliquota: 0.0481 }, { max: 300, aliquota: 0.0568 }, { max: 400, aliquota: 0.0615 }, { max: 500, aliquota: 0.0663 }, { max: null, aliquota: 0.071 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.032 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0464 }, { max: 200, aliquota: 0.0481 }, { max: 300, aliquota: 0.0568 }, { max: 400, aliquota: 0.0615 }, { max: 500, aliquota: 0.0663 }, { max: null, aliquota: 0.071 }],
        },
    },
    'IBIRACU': {
        nome: 'Ibiraçu',
        metodo: 'percentual',
        lei: '2743/2006',
        vigencia: 'Setembro de 2004',
        nota: 'Classes Isentas: PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.04 }, { max: 70, aliquota: 0.067 }, { max: 100, aliquota: 0.0885 }, { max: 150, aliquota: 0.1083 }, { max: 200, aliquota: 0.146 }, { max: 300, aliquota: 0.172 }, { max: 400, aliquota: 0.176 }, { max: 500, aliquota: 0.1925 }, { max: null, aliquota: 0.218 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0237 }, { max: 70, aliquota: 0.0308 }, { max: 100, aliquota: 0.046 }, { max: 150, aliquota: 0.055 }, { max: 200, aliquota: 0.0805 }, { max: 300, aliquota: 0.0985 }, { max: 400, aliquota: 0.1326 }, { max: 500, aliquota: 0.1563 }, { max: null, aliquota: 0.1758 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0175 }, { max: 100, aliquota: 0.0205 }, { max: 150, aliquota: 0.0233 }, { max: null, aliquota: 0.0262 }],
        },
    },
    'IBITIRAMA': {
        nome: 'Ibitirama',
        metodo: 'percentual',
        lei: '452/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0786 }, { max: 50, aliquota: 0.0917 }, { max: 70, aliquota: 0.0935 }, { max: 100, aliquota: 0.0963 }, { max: 150, aliquota: 0.1043 }, { max: 200, aliquota: 0.1048 }, { max: 300, aliquota: 0.1161 }, { max: 400, aliquota: 0.1173 }, { max: 500, aliquota: 0.1179 }, { max: null, aliquota: 0.132 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0272 }, { max: 50, aliquota: 0.0311 }, { max: 70, aliquota: 0.035 }, { max: 100, aliquota: 0.04 }, { max: 150, aliquota: 0.0589 }, { max: 200, aliquota: 0.0654 }, { max: 300, aliquota: 0.0786 }, { max: 400, aliquota: 0.0794 }, { max: 500, aliquota: 0.0817 }, { max: null, aliquota: 0.0888 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0182 }, { max: 50, aliquota: 0.0193 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'ICONHA': {
        nome: 'Iconha',
        metodo: 'percentual',
        lei: '038/2017',
        vigencia: 'Abril de 2018',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e PODER PÚBLICO - MUNICIPAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0501 }, { max: 70, aliquota: 0.0666 }, { max: 100, aliquota: 0.0979 }, { max: 150, aliquota: 0.1293 }, { max: 200, aliquota: 0.1606 }, { max: 300, aliquota: 0.192 }, { max: 400, aliquota: 0.276 }, { max: 500, aliquota: 0.336 }, { max: null, aliquota: 0.396 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.024 }, { max: 100, aliquota: 0.048 }, { max: 150, aliquota: 0.084 }, { max: 200, aliquota: 0.108 }, { max: 300, aliquota: 0.132 }, { max: 400, aliquota: 0.204 }, { max: 500, aliquota: 0.24 }, { max: null, aliquota: 0.276 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 80, aliquota: 0 }, { max: 100, aliquota: 0.0159 }, { max: 150, aliquota: 0.03 }, { max: 180, aliquota: 0.036 }, { max: null, aliquota: 0.042 }],
            'RURAL': [{ max: 30, aliquota: 0.024 }, { max: 100, aliquota: 0.048 }, { max: 150, aliquota: 0.084 }, { max: 200, aliquota: 0.108 }, { max: 300, aliquota: 0.132 }, { max: 400, aliquota: 0.204 }, { max: 500, aliquota: 0.24 }, { max: null, aliquota: 0.276 }],
        },
    },
    'IRUPI': {
        nome: 'Irupi',
        metodo: 'percentual',
        lei: '012/2025',
        vigencia: 'Janeiro de 2026',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA',
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0309 }, { max: 70, aliquota: 0.0513 }, { max: 100, aliquota: 0.0604 }, { max: 150, aliquota: 0.0739 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1174 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1444 }, { max: null, aliquota: 0.1684 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.0193 }, { max: 100, aliquota: 0.0288 }, { max: 150, aliquota: 0.0412 }, { max: 200, aliquota: 0.0604 }, { max: 300, aliquota: 0.0739 }, { max: 400, aliquota: 0.0996 }, { max: 500, aliquota: 0.1174 }, { max: null, aliquota: 0.1321 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0073 }, { max: 50, aliquota: 0.0077 }, { max: 70, aliquota: 0.0094 }, { max: null, aliquota: 0.0109 }],
        },
    },
    'ITAGUACU': {
        nome: 'Itaguaçu',
        metodo: 'percentual',
        lei: '800/1998',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0306 }, { max: 50, aliquota: 0.0365 }, { max: 70, aliquota: 0.0606 }, { max: 100, aliquota: 0.0714 }, { max: 150, aliquota: 0.0883 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1386 }, { max: 400, aliquota: 0.156 }, { max: 500, aliquota: 0.1705 }, { max: null, aliquota: 0.1931 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.013 }, { max: 50, aliquota: 0.0138 }, { max: 70, aliquota: 0.0228 }, { max: 100, aliquota: 0.034 }, { max: 150, aliquota: 0.0488 }, { max: 200, aliquota: 0.0714 }, { max: 300, aliquota: 0.0873 }, { max: 400, aliquota: 0.1175 }, { max: 500, aliquota: 0.1386 }, { max: null, aliquota: 0.156 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.013 }, { max: 50, aliquota: 0.0138 }, { max: 70, aliquota: 0.0228 }, { max: 100, aliquota: 0.034 }, { max: 150, aliquota: 0.0488 }, { max: null, aliquota: 0.0714 }],
        },
    },
    'ITAPEMIRIM': {
        nome: 'Itapemirim',
        metodo: 'percentual',
        lei: '1718/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0654 }, { max: 100, aliquota: 0.0916 }, { max: 200, aliquota: 0.1177 }, { max: null, aliquota: 0.1439 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0131 }, { max: 100, aliquota: 0.0262 }, { max: 200, aliquota: 0.0523 }, { max: null, aliquota: 0.0785 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0131 }, { max: 100, aliquota: 0.0262 }, { max: 200, aliquota: 0.0523 }, { max: null, aliquota: 0.0785 }],
        },
    },
    'ITARANA': {
        nome: 'Itarana',
        metodo: 'fixo',
        lei: '1105/2018',
        vigencia: 'Março de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 15.12 }, { max: 50, valor: 15.99 }, { max: 70, valor: 25.73 }, { max: 100, valor: 34.2 }, { max: 150, valor: 38.5 }, { max: 200, valor: 45.8 }, { max: 300, valor: 60.86 }, { max: 400, valor: 66.65 }, { max: 500, valor: 72.52 }, { max: null, valor: 78.61 }],
            'RESIDENCIAL': [{ max: 50, valor: 3.22 }, { max: 70, valor: 3.4 }, { max: 100, valor: 9.68 }, { max: 150, valor: 15.43 }, { max: 200, valor: 24.09 }, { max: 300, valor: 27.46 }, { max: 400, valor: 34.02 }, { max: 500, valor: 48.15 }, { max: null, valor: 52.23 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, valor: 3.22 }, { max: 70, valor: 3.4 }, { max: 100, valor: 9.68 }, { max: 150, valor: 15.43 }, { max: 200, valor: 24.09 }, { max: 300, valor: 27.46 }, { max: 400, valor: 34.02 }, { max: 500, valor: 48.15 }, { max: null, valor: 52.23 }],
        },
    },
    'IUNA': {
        nome: 'Iúna',
        metodo: 'fixo',
        lei: '1847/2002',
        vigencia: 'Julho de 2003',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 29, valor: 0 }, { max: 49, valor: 3.27 }, { max: 69, valor: 3.9 }, { max: 99, valor: 6.47 }, { max: 149, valor: 7.61 }, { max: 199, valor: 9.32 }, { max: 299, valor: 12.56 }, { max: 399, valor: 18.55 }, { max: 499, valor: 20.87 }, { max: null, valor: 22.83 }],
            'RESIDENCIAL': [{ max: 69, valor: 0 }, { max: 99, valor: 2.87 }, { max: 149, valor: 4.55 }, { max: 199, valor: 6.52 }, { max: 299, valor: 9.54 }, { max: 399, valor: 11.69 }, { max: 499, valor: 15.75 }, { max: null, valor: 18.55 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 69, valor: 0 }, { max: 99, valor: 2.87 }, { max: 149, valor: 4.55 }, { max: 199, valor: 6.52 }, { max: 299, valor: 9.54 }, { max: 399, valor: 11.69 }, { max: 499, valor: 15.75 }, { max: null, valor: 18.55 }],
        },
    },
    'JAGUARE': {
        nome: 'Jaguaré',
        metodo: 'percentual',
        lei: '680/2006',
        vigencia: 'Agosto de 2017',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO -AES, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0285 }, { max: 50, aliquota: 0.034 }, { max: 70, aliquota: 0.0565 }, { max: 100, aliquota: 0.0665 }, { max: 150, aliquota: 0.0814 }, { max: 200, aliquota: 0.1096 }, { max: 300, aliquota: 0.1292 }, { max: 400, aliquota: 0.1453 }, { max: 500, aliquota: 0.1589 }, { max: null, aliquota: 0.18 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0212 }, { max: 100, aliquota: 0.0317 }, { max: 150, aliquota: 0.0454 }, { max: 200, aliquota: 0.0665 }, { max: 300, aliquota: 0.0814 }, { max: 400, aliquota: 0.1096 }, { max: 500, aliquota: 0.1292 }, { max: null, aliquota: 0.1453 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0212 }, { max: 100, aliquota: 0.0317 }, { max: 150, aliquota: 0.0454 }, { max: 200, aliquota: 0.0665 }, { max: 300, aliquota: 0.0814 }, { max: 400, aliquota: 0.1096 }, { max: 500, aliquota: 0.1292 }, { max: null, aliquota: 0.1453 }],
        },
    },
    'JERONIMO MONTEIRO': {
        nome: 'Jerônimo Monteiro',
        metodo: 'fixo',
        lei: '1060/2003',
        vigencia: 'Março de 2016',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 9.54 }, { max: 50, valor: 10.81 }, { max: 70, valor: 17.75 }, { max: 100, valor: 23.67 }, { max: 150, valor: 28.97 }, { max: 200, valor: 39.04 }, { max: 220, valor: 42.93 }, { max: 300, valor: 46 }, { max: 400, valor: 51.73 }, { max: 500, valor: 56.58 }, { max: null, valor: 64.11 }],
            'RESIDENCIAL': [{ max: 30, valor: 0 }, { max: 50, valor: 0 }, { max: 70, valor: 0 }, { max: 100, valor: 8.5 }, { max: 150, valor: 12.92 }, { max: 200, valor: 18.93 }, { max: 220, valor: 28.97 }, { max: 300, valor: 39.04 }, { max: 400, valor: 46 }, { max: 500, valor: 51.73 }, { max: null, valor: 58.53 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, valor: 0 }, { max: 50, valor: 0 }, { max: 70, valor: 0 }, { max: 100, valor: 5.62 }, { max: 150, valor: 6.23 }, { max: 200, valor: 7.16 }, { max: null, valor: 7.8 }],
        },
    },
    'JOAO NEIVA': {
        nome: 'João Neiva',
        metodo: 'percentual',
        lei: '3827/2025',
        vigencia: 'Abril de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0505 }, { max: 50, aliquota: 0.053 }, { max: 70, aliquota: 0.0849 }, { max: 100, aliquota: 0.1136 }, { max: 150, aliquota: 0.152 }, { max: 200, aliquota: 0.193 }, { max: 300, aliquota: 0.2221 }, { max: 400, aliquota: 0.2423 }, { max: 500, aliquota: 0.2527 }, { max: null, aliquota: 0.2829 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0271 }, { max: 50, aliquota: 0.0404 }, { max: 70, aliquota: 0.0465 }, { max: 100, aliquota: 0.0795 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.1201 }, { max: 300, aliquota: 0.142 }, { max: 400, aliquota: 0.149 }, { max: 500, aliquota: 0.1531 }, { max: null, aliquota: 0.1766 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0235 }, { max: 100, aliquota: 0.0275 }, { max: 150, aliquota: 0.0313 }, { max: 180, aliquota: 0.0354 }, { max: null, aliquota: 0.0404 }],
        },
    },
    'LARANJA DA TERRA': {
        nome: 'Laranja da Terra',
        metodo: 'percentual',
        lei: '372/2003',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0335 }, { max: 50, aliquota: 0.0385 }, { max: 70, aliquota: 0.0415 }, { max: 100, aliquota: 0.0595 }, { max: 150, aliquota: 0.0755 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1285 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1885 }, { max: 600, aliquota: 0.1885 }, { max: 700, aliquota: 0.2185 }, { max: 800, aliquota: 0.2215 }, { max: 900, aliquota: 0.2385 }, { max: null, aliquota: 0.2465 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0335 }, { max: 50, aliquota: 0.0385 }, { max: 70, aliquota: 0.0415 }, { max: 100, aliquota: 0.0595 }, { max: 150, aliquota: 0.0755 }, { max: 200, aliquota: 0.1175 }, { max: 300, aliquota: 0.1285 }, { max: 400, aliquota: 0.1321 }, { max: 500, aliquota: 0.1885 }, { max: 600, aliquota: 0.1885 }, { max: 700, aliquota: 0.2185 }, { max: 800, aliquota: 0.2215 }, { max: 900, aliquota: 0.2385 }, { max: null, aliquota: 0.2465 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0156 }, { max: 50, aliquota: 0.0252 }, { max: 70, aliquota: 0.0305 }, { max: 100, aliquota: 0.0316 }, { max: 150, aliquota: 0.0406 }, { max: 200, aliquota: 0.0457 }, { max: null, aliquota: 0.0457 }],
        },
    },
    'LINHARES': {
        nome: 'Linhares',
        metodo: 'fixo',
        lei: '2331/2002',
        vigencia: 'Julho de 2016',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 10.91 }, { max: 50, valor: 12.75 }, { max: 70, valor: 20.91 }, { max: 100, valor: 25.38 }, { max: 150, valor: 31.08 }, { max: 200, valor: 41.83 }, { max: 300, valor: 49.34 }, { max: 400, valor: 61.03 }, { max: 500, valor: 72.8 }, { max: null, valor: 89.34 }],
            'RESIDENCIAL': [{ max: 100, valor: 0 }, { max: 150, valor: 20.77 }, { max: 200, valor: 30.45 }, { max: 300, valor: 37.29 }, { max: 400, valor: 51.2 }, { max: 500, valor: 59.22 }, { max: null, valor: 69.9 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 100, valor: 0 }, { max: 150, valor: 10.14 }, { max: 180, valor: 12.68 }, { max: null, valor: 12.68 }],
        },
    },
    'MANTENOPOLIS': {
        nome: 'Mantenópolis',
        metodo: 'percentual',
        lei: '954/2004',
        vigencia: 'Abril de 2005',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0285 }, { max: 50, aliquota: 0.034 }, { max: 70, aliquota: 0.0565 }, { max: 100, aliquota: 0.0665 }, { max: 150, aliquota: 0.0814 }, { max: 200, aliquota: 0.1096 }, { max: 300, aliquota: 0.1292 }, { max: 400, aliquota: 0.1453 }, { max: 500, aliquota: 0.1589 }, { max: null, aliquota: 0.18 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0215 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.032 }, { max: 150, aliquota: 0.046 }, { max: 200, aliquota: 0.067 }, { max: 300, aliquota: 0.082 }, { max: 400, aliquota: 0.11 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0215 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.032 }, { max: 150, aliquota: 0.046 }, { max: 200, aliquota: 0.067 }, { max: 300, aliquota: 0.082 }, { max: 400, aliquota: 0.11 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
        },
    },
    'MARATAIZES': {
        nome: 'Marataízes',
        metodo: 'percentual',
        lei: '741/2003',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL e PODER PÚBLICO - MUNICIPAL',
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0345 }, { max: 70, aliquota: 0.0483 }, { max: 100, aliquota: 0.0483 }, { max: 150, aliquota: 0.1036 }, { max: 200, aliquota: 0.1243 }, { max: 300, aliquota: 0.1519 }, { max: 400, aliquota: 0.1726 }, { max: 500, aliquota: 0.1933 }, { max: null, aliquota: 0.2763 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0345 }, { max: 50, aliquota: 0.0345 }, { max: 70, aliquota: 0.0345 }, { max: 100, aliquota: 0.0345 }, { max: 150, aliquota: 0.0587 }, { max: 200, aliquota: 0.0587 }, { max: 300, aliquota: 0.0693 }, { max: 400, aliquota: 0.1694 }, { max: 500, aliquota: 0.1997 }, { max: null, aliquota: 0.2247 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0172 }, { max: 50, aliquota: 0.0172 }, { max: 70, aliquota: 0.0172 }, { max: 100, aliquota: 0.0172 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
            'RURAL': [{ max: 30, aliquota: 0.014 }, { max: 50, aliquota: 0.014 }, { max: 70, aliquota: 0.014 }, { max: 100, aliquota: 0.014 }, { max: 150, aliquota: 0.014 }, { max: 200, aliquota: 0.014 }, { max: 300, aliquota: 0.014 }, { max: 400, aliquota: 0.014 }, { max: 500, aliquota: 0.014 }, { max: null, aliquota: 0.014 }],
        },
    },
    'MARECHAL FLORIANO': {
        nome: 'Marechal Floriano',
        metodo: 'fixo',
        lei: '457/2002',
        vigencia: 'Novembro de 2015',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 16.56 }, { max: 50, valor: 19.76 }, { max: 70, valor: 32.54 }, { max: 100, valor: 37.31 }, { max: 150, valor: 46.49 }, { max: 200, valor: 60.33 }, { max: 300, valor: 67.71 }, { max: 400, valor: 74.25 }, { max: 500, valor: 78.93 }, { max: null, valor: 88.26 }],
            'RESIDENCIAL': [{ max: 30, valor: 3.95 }, { max: 50, valor: 4.09 }, { max: 70, valor: 12.81 }, { max: 100, valor: 18.25 }, { max: 150, valor: 26.15 }, { max: 200, valor: 37.31 }, { max: 300, valor: 46.64 }, { max: 400, valor: 60.33 }, { max: 500, valor: 67.71 }, { max: null, valor: 74.1 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, valor: 2.12 }, { max: 50, valor: 2.23 }, { max: 70, valor: 2.73 }, { max: 100, valor: 3.16 }, { max: 150, valor: 3.6 }, { max: null, valor: 4.09 }],
        },
    },
    'MIMOSO DO SUL': {
        nome: 'Mimoso do Sul',
        metodo: 'percentual',
        lei: '1482/2002',
        vigencia: 'Novembro de 2011',
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.058 }, { max: 100, aliquota: 0.075 }, { max: 150, aliquota: 0.09 }, { max: 200, aliquota: 0.12 }, { max: 300, aliquota: 0.155 }, { max: 400, aliquota: 0.185 }, { max: 500, aliquota: 0.215 }, { max: null, aliquota: 0.235 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.045 }, { max: 100, aliquota: 0.065 }, { max: 150, aliquota: 0.085 }, { max: 200, aliquota: 0.105 }, { max: 300, aliquota: 0.145 }, { max: 400, aliquota: 0.165 }, { max: 500, aliquota: 0.185 }, { max: null, aliquota: 0.205 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.006 }, { max: 100, aliquota: 0.008 }, { max: 150, aliquota: 0.01 }, { max: 180, aliquota: 0.0105 }, { max: null, aliquota: 0.0105 }],
        },
    },
    'MONTANHA': {
        nome: 'Montanha',
        metodo: 'percentual',
        lei: '547/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0366 }, { max: 100, aliquota: 0.0548 }, { max: 200, aliquota: 0.0732 }, { max: null, aliquota: 0.0915 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0183 }, { max: 100, aliquota: 0.0366 }, { max: 200, aliquota: 0.0548 }, { max: null, aliquota: 0.0732 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0183 }, { max: 100, aliquota: 0.0366 }, { max: 200, aliquota: 0.0548 }, { max: null, aliquota: 0.0732 }],
        },
    },
    'MUCURICI': {
        nome: 'Mucurici',
        metodo: 'percentual',
        lei: '399/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.045 }, { max: 50, aliquota: 0.0498 }, { max: 70, aliquota: 0.0868 }, { max: 100, aliquota: 0.1004 }, { max: 150, aliquota: 0.1224 }, { max: 200, aliquota: 0.165 }, { max: 300, aliquota: 0.175 }, { max: null, aliquota: 0.175 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0282 }, { max: 50, aliquota: 0.0353 }, { max: 70, aliquota: 0.041 }, { max: 100, aliquota: 0.0567 }, { max: 150, aliquota: 0.0749 }, { max: 200, aliquota: 0.1098 }, { max: 300, aliquota: 0.1311 }, { max: 400, aliquota: 0.1835 }, { max: 500, aliquota: 0.1917 }, { max: null, aliquota: 0.2274 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0164 }, { max: 50, aliquota: 0.0174 }, { max: 70, aliquota: 0.0211 }, { max: 100, aliquota: 0.0245 }, { max: 150, aliquota: 0.028 }, { max: null, aliquota: 0.0318 }],
        },
    },
    'MUNIZ FREIRE': {
        nome: 'Muniz Freire',
        metodo: 'percentual',
        lei: '7842/2018',
        vigencia: 'Abril de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PUBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, aliquota: 0.0326 }, { max: 70, aliquota: 0.0424 }, { max: 100, aliquota: 0.0574 }, { max: 200, aliquota: 0.0797 }, { max: 300, aliquota: 0.1034 }, { max: 400, aliquota: 0.1738 }, { max: 500, aliquota: 0.21 }, { max: null, aliquota: 0.2824 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.0217 }, { max: 70, aliquota: 0.0253 }, { max: 100, aliquota: 0.0325 }, { max: 200, aliquota: 0.0435 }, { max: 300, aliquota: 0.0652 }, { max: 500, aliquota: 0.1014 }, { max: null, aliquota: 0.1738 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0.0146 }, { max: 70, aliquota: 0.0203 }, { max: 100, aliquota: 0.0276 }, { max: 200, aliquota: 0.0363 }, { max: 300, aliquota: 0.0543 }, { max: 500, aliquota: 0.076 }, { max: null, aliquota: 0.1448 }],
        },
    },
    'MUQUI': {
        nome: 'Muqui',
        metodo: 'percentual',
        lei: '296/2006',
        vigencia: 'Julho de 2006',
        nota: 'Classes Isentas: SERVIÇO PUBLICO - AES, CONSUMO PROPRIO, PODER PUBLICO - ESTADUAL, PODER PUBLICO - FEDERAL, PODER PUBLICO - MUNICIPAL, ILUMINAÇÃO PUBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0275 }, { max: 50, aliquota: 0.0275 }, { max: 70, aliquota: 0.0481 }, { max: 100, aliquota: 0.0481 }, { max: 150, aliquota: 0.0894 }, { max: 200, aliquota: 0.0894 }, { max: 300, aliquota: 0.1032 }, { max: 400, aliquota: 0.1032 }, { max: 500, aliquota: 0.11 }, { max: null, aliquota: 0.1169 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0103 }, { max: 50, aliquota: 0.0103 }, { max: 70, aliquota: 0.0275 }, { max: 100, aliquota: 0.0344 }, { max: 150, aliquota: 0.0619 }, { max: 200, aliquota: 0.0619 }, { max: 300, aliquota: 0.0619 }, { max: 400, aliquota: 0.0757 }, { max: 500, aliquota: 0.0757 }, { max: null, aliquota: 0.0757 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0 }, { max: 150, aliquota: 0 }, { max: 200, aliquota: 0 }, { max: null, aliquota: 0 }],
        },
    },
    'NOVA VENECIA': {
        nome: 'Nova Venécia',
        metodo: 'percentual',
        lei: '2569/2002',
        vigencia: 'Maio de 2010',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0515 }, { max: 50, aliquota: 0.052 }, { max: 70, aliquota: 0.0712 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1304 }, { max: 200, aliquota: 0.1474 }, { max: 300, aliquota: 0.1735 }, { max: 400, aliquota: 0.1962 }, { max: 500, aliquota: 0.2175 }, { max: null, aliquota: 0.2521 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0104 }, { max: 50, aliquota: 0.011 }, { max: 70, aliquota: 0.025 }, { max: 100, aliquota: 0.033 }, { max: 150, aliquota: 0.042 }, { max: 200, aliquota: 0.0755 }, { max: 300, aliquota: 0.0939 }, { max: 400, aliquota: 0.1019 }, { max: 500, aliquota: 0.1109 }, { max: null, aliquota: 0.1657 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.005 }, { max: 50, aliquota: 0.008 }, { max: 70, aliquota: 0.012 }, { max: 100, aliquota: 0.019 }, { max: 150, aliquota: 0.025 }, { max: 180, aliquota: 0.0302 }, { max: null, aliquota: 0.0302 }],
        },
    },
    'PEDRO CANARIO': {
        nome: 'Pedro Canário',
        metodo: 'fixo',
        vigencia: 'Dezembro de 2022',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 10.56 }, { max: 50, valor: 12.6 }, { max: 70, valor: 20.94 }, { max: 100, valor: 24.65 }, { max: 150, valor: 30.17 }, { max: 200, valor: 40.62 }, { max: 300, valor: 47.88 }, { max: 400, valor: 53.85 }, { max: 500, valor: 58.89 }, { max: null, valor: 66.71 }],
            'RESIDENCIAL': [{ max: 70, valor: 7.86 }, { max: 100, valor: 11.75 }, { max: 150, valor: 16.83 }, { max: 200, valor: 24.65 }, { max: 300, valor: 30.17 }, { max: 400, valor: 40.62 }, { max: 500, valor: 47.88 }, { max: null, valor: 53.85 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 70, valor: 7.41 }, { max: 100, valor: 11.75 }, { max: 150, valor: 16.83 }, { max: 200, valor: 24.65 }, { max: 220, valor: 30.17 }, { max: 300, valor: 30.17 }, { max: 400, valor: 40.62 }, { max: 500, valor: 47.88 }, { max: null, valor: 53.85 }],
        },
    },
    'PINHEIROS': {
        nome: 'Pinheiros',
        metodo: 'percentual',
        lei: '824/2005',
        vigencia: 'Janeiro de 2006',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0397 }, { max: 50, aliquota: 0.0517 }, { max: 70, aliquota: 0.0637 }, { max: 100, aliquota: 0.0657 }, { max: 150, aliquota: 0.0777 }, { max: 200, aliquota: 0.0897 }, { max: 300, aliquota: 0.1161 }, { max: 400, aliquota: 0.1351 }, { max: 500, aliquota: 0.1521 }, { max: null, aliquota: 0.2051 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0257 }, { max: 50, aliquota: 0.0257 }, { max: 70, aliquota: 0.0257 }, { max: 100, aliquota: 0.0257 }, { max: 150, aliquota: 0.0543 }, { max: 200, aliquota: 0.0693 }, { max: 300, aliquota: 0.0827 }, { max: 400, aliquota: 0.1174 }, { max: 500, aliquota: 0.1351 }, { max: null, aliquota: 0.1577 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0257 }, { max: 50, aliquota: 0.0257 }, { max: 70, aliquota: 0.0257 }, { max: 100, aliquota: 0.0257 }, { max: 150, aliquota: 0.0543 }, { max: 200, aliquota: 0.0693 }, { max: 300, aliquota: 0.0827 }, { max: 400, aliquota: 0.0931 }, { max: 500, aliquota: 0.1231 }, { max: null, aliquota: 0.1531 }],
        },
    },
    'PIUMA': {
        nome: 'Piúma',
        metodo: 'fixo',
        lei: '1024/2002',
        vigencia: 'Dezembro de 2018',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA',
        faixas: {
            'DEMAIS CLASSES': [{ max: null, valor: 27.17 }],
            'RESIDENCIAL': [{ max: null, valor: 13.57 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: null, valor: 10.86 }],
            'RURAL': [{ max: null, valor: 8.61 }],
        },
    },
    'PONTO BELO': {
        nome: 'Ponto Belo',
        metodo: 'percentual',
        lei: '467/2016',
        vigencia: 'Junho de 2017',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.043 }, { max: 50, aliquota: 0.0546 }, { max: 70, aliquota: 0.0546 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1156 }, { max: 200, aliquota: 0.1536 }, { max: 300, aliquota: 0.1734 }, { max: 400, aliquota: 0.1915 }, { max: 500, aliquota: 0.2064 }, { max: null, aliquota: 0.2361 }],
            'INDUSTRIAL': [{ max: 30, aliquota: 0.043 }, { max: 50, aliquota: 0.0546 }, { max: 70, aliquota: 0.0546 }, { max: 100, aliquota: 0.0991 }, { max: 150, aliquota: 0.1156 }, { max: 200, aliquota: 0.1536 }, { max: 300, aliquota: 0.1734 }, { max: 400, aliquota: 0.1915 }, { max: 500, aliquota: 0.2064 }, { max: null, aliquota: 0.241 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0249 }, { max: 70, aliquota: 0.0348 }, { max: 100, aliquota: 0.0519 }, { max: 150, aliquota: 0.0744 }, { max: 200, aliquota: 0.1074 }, { max: 300, aliquota: 0.1323 }, { max: 400, aliquota: 0.175 }, { max: 500, aliquota: 0.2006 }, { max: null, aliquota: 0.241 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0185 }, { max: 50, aliquota: 0.0185 }, { max: 70, aliquota: 0.0249 }, { max: 100, aliquota: 0.0249 }, { max: 150, aliquota: 0.0414 }, { max: 180, aliquota: 0.048 }, { max: null, aliquota: 0.048 }],
        },
    },
    'PRESIDENTE KENNEDY': {
        nome: 'Presidente Kennedy',
        metodo: 'percentual',
        lei: '578/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.081 }, { max: 100, aliquota: 0.108 }, { max: 300, aliquota: 0.135 }, { max: 500, aliquota: 0.162 }, { max: null, aliquota: 0.1755 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0.027 }, { max: 100, aliquota: 0.054 }, { max: 300, aliquota: 0.081 }, { max: 500, aliquota: 0.0945 }, { max: null, aliquota: 0.1008 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 80, aliquota: 0 }, { max: 100, aliquota: 0.027 }, { max: null, aliquota: 0.034 }],
        },
    },
    'RIO BANANAL': {
        nome: 'Rio Bananal',
        metodo: 'percentual',
        lei: '1358/2017',
        vigencia: 'Dezembro de 2017',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.041 }, { max: 50, aliquota: 0.044 }, { max: 70, aliquota: 0.0649 }, { max: 100, aliquota: 0.0956 }, { max: 150, aliquota: 0.1169 }, { max: 200, aliquota: 0.1575 }, { max: 300, aliquota: 0.1857 }, { max: 400, aliquota: 0.209 }, { max: 500, aliquota: 0.2284 }, { max: null, aliquota: 0.2694 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0306 }, { max: 100, aliquota: 0.0456 }, { max: 150, aliquota: 0.0653 }, { max: 200, aliquota: 0.0956 }, { max: 300, aliquota: 0.1169 }, { max: 400, aliquota: 0.1575 }, { max: 500, aliquota: 0.1857 }, { max: null, aliquota: 0.209 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0234 }, { max: 100, aliquota: 0.0272 }, { max: 150, aliquota: 0.0311 }, { max: null, aliquota: 0.035 }],
        },
    },
    'RIO NOVO DO SUL': {
        nome: 'Rio Novo do Sul',
        metodo: 'percentual',
        lei: '353/2008',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.04 }, { max: 50, aliquota: 0.05 }, { max: 70, aliquota: 0.075 }, { max: 100, aliquota: 0.09 }, { max: 150, aliquota: 0.12 }, { max: 200, aliquota: 0.15 }, { max: 300, aliquota: 0.175 }, { max: 400, aliquota: 0.2 }, { max: 500, aliquota: 0.22 }, { max: null, aliquota: 0.24 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.03 }, { max: 100, aliquota: 0.05 }, { max: 150, aliquota: 0.07 }, { max: 200, aliquota: 0.1 }, { max: 300, aliquota: 0.12 }, { max: 400, aliquota: 0.16 }, { max: 500, aliquota: 0.2 }, { max: null, aliquota: 0.24 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.02 }, { max: 100, aliquota: 0.03 }, { max: 150, aliquota: 0.04 }, { max: null, aliquota: 0.05 }],
        },
    },
    'SANTA LEOPOLDINA': {
        nome: 'Santa Leopoldina',
        metodo: 'fixo',
        lei: '1028/2002',
        vigencia: 'Abril de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 12.37 }, { max: 50, valor: 14.76 }, { max: 70, valor: 24.53 }, { max: 100, valor: 28.87 }, { max: 150, valor: 35.34 }, { max: 200, valor: 47.58 }, { max: 300, valor: 56.09 }, { max: 400, valor: 63.08 }, { max: 500, valor: 68.98 }, { max: null, valor: 78.14 }],
            'RESIDENCIAL': [{ max: 50, valor: 0 }, { max: 70, valor: 9.2 }, { max: 100, valor: 13.76 }, { max: 150, valor: 19.71 }, { max: 200, valor: 28.87 }, { max: 300, valor: 35.34 }, { max: 400, valor: 47.58 }, { max: 500, valor: 56.09 }, { max: null, valor: 63.08 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, valor: 0 }, { max: 70, valor: 9.2 }, { max: 100, valor: 13.76 }, { max: 150, valor: 19.71 }, { max: 200, valor: 28.87 }, { max: 300, valor: 35.34 }, { max: 400, valor: 47.58 }, { max: 500, valor: 56.09 }, { max: null, valor: 63.08 }],
        },
    },
    'SANTA MARIA DE JETIBA': {
        nome: 'Santa Maria do Jetibá',
        metodo: 'percentual',
        lei: '698/2003',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0259 }, { max: 50, aliquota: 0.0259 }, { max: 70, aliquota: 0.0407 }, { max: 100, aliquota: 0.0554 }, { max: 150, aliquota: 0.0775 }, { max: 200, aliquota: 0.0996 }, { max: 300, aliquota: 0.1217 }, { max: 400, aliquota: 0.1365 }, { max: 500, aliquota: 0.1475 }, { max: null, aliquota: 0.1698 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0096 }, { max: 50, aliquota: 0.0096 }, { max: 70, aliquota: 0.0185 }, { max: 100, aliquota: 0.0259 }, { max: 150, aliquota: 0.05 }, { max: 200, aliquota: 0.0648 }, { max: 300, aliquota: 0.0794 }, { max: 400, aliquota: 0.1015 }, { max: 500, aliquota: 0.1309 }, { max: null, aliquota: 0.1383 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.004 }, { max: 50, aliquota: 0.004 }, { max: 70, aliquota: 0.004 }, { max: 100, aliquota: 0.004 }, { max: 150, aliquota: 0.004 }, { max: 200, aliquota: 0.004 }, { max: null, aliquota: 0.004 }],
        },
    },
    'SANTA TERESA': {
        nome: 'Santa Teresa',
        metodo: 'fixo',
        lei: '1492/2002',
        vigencia: 'Maio de 2017',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 50, valor: 7.59 }, { max: 100, valor: 11.38 }, { max: 150, valor: 15.17 }, { max: 200, valor: 19.03 }, { max: 250, valor: 22.8 }, { max: 300, valor: 26.66 }, { max: 350, valor: 30.4 }, { max: 400, valor: 34.24 }, { max: 450, valor: 38.06 }, { max: 500, valor: 41.8 }, { max: 550, valor: 45.61 }, { max: 600, valor: 55.42 }, { max: 650, valor: 53.25 }, { max: 700, valor: 57.04 }, { max: 750, valor: 60.91 }, { max: 800, valor: 64.67 }, { max: 850, valor: 68.46 }, { max: 900, valor: 72.24 }, { max: 950, valor: 76.08 }, { max: 1000, valor: 91.3 }, { max: 1200, valor: 106.53 }, { max: 1400, valor: 121.77 }, { max: 1600, valor: 136.96 }, { max: 1800, valor: 152.2 }, { max: 2000, valor: 179.11 }, { max: null, valor: 327.8 }],
            'RESIDENCIAL': [{ max: 50, valor: 0 }, { max: 100, valor: 6.34 }, { max: 200, valor: 12.7 }, { max: 300, valor: 19.03 }, { max: 450, valor: 28.59 }, { max: 650, valor: 41.16 }, { max: 1000, valor: 49.75 }, { max: 2000, valor: 99.5 }, { max: null, valor: 149.26 }],
        },
    },
    'SAO JOSE DO CALCADO': {
        nome: 'São José do Calçado',
        metodo: 'incompativel',
        incompativel: 'CIP = alíquota (%) sobre o valor total da fatura, não sobre a Tarifa B4a por faixa de kWh.',
        faixas: {
        },
    },
    'SAO MATEUS': {
        nome: 'São Mateus',
        metodo: 'percentual',
        lei: '351/2005',
        vigencia: 'Março de 2006',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0831 }, { max: 150, aliquota: 0.1119 }, { max: 200, aliquota: 0.1676 }, { max: 300, aliquota: 0.181 }, { max: 400, aliquota: 0.1965 }, { max: 500, aliquota: 0.2335 }, { max: null, aliquota: 0.2413 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0658 }, { max: 150, aliquota: 0.087 }, { max: 200, aliquota: 0.0963 }, { max: 300, aliquota: 0.1069 }, { max: 400, aliquota: 0.1218 }, { max: 500, aliquota: 0.1276 }, { max: null, aliquota: 0.1364 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0 }, { max: 100, aliquota: 0.0188 }, { max: 150, aliquota: 0.0398 }, { max: 200, aliquota: 0.0596 }, { max: 300, aliquota: 0.0596 }, { max: 400, aliquota: 0.0596 }, { max: 500, aliquota: 0.0596 }, { max: null, aliquota: 0.0596 }],
        },
    },
    'SERRA': {
        nome: 'Serra',
        metodo: 'fixo',
        lei: '5125/2019',
        vigencia: 'Dezembro de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 12.28 }, { max: 50, valor: 14.63 }, { max: 70, valor: 24.28 }, { max: 100, valor: 28.61 }, { max: 150, valor: 34.42 }, { max: 200, valor: 47.13 }, { max: 300, valor: 55.57 }, { max: 400, valor: 56.25 }, { max: 500, valor: 61.51 }, { max: null, valor: 77.47 }],
            'RESIDENCIAL': [{ max: 30, valor: 0 }, { max: 50, valor: 0 }, { max: 70, valor: 9.06 }, { max: 100, valor: 13.67 }, { max: 150, valor: 19.51 }, { max: 200, valor: 28.61 }, { max: 300, valor: 34.98 }, { max: 400, valor: 47.16 }, { max: 500, valor: 55.57 }, { max: null, valor: 62.53 }],
        },
    },
    'SOORETAMA': {
        nome: 'Sooretama',
        metodo: 'percentual',
        lei: '070/2003',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: SERVIÇO PÚBLICO - AES, CONSUMO PRÓPRIO, PODER PÚBLICO - ESTADUAL, PODER PÚBLICO - FEDERAL, PODER PÚBLICO - MUNICIPAL, ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.03 }, { max: 50, aliquota: 0.041 }, { max: 70, aliquota: 0.0608 }, { max: 100, aliquota: 0.0825 }, { max: 150, aliquota: 0.1035 }, { max: 200, aliquota: 0.1285 }, { max: 300, aliquota: 0.149 }, { max: 400, aliquota: 0.1705 }, { max: 500, aliquota: 0.1995 }, { max: null, aliquota: 0.221 }],
            'RESIDENCIAL': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0113 }, { max: 100, aliquota: 0.025 }, { max: 150, aliquota: 0.045 }, { max: 200, aliquota: 0.0675 }, { max: 300, aliquota: 0.0825 }, { max: 400, aliquota: 0.1045 }, { max: 500, aliquota: 0.1215 }, { max: null, aliquota: 0.146 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0113 }, { max: 100, aliquota: 0.025 }, { max: 150, aliquota: 0.045 }, { max: 200, aliquota: 0.0675 }, { max: 300, aliquota: 0.0825 }, { max: 400, aliquota: 0.1045 }, { max: 500, aliquota: 0.1215 }, { max: null, aliquota: 0.146 }],
        },
    },
    'VARGEM ALTA': {
        nome: 'Vargem Alta',
        metodo: 'percentual',
        lei: '052/2018',
        vigencia: 'Abril de 2019',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e PODER PÚBLICO - MUNICIPAL',
        faixas: {
            'DEMAIS CLASSES': [{ max: 100, aliquota: 0.055 }, { max: 300, aliquota: 0.085 }, { max: 500, aliquota: 0.13 }, { max: null, aliquota: 0.15 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.035 }, { max: 200, aliquota: 0.055 }, { max: 300, aliquota: 0.065 }, { max: 400, aliquota: 0.085 }, { max: 500, aliquota: 0.125 }, { max: null, aliquota: 0.17 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.035 }, { max: 200, aliquota: 0.055 }, { max: 300, aliquota: 0.065 }, { max: 400, aliquota: 0.085 }, { max: 500, aliquota: 0.125 }, { max: null, aliquota: 0.17 }],
            'RURAL': [{ max: 30, aliquota: 0 }, { max: 100, aliquota: 0.03 }, { max: 200, aliquota: 0.045 }, { max: 300, aliquota: 0.06 }, { max: 400, aliquota: 0.08 }, { max: 500, aliquota: 0.11 }, { max: null, aliquota: 0.14 }],
        },
    },
    'VENDA NOVA DO IMIGRANTE': {
        nome: 'Venda Nova de Imigrante',
        metodo: 'percentual',
        vigencia: 'Abril de 2023',
        nota: 'Classes Isentas: PODER PÚBLICO — ESTADUAL, PODER PÚBLICO — FEDERAL, PODER PÚBLICO — MUNICIPAL, ILUMINAÇÃO PÚBLICA e ENTIDADES FILANTRÓPICAS',
        isenta_ppf: true,
        isenta_ppe: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0364 }, { max: 50, aliquota: 0.0433 }, { max: 70, aliquota: 0.0631 }, { max: 100, aliquota: 0.0688 }, { max: 150, aliquota: 0.0777 }, { max: 200, aliquota: 0.0907 }, { max: 300, aliquota: 0.1028 }, { max: 400, aliquota: 0.1157 }, { max: 500, aliquota: 0.1328 }, { max: null, aliquota: 0.1576 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0.0116 }, { max: 50, aliquota: 0.0124 }, { max: 70, aliquota: 0.0253 }, { max: 100, aliquota: 0.0328 }, { max: 150, aliquota: 0.0433 }, { max: 200, aliquota: 0.0582 }, { max: 300, aliquota: 0.0712 }, { max: 400, aliquota: 0.0873 }, { max: 500, aliquota: 0.1028 }, { max: null, aliquota: 0.1157 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0.0105 }, { max: 50, aliquota: 0.0112 }, { max: 70, aliquota: 0.0229 }, { max: 100, aliquota: 0.0297 }, { max: 150, aliquota: 0.0393 }, { max: null, aliquota: 0.0528 }],
            'RURAL': [{ max: 100, aliquota: 0.0364 }, { max: 300, aliquota: 0.0433 }, { max: 500, aliquota: 0.0631 }, { max: null, aliquota: 0.07 }],
        },
    },
    'VIANA': {
        nome: 'Viana',
        metodo: 'percentual',
        lei: '2508/2012',
        vigencia: 'Junho de 2009',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0.0425 }, { max: 50, aliquota: 0.0476 }, { max: 70, aliquota: 0.0841 }, { max: 100, aliquota: 0.0989 }, { max: 150, aliquota: 0.1212 }, { max: 200, aliquota: 0.1632 }, { max: 300, aliquota: 0.1907 }, { max: 400, aliquota: 0.2002 }, { max: 500, aliquota: 0.2189 }, { max: null, aliquota: 0.248 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0285 }, { max: 100, aliquota: 0.0427 }, { max: 150, aliquota: 0.0613 }, { max: 200, aliquota: 0.0989 }, { max: 300, aliquota: 0.1212 }, { max: 400, aliquota: 0.1509 }, { max: 500, aliquota: 0.1786 }, { max: null, aliquota: 0.2002 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0 }, { max: 70, aliquota: 0.0285 }, { max: 100, aliquota: 0.0427 }, { max: 150, aliquota: 0.0613 }, { max: 200, aliquota: 0.0989 }, { max: 300, aliquota: 0.1212 }, { max: 400, aliquota: 0.1509 }, { max: 500, aliquota: 0.1786 }, { max: null, aliquota: 0.2002 }],
        },
    },
    'VILA PAVAO': {
        nome: 'Vila Pavão',
        metodo: 'percentual',
        lei: '006/2002',
        vigencia: 'Agosto de 2004',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0632 }, { max: 70, aliquota: 0.1049 }, { max: 100, aliquota: 0.1235 }, { max: 150, aliquota: 0.1511 }, { max: 200, aliquota: 0.2073 }, { max: 300, aliquota: 0.24 }, { max: 400, aliquota: 0.27 }, { max: 500, aliquota: 0.2952 }, { max: null, aliquota: 0.329 }],
            'RESIDENCIAL': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0068 }, { max: 70, aliquota: 0.0332 }, { max: 100, aliquota: 0.0497 }, { max: 150, aliquota: 0.0706 }, { max: 200, aliquota: 0.1215 }, { max: 300, aliquota: 0.1487 }, { max: 400, aliquota: 0.2003 }, { max: 500, aliquota: 0.2301 }, { max: null, aliquota: 0.2657 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 30, aliquota: 0 }, { max: 50, aliquota: 0.0064 }, { max: 70, aliquota: 0.0077 }, { max: 100, aliquota: 0.009 }, { max: 150, aliquota: 0.0103 }, { max: null, aliquota: 0.011 }],
        },
    },
    'VILA VALERIO': {
        nome: 'Vila Valério',
        metodo: 'fixo',
        lei: '224/2002',
        vigencia: 'Março de 2003',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 0.38 }, { max: 50, valor: 0.64 }, { max: 100, valor: 1.27 }, { max: 200, valor: 2.55 }, { max: 300, valor: 3.82 }, { max: 450, valor: 5.74 }, { max: 650, valor: 8.27 }, { max: null, valor: 10 }],
            'RESIDENCIAL': [{ max: 30, valor: 0.38 }, { max: 50, valor: 0.64 }, { max: 100, valor: 1.27 }, { max: 200, valor: 2.55 }, { max: 300, valor: 3.82 }, { max: 450, valor: 5.74 }, { max: 650, valor: 8.27 }, { max: 1000, valor: 10 }, { max: 2000, valor: 10 }, { max: null, valor: 10 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: null, valor: 0 }],
        },
    },
    'VILA VELHA': {
        nome: 'Vila Velha',
        metodo: 'fixo',
        lei: '72/2019',
        vigencia: 'Janeiro de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 8.86 }, { max: 50, valor: 9.98 }, { max: 70, valor: 16.63 }, { max: 100, valor: 19.54 }, { max: 150, valor: 23.96 }, { max: 200, valor: 34.12 }, { max: 300, valor: 44.32 }, { max: 400, valor: 46.76 }, { max: 500, valor: 54.53 }, { max: null, valor: 61.73 }],
            'RESIDENCIAL': [{ max: 50, valor: 0 }, { max: 70, valor: 7.68 }, { max: 100, valor: 9.9 }, { max: 150, valor: 13.37 }, { max: 200, valor: 21.36 }, { max: 300, valor: 27.91 }, { max: 400, valor: 35.21 }, { max: 500, valor: 43.76 }, { max: null, valor: 49.88 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: 50, valor: 0 }, { max: 70, valor: 7.68 }, { max: 100, valor: 9.9 }, { max: 150, valor: 13.37 }, { max: 200, valor: 21.36 }, { max: 300, valor: 27.91 }, { max: 400, valor: 35.21 }, { max: 500, valor: 43.76 }, { max: null, valor: 49.88 }],
        },
    },
    'VITORIA': {
        nome: 'Vitória',
        metodo: 'fixo',
        lei: '9156/2017',
        vigencia: 'Fevereiro de 2026',
        nota: 'Classes Isentas: ILUMINAÇÃO PÚBLICA e RURAL',
        isenta_rural: true,
        isenta_irrigante: true,
        faixas: {
            'DEMAIS CLASSES': [{ max: 30, valor: 5.79 }, { max: 50, valor: 6.91 }, { max: 70, valor: 11.48 }, { max: 100, valor: 13.51 }, { max: 150, valor: 16.53 }, { max: 200, valor: 22.26 }, { max: 300, valor: 26.24 }, { max: 400, valor: 29.51 }, { max: 500, valor: 32.28 }, { max: null, valor: 36.56 }],
            'RESIDENCIAL': [{ max: 50, valor: 0 }, { max: 70, valor: 4.31 }, { max: 100, valor: 6.44 }, { max: 150, valor: 9.22 }, { max: 200, valor: 13.51 }, { max: 300, valor: 16.53 }, { max: 400, valor: 22.26 }, { max: 500, valor: 26.24 }, { max: null, valor: 29.51 }],
            'RESIDENCIAL BAIXA RENDA': [{ max: null, valor: 0 }],
        },
    },
};
