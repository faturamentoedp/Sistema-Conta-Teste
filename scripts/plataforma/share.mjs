/**
 * Publica o simulador num link público (localtunnel).
 * Uso: npm run share
 *
 * O cliente Netskope faz inspeção TLS e reassina o HTTPS com a CA corporativa.
 * O Node não usa o repositório de certificados do Windows, então o localtunnel
 * falha com "self-signed certificate in certificate chain". Este wrapper sobe o
 * túnel com a CA da empresa carregada.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = process.env.PORT || '3020';
const SUBDOMINIO = process.env.SUBDOMINIO || 'simulador-faturas-edp';

const cliente = path.join(raiz, 'node_modules', 'localtunnel', 'bin', 'client');
if (!existsSync(cliente)) {
    console.error('localtunnel não encontrado. Rode "npm install" antes.');
    process.exit(1);
}

const env = { ...process.env };
env.NODE_OPTIONS = [env.NODE_OPTIONS, '--use-system-ca'].filter(Boolean).join(' ');

const ca_corporativa = path.join(raiz, 'certs', 'edp-ca.pem');
if (existsSync(ca_corporativa)) {
    env.NODE_EXTRA_CA_CERTS = ca_corporativa;
}

console.log('');
console.log(`Abrindo túnel para http://localhost:${PORTA} (subdomínio: ${SUBDOMINIO})`);
console.log('CA corporativa carregada. Deixe esta janela aberta enquanto o time usa o link.');
console.log('O túnel reconecta sozinho se cair. Para encerrar de vez, Ctrl+C.');
console.log('');

// O localtunnel derruba a conexão sozinho (ociosidade, oscilação de rede, o 403
// intermitente do Netskope). Como o subdomínio é fixo, reconectar devolve
// exatamente a mesma URL - o colega nem precisa de link novo.
let encerrando = false;
let quedas = 0;

function abrirTunel() {
    const tunel = spawn(process.execPath, [cliente, '--port', PORTA, '--subdomain', SUBDOMINIO], {
        env,
        stdio: 'inherit'
    });

    tunel.on('exit', (codigo) => {
        if (encerrando) return process.exit(codigo ?? 0);

        quedas += 1;
        const espera = Math.min(3 + quedas * 2, 15);
        console.log('');
        console.log(`[túnel caiu - queda nº ${quedas}] reconectando em ${espera}s...`);
        setTimeout(abrirTunel, espera * 1000);
    });
}

process.on('SIGINT', () => {
    encerrando = true;
    console.log('\nTúnel encerrado. O link deixa de funcionar até você rodar "npm run share" de novo.');
    process.exit(0);
});

abrirTunel();
