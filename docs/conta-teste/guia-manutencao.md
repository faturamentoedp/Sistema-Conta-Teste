# Conta Teste: guia de manutenção (passagem de conhecimento)

Para quem vai cuidar do Conta Teste de **17/12/2026 a 04/01/2027**. Explica como incluir uma tarifa ou mudar um valor, conferir se nada quebrou e publicar.

---

## 1. O que vence neste período

| Prioridade | Item | Situação em 25/11/2026 | O que fazer |
|---|---|---|---|
| **Alta** | **PIS/COFINS de 12/2026** (ES e SP) | Cadastrado só até **11/2026** | Cadastrar quando o comunicado da EDP chegar (receita 4.1) |
| **Alta** | **PIS/COFINS de 01/2027** (ES e SP) | Não cadastrado | Idem |
| Média | CIP dos municípios do ES | Tabela conferida em 22/10/2026 | Se uma fatura de janeiro divergir só na CIP, veja a receita 4.5 |
| Baixa | Tarifa de energia ES / SP | ES vigente até 06/08/2027; SP até 22/10/2027 | Nenhum reajuste previsto; só se houver revisão extraordinária |

Sem o PIS/COFINS do mês, o simulador **não para**: usa 0,63% + 2,89% e mostra um aviso amarelo. O total sai errado. **Se aparecer o aviso, não use o resultado para conferência.**

O mês que vale é o da **leitura atual** da fatura.

---

## 2. Antes de começar (uma vez só)

- Pasta do projeto na sua máquina, a partir do GitHub (peça o acesso antes das férias).
- Node.js instalado. Na pasta do projeto: `npm install`.
- Para importar tarifas: Python com `pandas` e `openpyxl`.
- Para publicar: acesso ao projeto na Vercel e `npx vercel login` feito com a **sua** conta.

Não é preciso banco de dados nem arquivo `.env.local`. **Nunca** cadastre credenciais de banco na Vercel.

Para abrir o sistema na máquina: `npm run dev`, depois acesse `http://localhost:3020`.

---

## 3. A regra de ouro

1. **Só mude um valor com fonte:** comunicado da EDP, resolução da ANEEL ou fatura real.
2. **Diferença aceita contra a fatura: até R$ 0,03.** Dentro disso, não mexa em nada.
3. **Antes de mudar regra, confira o preenchimento** (seção 6). A maioria das divergências é de digitação.
4. **Nunca ajuste um número só para uma conta fechar.**
5. Se ficar em dúvida, **não publique**: guarde a fatura e o print e espere.

Fluxo de toda mudança:

```
alterar  →  npm run verificar  →  npm run verificar-cip  →  testar na tela
         →  commit  →  publicar teste  →  área valida  →  publicar produção
```

---

## 4. Receitas

Todos os arquivos de regra ficam em `src/modulos/conta-teste/motor/`.

### 4.1 PIS/COFINS do mês (a mais frequente)

Arquivo: `tributos.js`. Há um bloco `ES` e um bloco `SP`. Acrescente a linha do mês **no fim de cada bloco** e coloque uma vírgula no fim da linha anterior.

O comunicado vem em porcentagem; no arquivo vai **dividido por 100**. Exemplo: PIS 1,10% e COFINS 5,08%:

```js
'2026-12': { pis: 0.0110, cofins: 0.0508 }
```

(os números acima são só exemplo; use os do comunicado de cada estado)

Para conferir, simule uma fatura com leitura atual no mês novo: o aviso amarelo some e o "Resumo de Tributos" mostra as alíquotas digitadas.

### 4.2 Reajuste de tarifa de energia (TUSD e TE)

**Não digite tarifas à mão.** O arquivo `vigencias.js` é gerado por script. Escolha um caminho.

**A. Dados abertos da ANEEL (mais simples).** Troque a data pelo início da vigência nova:

```bash
python scripts/conta-teste/aneel-dados-abertos.py SP 2027-10-23 novas_sp.xlsx
```
```bash
python scripts/conta-teste/exportar-vigencias.py - novas_sp.xlsx --acrescentar
```

Para o **ES**, o arquivo vai na primeira posição:

```bash
python scripts/conta-teste/aneel-dados-abertos.py ES 2027-08-07 novas_es.xlsx
```
```bash
python scripts/conta-teste/exportar-vigencias.py novas_es.xlsx - --acrescentar
```

O `-` significa "não mexa neste estado". O `--acrescentar` soma a vigência nova sem reescrever o histórico.

**B. Export do portal** ([base de tarifas da ANEEL](https://portalrelatorios.aneel.gov.br/luznatarifa/basestarifas), painel **TUSD e TE**; limpe o filtro de data e filtre a Sigla EDP SP ou EDP ES). Use o mesmo `exportar-vigencias.py` com `--acrescentar`.

A ANEEL costuma atrasar alguns dias para publicar. Se o script disser que não há linhas, espere. A base nacional "data.xlsx" vem cortada em 150 mil linhas e não serve.

**Depois de importar:** rode `git diff --stat` e confira que em `vigencias.js` só houve **linhas acrescentadas**.

Um reajuste também costuma mudar os itens da receita 4.4.

### 4.3 Valor das bandeiras

Arquivo: `calculo.js`, bloco `BANDEIRAS` (R$ por kWh, sem impostos).

**Atenção:** a bandeira **não tem vigência**. Trocar o valor muda também a simulação de faturas antigas, e a regressão vai acusar. Se a ANEEL mudar os valores, não publique sem tratar isso: peça apoio técnico.

A **cor** de cada mês não fica no sistema: quem simula escolhe na tela.

### 4.4 Outros valores com vigência

Arquivo: `tarifas-aneel.js`. Para um período novo, **acrescente** uma linha com `inicio` e `fim`; não apague as antigas.

| Bloco | O que é | Entra no total? |
|---|---|---|
| `ENCARGO_ESCASSEZ_HIDRICA` | Informativo de Escassez Hídrica | Não |
| `FIO_B_TUSD` | Informativo do Fio B | Não |
| `PERC_REDUCAO_GD` | Compensação da Geração Distribuída (GD2 vale até 06/08/2027) | **Sim** |
| `SUDENE_CONFIG` | Redutor SUDENE (ES) | **Sim** |
| `ICMS_FAIXAS_RESIDENCIAL` | Faixas de ICMS do residencial | **Sim** |

O ICMS de Rural e Irrigante fica em `calculo.js` (ES: Rural 4%, Irrigante 17%; SP: 12%). Mudança de ICMS só com confirmação da área e fatura real.

### 4.5 CIP (iluminação pública, ES)

- **Uma fatura com CIP diferente:** o campo "CIP (R$)" é editável. Digite o valor da fatura e anote o município para revisão. Isso não exige mudar o sistema.
- **Tarifa B4a** (base dos municípios por percentual): `cip-municipios.js`, bloco `TARIFA_B4A`. O valor atual passa para `anterior`, o novo entra em `atual`, e `data_troca` recebe a data. Só há espaço para esses dois valores.
- **Tabela de um município:** os dados são gerados por script a partir do [site da EDP](https://www.edp.com.br/tabela-de-calculo-cip/). O passo a passo está no começo de `scripts/conta-teste/importar-cip-site.py` e de `gerar-cip-municipios.py`. **Cuidado:** a regeração pode mover em centavos municípios que não mudaram (o site arredonda a alíquota). Se isso aparecer no `git diff`, não publique.

---

## 5. Conferir, salvar e publicar

### 5.1 Conferir

```bash
npm run verificar
```
```bash
npm run verificar-cip
```

Esperado: **"Tudo idêntico à referência"** e **"Tudo certo"**.

- Acrescentar um mês ou uma vigência **futura** não deve mudar nenhum cenário antigo.
- Se aparecer **FALHA**, a mudança alterou uma conta já validada. **Pare** e revise.

### 5.2 Registrar a fatura que prova a mudança

1. Em `scripts/conta-teste/cenarios.mjs`, copie um bloco parecido, cole no fim da lista e ajuste. Em `fatura_real`, vai o total impresso.
2. Com o `npm run dev` ligado em outro terminal:

```bash
node scripts/conta-teste/capturar-referencia.mjs 3020
```

3. Esse comando **regrava a referência de todos os cenários**. Confira em `git diff scripts/conta-teste/referencia.json` que só há linhas **adicionadas**. Se linhas antigas mudaram sem motivo, descarte: `git checkout -- scripts/conta-teste/referencia.json`.
4. Rode `npm run verificar` de novo.

### 5.3 Salvar (commit) com a sua própria conta

```bash
git add -A
```
```bash
git commit -m "PIS/COFINS de 12/2026 (ES e SP)"
```
```bash
git push
```

### 5.4 Publicar

| Ambiente | Branch | Comando | Quando |
|---|---|---|---|
| Teste | `teste` ou qualquer outra | `npm run publicar:teste` | Para a área validar |
| Produção | `main` | `npm run publicar` | **Só depois de validado** |

A produção recusa publicar fora da `main`, com alteração sem commit ou com teste falhando, e pede para digitar `PRODUCAO`. Os botões de `ferramentas/Painel Conta Teste.xlsx` fazem o mesmo.

### 5.5 Desfazer

- **Antes do commit:** `git checkout -- <arquivo>`
- **Depois do commit:** `git revert <código do commit>` e publique de novo.

---

## 6. "A conta não bateu": confira nesta ordem

1. **Aviso amarelo** na tela? Falta tarifa ou PIS/COFINS do período.
2. **Tarifa selecionada** é a da fatura?
   - Mensagem de **Desconto Social** (linhas "até 120 kWh") → **B1CDE**.
   - **Subvenção Tarifária / Valor Baixa Renda** → **B1BRN MP 1300**.
3. **Todas as linhas sem kWh** da fatura foram lançadas em "Ajustes"? Parcelas, multas, juros, créditos (valor negativo), bônus e serviços de terceiros.
4. **Consumo:** a fatura cobra menos que a diferença de leitura? Ligue o **Desconto BT** (1,5%). Há **constante do medidor**?
5. **Bandeiras:** a fatura imprime por tipo, não por data. Preencha os **"Dias na fatura"**.
6. **Fase** (muda o consumo mínimo: 30, 50 ou 100 kWh).
7. **SUDENE** ligado quando a fatura tem a linha "Red. SUDENE".
8. **CIP** igual à da fatura.
9. Compare **linha a linha** a coluna "Tarifa Unit." e a alíquota de ICMS. A primeira linha diferente mostra a causa.

Se tudo confere e a diferença passa de R$ 0,03, guarde: o PDF da fatura, o print da tela inteira (formulário e resultado) e a linha que diverge.

---

## 7. Pontos em aberto (não são erro de quem está usando)

- **Fio B de SP** sem valor publicado desde 23/10/2026 (informativo).
- **Escassez Hídrica:** valores derivados de faturas; pode haver diferença de centavos no informativo.
- **ICMS de 17% do Irrigante no ES** confirmado por uma única fatura.
- **GD3** não calcula (o sistema avisa).
- **São José do Calçado:** CIP manual. **Ecoporonga (Baixa Renda):** a tabela de origem tem faixas repetidas.

## 8. Onde ler mais

- Regras de cálculo completas: [treinamento-databricks/regras_de_calculo.md](treinamento-databricks/regras_de_calculo.md)
- Regras em linguagem simples e CIP por município: `Regras_Tarifas_e_CIP.xlsx`
- Publicação: [../plataforma/publicacao.md](../plataforma/publicacao.md)
