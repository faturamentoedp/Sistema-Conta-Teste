# Regras de cálculo da fatura — EDP ES e EDP SP (Grupo B)

> **Origem:** transcrição fiel do motor de cálculo do simulador "Conta Teste"
> (`src/modulos/conta-teste/motor/calculo.js` e módulos vizinhos), conferida contra 51 cenários
> de regressão: 18 ancorados no total impresso de faturas reais, 8 em modelos
> oficiais da EDP (7 de total e 1 de linha do SUDENE) e 25 que apenas travam o
> comportamento atual. Estado do código em **27/10/2026**.
> **Escopo:** Grupo B (baixa tensão), distribuidoras **ES** e **SP**.
> **Onde está o código:** só leitura — esta pasta não altera nada do projeto.
> Os dados numéricos (tarifas, alíquotas, faixas) estão em `dados/*.csv`; este
> documento explica **como usá-los**.

Convenções deste texto: `kWh` = consumo faturado; `R$` com 2 casas só aparece
após arredondamento explícito; `round2(x)` = `Math.round(x*100)/100` do
JavaScript (ver seção 14 sobre arredondamento).

---

## 1. Visão geral do cálculo

A fatura de energia é montada assim:

1. Descobre-se a **tarifa** (TUSD + TE, em R$/kWh, **sem tributos**) vigente nos
   dias do período de leitura, por categoria e posto.
2. Aplica-se **consumo mínimo** (30/50/100 kWh conforme a fase).
3. Define-se o **ICMS** e o **PIS/COFINS** do mês.
4. Soma-se a base de energia (TUSD + TE + bandeiras) e divide-se por um
   **divisor "imposto por dentro"** (*gross-up*): o resultado é o valor da
   energia **já com os tributos embutidos**.
5. Distribui-se esse valor entre as linhas (TUSD, TE, bandeira…) e calculam-se,
   linha a linha, ICMS, base e valor de PIS/COFINS.
6. Somam-se os itens especiais: Baixa Renda, Desconto Social, retenções
   (poder público), Geração Distribuída, redutor SUDENE, ajustes.
7. **Informativos** (Fio B, Escassez Hídrica, Benefício Tarifa Social) são
   calculados e mostrados, mas **não entram no total**.
8. `total_fatura = total_energia − retenções + CIP + ajustes`.

Sinais: valores que **abatem** a conta (injeção de GD, SUDENE, crédito de
subvenção, retenções) são negativos nas linhas.

---

## 2. Entradas

### 2.1 Parâmetros do motor (corpo do `POST /api/calcular`)

| Campo | Tipo / valores | Observação |
|---|---|---|
| `distribuidora` | `ES` \| `SP` | Outra → erro 400. Padrão `ES`. |
| `categoria` | ver seção 3 | Maiúscula. Padrão `B1C`. |
| `fase` | `monofasico` \| `bifasico` \| `trifasico` | Define o consumo mínimo. |
| `data_leitura_anterior`, `data_leitura_atual` | `YYYY-MM-DD` | Lidas como meia-noite UTC. Atual deve ser **posterior** à anterior. |
| `consumo_kwh` | número ≥ 0 | Categorias sem posto. |
| `consumo_ponta`, `consumo_fora_ponta`, `consumo_intermediario` | número ≥ 0 | Só categorias `*_TB` (Tarifa Branca). |
| `consumo_reservado` | número ≥ 0 | Só B2 irrigante (`B2RUIRRG`/`B2RUIRRG_TB`). |
| `bandeira_mes1`, `bandeira_mes2`, `bandeira_mes3` | `VERDE`, `AMARELA`, `VERMELHA_P1`, `VERMELHA_P2`, `ESCASSEZ` (mês 3: ou vazio) | Mês 3 é opcional. Em ordem **cronológica** (Mês 1 = mês do 1º dia faturado). |
| `bandeiras_dias` | `[{bandeira, dias}]` | Opcional. Dias de cada bandeira como a **fatura imprime** (ela lista por tipo, não por data). Quando presente, substitui `bandeira_mes1/2/3`; a soma dos dias tem que ser igual aos dias do período, senão o motor devolve erro. |
| `valor_cip` | R$ | CIP (iluminação pública) já calculada/informada. |
| `ajustes` | `[{nome, valor}]` | Multas, juros, devoluções… Somam ao total, sem tributo. |
| `valor_ajuste` | R$ | Ajuste único legado. Linha só aparece se > 0; entra no total sempre. |
| `icms_opcao` | `auto` \| `isento`/`0` \| `4` \| `12` \| `17` \| `18` \| número | Substitui o ICMS automático. |
| `is_isento_icms` | bool | Força ICMS = 0. |
| `sudene` | bool | Liga o redutor SUDENE (só ES). |
| `gd_ativo`, `gd_papel`, `gd_modalidade`, `geradoras[]`, `inj_ponta`, `inj_intermediario`, `inj_fora_ponta` | ver seção 11 | Geração Distribuída. |
| `tarifas` | objeto ou lista | Sobrepõe a tarifa de um posto (uso avançado/testes). |

### 2.2 Pré-processamento feito pela **tela** antes de chamar o motor

Estas duas regras **não estão no motor**; quem reproduzir o cálculo fora do
sistema precisa aplicá-las antes:

1. **Constante do medidor** (medição indireta): o consumo digitado é a
   *diferença de leitura*; `consumo = diferença × constante`. Constante vazia,
   zero ou inválida vale 1. Multiplica `consumo_kwh`, `consumo_reservado`,
   `consumo_ponta`, `consumo_fora_ponta`, `consumo_intermediario`.
2. **Desconto BT / perda de 1,5 % no ramal** (opcional): depois da constante,
   `consumo = round(consumo × 0,985)` — **arredondado para kWh inteiro**
   (`Math.round`). Aplica-se também ao consumo de cada geradora de GD. Ex.:
   394 × 0,985 = 388,09 → 388 (conferido na instalação 151389514, SP, Baixa
   Renda). Desligado, o consumo passa como digitado.

O consumo mínimo (seção 5) é aplicado pelo motor **depois** dessas duas.

### 2.3 Validações da API (HTTP 400)

JSON inválido; datas inválidas; leitura atual ≤ anterior; distribuidora fora
de ES/SP; consumo negativo ou não numérico em qualquer campo de consumo;
Geração Distribuída GD3 (sem percentual cadastrado, o motor devolve `erro`).

---

## 3. Categorias de fatura

`categoria` define tarifa, regras de ICMS e linhas especiais. A categoria da
tela → chave de busca da tarifa:

| Categoria (tela) | O que é | Chave de tarifa | Particularidades |
|---|---|---|---|
| `B1C` | B1 Residencial convencional | `B1C` | ICMS por faixa de consumo (seção 7). |
| `B1C_TB` | B1 Residencial Tarifa Branca | `B1C_TB` | 3 postos; ICMS padrão do estado. |
| `B1CDE` | B1 com **Desconto Social** (Lei 15.235/2025) | `B1CDE` | Tarifa reduzida até 120 kWh (`faixa=ate`) e cheia acima (`faixa=acima`). |
| `B1BRN/B1BPC/B1BRQ/B1BRI` | **Baixa Renda** (MP 1300) | idem | 80 kWh isentos; Subvenção. Qualquer categoria que comece com `B1BR`. |
| `B2RURAL` | B2 Rural | `B2RURAL` | ICMS ES 4 % / SP 12 %. |
| `B2RURAL_TB` | B2 Rural Tarifa Branca | `B2RURAL_TB` | idem + 3 postos. |
| `B2RUIRRG` | B2 Rural **Irrigante** | `B2RUIRRG` | + consumo reservado a 40 % da tarifa. Rótulo de linha: "Ativo". |
| `B2RUIRRG_TB` | Irrigante Tarifa Branca | `B2RUIRRG_TB` | idem. |
| `B3` | B3 Comercial/demais classes | `B3` | ICMS padrão do estado. |
| `B3_CP` | B3 Consumo Próprio | `B3` | **ES: ICMS isento. SP: ICMS normal** (confirmado em fatura real). |
| `B3_PPF` | B3 Poder Público **Federal** | `B3` | Retenções federais (seção 10.1). |
| `B3_PPE` | B3 Poder Público **Estadual** | `B3` | ICMS **isento** (qualquer estado) + retenção de IR 1,2 % (10.2). |
| `B3_TB`, `B3_CP_TB`, `B3_PPF_TB`, `B3_PPE_TB` | versões Tarifa Branca | `B3_TB` | 3 postos; mesmas isenções/retenções da versão sem `_TB`. Grafias `B3CP_TB`, `B3PPF_TB`, `B3PPE_TB` também são aceitas. |
| `B4A` | Iluminação pública (rede de distribuição) | `B4A` | Sem consumo mínimo. **Em SP**: retenção de IR 1,2 %. CIP municipal = 0. |
| `B4B` | Iluminação pública (a prefeitura) | `B4B` | Sem consumo mínimo. |

Regras de formação do nome:

* `is_tb`: categoria termina em `_TB`.
* `is_baixa_renda`: começa com `B1BR`.
* `is_desconto_social`: igual a `B1CDE`.
* `is_irrigante`: começa com `B2RUIRRG`.
* `is_b4`: começa com `B4`.

Categoria **desconhecida** (ex.: `B1C_GERAR`) não tem tarifa na base: o motor
usa a **tarifa padrão embutida** (seção 4.4) e segue como categoria comum. Não
existe tratamento especial de "geradora isenta" por nome de categoria.

---

## 4. Tarifa TUSD / TE

### 4.1 Base

Tarifas são as de *"Tarifa de Aplicação"* publicadas pela ANEEL, em **R$/kWh,
sem tributos**, por distribuidora, **vigência** (resolução homologatória),
categoria e posto. Arquivo: `dados/tarifas_aneel_vigencias.csv`
(coluna `bloco`: `tarifas` = tarifa de consumo; `tarifas_scee` = tarifa de
compensação da energia injetada, publicada pela ANEEL e importada junto. **O
motor usa só o bloco `tarifas`**, inclusive para a energia injetada — o bloco
`tarifas_scee` está na base mas não entra em nenhum cálculo hoje).

Vigências cadastradas:

* **ES:** REH 3.508/2025 (01/01/2026 a 06/08/2026) e REH 3.600/2026
  (07/08/2026 a 06/08/2027).
* **SP:** 21 vigências, de REH 1.072/2010 (23/10/2010) até o Despacho ANEEL
  3.611/2026 (23/10/2026 a 22/10/2027). A REH 3.541/2025 está partida em duas
  linhas na virada de 01/01/2026. A de 23/10/2026 entrou em 29/10/2026, quando
  a ANEEL atualizou os dados abertos.

Postos: `Nao aplica` (sem posto), `Ponta`, `Intermediário`, `Fora ponta`.
`faixa`: só B1CDE (`ate` / `acima`).

### 4.2 Dias de cada vigência dentro do período

O período de faturamento é **aberto na leitura anterior e fechado na atual**:
o dia da leitura anterior **não conta**, o da leitura atual **conta**.

```
inicio_efetivo = max(leitura_anterior + 1 dia, vigencia.inicio)
fim_efetivo    = min(leitura_atual,           vigencia.fim)
dias           = 0 se fim_efetivo < inicio_efetivo
               = (fim_efetivo − inicio_efetivo) em dias + 1   caso contrário
```

Exemplo oficial da EDP: leitura de 24/07 a 25/08/2026, virada em 07/08 →
13 dias na tarifa antiga e 19 na nova, total 32.

### 4.3 Tarifa do período (`resolver_tarifas`)

1. Mapeia a categoria para a chave (tabela da seção 3). Se existir um
   *override* cadastrado para a categoria, usa ele (hoje a lista está vazia).
2. Para cada vigência com a categoria cadastrada, calcula `dias`.
3. **Nenhuma vigência cobre o período:** usa a **última vigência** que tenha a
   categoria (o simulador nunca para de responder — gera *aviso*, seção 15).
4. **Uma vigência:** usa as linhas dela sem cálculo.
5. **Várias (virada de resolução):** média **ponderada pelos dias**:
   `tarifa = Σ (tarifa_i × dias_i) / Σ dias_i`, separadamente para TUSD e TE,
   por `(posto, faixa)`.

### 4.4 Normalização e tarifas de reserva

* `normalizar_tarifas`: valores `> 10` são divididos por 100.000 (importações
  antigas sem decimais). Para `B2RUIRRG`, TE `0,29749` é trocado por `0,32068`
  (correção de cadastro antigo).
* **Escolha do posto** (`getTarifaConsolidada`): procura a linha com o nome do
  posto; se não achar, usa a **primeira linha da categoria**; se não houver
  linha alguma (categoria sem tarifa), usa a tarifa padrão abaixo.
  Os postos sem tarifa própria ("Não se aplica") caem na primeira linha por
  construção (a base grava `Nao aplica`; o motor procura `Não se aplica`).
  Na base, as linhas de Tarifa Branca vêm em ordem alfabética: *Fora ponta,
  Intermediário, Ponta*.
* Interruptor `REPRODUZIR_FALLBACK_POSTO` = **`false`** (atual): cada posto da
  Tarifa Branca usa a tarifa do próprio posto. (Com `true`, Intermediário e
  Reservado seriam cobrados com a tarifa de Ponta — comportamento antigo,
  desligado.)
* **Tarifa padrão embutida** (última linha de defesa; R$/kWh):

| Caso | TUSD | TE |
|---|---|---|
| ES / SP rural e irrigante: Ponta | 1,06103 | 0,48448 |
| rural e irrigante: Intermediário | 0,72534 | 0,30579 |
| rural e irrigante: Fora ponta | 0,38965 | 0,30579 |
| rural e irrigante: sem posto | 0,46863 | 0,32068 |
| B4A, B4B | 0,25775 | 0,17638 |
| Tarifa Branca ES: Ponta / Interm. / Fora ponta | 0,93761 / 0,65129 / 0,36496 | 0,48448 / 0,30579 / 0,30579 |
| Tarifa Branca SP: Ponta / Interm. / Fora ponta | 0,86563 / 0,59980 / 0,33398 | 0,49484 / 0,31504 / 0,31504 |
| Baixa Renda SP | 0,30080 | 0,29060 |
| Baixa Renda ES e demais ES | 0,46863 | 0,32068 |
| demais SP | 0,30080 | 0,29060 |

---

## 5. Consumo faturado e consumo mínimo

1. Define os **postos** (linhas de consumo):
   * Tarifa Branca (`*_TB`): `Ponta`, `Fora ponta`, `Intermediário`, cada um com
     o seu consumo.
   * `B1CDE`: dois "postos" por faixa: `até 120 KWh` = `min(consumo, 120)` e
     `acima de 120 KWh` = `max(consumo − 120, 0)`.
   * Demais: um posto com `consumo_kwh`.
2. `consumo_medido_total = Σ qtd`.
3. `minimo_fase = 0` se B4; senão `monofasico=30`, `bifasico=50`,
   `trifasico=100`.
4. `diff_minimo = max(minimo_fase − consumo_medido_total, 0)`. Se `> 0`, é somado
   ao posto **Fora ponta** (Tarifa Branca) ou ao **primeiro posto** (os demais;
   no B1CDE, à faixa "até 120").
5. `consumo_faturado_total = Σ qtd` (já com o mínimo).

O consumo mínimo **é faturado como energia** (com tarifa, ICMS e PIS/COFINS) —
ex.: 1 kWh medido, bifásico → 50 kWh faturados.

---

## 6. PIS/COFINS

Alíquotas **efetivas mensais**, por distribuidora, vindas do comunicado da EDP
(Nota Técnica 115-SFF/SRE/ANEEL, transação SAP `ZCCS_PISCOFINS`). A chave é o
**mês da leitura atual**. Arquivo: `dados/pis_cofins_mensal.csv`.

* ES: de 2024-01 a 2026-11. SP: de 2014-01 a 2026-11.
* Mês não cadastrado → alíquota padrão `PIS 0,63 % + COFINS 2,89 %` e **aviso**.
* Só a **soma** (`pis + cofins`) entra no imposto por dentro; PIS e COFINS são
  separados apenas no detalhamento, calculados sobre a mesma base.
* Pontos de atenção: ES jul/2024 (`1,40 % / 1,86 %`) foge da proporção normal,
  provável erro na origem; SP jul/2026 foi derivado da própria fatura
  (soma 5,586 %), não de comunicado — substituir quando houver o oficial.

---

## 7. ICMS

Fração do valor final da linha. Ordem de decisão (a primeira que valer):

1. **`icms_opcao` diferente de `auto`**: `isento`/`0` → 0; `12`, `17`, `18`, `4`
   → 12 %, 17 %, 18 %, 4 %; outro número `n` → `n/100` se `n>1`, senão `n`.
2. **Isenção por categoria** ou `is_isento_icms=true`:
   * `B3_CP`, `B3_CP_TB`, `B3CP_TB` — isentos **só no ES**;
   * `B3_PPE`, `B3_PPE_TB`, `B3PPE_TB` — isentos em **qualquer** estado.
3. **Residencial convencional** (não Tarifa Branca e categoria `B1C*` ou Baixa
   Renda): alíquota **por faixa do consumo faturado** (`consumo_faturado_total
   ≤ limite`, limite inclusivo):

| Estado | Até (kWh, inclusivo) | Alíquota |
|---|---|---|
| ES | 50 | 0 % |
| ES | acima de 50 | 17 % |
| SP | 90 | 0 % |
| SP | 200 | 12 % |
| SP | acima de 200 | 18 % |

   Baixa Renda de SP usa as mesmas faixas do residencial.
   *Atenção:* o limite de 200 kWh em SP é o clássico da lei paulista, comprovado
   só pelos pontos 158 kWh (12 %) e 291 kWh (18 %).
4. **Rural e irrigante** (categoria começa com `B2RURAL` ou `B2RUIRRG`,
   inclusive `_TB`): **ES 4 %**, **SP 12 %**.
5. **Demais** (inclui Tarifa Branca B1, B3, B4A, B4B): padrão do estado —
   **ES 17 %**, **SP 18 %**.

**Cálculo do ICMS na linha:** `icms_linha = round2(valor_total × alíquota)`.

**Apresentação quando ICMS = 4 %:** a fatura imprime alíquota **12 %** sobre
base reduzida a **1/3** do valor (`base = round2(valor/3)`), o que dá a carga
efetiva de 4 %. A conta é a mesma; só muda o que se mostra.

---

## 8. Imposto por dentro e distribuição entre as linhas

### 8.1 Divisor

```
se icms > 0:  divisor = 1 − icms − (1 − icms) × (pis + cofins)
senão:        divisor = 1 − pis − cofins
se divisor ≤ 0: divisor = 1
```

Significa: PIS/COFINS incidem sobre o valor **já líquido do ICMS** (base do
PIS/COFINS = valor − ICMS). O preço unitário com tributos de uma tarifa é
`tarifa / divisor`.

### 8.2 Base de energia

Cada linha de energia tem `valor_base = quantidade × tarifa_base` (sem tributos).
As linhas são, na ordem em que são criadas:

1. (Baixa Renda) linhas de isentos: `TUSD-Consumo MP1300…` e `TE - Consumo MP
   1300…` — tarifa 0.
2. Linhas de consumo faturado por posto: `TUSD - Consumo …` e `TE - Consumo …`
   (qtd arredondada a 2 casas).
3. (Irrigante) `TUSD - Consumo Reservado` e `TE - Consumo Reservado`, com
   tarifa × **0,4** (desconto regulatório de 60 %).
4. Bandeiras (seção 9): `Adic.Band. …`.

`total_base = Σ valor_base`.

### 8.3 Valor da energia faturada e rateio por linha

```
total_energia_faturado = round2(total_base / divisor)
```

Para cada linha *i* (na ordem acima):

* tarifa = 0 → `valor_total = 0`;
* **última** linha → `valor_total = round2(total_energia_faturado − acumulado)`
  (absorve a diferença de arredondamento). Se a última linha tiver tarifa 0, a
  regra de "tarifa = 0" vence e a diferença de arredondamento não é absorvida
  por ninguém;
* demais → `valor_total = round2(total_energia_faturado × valor_base_i / total_base)`
  e acumula.

Depois, por linha:

```
preco_unit      = valor_total / quantidade
icms_linha      = round2(valor_total × icms)
base_pis_cofins = round2(valor_total − icms_linha)      (0 se valor_total = 0)
pis             = round2(base_pis_cofins × pis)
cofins          = round2(base_pis_cofins × cofins)
valor_pis_cofins= round2(pis + cofins)
```

> Os totais de PIS e COFINS do resumo são `round2(Σ base_pis_cofins × alíquota)`,
> e **não** a soma dos valores por linha. Por isso podem divergir 1–2 centavos
> da soma das linhas.

---

## 9. Bandeiras tarifárias

Adicional em R$/kWh (arquivo `dados/bandeiras_tarifarias.csv`):

| Bandeira | R$/kWh |
|---|---|
| VERDE | 0,00000 |
| AMARELA | 0,01885 |
| VERMELHA_P1 | 0,04463 |
| VERMELHA_P2 | 0,07877 |
| ESCASSEZ | 0,14200 |

A bandeira é **do mês-calendário**; um período que cruza meses paga cada
bandeira proporcionalmente aos dias de cada mês.

### 9.1 Dias por mês (`calcular_proporcionalidade_dias`)

* **Mesmo mês** (leitura anterior e atual no mesmo mês/ano):
  `dias_mes1 = 0`, `dias_mes2 = dias do período`, `dias_mes3 = 0`.
* **Senão:** conta-se a partir do dia seguinte à leitura anterior; o **Mês 1 é o
  mês desse primeiro dia faturado** (leitura em 30/09 → Mês 1 = outubro). Cada
  mês-calendário recebe seus dias (o dia da leitura atual conta). Até 3 meses;
  se cruzar mais, o excedente é somado ao mês 3.
  Ex.: 13/04 a 13/05 → 17 dias (abril) + 13 (maio); 25/04 a 02/06 → 5 + 31 + 2.
* `dias_totais = dias_mes1 + dias_mes2 + dias_mes3` (mínimo 1).

### 9.2 Linha de bandeira

Se `bandeiras_dias` vier no corpo, o fator de cada bandeira é `Σ dias das entradas dessa bandeira / dias_totais` e a ordem dos campos não importa (os dias precisam somar `dias_totais`). Sem `bandeiras_dias`, vale a regra por mês abaixo.

Para cada bandeira *B* com tarifa `t_B`:

```
fator_B = [mes1==B]·dias_mes1/dias_totais + [mes2==B]·dias_mes2/dias_totais
        + [mes3==B]·dias_mes3/dias_totais
se fator_B > 0:
    quantidade_faturada = (consumo_faturado_liquido + consumo_reservado) × fator_B
    tarifa da linha     = t_B   (irrigante: média ponderada entre ativo a t_B e reservado a 0,4·t_B)
```

`consumo_faturado_liquido` = soma das quantidades das linhas `TUSD - Consumo …`
com tarifa > 0 (exclui reservado e isentos de Baixa Renda). A bandeira entra
na `total_base` e recebe o mesmo imposto por dentro.

### 9.3 Bandeira na Baixa Renda

* Linha extra `Adic.Band. X MP1300` com `quantidade = consumo_isento × fator_B`
  e tarifa 0 (apenas informativa).
* **Só ES:** `base_br_pura += consumo_isento × fator_B × t_B`, ou seja, a
  bandeira entra na base da Subvenção (parâmetro `SUBVENCAO_INCLUI_BANDEIRA`:
  ES = sim, SP = não — comprovado por duas faturas divergentes).

### 9.4 Bandeira efetiva (para a injeção de GD)

`tarifa_bandeira_efetiva = Σ_B t_B × fator_B` (bandeira média do período).

---

## 10. Retenções (Poder Público)

### 10.1 B3 PPF (e `_TB`) — federal

Sobre `total_energia_faturado`, cada uma arredondada:

* PIS/PASEP 0,65 %, CSLL 1,00 %, IR 1,20 %, COFINS 3,00 %.

Aparecem como linhas negativas (`Retenção PIS/PASEP`, `Retenção CSLL`,
`Retenção IR`, `Retenção COFINS`) e saem do total.

### 10.2 B3 PPE (e `_TB`) e B4A de **SP**

Só **Imposto de Renda** 1,20 % de `total_energia_faturado` (linha
`Retenção Imposto de Renda`). Estado e município só são obrigados a reter IR
(Lei 9.430/96, art. 64); PIS/COFINS/CSLL continuam cobrados. Confirmado em
fatura real (R$ 1,02 sobre R$ 85,32). B4A no ES: **sem** retenção.

`total_retencoes` é a soma e é **subtraída** do total da fatura.

---

## 11. Regimes especiais

### 11.1 Baixa Renda (MP 1300) — `B1BR…`

* **80 kWh isentos** (`FAIXA_TARIFA_SOCIAL_KWH`), consumidos no primeiro posto.
  Esses kWh saem a tarifa 0 nas linhas (`TUSD-Consumo MP1300`, `TE - Consumo MP 1300`).
* `base_br_pura = isentos × (TUSD + TE)` (+ bandeira dos isentos no ES; − SUDENE
  dos isentos quando ligada, ver 11.4).
* Duas linhas extras:

```
divisor_full = SP: (icms > 0 ? 1 − icms : 1)
               ES: o mesmo divisor da seção 8.1
base_icms_br = round2(base_br_pura / divisor_full)
icms_br      = round2(base_icms_br × icms)
valor_baixa_renda = round2(base_br_pura + icms_br)

linha "Valor Baixa Renda"   (ES) / "Subvenção Tarifária"        (SP): +valor_baixa_renda
linha "Desconto Baixa Renda" (ES) / "Crédito Subvenção Tarifária" (SP): −round2(base_br_pura)
```

Efeito líquido no total = `icms_br` (o ICMS da subvenção continua sendo cobrado).
Em SP o PIS/COFINS **não** entra no `divisor_full`.

* Os 80 kWh isentos entram na faixa de ICMS (o consumo faturado total, não só
  o cobrado, define a faixa) e **não** entram em `consumo_faturado_liquido`.

### 11.2 Desconto Social — `B1CDE` (Lei 15.235/2025)

Tarifa específica: até 120 kWh usa a linha `faixa=ate`, acima usa `faixa=acima`
(esta igual à B1C). As linhas de consumo ganham o sufixo `até 120 KWh` /
`acima de 120 KWh`. A categoria **não** é Baixa Renda (sem isenção de 80 kWh),
e, para a CIP, é tratada como Residencial.

### 11.3 B2 Irrigante — consumo reservado

`consumo_reservado` é faturado com **40 %** da tarifa (TUSD e TE da posição
"sem posto"), linhas `TUSD/TE - Consumo Reservado`. A bandeira usa a média
ponderada (9.2). ICMS do rural (ES 4 %, SP 12 %).

### 11.4 Redutor SUDENE (só ES, opcional `sudene=true`)

Recursos da repactuação UBP/SUDENE: abatimento de **R$ 0,00781/kWh** (R$ 7,81
por MWh) com **vigência a partir de 30/08/2026**.

```
dias_periodo = round(leitura_atual − leitura_anterior)  (em dias)
se leitura_atual > 30/08/2026:
    dias_sudene = dias_periodo                                se leitura_anterior ≥ 30/08/2026
                = round(leitura_atual − 30/08/2026) em dias   senão
tarifa_sudene = 0,00781 / dias_periodo × dias_sudene    (0 se não houver dias)
```

Linha negativa com o mesmo imposto por dentro da energia:

```
preco_unit  = tarifa_sudene / divisor
valor_total = −round2(quantidade × preco_unit)
icms_linha  = round2(valor_total × icms); base_pis_cofins = round2(valor_total − icms_linha)
```

| Categoria | Linha | Quantidade | Tarifa |
|---|---|---|---|
| Tarifa Branca | `Red. SUDENE Cons. Tar. Branca` | `consumo_faturado_total` | `tarifa_sudene` |
| Irrigante | `Red. SUDENE Cons. ativo` e `… Cons. Reserv` | consumo ativo; consumo reservado | `tarifa_sudene`; `tarifa_sudene × 0,4` |
| Baixa Renda | `Red. SUDENE Cons. MP1300` | `consumo_faturado_total − isentos` | `tarifa_sudene` |
| Demais | `Red. SUDENE Cons. ativo` | `consumo_faturado_total` | `tarifa_sudene` |

Na **Baixa Renda** o redutor também reduz o valor dos kWh isentos:
`base_br_pura −= isentos × tarifa_sudene` (e o mesmo no Benefício, 12.3).
Conferido em fatura real ES de OUT/2026 (321 kWh): desconto 54,42 =
80 × (0,34895 + 0,32532 − 0,00781) + bandeira 1,09.

> Atenção: tarifa (R$ 7,81/MWh) e data de início vieram do plano de
> implementação; a planilha oficial está criptografada e não pôde ser aberta.

### 11.5 Geração Distribuída (MMGD, Lei 14.300/2022)

Aplica-se se `gd_ativo` e `gd_papel ≠ "gerador"` (unidade **receptora**).

* **Enquadramentos:** `GD1` (compensação integral: TUSD 100 %, TE 100 %) e
  `GD2` (transição: TUSD 73,9 % até 06/08/2026 e 75,22 % de 07/08/2026 a
  06/08/2027; TE 100 %). `GD3`: sem percentual → **erro**. Arquivo
  `dados/gd_percentual_compensacao.csv`.
* **Baixa Renda e Tarifa Branca faturam sempre como GD1**, qualquer que seja o
  enquadramento informado.
* **Consolidação das geradoras:** para cada geradora com `consumo > 0`,
  `contribuição = consumo × (percentual/100)` (percentual vazio = 100 %).
  `injetada = Σ contribuição`. O percentual de compensação de cada geradora é
  ponderado pelos dias em cada vigência (como a tarifa) e depois pela energia:
  `perc = Σ (contribuição_g × perc_g) / injetada`. Cada geradora pode ter
  enquadramento próprio.
* **Linhas de injeção** (negativas): `injetar(nome, qtd, tarifa_base, com_icms)`:

```
divisor_sem_icms = 1 − pis − cofins
div          = com_icms ? divisor : divisor_sem_icms
preco_unit   = tarifa_base / div
valor_total  = −round2(qtd × preco_unit)
icms_linha   = com_icms ? round2(valor_total × icms) : 0
base_pis_cofins = round2(valor_total − icms_linha)
```

| Linha | Tarifa base | ICMS |
|---|---|---|
| `TUSD - Consumo inj` | `TUSD × perc_tusd` | **sem ICMS** (só PIS/COFINS) |
| `TE - Consumo inj` | `TE × perc_te` | **com ICMS** |
| `Adic.Band. inj` | `tarifa_bandeira_efetiva` | com ICMS, `qtd` = total injetado |

* **Tarifa de referência:** sem posto, `getTarifaConsolidada("Não se aplica")`
  (primeira linha da categoria); na Tarifa Branca, o posto de cada linha
  (Ponta / Intermediário / Fora ponta); `inj_*` por posto; se nenhum posto for
  informado, toda a injeção vai para **Fora ponta**.
* **B1CDE:** a injeção abate **primeiro a faixa acima de 120 kWh** e depois a
  faixa até 120 (`inj_acima = min(injetada, consumo_acima)`; o resto vai para
  "até"); linhas `… inj até 120kwh` / `… inj acima 120kwh` com a tarifa da
  respectiva faixa.
* **Baixa Renda com GD:** o motor não limita a injeção; nos modelos oficiais
  a injeção informada já é `consumo − 80 kWh isentos`.
* Quando a injeção supera o consumo, o total pode ficar **negativo** — regra
  de crédito ainda não definida pelo Tributário.

### 11.6 Ajustes e CIP

* Cada item de `ajustes` com valor ≠ 0 vira uma linha (sem tributo) e soma em
  `valor_ajuste_total`; `valor_ajuste` legado também soma.
* A CIP (`valor_cip`) é somada direto ao total (não passa pelo imposto por dentro).

---

## 12. Itens **informativos** (não somam no total)

Aparecem como linhas `is_informativo`, são excluídos de `total_energia`,
`total_pis_cofins` e `total_icms`.

### 12.1 TUSD – Fio B

* **Valor publicado** (`dados/fio_b_tusd.csv`), quando existe para
  distribuidora × categoria × período: `tarifa_fio_b = TUSD_Fio_B ponderada
  pelos dias`; **sem tributos**.
  `valor = round2(consumo_faturado_total × tarifa_fio_b)`.
  * ES: só `B1C` (0,203831 até 06/08/2026; 0,209512 a partir de 07/08/2026).
  * SP: `B1C`, `B1CDE`, Baixa Renda, `B2RURAL`, `B3`, `B3_CP`, `B3_PPF`,
    `B3_PPE` = 0,198766 (0,197693 antes de 01/01/2026); `B4A` = 0,109321;
    `B4B` = 0,119259. Janela termina em 22/10/2026 (sem valor para a vigência de
    23/10/2026: o que passa dessa data usa só os dias dentro da janela, e um
    período inteiro depois dela cai na estimativa de 45 %).
* **Sem valor publicado** (ES fora do B1C, SP Tarifa Branca e B2 irrigante, ou
  período fora da janela): **estimativa** `tarifa = 0,45 × TUSD(Não se
  aplica)`, brutada por `divisor_fio_b` (mesmo divisor da seção 8.1) →
  `preco_unit = tarifa / divisor_fio_b`; `valor = round2(consumo_faturado_total × preco_unit)`.
* A linha só aparece se `consumo_faturado_total > 0` e `tarifa > 0`.

### 12.2 Encargo CDE – Escassez Hídrica

Componente embutido no TUSD/TE que a fatura só exibe como rodapé; **já líquido
de tributos**: `consumo × (tusd + te)` do encargo. Arquivo
`dados/escassez_hidrica_encargo.csv`. Valor ponderado pelos dias nas vigências.

| Distribuidora | Vigência | TUSD | TE | Soma |
|---|---|---|---|---|
| ES | 01/01/2026 – 06/08/2026 (REH 3.508) | 0,00018609 | −0,0042314 | −0,004045 |
| ES | 07/08/2026 – 06/08/2027 (REH 3.600) | 0,00018609 | −0,00072809 | −0,000542 |
| SP | 23/10/2025 – 31/12/2025 | 0,00011506 | −0,00207315 | — |
| SP | 01/01/2026 – 22/10/2026 | 0,00012449 | −0,00127319 | — |
| SP | 23/10/2026 – 22/10/2027 | 0,00012449 (mantido) | −0,00054322 (derivado) | — |

(Os dois valores do ES são **derivados** a partir de três pontos de fatura/modelo;
só a soma é evidenciada. SP: sem valor antes de 23/10/2025 — nesse caso o
informativo não aparece. A planilha da área não traz valor próprio para o B2
irrigante de SP, mas o código aplica o mesmo valor do grupo B convencional a
qualquer categoria.)

```
kwh_escassez = max(consumo_faturado_total − isentos_baixa_renda, 0)
valor        = round2(kwh_escassez × (tusd + te))                    [ES]
```

* **SP — tarifa social** (Baixa Renda e B1CDE) usa só o **TE** do encargo nos kWh
  com desconto:
  * Baixa Renda: `kwh_social = consumo_faturado − isentos`, `kwh_cheio = 0`;
  * B1CDE: `kwh_social = min(consumo, 120)`, `kwh_cheio = max(consumo − 120, 0)`;
  * `valor_bruto = kwh_social × te + kwh_cheio × (tusd + te)`.
* **SP — arredondamento por componente:**
  `valor = round2( round2(kwh_tusd × tusd) + round2(kwh_te × te) )`, com
  `kwh_tusd = kwh_cheio` (em tarifa social) e `kwh_te = kwh_escassez`.
  No ES o arredondamento é único.
* Aplicado a **todas as categorias** do ES por pedido da equipe, embora o valor
  por kWh só esteja comprovado em fatura para B1 residencial.

### 12.3 Benefício Tarifa Social (só ES, só Baixa Renda)

Mensagem de rodapé da fatura Baixa Renda:
`valor = round2( isentos × (TUSD + TE) − isentos × tarifa_sudene )` —
**sem** a bandeira. Em SP o informativo está desligado (sem fatura de referência).

---

## 13. Totais

```
total_energia      = Σ valor_total das linhas que NÃO são: informativas,
                     "Ajustes / Outros Valores", "Retenção …" e linhas de
                     ajustes digitados
total_icms         = Σ valor_icms (não informativas)
total_pis_cofins   = Σ valor_pis_cofins (não informativas)
total_base_pis_cofins = Σ base_pis_cofins (não informativas)
total_pis          = round2(total_base_pis_cofins × pis)
total_cofins       = round2(total_base_pis_cofins × cofins)
total_retencoes    = retenções 10.1 / 10.2 (positivo)
valor_ajuste_total = valor_ajuste + Σ ajustes[].valor
total_fatura       = round2( total_energia − total_retencoes + valor_cip + valor_ajuste_total )
```

`total_energia` inclui: energia faturada, bandeiras, linhas Baixa Renda
(Valor + Desconto/Subvenção + Crédito), injeção de GD (negativa) e redutor
SUDENE (negativo).

Saída do motor: `detalhes[]` (linhas), `resumo{}`, `parametros_usados{}`
(consumo faturado e alíquotas aplicadas) e `avisos[]` (quando houver).

---

## 14. Arredondamento e fidelidade numérica

* Todo `round2` é `Math.round(x * 100) / 100` do **JavaScript**: o empate
  (`.5`) vai sempre para **cima**, em direção a +∞ (`Math.round(2,5)` = 3 e
  `Math.round(-2,5)` = -2). O `round()` do Python usa arredondamento bancário
  (empate para o par) e o `round()` do Spark SQL arredonda empate para longe do
  zero (diferente do JS em negativos). Para reproduzir centavo a centavo, use
  `floor(x*100 + 0.5)/100`.
* Aritmética em ponto flutuante de 64 bits (`double`). Em Databricks, use
  `DOUBLE`, **não** `DECIMAL`, para reproduzir os mesmos arredondamentos.
* A EDP calcula o imposto linha a linha; o simulador calcula o total por dentro
  e distribui. Por isso o resultado pode diferir **até R$ 0,03** da fatura
  impressa — esse é o limite de tolerância adotado pela área na validação.
* O arredondamento das quantidades de bandeira é `toFixed(4)` e das de consumo
  faturado é 2 casas.

---

## 15. CIP — Contribuição de Iluminação Pública (ES, por município)

A CIP é cobrada na fatura e **não passa pelo imposto por dentro**. O motor
recebe `valor_cip` pronto; a **tela** calcula automaticamente para o ES a partir
da tabela da prefeitura (70 municípios; arquivos `dados/cip_es_municipios.csv`
e `dados/cip_es_faixas.csv`). SP: CIP informada manualmente.

### 15.1 Classe do município por categoria

| Categoria | Classe da tabela |
|---|---|
| `B1BR…` | `RESIDENCIAL BAIXA RENDA` |
| `B1C…` (inclui `B1CDE` e `B1C_TB`) | `RESIDENCIAL` |
| `B2RU…` | `RURAL` |
| `B4A`, `B4B` | isento (R$ 0,00) |
| `B3_PPF…` | `PPF` (isento só se o município isentar; senão = `B3`/`DEMAIS CLASSES`) |
| `B3_PPE…` | `PPE` (idem) |
| demais | `DEMAIS CLASSES` |

### 15.2 Passos (`calcular_cip_municipio`)

1. Município inexistente ou do tipo `incompativel` (São José do Calçado, em que
   a CIP é percentual sobre o **valor da fatura**) → sem cálculo: CIP manual.
2. Classe isenta (B4A/B4B) → 0.
3. `RURAL`: `isenta_rural` (ou `isenta_irrigante`, para `B2RUIRRG`) → 0 — vale
   mesmo se o município tiver tabela de rural (ex.: Conceição da Barra).
4. `PPF`/`PPE`: `isenta_ppf`/`isenta_ppe` → 0; senão calcula como `B3`.
5. Seleciona a **tabela da classe**; rural sem tabela e sem isenção cai em
   `DEMAIS CLASSES` (aproximação por falta de dado).
6. **Faixa:** a de menor `max` tal que `consumo ≤ max` (limite **inclusivo**);
   `max` vazio = faixa aberta. Consumo usado = o consumo faturado após
   constante do medidor e perda BT (**sem** consumo mínimo; Tarifa Branca = soma
   dos postos).
7. Valor da faixa:
   * `isento` → 0;
   * **valor fixo** (18 municípios, ex.: Vitória, Serra, Vila Velha):
     `round2(valor_fixo_rs)`;
   * **percentual** (51 municípios): `round2(aliquota × Tarifa_B4a)`.

### 15.3 Tarifa B4a (base da CIP percentual)

* R$ **434,13** até 06/08/2026 e R$ **464,04** a partir de 07/08/2026 (mesma
  virada da REH 3.600). Em período que cruza a virada:
  `Tarifa_B4a = (dias_antes × 434,13 + dias_depois × 464,04) / dias_total`,
  com a mesma contagem de dias da seção 4.2.
* Exemplo: Afonso Cláudio, `B1C`, 100 kWh, depois de 07/08/2026:
  faixa 71–100 → alíquota 0,0288 × 464,04 = **R$ 13,36**.

---

## 16. Avisos de cobertura (`avisos[]`)

O motor **nunca para de responder**, mas avisa quando completou dado faltante
"no chute":

1. Leitura atual **posterior ao fim da última vigência** cadastrada (os dias
   depois usam a tarifa anterior).
2. Período começa **antes da primeira vigência** cadastrada.
3. **PIS/COFINS do mês** da leitura atual não cadastrado (usa 0,63 % / 2,89 %).

---

## 17. Exemplos resolvidos (conferidos com o motor)

### 17.1 ES, B1C, 300 kWh, 10/09 → 10/10/2026, bandeira verde, CIP R$ 10,00

* Vigência: tudo na REH 3.600 → TUSD 0,50632, TE 0,33739.
* PIS/COFINS de 2026-10: 1,10 % + 5,08 % = 6,18 %. ICMS: 300 > 50 → 17 %.
* `divisor = 1 − 0,17 − 0,83 × 0,0618 = 0,778706`.
* `total_base = 300 × (0,50632 + 0,33739) = 253,113` →
  `total_energia_faturado = round2(253,113 / 0,778706) = 325,04`.
* Rateio: TUSD `round2(325,04 × 0,50632/0,84371)` = **195,06**; TE (última) =
  325,04 − 195,06 = **129,98**.
* ICMS TUSD `round2(195,06 × 0,17)` = 33,16; base PIS/COFINS 161,90 →
  PIS 1,78 + COFINS 8,22 = 10,00.
* **Total = 325,04 + 10,00 (CIP) = R$ 335,04.**
* Informativos: Fio B `300 × 0,209512` = 62,85; Escassez `300 × (−0,000542)` = −0,16.

### 17.2 SP, Baixa Renda, 355 kWh, 17/09 → 19/10/2026

Bandeira: mês 1 amarela, mês 2 verde; juros 0,56 e multa 4,79.

* Dias: 18/09–30/09 = 13 (mês 1) e 01/10–19/10 = 19 (mês 2); `fator_amarela = 13/32`.
* Tarifa SP: TUSD 0,3008, TE 0,2906 (REH 3.541). ICMS: 355 > 200 → 18 %.
  PIS/COFINS 2026-10 SP: 1,06 % + 4,89 % = 5,95 %.
* Subvenção (SP, sem bandeira): `base_br_pura = 80 × (0,3008 + 0,2906) = 47,312`;
  `divisor_full = 0,82` → base ICMS 57,70; ICMS 10,39; **Subvenção 57,70** e
  **Crédito −47,31**.
* Energia faturada (275 kWh): TUSD 107,26 + TE 103,62 + bandeira
  (111,71875 kWh × 0,01885 brutado) 2,73 = 213,61.
* `total_energia = 213,61 + 57,70 − 47,31 = 224,00`;
  **total = 224,00 + 0,56 + 4,79 = R$ 229,35** (fatura real: 229,36).
* Informativos: Fio B 355 × 0,198766 = 70,56; Escassez (só TE em 275 kWh)
  `275 × −0,00127319` = −0,35 (impresso −0,35).

### 17.3 SP, B1C bifásico, 1 kWh medido, 18/08 → 18/09/2026

* Mínimo bifásico → **50 kWh faturados**. ICMS: 50 ≤ 90 → isento (0).
* PIS/COFINS SP 2026-09: 1,21 % + 5,59 % = 6,80 % → `divisor = 0,932`.
* Bandeira amarela nos dois meses: fator 1.
* Base = 50 × (0,45667 + 0,33003 + 0,01885) = 40,2775 → ÷ 0,932 = **43,22**.
* Mais ajuste 45,93 (fatura anterior) e CIP 14,66 → **R$ 103,81** (real: 103,80).

---

## 18. Validação: faturas reais e modelos oficiais usados como âncora

Diferença máxima aceita: **R$ 0,03**. Os 51 cenários completos, com as saídas
linha a linha, estão em `dados/exemplos_resolvidos.jsonl`.

| Âncora | Caso | Fatura real / modelo | Simulador |
|---|---|---|---|
| Doc 265002360732 | ES B1CDE 154 kWh, 22/05–23/06/2026 | 159,01 | 159,01 |
| Doc 257002385025 | ES Baixa Renda 100 kWh | 35,54 | 35,54 |
| Virada REH 3.600 | ES B1C 121 kWh, 21/07–20/08/2026 | 141,69 | 141,68 |
| ES Baixa Renda 413 kWh | REH 3.600 em 28 de 30 dias | 340,39 | 340,37 |
| ES Baixa Renda 321 kWh + SUDENE | OUT/2026 (241 kWh faturados) | 246,22 | 246,22 |
| SP Baixa Renda BPC (Lote 11) | 355 kWh | 229,36 | 229,35 |
| SP B1 bifásico (NF-e 027.587.971) | 1 → 50 kWh | 103,80 | 103,81 |
| SP B1 bifásico (NF-e 029.977.277) | 0 → 50 kWh | 56,86 | 56,86 |
| SP B3 trifásico (NF-e 027.587.974) | 120 kWh (3 × constante 40) | 135,69 | 135,69 |
| SP B3 trifásico (NF-e 029.977.285) | 40 → 100 kWh | 110,31 | 110,31 |
| SP Baixa Renda inst. 151389514 | perda 1,5 % (394 → 388) | 289,74 | 289,73 |
| SP B1CDE (NF-e 027.725.044) | perda 1,5 %, 308 kWh | 308,97 | 308,95 |
| SP B1C 158 kWh | ICMS 12 % pela faixa | 172,82 | 172,83 |
| ES B2 Rural (Doc 0.000.183.869.054-76) | 939 kWh, ICMS 4 % | 874,51 | 874,50 |
| Modelo ES Baixa Renda 450 kWh | Benefício 53,94 / Escassez −0,20 | 339,98 | 339,98 |
| Modelos ES de GD (GD1, GD2, B1CDE, Baixa Renda) | injeção, 4 modelos | 144,26 / 32,3852 / 121,39 / 145,81 | 144,27 / 32,39 / 121,41 / 145,83 (tolerância R$ 0,05 nos dois últimos) |

---

## 19. Limitações e pendências conhecidas

1. **SP — vigência de 23/10/2026**: a tarifa de consumo está na base (fonte:
   dados abertos da ANEEL). Ficam **sem valor publicado** o TUSD Fio B e o TUSD
   da Escassez a partir dessa data; o TE da Escassez (−0,00054322) foi derivado
   de uma fatura de Baixa Renda (Lote 17). Períodos inteiros depois de 23/10
   usam a estimativa de 45 % no Fio B.
2. **GD3** sem percentual de compensação (devolve erro). **Injeção maior que o
   consumo** gera total negativo sem regra de crédito.
3. **Fio B — SP Tarifa Branca** (a própria planilha da área sinaliza erro) e
   **B2 irrigante** (planilha com `#REF!`) seguem na estimativa de 45 %. ES
   fora do B1C também. A **Escassez Hídrica** é aplicada pelo código a qualquer
   categoria, inclusive o B2 irrigante de SP, sem fatura que comprove o valor.
4. **ICMS de SP entre 159 e 290 kWh**: o limite de 200 kWh não foi comprovado
   por fatura.
5. **Escassez Hídrica ES**: valores por resolução são derivados; comprovados
   em Baixa Renda e no ciclo B1 de referência. Aplicado a todas as categorias
   do ES por decisão da equipe.
6. **SUDENE**: constantes (R$ 7,81/MWh e 30/08/2026) não conferidas na fonte
   oficial (planilha criptografada); só ES.
7. **CIP**: São José do Calçado é manual; Aracruz tem observação "VERIFICAR" da
   área (Baixa Renda possivelmente isenta pela Lei 3870/2014); *Poder Público
   Municipal* não existe como categoria; rural sem tabela e sem isenção cai em
   `DEMAIS CLASSES`.
8. **PIS/COFINS**: jul/2024 do ES e jul/2026 de SP são dados atípicos/derivados
   (seção 6); meses futuros precisam ser cadastrados todo mês.
9. **B3 PPF/PPE/CP em SP e ES**: regras de ICMS por estado confirmadas por
   colegas de SP; sem confirmação para todo caso do ES.

---

## 20. Referência rápida — nomes das linhas da fatura

| Linha | Quando aparece |
|---|---|
| `TUSD - Consumo [Ativo] [MP1300] [posto/faixa]` | energia faturada, componente TUSD |
| `TE - Consumo …` | componente TE |
| `TUSD-Consumo MP1300…`, `TE - Consumo MP 1300…` | kWh isentos da Baixa Renda (tarifa 0) |
| `TUSD/TE - Consumo Reservado` | irrigante, 40 % da tarifa |
| `Adic.Band. {Amarela, Vermelha P1, Vermelha P2, Escassez}` | bandeira com fator > 0 |
| `Adic.Band. … MP1300` | bandeira dos kWh isentos (tarifa 0) |
| `Valor Baixa Renda` / `Desconto Baixa Renda` | Baixa Renda ES |
| `Subvenção Tarifária` / `Crédito Subvenção Tarifária` | Baixa Renda SP |
| `Retenção PIS/PASEP`, `CSLL`, `IR`, `COFINS` | B3 PPF |
| `Retenção Imposto de Renda` | B3 PPE e B4A SP |
| `TUSD/TE - Consumo inj`, `Adic.Band. inj` | GD |
| `Red. SUDENE …` | redutor SUDENE |
| `TUSD - Fio B (Item Informativo)` | informativo |
| `Informativo: Encargo CDE - Escassez Hídrica` | informativo |
| `Informativo: Benefício Tarifa Social` | informativo (ES Baixa Renda) |
