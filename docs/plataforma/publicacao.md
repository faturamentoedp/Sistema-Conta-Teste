# Rodar e publicar a plataforma

Operação da plataforma como um todo (vale para todas as ferramentas): rodar na máquina, publicar na Vercel, separar produção de teste e compartilhar o link. O que é específico de cada ferramenta fica em `docs/<ferramenta>/`.

---

## 🚀 Como Executar na Máquina

### 1. Pré-requisitos
Tenha o [Node.js](https://nodejs.org/) instalado. A plataforma **não usa banco de dados** — as tarifas são arquivos da ANEEL dentro do código. O arquivo `.env.local` é opcional; a única variável que a plataforma lê é a senha de acesso:
```env
APP_SENHA=uma-senha-combinada
```
(sem ela, o sistema abre direto).

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
A plataforma **não usa banco de dados**: as tarifas são arquivos da ANEEL dentro do código (`src/modulos/conta-teste/motor/vigencias.js`). **Nenhuma credencial e nenhum acesso a banco vão para a Vercel** — só dados públicos.

O `.vercelignore` já exclui `.env.local`, `certs/`, planilhas, bases e os scripts que tocam a rede corporativa.

> ⚠️ Duas coisas para alinhar antes: é uma plataforma externa, e a plataforma exibe a **logo da EDP**. Publicar material de marca da empresa numa conta pessoal é decisão que vale confirmar com seu gestor.

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

### Produção x Teste

São dois ambientes, com dois links e duas branches do Git:

| | **Produção** | **Teste** |
|---|---|---|
| O que tem | só o que a área **já validou** | tudo que foi adicionado, **validado ou não** |
| Branch | `main` | `teste` |
| Link | o de sempre, fixo (`sistema-conta-teste-psi.vercel.app`) | `sistema-conta-teste-teste.vercel.app` |
| Na tela | nenhuma marcação | faixa amarela **"Ambiente de teste"** + versão (commit) |
| Publicar | `npm run publicar` | `npm run publicar:teste` |

**No dia a dia, trabalhe sempre na `teste`.** Toda regra nova, ajuste ou correção entra lá, vai pro link de teste, e quem for validar abre o link de teste.

```bash
git checkout teste
```
(faça as alterações, comite e depois)
```bash
npm run publicar:teste
```

O comando de teste roda a regressão, sobe um *preview* (nunca toca na produção) e aponta o endereço fixo de teste para a versão nova. Se a regressão falhar ele avisa, mas publica — teste pode estar no meio do caminho.

#### Levando para produção o que foi validado
Só depois que a área validou. Como a `teste` mistura coisas validadas e não validadas, o caminho normal é levar **só os commits validados**:

```bash
git checkout main
```
```bash
git cherry-pick <commit validado> <outro commit validado>
```
Se **tudo** que está na `teste` foi validado, dá para levar de uma vez com `git merge teste`. Depois:

```bash
npm run publicar
```
```bash
git checkout teste
```

O `npm run publicar` (produção) **recusa** publicar quando: a branch não é a `main`; há alteração não commitada; ou a regressão (`verificar` e `verificar-cip`) falha. E ainda pede para digitar `PRODUCAO` para confirmar. Para só ensaiar, sem publicar: `npm run publicar -- --dry-run`.

> Todo commit que vai pra `main` deveria vir com o caso que o validou (fatura real ou modelo oficial) já em `scripts/conta-teste/cenarios.mjs`, ancorado no total — é o que o `verificar` confere em cada publicação.

#### Botões no Excel (sem linha de comando)
A pasta `ferramentas/` tem o **`Painel Conta Teste.xlsx`**: botões que executam os mesmos comandos - **Publicar teste**, **Publicar produção** e **Verificar cálculos** - e uma aba "Orientações" com o passo a passo e o que fazer quando o botão recusa. Cada botão é um link para um `.bat` da mesma pasta (não usa macro, então funciona com macros bloqueadas); o Excel mostra um aviso de segurança a cada clique: responda **Sim**. Mantenha o Excel dentro de `ferramentas/`. Pré-requisitos: Node.js e `npx vercel login` feito uma vez. As travas são as mesmas do `npm run publicar`.

#### Configuração única na Vercel (painel)
A Vercel não deixa fazer isso por linha de comando sem login, então é uma vez só, no painel do projeto `sistema-conta-teste`:

1. **Settings → Git → Production Branch**: `main`. (Se o projeto estiver ligado ao GitHub, `git push origin main` passa a publicar a produção e `git push origin teste` gera o preview sozinho — os comandos `npm run publicar*` continuam valendo como alternativa.)
2. **Settings → Domains**: adicione `sistema-conta-teste-teste.vercel.app` (o `publicar:teste` aponta ele sozinho para o último deploy de teste; se estiver ligado ao GitHub, associe-o à branch `teste`).
3. **Settings → Deployment Protection**: por padrão os previews pedem login da Vercel e os colegas **não conseguem abrir** o link de teste. Escolha: desligar a proteção só para previews, ou deixar ligada e convidar as pessoas.
4. **Senha opcional só no teste**: `npx vercel env add APP_SENHA preview` (variável só do ambiente de teste; a produção não é afetada).

> ❌ O que vale para produção vale para teste: nunca cadastre `DB_SERVER`, `DB_USER`, `DB_PASSWORD` ou `DB_DATABASE` em **nenhum** ambiente da Vercel.

Fluxo recomendado quando a mudança envolve cálculo:
```bash
npm run verificar
```
```bash
npm run publicar:teste
```

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

> **Sobre o erro `self-signed certificate in certificate chain`:** o cliente Netskope faz inspeção TLS e reassina o HTTPS com a CA da EDP. O Node não lê o repositório de certificados do Windows, então o túnel caía com `tunnel server offline`. O `npm run share` agora passa pelo [scripts/plataforma/share.mjs](../../scripts/plataforma/share.mjs), que sobe o localtunnel com `--use-system-ca` e com o pacote `certs/edp-ca.pem` (CAs `ca.edpsa.goskope.com`, `*.fra2.goskope.com` e `EDP ROOT CA`, exportadas da própria estação). Se a estação for trocada ou os certificados forem renovados, regere o pacote com:
> ```bash
> powershell -Command "$c = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root | Where-Object { $_.Subject -match 'goskope|EDP ROOT CA|proxy\.edp' } | Sort-Object Thumbprint -Unique; ($c | ForEach-Object { '-----BEGIN CERTIFICATE-----' + [Environment]::NewLine + [Convert]::ToBase64String($_.RawData,'InsertLineBreaks') + [Environment]::NewLine + '-----END CERTIFICATE-----' }) -join [Environment]::NewLine | Out-File certs\edp-ca.pem -Encoding ascii"
> ```

**Enquanto o túnel estiver aberto:**
- Os dois terminais precisam ficar abertos e a máquina ligada. Fechou o terminal, o link morre.
- Se o subdomínio `simulador-faturas-edp` estiver ocupado, o túnel devolve uma URL aleatória. Basta trocar o nome em `share`, no `package.json`.
- ⚠️ O link é **público**: qualquer pessoa que o receba (ou descubra) acessa a plataforma e consulta a base tarifária. Não divulgue fora do time e feche o túnel quando terminar.

### Protegendo com senha (opcional)
Como o link é público, dá para exigir uma senha. Adicione ao `.env.local` e reinicie o `npm start`:
```env
APP_SENHA=uma-senha-combinada
```
O navegador passa a pedir usuário e senha (o usuário pode ser qualquer coisa; só a senha é conferida). Sem essa variável, o sistema abre direto, como sempre.

### Texto pronto para abrir chamado no TI
> Preciso disponibilizar internamente o **Simulador de Faturas EDP**, uma aplicação web Node.js/Next.js que roda na porta 3020. Os usuários são colegas na rede EDP e em trabalho remoto via VPN. Solicito, por ordem de preferência:
> **(1)** Publicação da aplicação em servidor interno / Azure App Service, com registro em DNS — solução definitiva, com endereço fixo;
> **(2)** Publicação como *private application* no **Netskope Private Access**, para acesso pela VPN;
> **(3)** Liberação, via GPO, da porta **TCP 3020** na entrada do Windows Firewall da minha estação, para acesso temporário de quem estiver na mesma rede física durante os testes.
>
> Observação: tentei expor via túnel (localtunnel) e o Netskope bloqueia o domínio, como esperado pela política — por isso o pedido pelo caminho oficial.

### Acesso pela rede local (mesmo escritório)
Se o colega estiver na mesma rede física, rode `npm run rede` e envie o link marcado. Nesse caso a porta 3020 precisa estar liberada na **entrada** do Windows Firewall — na estação corporativa a política de grupo ignora regras locais (`LocalFirewallRules: apenas repositório GPO`), então só o TI consegue liberar, via GPO.
