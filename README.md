# ⚡ Simulador de Faturas de Energia EDP

Um sistema analítico corporativo desenvolvido para simular, auditar e prever faturas de energia elétrica com base em diversas categorias tarifárias, modalidades de Geração Distribuída (GDs) e resoluções tributárias brasileiras.

![Next.js](https://img.shields.io/badge/Framework-Next.js-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/Library-React-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![SQL Server](https://img.shields.io/badge/Database-SQL_Server-red?style=for-the-badge&logo=microsoft-sql-server)

---

## 📖 Sobre o Projeto
Este sistema substitui planilhas de cálculo complexas por uma interface web moderna e um motor de cálculo centralizado. Ele suporta desde clientes **Convencionais** até regras complexas de categorias **Rurais e Irrigantes** (com descontos específicos no consumo reservado), **Tarifas Brancas** (Postos Ponta, Intermediário e Fora Ponta) e modalidades avançadas de **Geração Distribuída (GD)**.

O cálculo leva em conta as regras oficiais de "imposto por dentro", detalhando de forma exata a formação do ICMS, PIS, COFINS, CIP, repasses de Bandeiras Tarifárias proporcionais e o item informativo do **Fio B**.

---

## ⚡ Módulos & Categorias Desenvolvidas

### 🟢 Geografias
- **EDP ES (Espírito Santo):** 100% operacional no banco Azure SQL.
- **EDP SP (São Paulo):** Mapeado na aplicação (aguardando cadastro na base tarifária do SQL).

### 🟢 Categorias & GDs Operacionais
- **B1C:** Residencial Convencional, **B1C Gerar (Isento TUSG/TE)**, Tarifa Branca, **B1C GD1**, **B1C GD2** e **B1C GD3** (Lei 14.300 / Fio B).
- **B1BR:** Baixa Renda Convencional e **Baixa Renda GD (exclusivo GD1)** (com isenção de ICMS até 90 kWh no ES).
- **B2RURAL & B2RUIRRG:** Rural Convencional, **B2 Rural Gerar (Isento TUSG/TE)**, **B2 Irrigação Gerar (Isento TUSG/TE)**, Tarifa Branca e **Irrigante GD** (com desconto legal de 60% no Consumo Reservado).
- **Tarifa Branca GD:** Suporte a compensação multihorária com GD1 (**exclusivo GD1** para Tarifa Branca e Baixa Renda).
- **B3:** Comercial e Demais Classes (Convencional e Tarifa Branca).
- **Fio B Informativo:** Exibição dedicada da parcela TUSD Fio B em tela (sem impactar o valor final da fatura).

---

## ⚙️ Base Tarifária e Vigências

As tarifas vêm do **export oficial da ANEEL**, não mais do SQL Server. O script `scripts/exportar-vigencias.py` lê os arquivos exportados (um por distribuidora), pega as linhas *Tarifa de Aplicação* e gera `src/lib/motor/vigencias.js`, organizado por **período de vigência** — inclusive sub-períodos dentro da mesma resolução, como a REH 3.541 de SP, que muda o TE em 01/01/2026.

Quando o período de leitura cruza a virada de uma resolução, a tarifa sai **ponderada pelos dias em cada vigência**. O período de faturamento é aberto na leitura anterior e fechado na atual: numa leitura de 24/07 a 25/08/2026, com virada em 07/08, são 13 dias na tarifa antiga e 19 na nova — exatamente como o modelo oficial da EDP conta.

```bash
python scripts/exportar-vigencias.py "export_ES.xlsx" "export_SP.xlsx"
```

## 🔆 Geração Distribuída (MMGD)

A unidade pode ser marcada como **geradora** (apenas injeta, não recebe compensação nesta fatura) ou **receptora**. Uma receptora pode receber rateio de **várias geradoras**, cada uma com o seu consumo, percentual de rateio e enquadramento próprio.

A energia injetada entra como linhas negativas, com dois tratamentos tributários distintos, conforme os modelos oficiais:
- **TUSD injetada** — sem ICMS, o preço unitário é bruteado só por PIS/COFINS;
- **TE injetada** — com ICMS, igual ao consumo.

O quanto a injeção abate depende do enquadramento: **GD1** compensa 100%; **GD2** compensa 73,9% do TUSD até 06/08/2026 e 75,22% a partir daí — o que sobra é o Fio B. **Baixa Renda e Tarifa Branca faturam sempre como GD1**, e o formulário fixa isso automaticamente.

> ⚠️ **GD3 ainda não tem percentual definido.** Os modelos oficiais recebidos cobrem apenas GD1 e GD2. Selecionar GD3 devolve erro explícito em vez de calcular um número inventado. Para habilitar, preencha `PERC_REDUCAO_GD.GD3` em `src/lib/motor/tarifas-aneel.js`.

## 🛠️ Stack Tecnológica (Frameworks)
- **[Next.js](https://nextjs.org/)** (App Router): O principal framework da aplicação fullstack.
- **React**: Biblioteca de construção de interfaces de usuário (*UI*).
- **TypeScript**: Adiciona tipagem estática, prevenindo falhas lógicas e estruturais antes do build.
- **Tailwind CSS**: Framework utilitário de CSS usado para construir a estética moderna e responsiva.
- **MSSQL**: Driver Node.js para conexão segura e criptografada com o Azure SQL Database.

---

## 🚀 Como Executar o Sistema

Para rodar o simulador em redes corporativas ou disponibilizar o acesso a outros PCs/celulares na mesma rede Wi-Fi, siga o protocolo de Produção abaixo:

### 1. Pré-requisitos
Certifique-se de que o [Node.js](https://nodejs.org/) está instalado na máquina.
Garanta que o arquivo contendo as credenciais (`.env.local`) está presente na raiz do projeto:
```env
DB_SERVER=seu_servidor.database.windows.net
DB_DATABASE=seu_banco
DB_USER=seu_usuario
DB_PASSWORD="sua_senha"
```

### 2. Instalação (Apenas na 1ª Vez)
Abra o **Prompt de Comando (CMD)** (evite PowerShell devido a restrições de *ExecutionPolicy*) e digite:
```bash
npm install
```

### 3. Rodando o Motor Estável (Modo Produção)
Para redes locais funcionarem sem congelamento de tela (*Turbopack Error*), execute o comando compilado:
```bash
npm run build && npm start
```
O servidor sobe na **porta 3020**, escutando em `0.0.0.0` (todas as placas de rede). Após a mensagem `Ready`, acesse no navegador:
- **Local:** `http://localhost:3020`
- **Rede:** `http://IP_DA_MAQUINA:3020`

Para descobrir o IP da máquina e conferir os links prontos para enviar:
```bash
npm run rede
```

---

## ☁️ Publicando na Vercel (URL fixa para todo o time)

Esta é a forma recomendada de dar acesso aos colegas: um endereço permanente, com HTTPS, que abre no escritório, em casa, na VPN e no celular — sem depender de nenhuma máquina ligada.

### Por que é seguro publicar
O simulador **não leva o banco junto**. As tarifas são um retrato gerado por `npm run tarifas` e gravado em `src/lib/motor/tarifas.js`. Se `DB_SERVER` não estiver definido, a aplicação usa esse retrato e o `mssql` nem é carregado. Ou seja: **nenhuma credencial e nenhum acesso ao Azure SQL vão para a Vercel** — só tarifas da ANEEL, que são públicas.

O `.vercelignore` já exclui `.env.local`, `certs/`, planilhas, bases e os scripts que tocam a rede corporativa.

> ⚠️ Duas coisas para alinhar antes: é uma plataforma externa, e a aplicação exibe a **logo da EDP**. Publicar material de marca da empresa numa conta pessoal é decisão que vale confirmar com seu gestor.

### Passo a passo

**1.** Crie a conta em [vercel.com/signup](https://vercel.com/signup) (o plano Hobby, gratuito, atende de sobra). A criação da conta e o login são feitos por você.

**2.** Na pasta do projeto, faça login pela linha de comando:
```bash
npx vercel login
```

**3.** Publique. Na primeira vez ele faz algumas perguntas — pode aceitar todos os padrões, só confira que o *framework* detectado é **Next.js**:
```bash
npx vercel
```

**4.** Gere a versão de produção, que é a URL definitiva:
```bash
npx vercel --prod
```
No fim ele imprime o endereço, algo como `https://simulador-faturas-edp.vercel.app`. **Esse é o link do time** — não muda mais.

### Protegendo com senha (recomendado)
Sem isso, qualquer pessoa com o link acessa. Para exigir senha:
```bash
npx vercel env add APP_SENHA production
```
Digite a senha combinada quando ele pedir e publique de novo com `npx vercel --prod`. O navegador passa a pedir usuário e senha — o usuário pode ser qualquer coisa, só a senha é conferida.

> ❌ **Não** cadastre `DB_SERVER`, `DB_USER`, `DB_PASSWORD` ou `DB_DATABASE` na Vercel. É justamente o que mantém a publicação livre de credenciais.

### Atualizando o site depois de mexer no código
A URL **nunca muda**: cada publicação substitui a anterior no mesmo endereço, e os colegas não precisam de link novo. Depois de alterar qualquer coisa:

```bash
npm run publicar
```

Esse é o único comando necessário — ele builda e sobe para produção. Se quiser conferir antes num endereço temporário, sem mexer no que o time usa, rode `npx vercel` (sem o `--prod`): isso gera uma URL de *preview* separada.

Fluxo recomendado quando a mudança envolve cálculo:
```bash
npm run verificar
```
```bash
npm run publicar
```

### Atualizando as tarifas depois de um reajuste
Na máquina corporativa, com acesso ao banco:
```bash
npm run tarifas
```
Confira que nada quebrou e publique:
```bash
npm run verificar
```
```bash
npm run publicar
```

### Critério de aceitação

A diferença máxima aceita contra uma fatura real é **R$ 0,03**, definida pela área na validação.

O simulador calcula o total do imposto por dentro e distribui entre as linhas; o sistema da EDP bruteia linha a linha, arredondando a cada uma. Isso produz até dois centavos de diferença conforme a composição da conta. As próprias faturas são internamente inconsistentes nesse ponto — na fatura de 21/07 a 20/08/2026, os preços unitários impressos implicam divisores de `0,778825` na linha de TUSD e `0,778569` na de TE, o que não é possível com uma única alíquota de PIS/COFINS.

Faturas e modelos conferidos hoje:

| Referência | Esperado | Simulador | Dif. |
|---|---|---|---|
| Fatura B1CDE Doc 265002360732 | R$ 159,01 | R$ 159,01 | 0,00 |
| Fatura Baixa Renda Doc 257002385025 | R$ 35,54 | R$ 35,54 | 0,00 |
| Fatura B1C cruzando a REH 3.600 | R$ 141,69 | R$ 141,68 | 0,01 |
| Modelo oficial MMGD GD1 | R$ 121,39 | R$ 121,41 | 0,02 |
| Modelo oficial MMGD GD2 | R$ 145,81 | R$ 145,83 | 0,02 |

### Conferindo que o cálculo não mudou
O motor de cálculo é um só, em `src/lib/motor/calculo.js`, usado tanto pela API com banco quanto pela versão publicada sem banco. O comando `npm run verificar` roda 15 cenários (convencional, tarifa branca, baixa renda, rural, irrigante com reservado, ajustes, SP) e compara centavo a centavo com `scripts/referencia.json`, que congelou o comportamento do sistema antes da mudança.

---

## 🌐 Compartilhando o Link com Colegas

O link `http://IP:3020` só funciona para quem está na **mesma rede física** da máquina — não serve para quem está em casa, mesmo com VPN. Para um link que todo mundo abre (escritório, casa, VPN Netskope, celular), use o túnel.

### Link único — funciona de qualquer rede

> **Status em 06/08/2026: funcionando.** Durante a subida pode aparecer `tunnel server offline: Request failed with status code 403, retry 1` — o Netskope bloqueia o domínio `localtunnel.me` para tráfego de navegador, mas a conexão do cliente do túnel passa. Se o retry seguir, o túnel abre normalmente.

Abra **dois** terminais na pasta do projeto e deixe os dois rodando:

Terminal 1 — o sistema:
```bash
npm run build && npm start
```

Terminal 2 — o túnel:
```bash
npm run share
```

O túnel imprime a URL, sempre a mesma enquanto o subdomínio estiver livre:
```
your url is: https://simulador-faturas-edp.loca.lt
```
Esse é o link para enviar aos colegas. Ele funciona porque a conexão **sai** da sua máquina até o servidor do túnel — não depende de firewall de entrada, de VPN, nem de estar na rede da EDP.

**Na primeira visita** o loca.lt mostra uma página de aviso pedindo um IP para continuar. O número está escrito **na própria página**, na linha *"This tunnel is hosted by"* — o colega copia dali para o campo `IP Address` e clica em Continue. É uma vez por navegador, e não é preciso enviar nada junto com o link.

> Não use `curl https://loca.lt/mytunnelpassword` desta máquina: essa requisição sai pela nuvem do Netskope e devolve o IP de saída dele, que **não** é o que o loca.lt espera. O cliente do túnel conecta direto, então o valor correto é o IP da operadora — o que a página mostra.

> **Sobre o erro `self-signed certificate in certificate chain`:** o cliente Netskope faz inspeção TLS e reassina o HTTPS com a CA da EDP. O Node não lê o repositório de certificados do Windows, então o túnel caía com `tunnel server offline`. O `npm run share` agora passa pelo [scripts/share.mjs](scripts/share.mjs), que sobe o localtunnel com `--use-system-ca` e com o pacote `certs/edp-ca.pem` (CAs `ca.edpsa.goskope.com`, `*.fra2.goskope.com` e `EDP ROOT CA`, exportadas da própria estação). Se a estação for trocada ou os certificados forem renovados, regere o pacote com:
> ```bash
> powershell -Command "$c = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root | Where-Object { $_.Subject -match 'goskope|EDP ROOT CA|proxy\.edp' } | Sort-Object Thumbprint -Unique; ($c | ForEach-Object { '-----BEGIN CERTIFICATE-----' + [Environment]::NewLine + [Convert]::ToBase64String($_.RawData,'InsertLineBreaks') + [Environment]::NewLine + '-----END CERTIFICATE-----' }) -join [Environment]::NewLine | Out-File certs\edp-ca.pem -Encoding ascii"
> ```

**Enquanto o túnel estiver aberto:**
- Os dois terminais precisam ficar abertos e a máquina ligada. Fechou o terminal, o link morre.
- Se o subdomínio `simulador-faturas-edp` estiver ocupado, o túnel devolve uma URL aleatória. Basta trocar o nome em `share`, no `package.json`.
- ⚠️ O link é **público**: qualquer pessoa que o receba (ou descubra) acessa o simulador e consulta a base tarifária. Não divulgue fora do time e feche o túnel quando terminar.

### Protegendo com senha (opcional)
Como o link é público, dá para exigir uma senha. Adicione ao `.env.local` e reinicie o `npm start`:
```env
APP_SENHA=uma-senha-combinada
```
O navegador passa a pedir usuário e senha (o usuário pode ser qualquer coisa; só a senha é conferida). Sem essa variável, o sistema abre direto, como sempre.

### Texto pronto para abrir chamado no TI
> Preciso disponibilizar internamente o **Simulador de Faturas EDP**, uma aplicação web Node.js/Next.js que roda na porta 3020 e consulta o banco `edpbredb.database.windows.net`. Os usuários são colegas na rede EDP e em trabalho remoto via VPN. Solicito, por ordem de preferência:
> **(1)** Publicação da aplicação em servidor interno / Azure App Service, com registro em DNS — solução definitiva, com endereço fixo;
> **(2)** Publicação como *private application* no **Netskope Private Access**, para acesso pela VPN;
> **(3)** Liberação, via GPO, da porta **TCP 3020** na entrada do Windows Firewall da minha estação, para acesso temporário de quem estiver na mesma rede física durante os testes.
>
> Observação: tentei expor via túnel (localtunnel) e o Netskope bloqueia o domínio, como esperado pela política — por isso o pedido pelo caminho oficial.

### Acesso pela rede local (mesmo escritório)
Se o colega estiver na mesma rede física, rode `npm run rede` e envie o link marcado. Nesse caso a porta 3020 precisa estar liberada na **entrada** do Windows Firewall — na estação corporativa a política de grupo ignora regras locais (`LocalFirewallRules: apenas repositório GPO`), então só o TI consegue liberar, via GPO.

---

## 🧮 Recursos Embutidos
- **Tratamento Mobile Avançado:** Todas as entradas numéricas interceptam o teclado nativo dos celulares, trocando vírgulas `,` por pontos `.` em tempo real para evitar quebra matemática no servidor.
- **Tratamento de Dados de Nuvem:** Proteção que detecta tarifas mal importadas no SQL Server (sem decimais) e aplica a divisão de auto-correção (`/ 100000`).
- **Tabela Dinâmica de Ajustes:** Capacidade de injetar múltiplos valores personalizados (multas, devoluções judiciais, taxas variadas) diretamente no corpo fiscal da fatura.

---
*Equipe de Desenvolvimento | EDP - 2026*
