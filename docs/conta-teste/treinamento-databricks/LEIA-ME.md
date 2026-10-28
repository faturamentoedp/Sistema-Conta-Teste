# Pasta de treinamento — regras de cálculo da fatura (Databricks)

Esta pasta é **independente do projeto**: nada nela é importado pelo sistema, não
entra no build do Next.js (não há `.ts`/`.tsx` aqui) e nenhum arquivo fora dela
foi alterado. Pode ser copiada, enviada ou apagada sem efeito no simulador.

## O que tem aqui

| Arquivo | Para quê |
|---|---|
| `regras_de_calculo.md` | **Documento principal.** Todas as regras de cálculo, na ordem em que o motor executa: entradas, tarifa, consumo mínimo, PIS/COFINS, ICMS, imposto por dentro, bandeiras, Baixa Renda, Desconto Social, irrigante, SUDENE, retenções, Geração Distribuída, informativos (Fio B, Escassez, Benefício), totais, CIP por município, arredondamento, exemplos resolvidos, pendências. |
| `dados/*.csv` | As tabelas que a regra consome (tarifas ANEEL, PIS/COFINS, ICMS, bandeiras, GD, Fio B, Escassez, CIP, parâmetros). |
| `dados/exemplos_resolvidos.jsonl` | 49 casos: `entrada` → `saida` do motor (linha a linha), mais `ancoras_reais` (total impresso na fatura real ou no modelo oficial). Serve como conjunto de teste/treino. |
| `gerar_dados.mjs` | Regera os arquivos de `dados/` a partir do código do motor. Somente leitura. |

## Dicionário dos CSVs

Separador `;`, UTF-8, ponto como decimal, cabeçalho na primeira linha.

| Arquivo | Linhas | Chave | Colunas principais |
|---|---|---|---|
| `tarifas_aneel_vigencias.csv` | 536 | distribuidora + vigência + bloco + categoria + posto + faixa | `tusd_rs_kwh`, `te_rs_kwh` (R$/kWh **sem tributos**), `vigencia_inicio/fim`, `resolucao`. `bloco`: `tarifas` (consumo, o único usado pelo motor) ou `tarifas_scee`. |
| `pis_cofins_mensal.csv` | 191 | distribuidora + `mes_leitura_atual` | `pis`, `cofins`, `soma`. A linha `*`/`PADRAO` é a alíquota usada quando o mês não existe. |
| `icms_regras.csv` | 11 | distribuidora + regra | Faixas do residencial (`consumo_faturado_ate_kwh_inclusivo`), padrão por estado, rural/irrigante, isenções. |
| `bandeiras_tarifarias.csv` | 5 | bandeira | `adicional_rs_kwh`. |
| `gd_percentual_compensacao.csv` | 4 | modalidade + vigência | `perc_compensacao_tusd/te` (GD1, GD2; GD3 sem valor). |
| `escassez_hidrica_encargo.csv` | 4 | distribuidora + vigência | `tusd_rs_kwh`, `te_rs_kwh`, `soma_rs_kwh` (já líquido de tributos). |
| `fio_b_tusd.csv` | 22 | distribuidora + categoria + vigência | `tusd_fio_b_rs_kwh` (sem tributos). |
| `parametros_regras.csv` | 25 | parâmetro + distribuidora | Constantes: 80 kWh isentos, 120 kWh do Desconto Social, SUDENE, retenções, consumo mínimo, chaves de comportamento por estado. |
| `cip_es_municipios.csv` | 70 | `municipio_chave` | `metodo` (`percentual`/`fixo`/`incompativel`), lei, isenções (`isenta_rural`, `isenta_irrigante`, `isenta_ppf`, `isenta_ppe`). |
| `cip_es_faixas.csv` | 1.772 | município + classe + faixa | `consumo_de_kwh_exclusivo`, `consumo_ate_kwh_inclusivo` (vazio = faixa aberta), `aliquota_sobre_tarifa_b4a` **ou** `valor_fixo_rs`, `isento`. |

Todas as faixas de consumo usam **limite superior inclusivo** (`consumo ≤ ate`).

## Como carregar no Databricks

1. Suba a pasta `dados/` para um *Volume* do Unity Catalog (ou para o DBFS).
2. Em um notebook, por exemplo (não testado neste ambiente — ajuste catálogo,
   esquema e caminho):

```python
base = "/Volumes/<catalogo>/<esquema>/<volume>/dados"
for nome in ["tarifas_aneel_vigencias", "pis_cofins_mensal", "icms_regras",
             "bandeiras_tarifarias", "gd_percentual_compensacao",
             "escassez_hidrica_encargo", "fio_b_tusd", "parametros_regras",
             "cip_es_municipios", "cip_es_faixas"]:
    (spark.read.option("header", True).option("sep", ";").option("inferSchema", True)
          .csv(f"{base}/{nome}.csv")
          .write.mode("overwrite").saveAsTable(f"<catalogo>.<esquema>.{nome}"))

exemplos = spark.read.json(f"{base}/exemplos_resolvidos.jsonl")
```

3. Para o texto das regras, envie `regras_de_calculo.md` como documento de
   treinamento/base de conhecimento.

## Cuidados ao reproduzir o cálculo fora do sistema

* Use `DOUBLE` (não `DECIMAL`) e o arredondamento `floor(x*100 + 0.5)/100`
  para bater centavo a centavo com o motor (detalhes na seção 14 do documento).
* A **constante do medidor** e a **perda de 1,5 % no ramal** são aplicadas pela
  *tela*, antes do motor — o documento descreve as duas (seção 2.2).
* A diferença aceita contra a fatura impressa é de **R$ 0,03**.
* O texto foi escrito em 27/10/2026. **A resolução de SP de 23/10/2026
  (REH 3.611) ainda não está na base**; os CSVs refletem exatamente o que o
  sistema tem hoje.

## Como manter atualizado

Na raiz do projeto:

```bash
node docs/conta-teste/treinamento-databricks/gerar_dados.mjs
```

Regera os CSVs e o `.jsonl` a partir do motor. O `regras_de_calculo.md` é texto
escrito à mão: se uma regra mudar em `src/modulos/conta-teste/motor/`, atualize o documento
também (os números das tabelas ficam sempre nos CSVs).
