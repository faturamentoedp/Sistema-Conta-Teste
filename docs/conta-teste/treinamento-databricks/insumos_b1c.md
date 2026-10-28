# Insumos do cálculo do B1C — conferência da lista de componentes

Conferido contra o motor de cálculo (`src/modulos/conta-teste/motor/`) e contra os CSVs desta pasta, em 28/10/2026. Cobre o **B1C (Residencial convencional)** de **EDP ES** e **EDP SP**. As regras completas estão em [regras_de_calculo.md](regras_de_calculo.md); os números, em `dados/`.

## 1. Lista original x o que o sistema realmente usa

| Componente | Como estava na lista | Correção / o que de fato entra | Tabela |
|---|---|---|---|
| **Energia** | valor da tarifa por geografia, vigência e categoria de tarifa | **Correto.** Detalhes: são **dois valores** (TUSD e TE, R$/kWh, **sem tributos**); a vigência é a resolução homologatória (início e fim); se o período de leitura **cruza a virada**, a tarifa é a média ponderada pelos dias de cada vigência. No B1C não há posto nem faixa (esses existem na Tarifa Branca e no B1CDE). | `tarifas_aneel_vigencias.csv` (`bloco = tarifas`, `categoria = B1C`) |
| **Bandeira** | valor da tarifa por geografia e vigência | **Parcialmente errado.** O valor (R$/kWh) é por **tipo de bandeira** (Verde 0, Amarela 0,01885, Vermelha P1 0,04463, Vermelha P2 0,07877, Escassez 0,142) e é **igual para ES e SP** — não depende de geografia. Além do valor, o cálculo precisa de **qual bandeira vigorou em cada mês** e **quantos dias de cada bandeira** o período teve (a fatura imprime esses dias; o simulador também os deriva das datas). | `bandeiras_tarifarias.csv` |
| **CIP** | alíquota por geografia, município, classe e faixa de consumo | **Quase certo, com 3 ajustes.** (1) Só existe tabela para o **ES** (70 municípios); em SP a CIP é informada à mão. (2) O valor não é sempre alíquota: em **51 municípios** é `alíquota × Tarifa B4a`; em **18** é **valor fixo em R$** por faixa; em **1** (São José do Calçado) é % da fatura e fica manual. (3) Falta a **Tarifa B4a** como insumo, com vigência (R$ 434,13 até 06/08/2026; R$ 464,04 desde 07/08/2026, rateada por dias na virada). No B1C a classe é `RESIDENCIAL`; faixa por consumo faturado em kWh (limite superior inclusivo). | `cip_es_municipios.csv`, `cip_es_faixas.csv`, `parametros_regras.csv` (`TARIFA_B4A_*`) |
| **ICMS** | alíquota por geografia, subgrupo e faixa de consumo | **Correto para o B1C.** ES: isento até 50 kWh, 17% acima. SP: isento até 90 kWh, 12% de 91 a 200, 18% acima de 200. A faixa usa o **consumo faturado** (já com o consumo mínimo). Atenção: a regra por faixa vale só para residencial convencional (`B1C`, `B1CDE`, Baixa Renda); Tarifa Branca, Rural, B3 etc. usam alíquota fixa do estado ou isenção. | `icms_regras.csv` |
| **PIS/COFINS** | alíquota por geografia e mês | **Correto.** O mês é o da **leitura atual**. São duas alíquotas (PIS e COFINS) **efetivas**, vindas do comunicado mensal da EDP — não as alíquotas legais de 1,65% / 7,6%. Mês sem cadastro usa 0,63% / 2,89% e gera aviso. | `pis_cofins_mensal.csv` |

## 2. O que faltava na lista (também entra no cálculo do B1C)

1. **Datas de leitura (anterior e atual)** — definem os dias em cada vigência de tarifa e em cada mês de bandeira. O dia da leitura anterior não conta; o da atual conta.
2. **Consumo (kWh) e fase** — o consumo mínimo faturado é 30 (mono), 50 (bi) ou 100 kWh (tri) e é cobrado como energia, com tributos. Também pode haver **constante do medidor** (consumo = diferença × constante) e **perda de 1,5% no ramal** (opcional, arredondada para kWh inteiro).
3. **Imposto por dentro** — todas as tarifas são **sem tributos**. O valor da energia é `(TUSD + TE + bandeira) ÷ divisor`, com `divisor = 1 − ICMS − (1 − ICMS) × (PIS + COFINS)`, e só depois é rateado entre as linhas da fatura.
4. **Ajustes** — multas, juros, devoluções: somam ao total sem tributo. A **CIP** também soma direto ao total.
5. **Informativos** (aparecem na fatura, **não somam** no total): **TUSD Fio B** e **Encargo CDE – Escassez Hídrica**, ambos por geografia e vigência (`fio_b_tusd.csv`, `escassez_hidrica_encargo.csv`).
6. **Opcionais**: redutor **SUDENE** (só ES, a partir de 30/08/2026) e **Geração Distribuída** (percentual de compensação GD1/GD2, `gd_percentual_compensacao.csv`).
7. **Composição impressa na fatura** (Energia elétrica, Distribuição, Transmissão, Encargos setoriais, Tributos): o simulador **ainda não calcula** essa quebra — está na fila de pedidos.

## 3. Lacunas dos dados hoje (o que o Databricks não vai encontrar)

| Lacuna | Efeito |
|---|---|
| **ES só tem tarifas a partir de 01/01/2026** (duas resoluções) | Faturas do ES anteriores a 2026 não têm tarifa; o motor usa a mais recente e avisa. A base da ANEEL que recebemos não traz o subgrupo B do ES para anos anteriores. |
| **SP termina em 22/10/2026** (falta a REH 3.611, de 23/10/2026) | Leituras depois dessa data usam a tarifa antiga e geram aviso. |
| **Bandeira sem histórico** | Os valores são os atuais, fixos; não há vigência. Também **não existe tabela "qual bandeira em cada mês"** — hoje quem usa informa a bandeira de cada mês (ou os dias que a fatura mostra). |
| **ICMS e Tarifa B4a sem histórico** | ICMS é a regra vigente (sem vigência); a B4a só tem duas datas. |
| **CIP de SP** | Não há tabela; é valor informado. |
| **PIS/COFINS do ES** | Começa em jan/2024 (SP, em jan/2014). |
| **Escassez Hídrica do ES** | Os valores por resolução foram **derivados** de faturas; uma fatura B1 recente (Inst 30875, ES) imprimiu −R$ 0,13 contra −R$ 0,19 do simulador, então o valor do B1 em REH 3.600 está para revisão. É informativo e não altera o total. |

## 4. Exemplo de conferência (ES, B1C, 300 kWh, 10/09 a 10/10/2026, bandeira verde, CIP R$ 10,00)

- Tarifa: TUSD 0,50632 e TE 0,33739 (REH 3.600); PIS/COFINS de out/2026 = 1,10% + 5,08%; ICMS 17% (consumo acima de 50 kWh).
- `divisor = 1 − 0,17 − 0,83 × 0,0618 = 0,778706`; energia = `300 × (0,50632 + 0,33739) ÷ 0,778706 = R$ 325,04`.
- Total da fatura = 325,04 + CIP 10,00 = **R$ 335,04**.
- Informativos: Fio B 300 × 0,209512 = R$ 62,85; Escassez 300 × (−0,000542) = −R$ 0,16.

## 5. Perguntas para fechar com quem vai treinar o modelo

1. **Desde quando** o modelo precisa de faturas? Para o ES antes de 2026 precisamos obter as resoluções antigas (REH) na ANEEL.
2. A base do Databricks já tem **a bandeira vigente por mês**? Se tiver, dá para ligar direto à data da leitura e dispensar o preenchimento manual.
3. Qual formato prefere para as tabelas: **CSV** (como estão) ou já em **Delta/tabelas** no catálogo?
4. O escopo é só **B1C** ou também as outras categorias (Baixa Renda, B1CDE, Tarifa Branca, B2, B3)? O documento principal já cobre todas.
