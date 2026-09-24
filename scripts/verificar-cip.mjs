/**
 * Regressão da CIP por município (ES). Casos ancorados nos valores impressos
 * na planilha oficial "Atualização valores CIP no site Agosto 2026" -
 * conferidos um a um (aliquota x Tarifa B4a == "VALOR CIP (R$)" da planilha)
 * antes de entrar no simulador. Ver docs/cip-municipios-es-extraido.json
 * para os dados brutos e src/lib/motor/cip-municipios.js para a regra.
 *
 * Uso: node scripts/verificar-cip.mjs
 */
import { calcular_cip_municipio } from '../src/lib/motor/cip-municipios.js';

const DATA_APOS_VIGENCIA = [new Date('2026-08-21'), new Date('2026-09-20')]; // 100% na tarifa B4a nova (464,04)
const DATA_ANTES_VIGENCIA = [new Date('2026-06-21'), new Date('2026-07-20')]; // 100% na tarifa antiga (434,13)

const CASOS = [
    // categoria B1C -> classe RESIDENCIAL
    { nome: 'AFONSO CLAUDIO, B1C, 100 kWh (faixa 70-100)', municipio: 'AFONSO CLAUDIO', categoria: 'B1C', consumo: 100, esperado: 13.36 },
    { nome: 'AFONSO CLAUDIO, B1C, 30 kWh (limite da faixa 0-30, inclusive)', municipio: 'AFONSO CLAUDIO', categoria: 'B1C', consumo: 30, esperado: 4.83 },
    { nome: 'AFONSO CLAUDIO, B1C, 31 kWh (primeiro kWh da faixa seguinte)', municipio: 'AFONSO CLAUDIO', categoria: 'B1C', consumo: 31, esperado: 5.1 },
    { nome: 'IBITIRAMA, B1C, 100 kWh', municipio: 'IBITIRAMA', categoria: 'B1C', consumo: 100, esperado: 18.56 },
    { nome: 'ITAGUACU, B1C_TB, 550 kWh (categoria com sufixo _TB cai na mesma classe)', municipio: 'ITAGUACU', categoria: 'B1C_TB', consumo: 550, esperado: 72.39 },

    // Baixa Renda MP1300 -> classe RESIDENCIAL BAIXA RENDA
    { nome: 'CARIACICA, Baixa Renda, 70 kWh', municipio: 'CARIACICA', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', consumo: 70, esperado: 7.84 },
    { nome: 'GUARAPARI, Baixa Renda, 60 kWh (isento nessa faixa)', municipio: 'GUARAPARI', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', consumo: 60, esperado: 0 },
    { nome: 'GUARAPARI, Baixa Renda, 80 kWh (faixa acima de 70, já cobra)', municipio: 'GUARAPARI', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', consumo: 80, esperado: 6.73 },

    // B1CDE (Desconto Social Lei 15.235) -> classe RESIDENCIAL (não Baixa Renda) - decisão validada com a área em 24/09/2026
    { nome: 'AFONSO CLAUDIO, B1CDE, 100 kWh (mesma classe do B1C comum)', municipio: 'AFONSO CLAUDIO', categoria: 'B1CDE', consumo: 100, esperado: 13.36 },

    // B2RURAL/B2RUIRRG -> classe RURAL, com fallback pra DEMAIS CLASSES onde não existe
    { nome: 'GUARAPARI, B2RURAL, 250 kWh (município com classe Rural própria)', municipio: 'GUARAPARI', categoria: 'B2RURAL', consumo: 250, esperado: 64.97 },
    { nome: 'AFONSO CLAUDIO, B2RUIRRG, 100 kWh (sem classe Rural -> cai em Demais Classes)', municipio: 'AFONSO CLAUDIO', categoria: 'B2RUIRRG', consumo: 100, esperado: 28.03 },

    // B3/B4A e demais - DEMAIS CLASSES, e B4A isento
    { nome: 'DORES DO RIO PRETO, B3, 40 kWh (lei vigente 1078/2025, não a antiga 867/2019)', municipio: 'DORES DO RIO PRETO', categoria: 'B3', consumo: 40, esperado: 19.54 },
    { nome: 'GUARAPARI, B4A, 100 kWh (iluminação pública isenta)', municipio: 'GUARAPARI', categoria: 'B4A', consumo: 100, esperado: 0 },

    // Município não cadastrado -> não trava, devolve null pra manter manual
    { nome: 'Município inexistente devolve null (fica manual)', municipio: 'MUNICIPIO_QUE_NAO_EXISTE', categoria: 'B1C', consumo: 100, esperado: null },
];

let falhas = 0;
for (const c of CASOS) {
    const resultado = calcular_cip_municipio(c.municipio, c.categoria, c.consumo, ...DATA_APOS_VIGENCIA);
    const bateu = c.esperado === null ? resultado === null : Math.abs(resultado - c.esperado) < 0.005;
    console.log(`${bateu ? 'ok  ' : 'FALHA'}  ${c.nome} -> ${resultado} (esperado ${c.esperado})`);
    if (!bateu) falhas++;
}

// Rateio da Tarifa B4a pela vigência (07/08/2026) - mesmo criterio de dias das outras tarifas do ES
const antesVigencia = calcular_cip_municipio('AFONSO CLAUDIO', 'B1C', 100, ...DATA_ANTES_VIGENCIA);
const esperadoAntes = Math.round(0.0288 * 434.13 * 100) / 100;
const bateuAntes = Math.abs(antesVigencia - esperadoAntes) < 0.005;
console.log(`${bateuAntes ? 'ok  ' : 'FALHA'}  AFONSO CLAUDIO, B1C, 100 kWh, antes de 07/08/2026 (tarifa B4a antiga) -> ${antesVigencia} (esperado ${esperadoAntes})`);
if (!bateuAntes) falhas++;

if (falhas > 0) {
    console.log(`\n${falhas} caso(s) de CIP por município divergiram.`);
    process.exit(1);
} else {
    console.log(`\nTudo certo: ${CASOS.length + 1} casos de CIP por município confirmados.`);
}
