/**
 * Confere a simulação preliminar da Reforma Tributária (CBS/IBS) contra os dois
 * exemplos da aba "Modelo Reforma" das planilhas B1C recebidas da área.
 *
 * Uso: npm run verificar-reforma
 */
import { calcular_fatura, normalizar_tarifas, resolver_tarifas } from '../../src/modulos/conta-teste/motor/calculo.js';
import { calcular_reforma, reforma_vigente } from '../../src/modulos/conta-teste/motor/reforma.js';

let falhas = 0;
function conferir(nome, obtido, esperado, tolerancia = 0.005) {
    const ok = typeof esperado === 'number' ? Math.abs(obtido - esperado) <= tolerancia : obtido === esperado;
    if (!ok) falhas++;
    console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}: ${obtido}${ok ? '' : ` (esperado ${esperado})`}`);
}

function simular(extra) {
    const params = {
        distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
        data_leitura_anterior: '2026-04-07', data_leitura_atual: '2026-05-06',
        consumo_kwh: 155, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
        valor_cip: 13.51, ajustes: [], ...extra
    };
    const rows = normalizar_tarifas(
        resolver_tarifas(params.distribuidora, params.categoria, new Date(params.data_leitura_anterior), new Date(params.data_leitura_atual)),
        params.categoria
    );
    const atual = calcular_fatura(params, rows);
    return { atual, reforma: calcular_reforma(params, rows, atual) };
}

console.log('--- Modelo ES (155 kWh, amarela em 6 de 29 dias)');
{
    const { reforma } = simular({});
    const r = reforma.resumo;
    const valores = reforma.linhas.map((l) => l.valor_total);
    conferir('TUSD', valores[0], 97.49);
    conferir('TE', valores[1], 66.72);
    conferir('Bandeira amarela', valores[2], 0.81);
    conferir('CBS', r.valor_cbs, 13.89);
    conferir('IBS (municipal + estadual)', r.valor_ibs, 0.12);
    conferir('IBS Municipal (0,05%)', r.valor_ibs_municipal, 0.06);
    conferir('IBS Estadual (0,05%)', r.valor_ibs_estadual, 0.06);
    const [tusd] = reforma.linhas;
    conferir('Linha TUSD: IBS Municipal / IBS Estadual / CBS', `${tusd.valor_ibs_municipal} / ${tusd.valor_ibs_estadual} / ${tusd.valor_cbs}`, '0.04 / 0.04 / 8.21');
    conferir('ICMS', r.total_icms, 28.05);
    conferir('Linha TOTAL: coluna CBS/IBS', r.total_cbs_ibs, 14.02);
    conferir('Linha TOTAL: coluna Base do ICMS', r.total_base_icms, 165.02);
    conferir('Fio B (informativo)', r.valor_fio_b, 31.59);
    conferir('Total com CIP', r.total_fatura, 178.53);
    conferir('Total se CBS/IBS ficassem fora do ICMS (quadro "Fatura B1": 162,15 + CIP)', r.total_icms_sem_cbs_ibs, 175.66);
}

console.log('--- Modelo SP (232 kWh, amarela no período todo, taxa de -10,77)');
{
    // Tarifas digitadas no modelo (a vigência de lá ainda é provisória).
    const { reforma } = simular({
        distribuidora: 'SP', data_leitura_anterior: '2026-07-02', data_leitura_atual: '2026-08-03',
        consumo_kwh: 232, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA', valor_cip: 0,
        tarifas: { 'Não se aplica': { tusd: 0.45667, te: 0.33003 } },
        ajustes: [{ nome: 'Taxas', valor: -10.77 }]
    });
    const r = reforma.resumo;
    const valores = reforma.linhas.map((l) => l.valor_total);
    conferir('TUSD', valores[0], 143.94);
    conferir('TE', valores[1], 104.02);
    conferir('Bandeira amarela', valores[2], 5.94);
    conferir('CBS', r.valor_cbs, 21.12);
    conferir('IBS', r.valor_ibs, 0.19);
    conferir('ICMS', r.total_icms, 45.70);
    conferir('Linha TOTAL: coluna CBS/IBS', r.total_cbs_ibs, 21.31);
    conferir('Linha TOTAL: coluna Base do ICMS', r.total_base_icms, 253.89);
    conferir('Linha de ajuste', reforma.ajustes.map((a) => `${a.nome} ${a.valor}`).join(), 'Taxas -10.77');
    conferir('Total', r.total_fatura, 243.13);
}

console.log('--- Bandeira vermelha segue a regra nova (a planilha ainda usa a antiga)');
{
    // 155 kWh x 0,04463 = 6,92 líquido; x 1,114 / 0,83 = 9,28. A fórmula antiga daria 9,41.
    const { reforma } = simular({ bandeira_mes1: 'VERMELHA_P1', bandeira_mes2: 'VERMELHA_P1' });
    const linha = reforma.linhas.find((l) => l.nome.startsWith('Adic.Band. Vermelha'));
    conferir('Vermelha P1, 155 kWh', linha.valor_total, 9.29, 0.011);
}

console.log('--- O layout de 2027 vale pela data da leitura atual');
for (const [data, esperado] of [['2026-12-15', false], ['2026-12-31', false], ['2027-01-01', true], ['2027-04-06', true], ['', false]]) {
    conferir(`leitura atual ${data || '(em branco)'}`, reforma_vigente(data), esperado);
}

console.log('--- Situações sem regra definida não geram número');
for (const [nome, extra] of [
    ['Baixa Renda', { categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI' }],
    ['Desconto Social', { categoria: 'B1CDE' }],
    ['Rural', { categoria: 'B2RURAL' }],
    ['Poder Público Federal', { categoria: 'B3_PPF' }],
    ['SUDENE', { sudene: true, data_leitura_anterior: '2026-09-09', data_leitura_atual: '2026-10-08' }],
    ['Geração Distribuída', { gd_ativo: true, gd_papel: 'receptor', geradoras: [{ consumo: 50, percentual: 100, modalidade: 'GD1' }] }]
]) {
    const { reforma } = simular(extra);
    conferir(nome, Array.isArray(reforma.indisponivel) && reforma.indisponivel.length > 0, true);
}

console.log('');
if (falhas === 0) {
    console.log('Tudo certo: a simulação reproduz os dois exemplos da área.');
} else {
    console.log(`${falhas} verificação(ões) com divergência.`);
    process.exit(1);
}
