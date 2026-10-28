/**
 * Diagnóstico de rede do Simulador.
 * Uso: npm run rede
 *
 * Identifica em qual rede a máquina está (doméstica ou EDP/VPN) e monta o
 * link correto para enviar aos colegas.
 */
import os from 'node:os';
import net from 'node:net';

const PORTA = Number(process.env.PORT) || 3020;

function classificar(ip) {
  if (/^10\./.test(ip)) return 'corporativa';
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 'corporativa';
  if (/^192\.168\./.test(ip)) return 'domestica';
  return 'publica';
}

function servidorNoAr(porta) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: porta });
    socket.setTimeout(1500);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

(async () => {
  const noAr = await servidorNoAr(PORTA);

  const enderecos = [];
  for (const [nome, infos] of Object.entries(os.networkInterfaces())) {
    for (const info of infos || []) {
      if (info.family !== 'IPv4' || info.internal) continue;
      if (info.address.startsWith('169.254.')) continue; // adaptador sem rede
      enderecos.push({ nome, ip: info.address, tipo: classificar(info.address) });
    }
  }

  const corporativos = enderecos.filter((e) => e.tipo === 'corporativa');
  const domesticos = enderecos.filter((e) => e.tipo === 'domestica');

  console.log('');
  console.log('=========================================================');
  console.log('  Simulador de Faturas EDP - Diagnóstico de Acesso');
  console.log('=========================================================');
  console.log(`  Servidor na porta ${PORTA} .: ${noAr ? 'NO AR' : 'PARADO (rode: npm start)'}`);
  console.log(`  VPN / rede EDP ......: ${corporativos.length > 0 ? 'CONECTADA' : 'NÃO DETECTADA'}`);
  console.log('');

  console.log('  LINKS');
  console.log('  -----');
  console.log(`  Nesta máquina .......: http://localhost:${PORTA}`);
  for (const { nome, ip, tipo } of enderecos) {
    const marca = tipo === 'corporativa' ? '<-- ENVIAR ESTE' : '';
    console.log(`  ${nome.padEnd(20)}: http://${ip}:${PORTA} ${marca}`);
  }
  if (enderecos.length === 0) console.log('  Nenhuma placa de rede ativa encontrada.');
  console.log('');

  if (corporativos.length > 0) {
    console.log('  PARA OS COLEGAS NA REDE EDP / VPN');
    console.log('  ---------------------------------');
    console.log('  Envie o link marcado acima. Para funcionar, é preciso que:');
    console.log(`  1. a porta ${PORTA} esteja liberada na ENTRADA do Windows Firewall`);
    console.log('     (regra de GPO - solicite ao TI, não dá para criar localmente);');
    console.log('  2. a VPN permita tráfego entre clientes (client-to-client);');
    console.log('  3. esta máquina fique ligada, com a VPN conectada e o npm start rodando.');
    console.log('');
    console.log('  ATENÇÃO: o IP da VPN muda a cada reconexão. Para ter um endereço');
    console.log('  fixo, a aplicação precisa ser publicada num servidor da EDP.');
    console.log('');
  } else if (domesticos.length > 0) {
    console.log('  ATENÇÃO - VOCÊ ESTÁ FORA DA REDE EDP');
    console.log('  ------------------------------------');
    console.log('  Os IPs acima são da sua rede local (roteador de casa). Eles não');
    console.log('  existem para ninguém de fora. Colegas na rede da EDP ou na VPN');
    console.log('  NÃO conseguem abrir esse link: a VPN leva o colega para dentro da');
    console.log('  EDP, e esta máquina não está lá.');
    console.log('');
    console.log('  O cliente Netskope não resolve isto: ele inspeciona o tráfego de');
    console.log('  SAÍDA e não atribui IP da rede EDP a esta máquina, nem aceita');
    console.log('  conexões de entrada vindas de colegas.');
    console.log('');
    console.log('  Para compartilhar a partir daqui, use o túnel:  npm run share');
    console.log('');
  }

  console.log(`  Teste rápido a partir do PC do colega:  curl -v http://SEU_IP:${PORTA}`);
  console.log('=========================================================');
  console.log('');
})();
