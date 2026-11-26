# Reforma Tributária no Conta Teste (protótipo)

**Situação em 26/11/2026: simulação preliminar, não validada.** Disponível também no link oficial, com aviso na tela (liberada em 26/11/2026). Como usar, onde mexer e as perguntas em aberto estão na parte 10 do [manual](manual-do-desenvolvedor.md).

## Fontes

- `EDP ES_Modelo_NFe_B1C.xlsm` e `EDP SP_Modelo_NFe_B1C.xlsm`, aba **Modelo Reforma**.
- Os quatro modelos de Grupo A (cativo e livre, ES e SP) servem de base para uma etapa futura; não foram encontrados CBS ou IBS nos textos das abas.

## Como foi construído

- Na tela há a tarifa **Fatura B1 (Res) - Reforma 2027** (só a fatura nova, colunas da planilha) e a caixa **Comparar com a Reforma 2027**. A tarifa existe só na tela: o cálculo recebe `B1C`.
- Na linha TOTAL, as colunas CBS/IBS e Base do ICMS somam os valores sem arredondar, como a planilha (ES: 14,02 e 165,02).
- `motor/reforma.js` chama o motor atual e usa, de cada linha de consumo e bandeira, a quantidade e a tarifa sem impostos. `calculo.js` não foi alterado.
- A rota só calcula a reforma quando recebe `comparar_reforma` (e `reformaDisponivel.ts` está ligado). O resultado vai no campo `reforma`.
- `npm run verificar-reforma` reproduz os exemplos: ES R$ 178,53 e SP R$ 243,13. No exemplo do ES, o total atual do sistema (R$ 167,04) também é igual ao da planilha.

## Escolhas provisórias

| Tema | Escolha | Alternativa |
|---|---|---|
| CBS | 11,3% (planilha); 11,2% selecionável | Depende da resolução do Senado e da área fiscal |
| ICMS | CBS e IBS **dentro** da base (tabela dos modelos ES e SP) | Fora da base (quadro "Fatura B1" do ES). A tela mostra o total dos dois jeitos |
| Bandeiras vermelhas e Escassez | Mesma regra do consumo | A planilha ainda usa a fórmula antiga |
| CIP e ajustes | Fora da base de CBS, IBS e ICMS | Falta a lista de itens tributáveis |
| Período entre 2026 e 2027 | CBS/IBS na fatura inteira, com aviso | Regra de transição indefinida |

## Diferenças encontradas nas planilhas

1. No ES, a tabela da fatura soma R$ 165,02 e o quadro "Fatura B1" soma R$ 162,15 (sem a CIP): R$ 2,87 de diferença, pelo ICMS sobre CBS e IBS.
2. As linhas de bandeira vermelha e Escassez ainda embutem o imposto por dentro, com as alíquotas novas.
3. Em SP, a base do ICMS das bandeiras vermelhas 1 e 2 está fixada em zero.
4. No exemplo de SP, a leitura é anterior à vigência informada, o que gera dias negativos e distorce a composição da conta.
