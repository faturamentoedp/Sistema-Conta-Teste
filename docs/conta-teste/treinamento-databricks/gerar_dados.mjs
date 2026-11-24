/**
 * Gera os arquivos de dados da pasta docs/conta-teste/treinamento-databricks/dados a partir do
 * motor de cálculo do simulador. SOMENTE LEITURA: importa os módulos de
 * src/modulos/conta-teste/motor e scripts/conta-teste/cenarios.mjs, nunca escreve fora desta pasta.
 *
 * Uso (na raiz do projeto): node docs/conta-teste/treinamento-databricks/gerar_dados.mjs
 *
 * Rode de novo sempre que o motor mudar (nova resolução da ANEEL, novo mês de
 * PIS/COFINS, nova regra) para os CSVs não ficarem velhos em relação ao código.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VIGENCIAS } from '../../../src/modulos/conta-teste/motor/vigencias.js';
import { TRIBUTOS_MENSAIS, TRIBUTOS_PADRAO, ICMS_PADRAO } from '../../../src/modulos/conta-teste/motor/tributos.js';
import {
    FAIXA_TARIFA_SOCIAL_KWH, FAIXA_DESCONTO_SOCIAL_KWH, CATEGORIA_DESCONTO_SOCIAL,
    SUBVENCAO_INCLUI_BANDEIRA, BENEFICIO_TARIFA_SOCIAL_INFORMATIVO, REPRODUZIR_FALLBACK_POSTO,
    PERC_REDUCAO_GD, ICMS_FAIXAS_RESIDENCIAL, ENCARGO_ESCASSEZ_HIDRICA,
    ESCASSEZ_SO_TE_NA_FAIXA_SOCIAL, ESCASSEZ_ARREDONDA_POR_COMPONENTE, FIO_B_TUSD, SUDENE_CONFIG
} from '../../../src/modulos/conta-teste/motor/tarifas-aneel.js';
import { BANDEIRAS, calcular_fatura, normalizar_tarifas, resolver_tarifas } from '../../../src/modulos/conta-teste/motor/calculo.js';
import { CIP_MUNICIPIOS_ES, TARIFA_B4A } from '../../../src/modulos/conta-teste/motor/cip-municipios.js';
import { CENARIOS } from '../../../scripts/conta-teste/cenarios.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(aqui, 'dados');
fs.mkdirSync(saida, { recursive: true });

// CSV com ponto-e-vírgula e vírgula decimal NÃO: números saem com ponto, para
// o Spark/Databricks ler direto (header=true, sep=';', inferSchema=true).
const celula = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function grava_csv(nome, colunas, linhas) {
    const corpo = [colunas.join(';'), ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(';'))].join('\n') + '\n';
    fs.writeFileSync(path.join(saida, nome), corpo, 'utf8');
    console.log(`${nome}: ${linhas.length} linhas`);
}

// 1. Tarifas ANEEL por vigência -------------------------------------------------
{
    const linhas = [];
    for (const [distribuidora, lista] of Object.entries(VIGENCIAS)) {
        for (const v of lista) {
            for (const bloco of ['tarifas', 'tarifas_scee']) {
                for (const [categoria, postos] of Object.entries(v[bloco] || {})) {
                    for (const p of postos) {
                        linhas.push({
                            distribuidora, resolucao: v.resolucao, vigencia_inicio: v.inicio, vigencia_fim: v.fim,
                            bloco, categoria, posto: p.posto, faixa: p.faixa ?? '', tusd_rs_kwh: p.tusd, te_rs_kwh: p.te
                        });
                    }
                }
            }
        }
    }
    grava_csv('tarifas_aneel_vigencias.csv',
        ['distribuidora', 'resolucao', 'vigencia_inicio', 'vigencia_fim', 'bloco', 'categoria', 'posto', 'faixa', 'tusd_rs_kwh', 'te_rs_kwh'], linhas);
}

// 2. PIS/COFINS mensal -----------------------------------------------------------
{
    const linhas = [];
    for (const [distribuidora, meses] of Object.entries(TRIBUTOS_MENSAIS)) {
        for (const [mes, t] of Object.entries(meses)) {
            linhas.push({ distribuidora, mes_leitura_atual: mes, pis: t.pis, cofins: t.cofins, soma: Math.round((t.pis + t.cofins) * 1e6) / 1e6 });
        }
    }
    linhas.push({ distribuidora: '*', mes_leitura_atual: 'PADRAO', pis: TRIBUTOS_PADRAO.pis, cofins: TRIBUTOS_PADRAO.cofins, soma: Math.round((TRIBUTOS_PADRAO.pis + TRIBUTOS_PADRAO.cofins) * 1e6) / 1e6 });
    grava_csv('pis_cofins_mensal.csv', ['distribuidora', 'mes_leitura_atual', 'pis', 'cofins', 'soma'], linhas);
}

// 3. ICMS por tarifa --------------------------------------------------------------
// Uma linha por distribuidora x tarifa (x faixa de consumo, no residencial). As
// regras abaixo repetem as do motor (ver "ICMS" em calculo.js) e, antes de gravar,
// CADA tarifa é conferida chamando o próprio motor em vários consumos: se uma
// regra mudar no motor e esta tabela não, o gerador para com erro.
{
    const NOME = {
        'B1C': 'B1 Residencial',
        'B1C_TB': 'B1 Residencial Tarifa Branca',
        'B1CDE': 'B1 Desconto Social',
        'B1BRN/B1BPC/B1BRQ/B1BRI': 'B1 Baixa Renda',
        'B2RURAL': 'B2 Rural',
        'B2RURAL_TB': 'B2 Rural Tarifa Branca',
        'B2RUIRRG': 'B2 Rural Irrigante',
        'B2RUIRRG_TB': 'B2 Irrigante Tarifa Branca',
        'B3': 'B3 Comercial / Demais classes',
        'B3_TB': 'B3 Tarifa Branca',
        'B3_CP': 'B3 Consumo Próprio',
        'B3_CP_TB': 'B3 Consumo Próprio Tarifa Branca',
        'B3_PPF': 'B3 Poder Público Federal',
        'B3_PPF_TB': 'B3 Poder Público Federal Tarifa Branca',
        'B3_PPE': 'B3 Poder Público Estadual',
        'B3_PPE_TB': 'B3 Poder Público Estadual Tarifa Branca',
        'B4A': 'B4A Iluminação Pública (rede)',
        'B4B': 'B4B Iluminação Pública (bulbo)'
    };

    /** Regra de ICMS da tarifa, na ordem de decisão do motor (sem a opção manual de ICMS). */
    function regra_icms(dist, cat) {
        const tb = cat.endsWith('_TB');
        const base = cat.replace(/_TB$/, '');
        if (base === 'B3_PPE') {
            return { tipo: 'isento', obs: 'Poder Público Estadual é isento de ICMS em ES e SP.' };
        }
        if (base === 'B3_CP' && dist === 'ES') {
            return { tipo: 'isento', obs: 'Consumo Próprio é isento só no ES; em SP paga o ICMS normal.' };
        }
        if (!tb && (cat.startsWith('B1C') || cat.startsWith('B1BR'))) {
            return {
                tipo: 'por_faixa_de_consumo', faixas: ICMS_FAIXAS_RESIDENCIAL[dist],
                obs: 'Residencial convencional: a alíquota depende do consumo faturado total (com o consumo mínimo), não de cada kWh.'
            };
        }
        if (cat.startsWith('B2RUIRRG') && dist === 'ES') {
            return {
                tipo: 'aliquota_fixa', aliquota: 0.17,
                obs: 'Irrigante no ES paga o ICMS cheio (17%), conforme fatura real; o 4% vale só para o Rural comum.'
            };
        }
        if (cat.startsWith('B2RU')) {
            return {
                tipo: 'aliquota_fixa', aliquota: dist === 'ES' ? 0.04 : 0.12,
                obs: dist === 'ES' ? 'Carga efetiva de 4% (a fatura imprime 12% sobre 1/3 do valor).' : 'Rural e irrigante pagam 12% em SP.'
            };
        }
        return {
            tipo: 'aliquota_fixa', aliquota: ICMS_PADRAO[dist],
            obs: tb ? 'Tarifa Branca não tem isenção por faixa de consumo: paga a alíquota cheia do estado.' : 'Alíquota cheia do estado.'
        };
    }

    const linhas = [];
    const regras = [];
    for (const dist of ['ES', 'SP']) {
        for (const cat of Object.keys(NOME)) {
            const r = regra_icms(dist, cat);
            regras.push({ dist, cat, r });
            if (r.tipo === 'por_faixa_de_consumo') {
                let anterior = 0;
                for (const f of r.faixas) {
                    linhas.push({
                        distribuidora: dist, categoria: cat, nome_da_tarifa: NOME[cat], tipo_regra: r.tipo,
                        consumo_faturado_de_kwh_exclusivo: anterior,
                        consumo_faturado_ate_kwh_inclusivo: Number.isFinite(f.ate) ? f.ate : '',
                        aliquota_icms: f.aliquota, observacao: r.obs
                    });
                    anterior = f.ate;
                }
            } else {
                linhas.push({
                    distribuidora: dist, categoria: cat, nome_da_tarifa: NOME[cat], tipo_regra: r.tipo,
                    consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '',
                    aliquota_icms: r.tipo === 'isento' ? 0 : r.aliquota, observacao: r.obs
                });
            }
        }
    }

    // Conferência contra o motor: mesma tarifa, vários consumos, mesma alíquota.
    const aliquota_esperada = (r, consumo) => {
        if (r.tipo === 'isento') return 0;
        if (r.tipo === 'aliquota_fixa') return r.aliquota;
        return r.faixas.find((f) => consumo <= f.ate).aliquota;
    };
    const divergencias = [];
    for (const { dist, cat, r } of regras) {
        for (const consumo of [30, 50, 51, 90, 91, 200, 201, 800]) {
            const eh_tb = cat.endsWith('_TB');
            const params = {
                distribuidora: dist, categoria: cat, fase: 'monofasico',
                data_leitura_anterior: '2026-09-10', data_leitura_atual: '2026-10-10',
                bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE', valor_cip: 0, ajustes: [],
                ...(eh_tb ? { consumo_fora_ponta: consumo, consumo_ponta: 0, consumo_intermediario: 0 } : { consumo_kwh: consumo })
            };
            const tarifas = resolver_tarifas(dist, cat, new Date(params.data_leitura_anterior), new Date(params.data_leitura_atual));
            const doMotor = calcular_fatura(params, normalizar_tarifas(tarifas, cat)).parametros_usados.aliquota_icms_aplicada;
            const nossa = aliquota_esperada(r, consumo);
            if (Math.abs(doMotor - nossa) > 1e-9) divergencias.push(`${dist} ${cat} ${consumo} kWh: motor ${doMotor} x tabela ${nossa}`);
        }
    }
    if (divergencias.length > 0) {
        console.error('A tabela de ICMS divergiu do motor:\n - ' + divergencias.join('\n - '));
        process.exit(1);
    }
    console.log(`ICMS conferido contra o motor: ${regras.length} tarifas x 8 consumos`);

    grava_csv('icms_regras.csv', ['distribuidora', 'categoria', 'nome_da_tarifa', 'tipo_regra',
        'consumo_faturado_de_kwh_exclusivo', 'consumo_faturado_ate_kwh_inclusivo', 'aliquota_icms', 'observacao'], linhas);
}

// 4. Bandeiras tarifárias ----------------------------------------------------------
grava_csv('bandeiras_tarifarias.csv', ['bandeira', 'adicional_rs_kwh'],
    Object.entries(BANDEIRAS).map(([bandeira, adicional_rs_kwh]) => ({ bandeira, adicional_rs_kwh })));

// 5. Geração distribuída (percentual de compensação do TUSD) ---------------------
{
    const linhas = [];
    for (const [modalidade, faixas] of Object.entries(PERC_REDUCAO_GD)) {
        if (!faixas) {
            linhas.push({ modalidade, vigencia_inicio: '', vigencia_fim: '', perc_compensacao_tusd: '', perc_compensacao_te: '', observacao: 'sem percentual cadastrado: o motor devolve erro' });
            continue;
        }
        for (const f of faixas) {
            linhas.push({ modalidade, vigencia_inicio: f.inicio, vigencia_fim: f.fim, perc_compensacao_tusd: f.tusd, perc_compensacao_te: f.te, observacao: '' });
        }
    }
    grava_csv('gd_percentual_compensacao.csv', ['modalidade', 'vigencia_inicio', 'vigencia_fim', 'perc_compensacao_tusd', 'perc_compensacao_te', 'observacao'], linhas);
}

// 6. Informativos: Escassez Hídrica e Fio B --------------------------------------
{
    const linhas = [];
    for (const [distribuidora, faixas] of Object.entries(ENCARGO_ESCASSEZ_HIDRICA)) {
        for (const f of faixas) {
            linhas.push({ distribuidora, vigencia_inicio: f.inicio, vigencia_fim: f.fim, tusd_rs_kwh: f.tusd, te_rs_kwh: f.te, soma_rs_kwh: f.tusd + f.te });
        }
    }
    grava_csv('escassez_hidrica_encargo.csv', ['distribuidora', 'vigencia_inicio', 'vigencia_fim', 'tusd_rs_kwh', 'te_rs_kwh', 'soma_rs_kwh'], linhas);
}
{
    const linhas = [];
    for (const [distribuidora, porCategoria] of Object.entries(FIO_B_TUSD)) {
        for (const [categoria, faixas] of Object.entries(porCategoria)) {
            for (const f of faixas) {
                linhas.push({ distribuidora, categoria, vigencia_inicio: f.inicio, vigencia_fim: f.fim, tusd_fio_b_rs_kwh: f.tusd });
            }
        }
    }
    grava_csv('fio_b_tusd.csv', ['distribuidora', 'categoria', 'vigencia_inicio', 'vigencia_fim', 'tusd_fio_b_rs_kwh'], linhas);
}

// 7. Parâmetros e chaves de comportamento (um valor por linha) -------------------
{
    const p = [];
    const add = (parametro, distribuidora, valor, descricao) => p.push({ parametro, distribuidora, valor, descricao });
    add('FAIXA_TARIFA_SOCIAL_KWH', '*', FAIXA_TARIFA_SOCIAL_KWH, 'kWh isentos na Baixa Renda (MP 1300)');
    add('FAIXA_DESCONTO_SOCIAL_KWH', '*', FAIXA_DESCONTO_SOCIAL_KWH, 'kWh com tarifa reduzida no B1CDE (Lei 15.235/2025)');
    add('CATEGORIA_DESCONTO_SOCIAL', '*', CATEGORIA_DESCONTO_SOCIAL, 'categoria do formulário tratada como Desconto Social');
    add('REPRODUZIR_FALLBACK_POSTO', '*', REPRODUZIR_FALLBACK_POSTO, 'true = Intermediário/Reservado da Tarifa Branca cobrados com tarifa de Ponta (comportamento antigo)');
    add('PERDA_RAMAL_BT', '*', 0.015, 'toggle Desconto BT: consumo x 0,985 arredondado para kWh inteiro (feito na tela, antes de chamar o motor)');
    for (const [d, v] of Object.entries(SUBVENCAO_INCLUI_BANDEIRA)) add('SUBVENCAO_INCLUI_BANDEIRA', d, v, 'bandeira entra na base da Subvenção/Valor Baixa Renda');
    for (const [d, v] of Object.entries(BENEFICIO_TARIFA_SOCIAL_INFORMATIVO)) add('BENEFICIO_TARIFA_SOCIAL_INFORMATIVO', d, v, 'mostra o informativo Benefício Tarifa Social');
    for (const [d, v] of Object.entries(ESCASSEZ_SO_TE_NA_FAIXA_SOCIAL)) add('ESCASSEZ_SO_TE_NA_FAIXA_SOCIAL', d, v, 'tarifa social: só o TE do encargo nos kWh com desconto');
    for (const [d, v] of Object.entries(ESCASSEZ_ARREDONDA_POR_COMPONENTE)) add('ESCASSEZ_ARREDONDA_POR_COMPONENTE', d, v, 'arredonda TUSD e TE do encargo separadamente');
    for (const [d, c] of Object.entries(SUDENE_CONFIG)) {
        add('SUDENE_TARIFA_BASE_KWH', d, c.tarifa_base_kwh, 'redutor SUDENE em R$/kWh (R$ 7,81/MWh)');
        add('SUDENE_INICIO_VIGENCIA', d, c.inicio_vigencia, 'início da vigência do redutor');
    }
    add('CONSUMO_MINIMO_MONOFASICO_KWH', '*', 30, 'consumo mínimo faturado (não vale para B4A/B4B)');
    add('CONSUMO_MINIMO_BIFASICO_KWH', '*', 50, 'idem');
    add('CONSUMO_MINIMO_TRIFASICO_KWH', '*', 100, 'idem');
    add('RESERVADO_IRRIGANTE_FATOR_TARIFA', '*', 0.4, 'consumo reservado do B2 irrigante paga 40% da tarifa');
    add('RETENCAO_PPF_PIS', '*', 0.0065, 'sobre a energia faturada (Poder Público Federal)');
    add('RETENCAO_PPF_CSLL', '*', 0.01, 'idem');
    add('RETENCAO_PPF_IR', '*', 0.012, 'idem');
    add('RETENCAO_PPF_COFINS', '*', 0.03, 'idem');
    add('RETENCAO_IR_PPE_E_B4A_SP', '*', 0.012, 'só Imposto de Renda (B3 PPE; B4A apenas em SP)');
    add('FIO_B_ESTIMATIVA_FRACAO_TUSD', '*', 0.45, 'usado quando não há TUSD Fio B publicada');
    add('TARIFA_B4A_ATUAL', 'ES', TARIFA_B4A.atual, 'base da CIP percentual, a partir de ' + TARIFA_B4A.data_troca);
    add('TARIFA_B4A_ANTERIOR', 'ES', TARIFA_B4A.anterior, 'base da CIP percentual, até a véspera da troca');
    grava_csv('parametros_regras.csv', ['parametro', 'distribuidora', 'valor', 'descricao'], p);
}

// 8. CIP por município (ES) ---------------------------------------------------------
{
    const mun = [];
    const faixas = [];
    for (const [chave, d] of Object.entries(CIP_MUNICIPIOS_ES)) {
        mun.push({
            municipio_chave: chave, municipio: d.nome, metodo: d.metodo, lei: d.lei ?? '', vigencia_lei: d.vigencia ?? '', nota: d.nota ?? d.incompativel ?? '',
            isenta_rural: !!d.isenta_rural, isenta_irrigante: !!d.isenta_irrigante, isenta_ppf: !!d.isenta_ppf, isenta_ppe: !!d.isenta_ppe
        });
        for (const [classe, lista] of Object.entries(d.faixas || {})) {
            let anterior = 0;
            for (const f of lista) {
                faixas.push({
                    municipio_chave: chave, classe, consumo_de_kwh_exclusivo: anterior, consumo_ate_kwh_inclusivo: f.max ?? '',
                    aliquota_sobre_tarifa_b4a: f.aliquota ?? '', valor_fixo_rs: f.valor ?? '', isento: !!f.isento
                });
                if (f.max !== null && f.max !== undefined) anterior = f.max;
            }
        }
    }
    grava_csv('cip_es_municipios.csv', ['municipio_chave', 'municipio', 'metodo', 'lei', 'vigencia_lei', 'nota', 'isenta_rural', 'isenta_irrigante', 'isenta_ppf', 'isenta_ppe'], mun);
    grava_csv('cip_es_faixas.csv', ['municipio_chave', 'classe', 'consumo_de_kwh_exclusivo', 'consumo_ate_kwh_inclusivo', 'aliquota_sobre_tarifa_b4a', 'valor_fixo_rs', 'isento'], faixas);

    // Arquivo único: uma linha por faixa, com os dados do município repetidos na
    // própria linha (é a junção de cip_es_municipios.csv e cip_es_faixas.csv).
    // Duas colunas extras ajudam a ler a tabela sem cair em pegadinhas:
    //   valor_rs_tarifa_b4a_atual - o valor da faixa em R$ com a Tarifa B4a vigente;
    //   usada_pelo_sistema        - 'false' nas linhas que o motor nunca usa (faixa
    //     repetida na tabela da prefeitura, classe sem categoria no formulário e
    //     classe Rural em município que isenta Rural), com o motivo em observacao_linha.
    {
        const campos_municipio = ['municipio_chave', 'municipio', 'metodo', 'lei', 'vigencia_lei', 'nota',
            'isenta_rural', 'isenta_irrigante', 'isenta_ppf', 'isenta_ppe'];
        const completo = [];
        const ordenados = [...mun].sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'));
        for (const m of ordenados) {
            const dele = faixas.filter((x) => x.municipio_chave === m.municipio_chave);
            if (dele.length === 0) {
                completo.push({
                    ...m, classe: '', consumo_de_kwh_exclusivo: '', consumo_ate_kwh_inclusivo: '',
                    aliquota_sobre_tarifa_b4a: '', valor_fixo_rs: '', isento: '', valor_rs_tarifa_b4a_atual: '',
                    usada_pelo_sistema: false,
                    observacao_linha: 'Sem tabela por faixa de kWh: a CIP é percentual do valor da fatura e fica manual no sistema'
                });
                continue;
            }
            const vistos = new Set();
            for (const x of dele) {
                const motivos = [];
                const limite = `${x.classe}|${x.consumo_ate_kwh_inclusivo}`;
                if (vistos.has(limite)) motivos.push('faixa repetida na tabela da prefeitura (o sistema usa a primeira com o mesmo limite)');
                vistos.add(limite);
                if (x.classe === 'INDUSTRIAL') motivos.push('classe Industrial não existe no formulário do Grupo B');
                if (x.classe === 'RURAL' && m.isenta_rural) motivos.push('o município isenta a classe Rural (CIP = R$ 0,00)');
                const nota = [];
                if (x.classe === 'RURAL' && m.isenta_irrigante && !m.isenta_rural) nota.push('Rural Irrigante é isento neste município');
                const valor = x.isento ? 0
                    : (x.valor_fixo_rs !== '' ? x.valor_fixo_rs : Math.round(x.aliquota_sobre_tarifa_b4a * TARIFA_B4A.atual * 100) / 100);
                completo.push({
                    ...m, classe: x.classe,
                    consumo_de_kwh_exclusivo: x.consumo_de_kwh_exclusivo, consumo_ate_kwh_inclusivo: x.consumo_ate_kwh_inclusivo,
                    aliquota_sobre_tarifa_b4a: x.aliquota_sobre_tarifa_b4a, valor_fixo_rs: x.valor_fixo_rs, isento: x.isento,
                    valor_rs_tarifa_b4a_atual: valor,
                    usada_pelo_sistema: motivos.length === 0,
                    observacao_linha: [...motivos, ...nota].join('; ')
                });
            }
        }
        grava_csv('cip_es_completo.csv', [...campos_municipio, 'classe', 'consumo_de_kwh_exclusivo', 'consumo_ate_kwh_inclusivo',
            'aliquota_sobre_tarifa_b4a', 'valor_fixo_rs', 'isento', 'valor_rs_tarifa_b4a_atual', 'usada_pelo_sistema', 'observacao_linha'], completo);
    }
}

// 9. Exemplos resolvidos (entrada -> saída do motor) --------------------------------
// Um JSON por linha. "ancoras" traz os valores impressos em fatura real / modelo
// oficial que cada cenário foi conferido contra (vazio nos cenários de
// travamento de comportamento).
{
    const linhas = CENARIOS.map((c) => {
        const { nome, params, ...ancoras } = c;
        const categoria = (params.categoria || 'B1C').toUpperCase();
        const distribuidora = (params.distribuidora || 'ES').toUpperCase();
        const tarifas = resolver_tarifas(distribuidora, categoria, new Date(params.data_leitura_anterior), new Date(params.data_leitura_atual));
        const resultado = calcular_fatura(params, normalizar_tarifas(tarifas, categoria));
        return JSON.stringify({ nome, entrada: params, ancoras_reais: ancoras, saida: resultado });
    });
    fs.writeFileSync(path.join(saida, 'exemplos_resolvidos.jsonl'), linhas.join('\n') + '\n', 'utf8');
    console.log(`exemplos_resolvidos.jsonl: ${linhas.length} linhas`);
}
