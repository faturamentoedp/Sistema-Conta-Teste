# Conta Teste: manual de uso e manutenção

Para quem vai usar o Conta Teste, atualizar valores, mudar regras de cálculo ou acrescentar funções. Siga na ordem na primeira vez; depois, use como consulta.

Situação descrita: **25/11/2026**.

> **Reforma Tributária:** o protótipo existe **só na branch `reforma-tributaria`**. Na `main` (produção) não há a opção na tela, os arquivos `reforma.js`, `ResultadoReforma.tsx`, `reformaDisponivel.ts` e `reforma-tributaria.md`, nem o comando `npm run verificar-reforma`. Para vê-los, rode `git switch reforma-tributaria`.

**Onde está o que você procura**

| Preciso de... | Vá para |
|---|---|
| Simular uma fatura | parte 2 |
| Preparar meu computador | parte 3 |
| Saber em que arquivo mexer | parte 5 |
| Atualizar PIS/COFINS, tarifa, bandeira, ICMS ou CIP | parte 7 |
| Mudar uma regra de cálculo | partes 6 e 8 |
| Criar tarifa, campo ou linha nova | parte 9 |
| Mexer na Reforma Tributária | parte 10 |
| Testar, salvar e publicar | parte 11 |
| Resolver um erro | partes 12 e 13 |

---

## 1. Leia antes de tudo

### 1.1 O que é

Um sistema web que simula a fatura de energia do **Grupo B** da EDP ES e EDP SP. Ele não usa banco de dados: tarifas, tributos e CIP são arquivos dentro do próprio código. Não tem login (existe uma senha opcional de acesso).

### 1.2 Cinco regras que valem sempre

1. **Só mude um valor com fonte:** comunicado da EDP, resolução da ANEEL, orientação da área ou fatura real.
2. **Diferença aceita contra a fatura: até R$ 0,03.** Dentro disso, não mexa em nada.
3. **Não quebre o que já está validado.** Antes de publicar, os testes precisam passar.
4. **Nunca ajuste um número só para uma conta fechar.** Se não achar a causa, não publique.
5. **Nunca coloque senha ou credencial de banco** no código ou na Vercel (`DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`).

Em dúvida, **não publique**: guarde a fatura e o print e pergunte à área.

### 1.3 O que vence e o que está para mudar

| Quando | Item | O que fazer |
|---|---|---|
| Leitura atual em 12/2026 | PIS/COFINS de 12/2026 não cadastrado (vai só até 11/2026) | Cadastrar quando o comunicado chegar (7.1) |
| A partir de 2027 | Reforma Tributária: CBS e IBS substituem PIS e COFINS | Ver parte 10. **O cálculo atual ainda não vale para faturas de 2027** |
| Janeiro | CIP de municípios pode mudar (tabela conferida em 22/10/2026) | Conferir se alguma fatura divergir só na CIP (7.6) |
| 06/08/2027 | Fim da tarifa vigente do ES e do percentual GD2 | Importar a nova resolução (7.2) e o novo percentual (7.4) |
| 22/10/2027 | Fim da tarifa vigente de SP | Importar a nova (7.2) |

> **Atenção para 2027:** com leitura atual em 2027, o sistema usa um PIS/COFINS genérico (0,63% + 2,89%) e mostra um aviso amarelo. Esses tributos deixam de existir com a reforma, então **não use o total "atual" para conferir fatura de 2027**. A simulação com CBS/IBS existe, mas é preliminar e não aparece na produção. A área precisa definir as regras e a transição (parte 10).

---

## 2. Como usar o simulador

Abra o sistema, clique em **Conta Teste**, preencha os campos e clique em **Calcular Fatura**. Qualquer mudança no formulário apaga o resultado: calcule de novo.

| Campo | Como preencher |
|---|---|
| Instalação e Documento | Só para identificar a simulação no arquivo exportado |
| Geografia | EDP ES ou EDP SP |
| Tarifas | A mesma da fatura (ver abaixo) |
| Fase | Muda o consumo mínimo: monofásico 30, bifásico 50, trifásico 100 kWh (B4 não tem mínimo) |
| Bandeiras 1, 2 e 3 | Cor de cada período. A 3ª é só para ciclo que cruza três meses |
| Dias na fatura | A fatura lista as bandeiras **por tipo**, não por data. Digite os dias que ela mostra em cada uma. A soma precisa bater com o período |
| Leituras | Datas da leitura anterior e da atual |
| Constante do medidor | Medição indireta (ex.: 40). Informe a diferença de leitura; o sistema multiplica |
| Consumo | kWh. Na Tarifa Branca: Ponta, Fora Ponta e Intermediário. No Irrigante há o Reservado |
| Geração Distribuída | Marque se a unidade tem geração. Informe a energia injetada e GD1 ou GD2 |
| Desconto BT0 | Ligue quando a fatura cobrar 1,5% menos que a diferença de leitura |
| Redutor SUDENE | Só ES. Ligue quando a fatura tiver a linha "Red. SUDENE" |
| Município (CIP automática) | Só ES. Preenche a CIP, que continua editável |
| CIP (R$) | Valor da iluminação pública |
| Tributação de ICMS | Deixe em Automático, salvo caso específico |
| Ajustes / Outros Valores | **Toda linha da fatura sem kWh:** parcelas, multas, juros, bônus, serviços de terceiros. Crédito entra negativo (ex.: -10,77) |
| Comparar com a Reforma 2027 | Só na branch `reforma-tributaria` e fora da produção (parte 10) |

**Como escolher a tarifa**

- Fatura com mensagem de **Desconto Social** (linhas "até 120 kWh"): **B1CDE**.
- Fatura com **Subvenção Tarifária** ou **Valor Baixa Renda**: **B1BRN MP 1300**.
- Residencial comum: **B1 (Res)**.

**Como ler o resultado:** os cartões mostram os totais; a tabela imita a nota fiscal; o "Resumo de Tributos" mostra as alíquotas usadas. **Fio B**, **Escassez Hídrica** e **Benefício Tarifa Social** são informativos e não somam no total. O botão **Baixar Tabela** gera o CSV.

Se aparecer um **aviso amarelo**, falta algum dado do período. Não use o total para conferência.

---

## 3. Preparar o computador (uma vez só)

### 3.1 O que instalar e pedir

| Item | Para quê |
|---|---|
| Git | Baixar o código e salvar mudanças |
| Node.js (versão LTS) | Rodar o sistema e os testes |
| Visual Studio Code | Editar os arquivos |
| Python com `pandas` e `openpyxl` | Só para importar tarifas e CIP |
| Acesso ao repositório no GitHub, **com a sua conta** | Baixar e enviar mudanças |
| Acesso ao projeto na Vercel, **com a sua conta** | Publicar |

Repositório: `https://github.com/faturamentoedp/Sistema-Conta-Teste`. Cada pessoa usa a própria conta. Não compartilhe senha.

### 3.2 Baixar e rodar

```bash
git clone https://github.com/faturamentoedp/Sistema-Conta-Teste.git
```
```bash
cd Sistema-Conta-Teste
```
```bash
npm install
```
```bash
npm run dev
```

Abra `http://localhost:3020`. Para parar, aperte `Ctrl+C` no terminal. Se o PowerShell recusar o comando `npm`, use o **Prompt de Comando (CMD)**.

Para importar tarifas:

```bash
pip install pandas openpyxl
```

Para publicar:

```bash
npx vercel login
```

Configure o seu nome no Git, para os commits saírem na sua conta:

```bash
git config user.name "Seu Nome"
```
```bash
git config user.email "seu.email@empresa.com"
```

### 3.3 Conferir se está tudo certo

```bash
npm run verificar
```
```bash
npm run verificar-cip
```

Esperado: **"Tudo idêntico à referência"** e **"Tudo certo"**. Se falhar antes de você mexer em algo, pare e investigue.

---

## 4. Como o sistema funciona

```
Tela (ContaTeste.tsx)
   │  envia os dados do formulário
   ▼
API (src/app/api/conta-teste/calcular/route.ts)
   │  valida e busca a tarifa do período (vigencias.js)
   ▼
Motor (motor/calculo.js)  ← usa tributos.js e tarifas-aneel.js
   │  devolve linhas, resumo e avisos
   ▼
Tela do resultado (ResultadoFatura.tsx)
```

Alguns ajustes acontecem **na tela, antes de chegar ao motor**: constante do medidor, Desconto BT (consumo x 0,985, arredondado para kWh inteiro) e CIP automática por município. Quem chama a API ou escreve um teste precisa informar o consumo **já com** esses ajustes.

---

## 5. Mapa dos arquivos: onde mexer

### 5.1 Regras e valores (`src/modulos/conta-teste/motor/`)

| Arquivo | O que tem | Editar à mão? |
|---|---|---|
| `calculo.js` | O cálculo da fatura, o ICMS por categoria e o valor das **bandeiras** | Sim, com cuidado |
| `tributos.js` | **PIS/COFINS** mês a mês e ICMS padrão do estado | Sim |
| `tarifas-aneel.js` | Faixas de ICMS residencial, GD, Fio B, Escassez, SUDENE, limites de Baixa Renda e Desconto Social | Sim |
| `vigencias.js` | **Tarifas TUSD e TE** por resolução | **Não.** É gerado por script |
| `cip-municipios.js` | Tarifa B4a e CIP dos municípios | Só a Tarifa B4a e as regras. **O bloco de dados é gerado** |
| `reforma.js` | Simulação CBS/IBS, preliminar (só na branch `reforma-tributaria`) | Sim, com cuidado |

### 5.2 Telas (`src/modulos/conta-teste/`)

| Arquivo | O que tem |
|---|---|
| `ContaTeste.tsx` | Formulário, lista de tarifas e o que é enviado ao cálculo |
| `ResultadoFatura.tsx` | Cartões, tabela e resumo de tributos |
| `ResultadoReforma.tsx` | Comparação com a reforma (só na branch `reforma-tributaria`) |
| `reformaDisponivel.ts` | Liga ou desliga a reforma por ambiente (só na branch `reforma-tributaria`) |
| `exportarCsv.ts` | Arquivo CSV baixado |
| `utilitarios.ts` | Desconto BT, constante do medidor, períodos das bandeiras |
| `formatadores.ts` | Formato de moeda e números |
| `tipos.ts` | Lista dos campos do formulário e do resultado |

### 5.3 Testes, scripts e documentos

| Caminho | O que é |
|---|---|
| `scripts/conta-teste/cenarios.mjs` | Casos de teste (faturas reais, modelos e referências) |
| `scripts/conta-teste/referencia.json` | Resultado esperado de cada caso. **Não edite à mão** |
| `scripts/conta-teste/verificar.mjs`, `verificar-cip.mjs`, `verificar-reforma.mjs` | Testes |
| `scripts/conta-teste/exportar-vigencias.py`, `aneel-dados-abertos.py` | Importação de tarifas |
| `scripts/conta-teste/importar-cip-site.py`, `gerar-cip-municipios.py` | Importação da CIP |
| `docs/conta-teste/treinamento-databricks/` | Regras de cálculo escritas em detalhe e tabelas CSV |
| `docs/conta-teste/Regras_Tarifas_e_CIP.xlsx` | Regras em linguagem simples e CIP por município |
| `ferramentas/Painel Conta Teste.xlsx` | Botões para testar e publicar |
| `src/plataforma/` | Menu, tema e moldura das páginas (comum a todas as ferramentas) |

> Os documentos e planilhas **não se atualizam sozinhos** e não são lidos pelo sistema. Mudar a planilha não muda o cálculo.

---

## 6. As regras de cálculo em resumo

A versão detalhada está em `docs/conta-teste/treinamento-databricks/regras_de_calculo.md`. **Se um documento e o código divergirem, o que vale hoje no sistema é o código.**

### 6.1 Ordem do cálculo (função `calcular_fatura`)

1. Monta o consumo por posto (único; Ponta, Fora Ponta e Intermediário; ou faixas do Desconto Social).
2. Aplica o consumo mínimo da fase.
3. Busca PIS/COFINS do mês da **leitura atual** e define o ICMS.
4. Cria as linhas de TUSD e TE (na Baixa Renda, separa os 80 kWh isentos).
5. Cria as linhas de bandeira, proporcionais aos dias.
6. Calcula o total da energia "por dentro" e distribui entre as linhas.
7. Acrescenta, quando houver: desconto Baixa Renda, retenções, energia injetada, redutor SUDENE e ajustes.
8. Calcula os informativos (Fio B, Escassez, Benefício Tarifa Social).
9. Soma o total: energia − retenções + CIP + ajustes.

### 6.2 Fórmula principal (regime atual)

```
valor sem impostos = soma de (kWh x tarifa sem impostos)
divisor            = (1 − ICMS) x (1 − PIS − COFINS)
valor com impostos = valor sem impostos ÷ divisor
```

A última linha de energia absorve a diferença de arredondamento.

### 6.3 Tarifa e dias

- A tarifa é **TUSD + TE sem impostos**.
- Se o período cruza a virada de uma resolução, a tarifa é ponderada pelos dias.
- O dia da leitura anterior **não conta**; o da leitura atual **conta**.

### 6.4 ICMS automático

| Situação | ES | SP |
|---|---|---|
| Residencial convencional, Baixa Renda e Desconto Social | até 50 kWh: 0%; acima: 17% | até 90: 0%; 91 a 200: 12%; acima: 18% |
| Rural (B2) | 4% (a tela mostra 12% sobre 1/3 da base) | 12% |
| Irrigante (B2) | 17% (confirmado por uma fatura) | 12% |
| B3 Consumo Próprio | isento | 18% |
| B3 Poder Público Estadual | isento | isento |
| Demais, inclusive Tarifa Branca residencial | 17% | 18% |

A faixa usa o consumo **faturado** e vale para a fatura inteira.

### 6.5 Regras especiais

| Regra | Como funciona |
|---|---|
| Consumo Reservado (Irrigante) | Paga 40% da tarifa |
| Desconto Social (B1CDE) | Tarifa reduzida até 120 kWh; acima disso, tarifa cheia |
| Baixa Renda | 80 kWh isentos. No ES a bandeira entra na base da subvenção; em SP, não |
| Poder Público Federal | Retém PIS 0,65%, CSLL 1%, IR 1,2% e COFINS 3% |
| Poder Público Estadual (e B4a em SP) | Retém IR 1,2% |
| Geração Distribuída | A injetada abate a conta. TUSD injetada sem ICMS; TE injetada com ICMS. GD1 compensa 100% da TUSD; GD2, um percentual. GD3 não calcula |
| SUDENE (ES) | Linha negativa de R$ 0,00781/kWh, proporcional aos dias desde 30/08/2026 |

---

## 7. Como atualizar valores

Antes de qualquer receita:

```bash
git pull
```

e rode os testes (3.3). Depois da mudança, siga a parte 11.

### 7.1 PIS/COFINS do mês (a mais frequente)

**Arquivo:** `motor/tributos.js`. Há um bloco `ES` e um bloco `SP`.

1. Vá ao fim do bloco do estado.
2. Coloque uma vírgula no fim da linha que era a última.
3. Acrescente a linha do mês, com os valores **divididos por 100**.

Exemplo para PIS 1,10% e COFINS 5,08% (números ilustrativos, use os do comunicado):

```js
'2026-12': { pis: 0.0110, cofins: 0.0508 }
```

4. Repita no outro estado. As alíquotas de ES e SP são diferentes.

**Conferir:** simule uma fatura com leitura atual no mês novo. O aviso amarelo some e o Resumo de Tributos mostra os valores digitados.

### 7.2 Reajuste de tarifa (TUSD e TE)

**Não digite tarifa à mão em `vigencias.js`.**

**Caminho A: dados abertos da ANEEL.** A data é o início da vigência nova. Para SP:

```bash
python scripts/conta-teste/aneel-dados-abertos.py SP 2027-10-23 novas_sp.xlsx
```
```bash
python scripts/conta-teste/exportar-vigencias.py - novas_sp.xlsx --acrescentar
```

Para o ES o arquivo vai na **primeira** posição:

```bash
python scripts/conta-teste/aneel-dados-abertos.py ES 2027-08-07 novas_es.xlsx
```
```bash
python scripts/conta-teste/exportar-vigencias.py novas_es.xlsx - --acrescentar
```

A ordem é sempre `ES SP`. O `-` significa "não mexa neste estado". O `--acrescentar` soma a vigência nova sem reescrever o histórico. O download tem cerca de 180 MB. Se não houver linhas, a ANEEL ainda não publicou: espere alguns dias.

**Caminho B: export do portal.** Em `https://portalrelatorios.aneel.gov.br/luznatarifa/basestarifas`, painel **TUSD e TE**, limpe o filtro de data, filtre a Sigla (EDP SP ou EDP ES), exporte e use o mesmo `exportar-vigencias.py` com `--acrescentar`. O arquivo "data.xlsx" da base nacional vem cortado e não serve para o ES.

**Depois:** rode `git diff --stat`. Em `vigencias.js` deve haver só linhas **acrescentadas**. Apague os arquivos `.xlsx` temporários antes do commit. Confira também os itens que mudam junto com o reajuste (7.4).

**Forçar uma tarifa (exceção):** `OVERRIDES_TARIFA`, em `tarifas-aneel.js`, substitui a tarifa da ANEEL para uma categoria **em todos os períodos**. Evite.

### 7.3 Bandeiras

**Arquivo:** `motor/calculo.js`, bloco `BANDEIRAS`, em R$/kWh sem impostos:

| Bandeira | Valor atual |
|---|---|
| Verde | 0 |
| Amarela | 0,01885 |
| Vermelha P1 | 0,04463 |
| Vermelha P2 | 0,07877 |
| Escassez | 0,142 |

> **Cuidado:** a bandeira **não tem vigência**. Trocar o número muda também a simulação de faturas antigas, e o teste vai acusar. Se a ANEEL mudar os valores, será preciso criar uma tabela por período (como a `PERC_REDUCAO_GD`) antes de publicar.

A **cor** de cada mês não fica no sistema: quem simula escolhe.

### 7.4 Valores com vigência

**Arquivo:** `motor/tarifas-aneel.js`. Para um período novo, **acrescente** uma linha com `inicio` e `fim`. Não apague as antigas.

| Bloco | O que é | Muda o total? |
|---|---|---|
| `PERC_REDUCAO_GD` | Compensação da Geração Distribuída | Sim |
| `ICMS_FAIXAS_RESIDENCIAL` | Faixas de ICMS do residencial (não tem datas) | Sim |
| `SUDENE_CONFIG` | Valor e início do redutor | Sim |
| `FAIXA_TARIFA_SOCIAL_KWH` | 80 kWh da Baixa Renda | Sim |
| `FAIXA_DESCONTO_SOCIAL_KWH` | 120 kWh do Desconto Social | Sim |
| `FIO_B_TUSD` | Informativo do Fio B | Não |
| `ENCARGO_ESCASSEZ_HIDRICA` | Informativo de Escassez Hídrica | Não |

Exemplo de formato (os números são só ilustração):

```js
{ inicio: '2027-08-07', fim: '2028-08-06', tusd: 0.76, te: 1 }
```

Na GD, `0.76` quer dizer que 76% da TUSD é compensada.

Para habilitar o **GD3**, troque `GD3: null` por uma lista no mesmo formato, somente com o percentual oficial.

### 7.5 ICMS fora do residencial

**Arquivo:** `motor/calculo.js`. Procure o comentário `// ICMS:` dentro de `calcular_fatura`. Ali estão as isenções e os valores de Rural e Irrigante. O padrão do estado (17% ES, 18% SP) está em `ICMS_PADRAO`, no `tributos.js`.

As opções da caixa "Tributação de ICMS" ficam em `ContaTeste.tsx`.

Mudança de ICMS só com confirmação da área e fatura real.

### 7.6 CIP (iluminação pública, só ES)

**Uma fatura com CIP diferente:** o campo "CIP (R$)" é editável. Digite o valor da fatura e anote o município. Não precisa mudar o sistema.

**Tarifa B4a** (base dos municípios calculados por percentual): em `motor/cip-municipios.js`, bloco `TARIFA_B4A`. O valor de `atual` passa para `anterior`, o novo entra em `atual` e `data_troca` recebe a data. Só há espaço para dois valores. Os municípios de valor fixo não dependem dela.

**Tabela de um município:**

1. Abra `https://www.edp.com.br/tabela-de-calculo-cip/` e escolha Espírito Santo.
2. Abra o console do navegador e rode o comando que está no começo de `scripts/conta-teste/importar-cip-site.py`. Salve a saída em um arquivo.
3. Gere o arquivo intermediário:

```bash
python scripts/conta-teste/importar-cip-site.py saida-navegador.json site-cip.json
```

4. Atualize o sistema:

```bash
python scripts/conta-teste/gerar-cip-municipios.py site-cip.json src/modulos/conta-teste/motor/cip-municipios.js
```

5. Rode `git diff` e confira **município por município**.

> **Cuidado:** o site arredonda alíquotas para 4 casas, e o sistema guarda mais casas em parte dos municípios (vindas de planilha da área). Regerar pode mudar centavos de quem não mudou. Se aparecer isso, não publique. O script aceita um terceiro arquivo com as alíquotas exatas; leia o cabeçalho dele.

**Isenções:** cada município tem os campos `isenta_rural`, `isenta_irrigante`, `isenta_ppf` e `isenta_ppe`. A tarifa do formulário vira classe de CIP na função `classe_cip_por_categoria`.

---

## 8. Como mudar uma regra de cálculo

Passo a passo seguro:

1. **Tenha a prova:** fatura real, modelo oficial ou orientação escrita da área.
2. Crie uma branch para o trabalho:

```bash
git switch -c ajuste-nome-curto
```

3. Rode os testes **antes**.
4. Ache a regra. No VS Code, use `Ctrl+Shift+F` com um trecho do nome da linha ou do comentário.
5. Faça a **menor mudança possível**, restrita ao caso: distribuidora, categoria e, se for o caso, data.
6. Escreva um comentário dizendo **por que** e qual fatura ou documento comprova.
7. Rode `npm run verificar`. Se um caso antigo falhar, sua mudança alterou algo validado. Entenda antes de seguir.
8. Cadastre a fatura nova como cenário (11.2).
9. Atualize o documento de regras, se a regra mudou.

Exemplo de mudança restrita (regra que existe hoje):

```js
if (distribuidora === "SP") {
    icms = 0.12;
} else if (categoria.startsWith("B2RUIRRG")) {
    icms = 0.17;   // comprovado em fatura real (citar qual)
} else {
    icms = 0.04;
}
```

**Regra que muda a partir de uma data:** não troque o valor antigo. Use uma lista com `inicio` e `fim`, ou compare a data da leitura, para as faturas antigas continuarem certas.

**Um teste antigo precisa mudar de valor?** Só se a área confirmar que o valor antigo estava errado. Registre isso no commit.

---

## 9. Como acrescentar coisas novas

### 9.1 Uma tarifa (categoria) nova

| Passo | Arquivo | O que fazer |
|---|---|---|
| 1 | `scripts/conta-teste/exportar-vigencias.py` | Incluir no `MAPA` (subgrupo, modalidade, subclasse da ANEEL) e reimportar as tarifas. Sem `--acrescentar`, o script reescreve o histórico: confira o `git diff` |
| 2 | `motor/calculo.js` | Em `resolver_tarifas`, se ela usa a tarifa de outra; tratar ICMS, retenções e mínimo |
| 3 | `ContaTeste.tsx` | Incluir a opção na lista "Tarifas" |
| 4 | `motor/cip-municipios.js` | Definir a classe em `classe_cip_por_categoria` |
| 5 | `motor/tarifas-aneel.js` | Fio B, se houver |
| 6 | `motor/reforma.js` (só na branch `reforma-tributaria`) | Decidir se entra em `CATEGORIAS_SIMULAVEIS` |
| 7 | `cenarios.mjs` | Cadastrar uma fatura real |

> **Atenção:** quando o motor não acha a tarifa, ele pode usar um valor reserva fixo, escrito dentro de `getTarifaConsolidada`. Confira a coluna **Tarifa Unit.** no resultado para ter certeza de que veio a tarifa certa.

Nomes de categoria influenciam regras: o sistema testa o começo (`B1BR`, `B2RUIRRG`, `B4`) e o fim (`_TB`) do nome.

### 9.2 Um campo novo no formulário

1. `tipos.ts`: incluir o campo.
2. `ContaTeste.tsx`: valor inicial, campo na tela e envio no `payload`.
3. `ContaTeste.tsx`: se o campo tiver estado próprio, incluir na lista do efeito que apaga o resultado.
4. `route.ts`: validar, se for número ou data.
5. `calculo.js`: ler com um padrão seguro. **Sem o campo, o resultado precisa ficar igual ao de antes.**
6. `exportarCsv.ts`: incluir no CSV.

### 9.3 Uma linha nova na fatura

Dentro de `calcular_fatura`, as linhas entram com `linhas.push({...})`. Copie o formato de uma linha parecida (a do SUDENE é um bom exemplo de linha de desconto).

| Tipo | Cuidado |
|---|---|
| Linha que soma ou abate | Entra em `total_energia` automaticamente se for incluída antes dos totais |
| Linha informativa | Marque `is_informativo: true` para não somar |
| Retenção | O nome começa com "Retenção" e o valor precisa entrar em `total_retencoes` |
| Valor sem kWh e sem regra | Não precisa de código: use "Ajustes" |

Não dê a uma linha nova o mesmo nome de um ajuste: o total usa o nome e o valor para separar os ajustes.

Se você acrescentar um **campo novo no resultado** de todas as faturas, o teste acusará diferença em todos os cenários. Prefira criar o campo só quando ele se aplica.

### 9.4 Uma ferramenta nova na plataforma

Siga `docs/plataforma/como-adicionar-ferramenta.md`.

### 9.5 Antes de programar

Este projeto usa uma versão do Next.js com mudanças em relação a versões anteriores. Antes de mexer em páginas ou APIs, leia o guia correspondente em `node_modules/next/dist/docs/`.

---

## 10. Reforma Tributária (CBS e IBS)

**Situação:** protótipo que existe só na branch `reforma-tributaria` (use `git switch reforma-tributaria`). **Não está validado** e não aparece na produção. O resumo técnico está em `docs/conta-teste/reforma-tributaria.md`.

### 10.1 Como usar

Marque **Comparar com a Reforma 2027**, escolha a alíquota da CBS e calcule. A tela mostra o total atual, o total com a reforma e a diferença. O CSV baixado traz **só o cálculo atual**.

### 10.2 Regra aplicada

```
líquido   = kWh x tarifa sem impostos
CBS + IBS = líquido x (CBS + IBS)          ("por fora")
base ICMS = (líquido + CBS + IBS) ÷ (1 − ICMS)
total     = líquido + CBS/IBS + ICMS
```

PIS e COFINS não entram. A CIP e os ajustes são somados sem CBS, IBS ou ICMS (a lista de itens tributáveis ainda não foi definida).

### 10.3 O que já simula

| Simula | Ainda não simula (mostra o motivo na tela) |
|---|---|
| B1 convencional e Branca (o modelo da área cobre o B1 convencional) | Baixa Renda e Desconto Social |
| B3 convencional e Branca, B4a e B4b, **sem modelo de referência** | Rural e Irrigante |
| Consumo e bandeiras | Poder Público, Consumo Próprio e faturas com retenção |
| | Geração Distribuída com injeção e redutor SUDENE |
| | Grupo A (média e alta tensão): o sistema ainda não tem |

### 10.4 Onde mexer

| O que mudar | Onde |
|---|---|
| Alíquotas de CBS e IBS | `motor/reforma.js`: `REFORMA_ALIQUOTAS` e `REFORMA_OPCOES_CBS` |
| Liberar uma tarifa | `motor/reforma.js`: `CATEGORIAS_SIMULAVEIS` e `motivos_sem_simulacao` |
| Fórmula ou base dos impostos | `motor/reforma.js`: função `calcular_reforma` |
| Textos de aviso | `motor/reforma.js`: lista `observacoes` |
| Tela da comparação | `ResultadoReforma.tsx` |
| Mostrar na produção | `reformaDisponivel.ts` (**só depois da validação**) |

Depois de mudar:

```bash
npm run verificar-reforma
```

Ele reproduz os dois exemplos das planilhas da área (ES R$ 178,53 e SP R$ 243,13). Se a área mudar uma regra, atualize os valores esperados com base no modelo novo.

### 10.5 Perguntas em aberto para a área

1. A CBS de 2027 será 11,2% ou 11,3%?
2. CBS e IBS entram na base do ICMS no ES e em SP? No modelo do ES, a tabela e o quadro "Fatura B1" estão diferentes.
3. Quais itens são tributáveis: CIP, juros, multas, parcelas, serviços de terceiros, descontos, créditos e geração distribuída?
4. Como ficam Baixa Renda, Desconto Social, Rural e Irrigante? Há devolução de CBS/IBS na fatura?
5. Na fatura com leituras em 2026 e 2027, vale a data da leitura atual ou o cálculo é proporcional aos dias?
6. As fórmulas das bandeiras vermelhas e da Escassez podem ser corrigidas nos modelos? (Elas ainda usam a fórmula antiga. No modelo de SP, a base do ICMS das vermelhas está fixada em zero.)
7. Haverá modelo com CBS e IBS para o Grupo A?

**Quando for validado,** falta decidir como o cálculo de 2027 passa a ser o principal: tela de resultado, CSV, informativos e fim do aviso de PIS/COFINS.

---

## 11. Testar, salvar e publicar

### 11.1 Testes

| Comando | O que confere |
|---|---|
| `npm run verificar` | 62 cenários, centavo a centavo |
| `npm run verificar-cip` | 37 casos de CIP |
| `npm run verificar-reforma` | Simulação da reforma contra os modelos (só na branch `reforma-tributaria`) |
| `npx tsc --noEmit` | Erros de código nas telas |
| `npm run lint` | Padrão do código |
| `npm run build` | Se o sistema compila para publicar |

Acrescentar um mês ou uma vigência **futura** não deve mudar cenário antigo.

Teste também **na tela** a fatura que motivou a mudança.

### 11.2 Cadastrar uma fatura como teste

1. Em `scripts/conta-teste/cenarios.mjs`, copie um bloco parecido e cole no fim da lista, separado por vírgula:

```js
{
    nome: 'FATURA REAL ES B1C, MES/ANO: descrição curta',
    fatura_real: 123.45,
    params: {
        distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
        data_leitura_anterior: '2026-10-15', data_leitura_atual: '2026-11-13',
        consumo_kwh: 150, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
        valor_cip: 10.00,
        ajustes: [ { nome: 'Multa', valor: 4.62 } ]
    }
}
```

`fatura_real` é o total impresso. O `nome` precisa ser único. Não inclua nome, CPF ou endereço de cliente.

2. Com o `npm run dev` ligado em **outro terminal**:

```bash
node scripts/conta-teste/capturar-referencia.mjs 3020
```

3. Esse comando **regrava a referência de todos os cenários**. Rode:

```bash
git diff scripts/conta-teste/referencia.json
```

Deve haver só linhas **adicionadas**. Se linhas antigas mudaram sem motivo:

```bash
git checkout -- scripts/conta-teste/referencia.json
```

4. Rode `npm run verificar` de novo.

### 11.3 Branches

| Branch | Para quê |
|---|---|
| `main` | **Produção:** só o que a área validou |
| `teste` | Tudo que está para validar |
| `reforma-tributaria` | Protótipo da Reforma 2027, ainda sem validação |
| outras | Trabalho em andamento |

Em 25/11/2026 a `teste` está desatualizada em relação à `main`. Antes de usar, atualize:

```bash
git switch teste
```
```bash
git merge main
```

Se aparecer conflito e você não souber resolver, cancele com `git merge --abort` e peça ajuda. Se uma branch citada aqui não aparecer para você, ela ainda não foi enviada ao GitHub: peça a quem a criou.

### 11.4 Salvar (commit)

Veja o que mudou:

```bash
git status
```

Confira se não há planilhas temporárias, faturas ou arquivos `.env`. Depois:

```bash
git add -A
```
```bash
git commit -m "PIS/COFINS de 12/2026 (ES e SP)"
```
```bash
git push -u origin HEAD
```

### 11.5 Publicar

| Ambiente | Comando | Link |
|---|---|---|
| Teste | `npm run publicar:teste` | `sistema-conta-teste-teste.vercel.app` |
| Produção | `npm run publicar` | `sistema-conta-teste-psi.vercel.app` |

Para ensaiar sem publicar:

```bash
npm run publicar:teste -- --dry-run
```

A produção só publica a partir da `main`, sem alteração pendente e com os testes passando, e pede para digitar `PRODUCAO`.

**Levar para a produção o que foi validado:** vá para a `main` e traga **só os commits validados**:

```bash
git switch main
```
```bash
git cherry-pick codigo-do-commit
```

Use `git merge nome-da-branch` apenas se **tudo** naquela branch foi validado.

> Publicar atualiza o link que o time usa. Faça só depois da validação.

O link de teste pode pedir login da Vercel, conforme a configuração do projeto. Os botões de `ferramentas/Painel Conta Teste.xlsx` executam os mesmos comandos. Mais detalhes em `docs/plataforma/publicacao.md`.

**Senha de acesso (opcional):** variável `APP_SENHA`, na Vercel ou no arquivo `.env.local`.

### 11.6 Desfazer

| Situação | Como |
|---|---|
| Mudei um arquivo e não fiz commit | `git checkout -- caminho/do/arquivo` (apaga a mudança) |
| Já fiz commit | `git revert codigo-do-commit` e publique de novo |
| Não sei o que fazer | Não publique e peça ajuda |

Evite `git reset --hard` e `git push --force`: podem apagar trabalho.

---

## 12. "A conta não bateu": confira nesta ordem

1. **Aviso amarelo?** Falta tarifa ou PIS/COFINS do período.
2. **Tarifa** igual à da fatura? (parte 2)
3. **Todas as linhas sem kWh** foram lançadas em Ajustes, com o sinal certo?
4. **Consumo:** precisa de Desconto BT ou constante do medidor?
5. **Bandeiras:** os "Dias na fatura" estão preenchidos como impresso?
6. **Fase** certa?
7. **SUDENE** ligado, se a fatura tem a linha?
8. **CIP** igual à da fatura?
9. Compare **linha a linha** a Tarifa Unit. e a alíquota de ICMS. A primeira linha diferente mostra a causa.

Passou de R$ 0,03 com tudo conferido? Guarde o PDF da fatura, o print da tela inteira (formulário e resultado) e a linha que diverge.

---

## 13. Problemas comuns

| Problema | O que fazer |
|---|---|
| `npm` não é reconhecido | Instale o Node.js e abra um terminal novo |
| PowerShell bloqueia o `npm` | Use o Prompt de Comando (CMD) |
| Porta 3020 em uso | Feche o outro terminal do sistema ou rode `npm run dev -- -p 3040` (e use essa porta na captura) |
| Página 404 | Confira se o terminal está na pasta do projeto |
| Visual antigo depois de mudar estilo | Pare o sistema, apague a pasta `.next` e rode de novo |
| `tsc` acusa erro em `.next/dev/types` | Apague a pasta `.next/dev/types` |
| Erro de certificado no Python | O script da ANEEL usa o arquivo `edp-ca.pem` na sua pasta de usuário, se existir. Peça apoio ao TI |
| Erro de vírgula ou chave após editar valores | Compare com a linha de cima. Número usa **ponto**, e linhas são separadas por vírgula |
| `FALHA motor local` | Seu ajuste mudou um resultado já validado. Veja o caso e os campos listados |
| `SEM REFERÊNCIA` | Cenário novo ainda não capturado (11.2) |
| Publicação de produção recusada | Leia a mensagem: branch errada, mudança sem commit ou teste falhando |

---

## 14. Pontos em aberto conhecidos

- **Fio B de SP** sem valor publicado a partir de 23/10/2026: o sistema usa uma estimativa (informativo).
- **Escassez Hídrica:** parte dos valores foi deduzida de faturas; pode haver diferença de centavos no informativo.
- **ICMS de 17% no Irrigante do ES:** confirmado por uma única fatura.
- **SUDENE:** valor e data de início não foram conferidos na planilha de origem, que está protegida.
- **PIS/COFINS de SP de 07/2026:** deduzido de uma fatura.
- **GD3:** sem percentual; o sistema avisa e não calcula.
- **São José do Calçado:** CIP manual. Há ressalvas de CIP em Aracruz e Ecoporanga (ver `cip-municipios.js` e confirmar com a área).
- **Reforma Tributária:** ver 10.5.

---

## 15. Glossário

| Termo | Significado |
|---|---|
| TUSD | Tarifa de uso do sistema de distribuição |
| TE | Tarifa de energia |
| CIP | Contribuição de iluminação pública (municipal) |
| CBS e IBS | Novos tributos da reforma |
| GD / MMGD | Geração distribuída (ex.: placa solar) |
| REH | Resolução homologatória da ANEEL |
| Vigência | Período em que um valor vale |
| Cenário | Um caso de teste |
| Commit | Uma mudança salva no Git, com descrição |
| Branch | Uma linha de trabalho separada no Git |
