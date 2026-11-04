# Painéis de Análise

Ferramenta da plataforma com painéis interativos no estilo Power BI. Rota: `/paineis` (escolha do tema). Código: `src/modulos/paineis/`.

## Como funciona

- **Dados:** o usuário carrega a tabela no próprio painel: arquivo CSV/TXT (separador detectado), Excel `.xlsx` ou texto colado do Excel. **Tudo é lido no navegador; nada é enviado ao servidor** (mantém a regra de não levar banco nem credencial para a Vercel). Do Databricks: baixe o resultado da consulta em CSV.
- **Colunas:** reconhecidas pelo nome (inteiro ou por pedaço: `dt_processamento` → Data, `msg_retorno` → Motivo). Se faltar o mínimo, o painel pede para indicar; dá para ajustar a qualquer momento em "Ajustar colunas".
- **Filtros:** ficam numa linha acima de tudo e valem para todos os visuais e abas. **Clicar numa barra ou coluna filtra o painel inteiro** (filtro cruzado); clicar de novo desfaz. Os filtros ativos aparecem como etiquetas removíveis.
- **Cores:** azul = autorizada, laranja = rejeitada, em todos os gráficos (paleta validada para daltonismo e contraste nos temas claro e escuro).

## Tema: Rejeição de NF-e (`/paineis/rejeicao-nfe`)

Uma linha por nota fiscal. Colunas reconhecidas (só **Data** e **Status ou Código** são obrigatórias):

| Campo | Exemplos de nome de coluna aceitos |
|---|---|
| Data | `data`, `data_emissao`, `dt_processamento`, `dhRecbto`, `Data Emissão` |
| Status | `status`, `situacao`, `status_nfe` (Autorizada / Rejeitada / Cancelada...) |
| Código de retorno (cStat) | `cstat`, `codigo`, `cod_retorno`, `codigo_rejeicao` |
| Motivo / mensagem | `xmotivo`, `motivo`, `mensagem`, `msg_retorno` |
| Característica do erro | `caracteristica_erro`, `detalhe`, `detalhe_erro`, `causa` |
| Distribuidora | `distribuidora`, `empresa`, `uf` |
| Categoria | `categoria`, `classe`, `subgrupo` |
| Lote | `lote`, `ciclo` |
| Número / Chave | `numero_nf`, `nr_nota`, `chave_acesso`, `chNFe` |
| Valor | `valor_total`, `vl_total`, `vNF` |

**Regras:**

- **Autorizada x rejeitada:** vale o texto do status. Sem status, o código decide: 100/150 = autorizada; 101, 110, 135, 301 e 302 = outra (cancelada ou denegada); 200 ou mais = rejeitada.
- **Erro 999 (erro não catalogado):** a característica vem da coluna de detalhe. Se ela não existir ou estiver vazia, sai do texto do motivo, tirando o prefixo "Rejeição: Erro não catalogado". Sem nenhum dos dois, aparece "(sem detalhe informado)".
- **Datas:** aceita `AAAA-MM-DD`, `dd/mm/aaaa` e as datas numéricas do Excel. Valores: `1.234,56` ou `1234.56`.

Visuais:

- **Visão geral:** KPIs (notas, autorizadas, rejeitadas e taxa, erro 999, valor rejeitado), notas por dia ou mês, rejeições por código, características do 999, por distribuidora e por categoria.
- **Erro 999:** o 999 por período, todas as características e a lista das notas.
- **Notas:** tabela filtrada, com download em CSV.

O botão "Ver com dados de exemplo" carrega dados **fictícios** (gerados em `rejeicao-nfe/exemplo.ts`), com aviso na tela.

## Como adicionar um tema

1. Crie `src/modulos/paineis/<tema>/` (modelo, agregações e painel), reaproveitando `comum/importar.ts`, `comum/Importador.tsx` e `comum/graficos.tsx`.
2. Registre o tema em `src/modulos/paineis/temas.ts`.
3. Crie a página `src/app/paineis/<tema>/page.tsx`.
