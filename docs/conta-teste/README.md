# Conta Teste — simulador de fatura de energia EDP (ES e SP)

Ferramenta da plataforma que simula, audita e prevê faturas de energia do Grupo B com base em categorias tarifárias, modalidades de Geração Distribuída e regras tributárias brasileiras. Rota: `/conta-teste`. Código: `src/modulos/conta-teste/`.

---

## 📖 Sobre o Projeto
Este sistema substitui planilhas de cálculo complexas por uma interface web moderna e um motor de cálculo centralizado. Ele suporta desde clientes **Convencionais** até regras complexas de categorias **Rurais e Irrigantes** (com descontos específicos no consumo reservado), **Tarifas Brancas** (Postos Ponta, Intermediário e Fora Ponta) e modalidades avançadas de **Geração Distribuída (GD)**.

O cálculo leva em conta as regras oficiais de "imposto por dentro", detalhando de forma exata a formação do ICMS, PIS, COFINS, CIP, repasses de Bandeiras Tarifárias proporcionais e o item informativo do **Fio B**.


---

## ⚡ Geografias, Categorias e GDs

### 🟢 Geografias
- **EDP ES (Espírito Santo)** e **EDP SP (São Paulo):** tarifas da ANEEL por vigência (ES: 2 resoluções; SP: 21, de 2010 até 22/10/2027).

### 🟢 Categorias atendidas
Todas as regras, categoria por categoria, estão em [treinamento-databricks/regras_de_calculo.md](treinamento-databricks/regras_de_calculo.md) (seção 3). Resumo:

- **B1** Residencial: convencional (`B1C`), Tarifa Branca (`B1C_TB`), Desconto Social (`B1CDE`) e Baixa Renda MP 1300 (`B1BR…`).
- **B2** Rural (`B2RURAL`) e Irrigante com consumo reservado a 40 % (`B2RUIRRG`), convencionais e Tarifa Branca.
- **B3** Comercial e demais classes, incluindo Consumo Próprio (`B3_CP`), Poder Público Federal (`B3_PPF`) e Estadual (`B3_PPE`), convencionais e Tarifa Branca.
- **B4A / B4B** Iluminação pública.
- **Geração Distribuída:** GD1 e GD2 (GD3 devolve erro até existir percentual cadastrado). Baixa Renda e Tarifa Branca faturam sempre como GD1.
- **Informativos** (não somam no total): TUSD Fio B, Encargo CDE Escassez Hídrica e Benefício Tarifa Social.

---

## ⚙️ Base Tarifária e Vigências

As tarifas vêm do **export oficial da ANEEL**. O script `scripts/conta-teste/exportar-vigencias.py` lê os arquivos exportados (um por distribuidora), pega as linhas *Tarifa de Aplicação* e gera `src/modulos/conta-teste/motor/vigencias.js`, organizado por **período de vigência** — inclusive sub-períodos dentro da mesma resolução, como a REH 3.541 de SP, que muda o TE em 01/01/2026.

Quando o período de leitura cruza a virada de uma resolução, a tarifa sai **ponderada pelos dias em cada vigência**. O período de faturamento é aberto na leitura anterior e fechado na atual: numa leitura de 24/07 a 25/08/2026, com virada em 07/08, são 13 dias na tarifa antiga e 19 na nova — exatamente como o modelo oficial da EDP conta.

```bash
python scripts/conta-teste/exportar-vigencias.py "export_ES.xlsx" "export_SP.xlsx"
```

## 🔆 Geração Distribuída (MMGD)

A unidade pode ser marcada como **geradora** (apenas injeta, não recebe compensação nesta fatura) ou **receptora**. Uma receptora pode receber rateio de **várias geradoras**, cada uma com o seu consumo, percentual de rateio e enquadramento próprio.

A energia injetada entra como linhas negativas, com dois tratamentos tributários distintos, conforme os modelos oficiais:
- **TUSD injetada** — sem ICMS, o preço unitário é bruteado só por PIS/COFINS;
- **TE injetada** — com ICMS, igual ao consumo.

O quanto a injeção abate depende do enquadramento: **GD1** compensa 100%; **GD2** compensa 73,9% do TUSD até 06/08/2026 e 75,22% a partir daí — o que sobra é o Fio B. **Baixa Renda e Tarifa Branca faturam sempre como GD1**, e o formulário fixa isso automaticamente.

> ⚠️ **GD3 ainda não tem percentual definido.** Os modelos oficiais recebidos cobrem apenas GD1 e GD2. Selecionar GD3 devolve erro explícito em vez de calcular um número inventado. Para habilitar, preencha `PERC_REDUCAO_GD.GD3` em `src/modulos/conta-teste/motor/tarifas-aneel.js`.

---

### Importando um reajuste da ANEEL (tarifas por vigência)
As tarifas por vigência (`src/modulos/conta-teste/motor/vigencias.js`) vêm do export da base da ANEEL (https://portalrelatorios.aneel.gov.br/luznatarifa/basestarifas, painel **TUSD e TE**; ao abrir, o painel vem filtrado em 2024 - limpe o filtro de data e filtre a **Sigla** = EDP SP ou EDP ES antes de exportar).

```bash
python scripts/conta-teste/exportar-vigencias.py - "data (33).xlsx"
```
O `-` mantém o ES como está (use `"export_ES.xlsx" "export_SP.xlsx"` para os dois). O script só aproveita as linhas da distribuidora de cada estado e **avisa quando a última vigência do arquivo termina antes de hoje** - sinal de que a base da ANEEL ainda não recebeu o reajuste novo. Depois: `npm run verificar`, `npm run publicar:teste`, validação da área e só então a produção.

> O reajuste de SP de 23/10/2026 (Despacho ANEEL 3.611/2026) não estava nem no painel nem no CSV de dados abertos nos primeiros dias; o **CSV de dados abertos** (`tarifas-homologadas-distribuidoras-energia-eletrica.csv`, em dadosabertos.aneel.gov.br) foi atualizado em 29/10/2026 e dele saiu a vigência nova (acrescentada com `--acrescentar`). Ele tem colunas diferentes do export do portal: filtre a EDP e converta para o layout das COLUNAS do script antes. A base atrasa alguns dias após cada homologação. O arquivo "data.xlsx" (base nacional, 150 mil linhas) não traz o subgrupo B do ES e não serve como export do ES.

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
O motor de cálculo é um só, em `src/modulos/conta-teste/motor/calculo.js`, usado pela API (`/api/conta-teste/calcular`) e pelos scripts de regressão. O comando `npm run verificar` roda 51 cenários (convencional, tarifa branca, baixa renda, rural, irrigante com reservado, ajustes, SP) e compara centavo a centavo com `scripts/conta-teste/referencia.json`, que congelou o comportamento do sistema antes da mudança.

---

## 🧮 Recursos Embutidos
- **Tratamento Mobile Avançado:** Todas as entradas numéricas interceptam o teclado nativo dos celulares, trocando vírgulas `,` por pontos `.` em tempo real para evitar quebra matemática no servidor.
- 
- **Tabela Dinâmica de Ajustes:** Capacidade de injetar múltiplos valores personalizados (multas, devoluções judiciais, taxas variadas) diretamente no corpo fiscal da fatura.

## 📚 Documentos desta ferramenta

- [treinamento-databricks/](treinamento-databricks/) — regras de cálculo transcritas + tabelas em CSV.
- `faq-simulador.tex`, `Duvidas_Frequentes___Conta_Teste.pdf`, `Documentacao_Simulador.tex`, `apresentacao-simulador.txt` — material de apoio para o time.
- `cip-municipios-es-extraido.json` — dados brutos da CIP por município (ES).
- Testes de regressão: `scripts/conta-teste/` (`npm run verificar`, `npm run verificar-cip`).

