/**
 * Compara o motor compartilhado (com as tarifas locais) contra o retrato do
 * comportamento antigo gravado em scripts/referencia.json.
 *
 * Uso: npm run verificar
 *      npm run verificar -- --api 3020    (compara também com a API no ar)
 *
 * Qualquer divergência de centavo aparece aqui.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CENARIOS } from './cenarios.mjs';
import { calcular_fatura, normalizar_tarifas, resolver_tarifas } from '../src/lib/motor/calculo.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referencia = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts', 'referencia.json'), 'utf8'));

const idx = process.argv.indexOf('--api');
const porta_api = idx >= 0 ? process.argv[idx + 1] : null;

/**
 * Diferença máxima aceita contra uma fatura real ou modelo oficial, definida
 * pela área na validação: R$ 0,03.
 *
 * O simulador calcula o total do imposto por dentro e distribui entre as
 * linhas; o sistema da EDP bruteia linha a linha, arredondando a cada uma.
 * Isso gera até dois centavos de diferença conforme a composição da conta -
 * as próprias faturas são internamente inconsistentes nesse ponto, com preços
 * unitários impressos que implicam divisores diferentes entre linhas.
 */
const TOLERANCIA_PADRAO = 0.03;

function diferencas(esperado, obtido, caminho = '') {
    const achados = [];

    if (esperado === obtido) return achados;

    if (typeof esperado === 'number' && typeof obtido === 'number') {
        if (Math.abs(esperado - obtido) > 1e-9) {
            achados.push(`${caminho}: esperado ${esperado}, obtido ${obtido}`);
        }
        return achados;
    }

    if (Array.isArray(esperado) || Array.isArray(obtido)) {
        if (!Array.isArray(esperado) || !Array.isArray(obtido)) {
            achados.push(`${caminho}: tipos diferentes`);
            return achados;
        }
        if (esperado.length !== obtido.length) {
            achados.push(`${caminho}: ${esperado.length} linhas esperadas, ${obtido.length} obtidas`);
        }
        for (let i = 0; i < Math.max(esperado.length, obtido.length); i++) {
            achados.push(...diferencas(esperado[i], obtido[i], `${caminho}[${i}]`));
        }
        return achados;
    }

    if (esperado && obtido && typeof esperado === 'object' && typeof obtido === 'object') {
        for (const chave of new Set([...Object.keys(esperado), ...Object.keys(obtido)])) {
            achados.push(...diferencas(esperado[chave], obtido[chave], caminho ? `${caminho}.${chave}` : chave));
        }
        return achados;
    }

    achados.push(`${caminho}: esperado ${JSON.stringify(esperado)}, obtido ${JSON.stringify(obtido)}`);
    return achados;
}

function calcular_local(params) {
    const distribuidora = (params.distribuidora || 'ES').toUpperCase();
    const categoria = (params.categoria || 'B1C').toUpperCase();
    const linhas = resolver_tarifas(
        distribuidora,
        categoria,
        new Date(params.data_leitura_anterior),
        new Date(params.data_leitura_atual)
    );
    return calcular_fatura(params, normalizar_tarifas(linhas, categoria));
}

let falhas = 0;

for (const cenario of CENARIOS) {
    const esperado = referencia.find((r) => r.nome === cenario.nome)?.resultado;
    if (!esperado) {
        console.log(`SEM REFERÊNCIA  ${cenario.nome}`);
        falhas++;
        continue;
    }

    const obtido = calcular_local(cenario.params);

    // Cenários ancorados em fatura real ou em modelo oficial são conferidos
    // contra o total de fora, não só contra a referência gravada.
    const ancora = cenario.fatura_real ?? cenario.modelo_oficial;
    if (ancora !== undefined) {
        const rotulo = cenario.fatura_real !== undefined ? 'fatura real ' : 'modelo EDP  ';
        const limite = cenario.tolerancia ?? TOLERANCIA_PADRAO;
        const dif = obtido.resumo.total_fatura - ancora;
        if (Math.abs(dif) > limite) {
            falhas++;
            console.log(`FALHA ${rotulo} ${cenario.nome}`);
            console.log(`        total do motor ${obtido.resumo.total_fatura.toFixed(2)} vs ${ancora.toFixed(2)} (dif ${dif.toFixed(2)})`);
        } else {
            console.log(`ok    ${rotulo} ${cenario.nome} -> R$ ${ancora.toFixed(2)}`);
        }
    }

    const achados = diferencas(esperado, obtido);
    if (achados.length === 0) {
        console.log(`ok    motor local   ${cenario.nome}`);
    } else {
        falhas++;
        console.log(`FALHA motor local   ${cenario.nome}`);
        achados.slice(0, 6).forEach((d) => console.log(`        ${d}`));
        if (achados.length > 6) console.log(`        ... e mais ${achados.length - 6}`);
    }

    if (porta_api) {
        const resposta = await fetch(`http://127.0.0.1:${porta_api}/api/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cenario.params)
        });
        const corpo = await resposta.json();
        const fonte = corpo.fonte_tarifas;
        delete corpo.fonte_tarifas;

        const achados_api = diferencas(esperado, corpo);
        if (achados_api.length === 0) {
            console.log(`ok    API (${fonte})    ${cenario.nome}`);
        } else {
            falhas++;
            console.log(`FALHA API (${fonte})    ${cenario.nome}`);
            achados_api.slice(0, 6).forEach((d) => console.log(`        ${d}`));
        }
    }
}

console.log('');
if (falhas === 0) {
    console.log(`Tudo idêntico à referência: ${CENARIOS.length} cenários.`);
} else {
    console.log(`${falhas} verificação(ões) com divergência.`);
    process.exit(1);
}
