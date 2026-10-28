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

// 3. ICMS: faixas do residencial e padrão por estado -----------------------------
{
    const linhas = [];
    for (const [distribuidora, faixas] of Object.entries(ICMS_FAIXAS_RESIDENCIAL)) {
        let anterior = 0;
        for (const f of faixas) {
            linhas.push({
                distribuidora, regra: 'residencial_convencional_por_faixa',
                consumo_faturado_de_kwh_exclusivo: anterior, consumo_faturado_ate_kwh_inclusivo: Number.isFinite(f.ate) ? f.ate : '', aliquota_icms: f.aliquota
            });
            anterior = f.ate;
        }
    }
    for (const [distribuidora, aliquota] of Object.entries(ICMS_PADRAO)) {
        linhas.push({ distribuidora, regra: 'padrao_demais_categorias', consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '', aliquota_icms: aliquota });
    }
    linhas.push({ distribuidora: 'ES', regra: 'rural_e_irrigante', consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '', aliquota_icms: 0.04 });
    linhas.push({ distribuidora: 'SP', regra: 'rural_e_irrigante', consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '', aliquota_icms: 0.12 });
    linhas.push({ distribuidora: 'ES', regra: 'b3_cp_isento', consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '', aliquota_icms: 0 });
    linhas.push({ distribuidora: '*', regra: 'b3_ppe_isento', consumo_faturado_de_kwh_exclusivo: '', consumo_faturado_ate_kwh_inclusivo: '', aliquota_icms: 0 });
    grava_csv('icms_regras.csv', ['distribuidora', 'regra', 'consumo_faturado_de_kwh_exclusivo', 'consumo_faturado_ate_kwh_inclusivo', 'aliquota_icms'], linhas);
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
