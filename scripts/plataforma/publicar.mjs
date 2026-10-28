/**
 * Publica na Vercel separando PRODUÇÃO (só o que foi validado) de TESTE (tudo
 * que foi adicionado, tenha passado ou não pela validação da área).
 *
 *   npm run publicar            -> produção  (só da branch main, árvore limpa,
 *                                  com os testes de regressão passando)
 *   npm run publicar:teste      -> teste     (qualquer branch; gera um link
 *                                  de preview, nunca mexe na produção)
 *
 * Flags (depois de "--"):  --dry-run  mostra o que faria, sem publicar
 *                          --yes      pula a confirmação da produção
 *
 * Por que existe: o antigo `vercel --prod` direto subia a PASTA como estava,
 * de qualquer branch e mesmo com alteração não commitada - bastava um
 * esquecimento para uma regra não validada ir parar no link do time.
 *
 * Ver a seção "Produção x Teste" do README.
 */
import { execSync, spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const modo = process.argv[2];
const dry = process.argv.includes('--dry-run');
const sim = process.argv.includes('--yes');

/** Endereço fixo do link de teste (alias *.vercel.app). Falhar não impede o deploy. */
const ALIAS_TESTE = 'sistema-conta-teste-teste.vercel.app';

function falhar(msg) {
    console.error(`\n✗ ${msg}\n`);
    process.exit(1);
}

function git(args) {
    try {
        return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return '';
    }
}

function rodar(titulo, comando, argumentos) {
    console.log(`\n▶ ${titulo}`);
    const r = spawnSync(comando, argumentos, { stdio: 'inherit', shell: true });
    return r.status === 0;
}

if (modo !== 'producao' && modo !== 'teste') {
    falhar('Uso: node scripts/publicar.mjs <producao|teste> [--dry-run] [--yes]');
}

const branch = git('rev-parse --abbrev-ref HEAD');
const sha = git('rev-parse --short HEAD');
const sujo = git('status --porcelain') !== '';

console.log(`Modo: ${modo.toUpperCase()}   branch: ${branch || '?'}   commit: ${sha || '?'}${sujo ? '   (com alterações não commitadas)' : ''}`);

// ------------------------------------------------------------ travas
if (modo === 'producao') {
    if (branch !== 'main') {
        falhar(
            `Produção só publica da branch "main" (você está em "${branch}").\n` +
            `  Para levar o que já foi validado: git checkout main  e depois\n` +
            `  git cherry-pick <commit validado>  (ou git merge teste, se tudo foi validado).\n` +
            `  Para só mostrar a versão nova ao time, use: npm run publicar:teste`
        );
    }
    if (sujo) {
        falhar('Há alterações não commitadas. Produção só publica o que está commitado em "main" - faça o commit (ou guarde com git stash) e rode de novo.');
    }
} else if (branch === 'main') {
    console.log('\n⚠ Você está na "main" (produção). Um deploy de teste daqui só mostra o que já está validado - o trabalho novo fica na branch "teste".');
}

// ------------------------------------------------------------ regressão
const comRegressao = rodar('Regressão dos cenários (npm run verificar)', 'node', ['scripts/verificar.mjs']);
const comCip = rodar('Regressão da CIP por município (npm run verificar-cip)', 'node', ['scripts/verificar-cip.mjs']);
const passou = comRegressao && comCip;

if (!passou) {
    if (modo === 'producao') {
        falhar('A regressão falhou - produção não será publicada. Corrija (ou, se a mudança de valor foi proposital, recapture scripts/referencia.json) e rode de novo.');
    }
    console.log('\n⚠ A regressão falhou. Para teste isso é permitido - o link vai mostrar o que está em andamento -, mas avise quem for usar.');
}

if (modo === 'producao') {
    const naoEnviados = git('rev-list --count origin/main..HEAD');
    if (naoEnviados && naoEnviados !== '0') {
        console.log(`\n⚠ A "main" local tem ${naoEnviados} commit(s) que ainda não estão no GitHub (git push origin main). A produção sobe do seu computador, então vai incluir eles.`);
    }
}

// ------------------------------------------------------------ confirmação
if (dry) {
    console.log(`\n(dry-run) Publicaria em ${modo.toUpperCase()} com: npx --yes vercel deploy${modo === 'producao' ? ' --prod' : ''} -m ambiente=${modo} -m commit=${sha}${sujo ? '-sujo' : ''}`);
    if (modo === 'teste') console.log(`(dry-run) e tentaria apontar ${ALIAS_TESTE} para o link novo.`);
    process.exit(0);
}

if (modo === 'producao' && !sim) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const resposta = await rl.question('\nIsto atualiza o link que o time usa. Tudo que está nesta "main" foi validado? Digite PRODUCAO para confirmar: ');
    rl.close();
    if (resposta.trim() !== 'PRODUCAO') falhar('Cancelado - nada foi publicado.');
}

// ------------------------------------------------------------ deploy
const marca = `${sha}${sujo ? '-sujo' : ''}`;
const args = ['--yes', 'vercel', 'deploy'];
if (modo === 'producao') args.push('--prod');
args.push('-m', `ambiente=${modo}`, '-m', `commit=${marca}`);

console.log(`\n▶ Publicando (${modo})…`);
const deploy = spawnSync('npx', args, { stdio: ['inherit', 'pipe', 'inherit'], shell: true, encoding: 'utf8' });
if (deploy.status !== 0) falhar('A publicação na Vercel falhou (veja a mensagem acima).');

const saida = (deploy.stdout || '').trim();
const url = saida.split(/\s+/).filter((t) => t.startsWith('https://')).pop() || saida;
console.log(`\n✓ ${modo === 'producao' ? 'Produção' : 'Teste'} publicado: ${url}`);

if (modo === 'teste' && url.startsWith('https://')) {
    const ok = rodar(`Apontando ${ALIAS_TESTE} para o link novo`, 'npx', ['--yes', 'vercel', 'alias', 'set', url, ALIAS_TESTE]);
    if (ok) console.log(`\n✓ Link fixo de teste: https://${ALIAS_TESTE}`);
    else console.log(`\n⚠ Não consegui fixar o endereço ${ALIAS_TESTE} (nome já em uso, ou sem permissão). O link acima continua válido.`);
}
