# Conta Teste: cobertura de férias (17/12/2026 a 04/01/2027)

O passo a passo completo está no **[manual de uso e manutenção](manual-do-desenvolvedor.md)**. Esta página lista só o que pede atenção no período.

| Prioridade | Item | O que fazer | No manual |
|---|---|---|---|
| Feito | PIS/COFINS de **12/2026** (ES e SP) cadastrado em 26/11/2026 | Nada a fazer | 7.1 |
| **Alta** | Faturas com leitura atual em **2027** | O cálculo atual **não vale**: PIS e COFINS são substituídos por CBS e IBS. A simulação da reforma é preliminar. Não use o resultado para conferência sem a validação da área | 1.3 e 10 |
| Alta | Alíquota da CBS e regras da reforma indefinidas | Levar as perguntas em aberto para a área | 10.5 |
| Média | CIP dos municípios (conferida em 22/10/2026) | Se divergir só na CIP, digitar o valor da fatura e anotar o município | 7.6 |
| Baixa | Tarifas de energia (ES até 06/08/2027; SP até 22/10/2027) | Nenhum reajuste previsto no período | 7.2 |

> **Correção em 25/11/2026:** a primeira versão deste guia mandava cadastrar o PIS/COFINS de 01/2027. Isso foi retirado por causa da reforma. A regra para a fatura que começa em dezembro e termina em janeiro ainda precisa ser definida pela área fiscal.

## Antes de sair

- [ ] Definir quem fica responsável e quem valida na área.
- [ ] Enviar o código ao GitHub.
- [ ] Atualizar a branch `teste`.
- [ ] Dar acesso ao GitHub e à Vercel com a conta de cada pessoa (sem compartilhar senha).
- [ ] Fazer o ensaio: rodar os testes e `npm run publicar:teste -- --dry-run`.
- [ ] Confirmar qual versão está na produção.
