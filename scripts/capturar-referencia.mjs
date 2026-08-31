/**
 * Roda a bateria de cenários contra a API que estiver no ar e grava o
 * resultado em scripts/referencia.json.
 *
 * Uso: node scripts/capturar-referencia.mjs [porta]
 *
 * Serve para congelar o comportamento atual antes de mexer no motor e depois
 * comparar com `npm run verificar`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CENARIOS } from './cenarios.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const porta = process.argv[2] || '3020';

const referencia = [];

for (const cenario of CENARIOS) {
    const resposta = await fetch(`http://127.0.0.1:${porta}/api/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cenario.params)
    });

    const corpo = await resposta.json();
    if (!resposta.ok || corpo.erro) {
        console.error(`FALHOU: ${cenario.nome} -> ${corpo.erro || resposta.status}`);
        process.exit(1);
    }

    // fonte_tarifas não existia na versão antiga; fora da comparação.
    delete corpo.fonte_tarifas;
    referencia.push({ nome: cenario.nome, resultado: corpo });
    console.log(`ok  ${cenario.nome}  -> total R$ ${corpo.resumo.total_fatura}`);
}

const destino = path.join(raiz, 'scripts', 'referencia.json');
fs.writeFileSync(destino, JSON.stringify(referencia, null, 2), 'utf8');
console.log(`\n${referencia.length} cenários gravados em ${path.relative(raiz, destino)}`);
