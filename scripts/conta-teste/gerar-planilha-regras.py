# -*- coding: utf-8 -*-
"""
Gera docs/conta-teste/Regras_Tarifas_e_CIP.xlsx: planilha em linguagem simples com
como a fatura é calculada, a regra de cada tarifa, as tarifas vigentes e as regras
e valores da CIP por município (ES).

Os números (tarifas vigentes, faixas e alíquotas da CIP) saem dos CSVs de
docs/conta-teste/treinamento-databricks/dados, que por sua vez são gerados do motor
(node docs/conta-teste/treinamento-databricks/gerar_dados.mjs). Os textos são
escritos à mão a partir de src/modulos/conta-teste/motor/ - se uma regra mudar lá,
atualize os textos aqui e rode de novo:

    python scripts/conta-teste/gerar-planilha-regras.py

Na aba de valores da CIP, o valor em R$ dos municípios por percentual é FÓRMULA
sobre a Tarifa B4a da aba "4_CIP_regras" (célula C5): mudando a B4a, recalcula.
"""
import csv
import io
import os

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DADOS = os.path.join(RAIZ, 'docs', 'conta-teste', 'treinamento-databricks', 'dados')
SAIDA = os.path.join(RAIZ, 'docs', 'conta-teste', 'Regras_Tarifas_e_CIP.xlsx')

FONTE = 'Arial'
COR_CABECALHO = '2F364B'
COR_FAIXA = 'F3F4F8'
COR_ENTRADA = 'FFF2CC'
fino = Side(style='thin', color='D1D5DB')
BORDA = Border(left=fino, right=fino, top=fino, bottom=fino)


def ler_csv(nome):
    with io.open(os.path.join(DADOS, nome), encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f, delimiter=';'))


def f(negrito=False, cor='000000', tam=10, italico=False):
    return Font(name=FONTE, size=tam, bold=negrito, color=cor, italic=italico)


def titulo(ws, texto, subtitulo=None, largura=8):
    ws['A1'] = texto
    ws['A1'].font = f(True, COR_CABECALHO, 14)
    if subtitulo:
        ws['A2'] = subtitulo
        ws['A2'].font = f(False, '555555', 10, True)
        ws['A2'].alignment = Alignment(wrap_text=True, vertical='top')
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=largura)
        ws.row_dimensions[2].height = 42
    ws.sheet_view.showGridLines = False


def cabecalho(ws, linha, colunas):
    for i, c in enumerate(colunas, start=1):
        cel = ws.cell(row=linha, column=i, value=c)
        cel.font = f(True, 'FFFFFF')
        cel.fill = PatternFill('solid', start_color=COR_CABECALHO)
        cel.alignment = Alignment(wrap_text=True, vertical='center', horizontal='left')
        cel.border = BORDA
    ws.row_dimensions[linha].height = 30


def linha_texto(ws, linha, valores, zebra=False, altura=None):
    for i, v in enumerate(valores, start=1):
        cel = ws.cell(row=linha, column=i, value=v)
        cel.font = f()
        cel.alignment = Alignment(wrap_text=True, vertical='top')
        cel.border = BORDA
        if zebra:
            cel.fill = PatternFill('solid', start_color=COR_FAIXA)
    if altura:
        ws.row_dimensions[linha].height = altura


def larguras(ws, ls):
    for i, w in enumerate(ls, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


wb = Workbook()

# ---------------------------------------------------------------------------
# 1. Como a fatura é calculada
# ---------------------------------------------------------------------------
ws = wb.active
ws.title = '1_Como_calcula'
titulo(ws, 'Como a conta de energia é calculada (Conta Teste)',
       'Passo a passo em linguagem simples. Vale para EDP ES e EDP SP, Grupo B (baixa tensão). '
       'Cada tarifa tem suas particularidades: veja a aba 2_Regras_por_tarifa.', 4)
cabecalho(ws, 4, ['Passo', 'O que o sistema faz', 'Em palavras simples', 'Exemplo'])
passos = [
    ('1. Período', 'Conta os dias entre a leitura anterior e a leitura atual.',
     'O dia da leitura anterior não conta; o dia da leitura atual conta. Os dias servem para dividir tarifa e bandeira quando mudam no meio do período.',
     'Leitura de 02/09 a 02/10 = 30 dias.'),
    ('2. Tarifa (TUSD + TE)', 'Busca a tarifa da ANEEL da distribuidora (ES ou SP), da categoria e da data.',
     'TUSD é o uso da rede e TE é a energia, os dois em R$ por kWh e SEM imposto. Se o período atravessa a data de um reajuste, usa a média das duas tarifas, ponderada pelos dias de cada uma.',
     'ES mudou a tarifa em 07/08/2026 e SP em 23/10/2026.'),
    ('3. Consumo', 'Define quantos kWh serão cobrados.',
     'Usa o consumo lido (vezes a constante do medidor, se houver; menos 1,5% se o Desconto BT estiver ligado). Se der menos que o mínimo, cobra o mínimo: monofásico 30 kWh, bifásico 50 kWh, trifásico 100 kWh (iluminação pública B4 não tem mínimo).',
     'Bifásico com 1 kWh lido paga 50 kWh.'),
    ('4. Bandeira', 'Soma um adicional por kWh conforme a cor da bandeira.',
     'Verde R$ 0,00000/kWh, Amarela R$ 0,01885, Vermelha P1 R$ 0,04463, Vermelha P2 R$ 0,07877, Escassez R$ 0,14200. Se a cor muda no meio do período, cada cor vale pelos dias dela.',
     'Amarela 28 dias e Verde 2 dias em 30 dias: 28/30 dos kWh pagam a Amarela.'),
    ('5. Valor da energia sem imposto', 'Calcula kWh x (TUSD + TE) mais kWh x bandeira.',
     'É o valor "limpo", antes dos impostos.', '300 kWh x (0,50632 + 0,33739) = R$ 253,11.'),
    ('6. Impostos "por dentro"', 'Divide o valor limpo por um fator que embute ICMS, PIS e COFINS.',
     'As tarifas vêm sem imposto e o imposto já está dentro do preço da fatura. Por isso divide-se por (1 - ICMS - (1 - ICMS) x (PIS + COFINS)). O resultado é repartido entre as linhas TUSD, TE e bandeira.',
     'ICMS 17% e PIS+COFINS 6,18%: fator 0,778706. R$ 253,11 / 0,778706 = R$ 325,04.'),
    ('7. ICMS e PIS/COFINS', 'ICMS depende da categoria e, no residencial, da faixa de consumo. PIS/COFINS dependem do mês.',
     'ICMS: veja a aba 2. PIS e COFINS são as alíquotas EFETIVAS do mês da leitura atual, divulgadas pela EDP todo mês (não são as alíquotas legais).',
     'Out/2026 ES: PIS 1,10% + COFINS 5,08%.'),
    ('8. Total da fatura', 'Soma energia + CIP + ajustes e desconta as retenções.',
     'A CIP (iluminação pública) soma direto, sem imposto. Multas, juros e devoluções entram como ajustes, sem imposto. Retenções (poder público) saem do total.',
     'R$ 325,04 + CIP R$ 10,00 = R$ 335,04.'),
    ('9. Informativos', 'Mostra Fio B, Escassez Hídrica e (ES Baixa Renda) Benefício Tarifa Social.',
     'Aparecem na fatura como informação e NÃO somam no total.', 'Fio B: 300 kWh x 0,209512 = R$ 62,85 (só informativo).'),
]
for i, p in enumerate(passos):
    linha_texto(ws, 5 + i, p, zebra=(i % 2 == 1), altura=78)
larguras(ws, [24, 42, 70, 44])
r = 5 + len(passos) + 1
ws.cell(row=r, column=1, value='Regras que valem para todas as tarifas').font = f(True, COR_CABECALHO, 12)
r += 1
cabecalho(ws, r, ['Tema', 'Regra', 'Em palavras simples', 'Observação'])
gerais = [
    ('Redutor SUDENE (só ES)', 'Opcional; vale a partir de 30/08/2026.',
     'Abate R$ 0,00781 por kWh (R$ 7,81 por MWh), proporcional aos dias do período depois de 30/08.', 'Liga/desliga no formulário.'),
    ('Geração Distribuída (GD)', 'A energia injetada abate a conta. GD1 compensa 100%; GD2 compensa 73,9% do TUSD até 06/08/2026 e 75,22% depois (o TE é sempre 100%).',
     'Baixa Renda e Tarifa Branca são sempre faturadas como GD1. GD3 ainda não tem percentual cadastrado e o sistema recusa.', 'O que sobra sem compensar é o Fio B.'),
    ('Fio B', 'Parte do TUSD que é informativa.', 'Mostrado na tela, não entra no total.', 'Estimado em 45% do TUSD quando não há valor publicado.'),
    ('Escassez Hídrica', 'Encargo embutido na tarifa, mostrado como informativo.', 'Mostrado na tela, não entra no total.', 'Valores de ES e SP foram derivados de faturas reais.'),
    ('Arredondamento e tolerância', 'Cada valor é arredondado a centavos.',
     'O sistema calcula o total e distribui entre as linhas; a EDP arredonda linha a linha. Por isso pode diferir até R$ 0,03 da fatura impressa (limite aceito pela área).', ''),
]
for i, g in enumerate(gerais):
    linha_texto(ws, r + 1 + i, g, zebra=(i % 2 == 1), altura=64)
ws.freeze_panes = 'A5'

# ---------------------------------------------------------------------------
# 2. Regras por tarifa
# ---------------------------------------------------------------------------
ws = wb.create_sheet('2_Regras_por_tarifa')
titulo(ws, 'Regra de cada tarifa',
       'Como a energia é cobrada, o ICMS e o que é diferente em cada categoria. "Faturado" = kWh cobrados, já com o consumo mínimo.', 9)
cabecalho(ws, 4, ['Tarifa (nome na tela)', 'Código', 'Quem é', 'Como a energia é cobrada', 'ICMS no ES', 'ICMS em SP',
                  'Regras especiais', 'Classe usada na CIP (ES)', 'Observação'])
ICMS_RES_ES = 'Isento até 50 kWh faturados; 17% acima disso.'
ICMS_RES_SP = 'Isento até 90 kWh; 12% de 91 a 200 kWh; 18% acima de 200 kWh.'
regras = [
    ('B1 Residencial', 'B1C', 'Casas e apartamentos (residencial comum).',
     'Uma tarifa única (TUSD + TE) para todos os kWh.', ICMS_RES_ES, ICMS_RES_SP,
     'O ICMS é decidido pelo consumo faturado total, não kWh a kWh.', 'Residencial', 'O limite de 200 kWh em SP não foi comprovado por fatura.'),
    ('B1 Residencial Tarifa Branca', 'B1C_TB', 'Residencial que paga preço diferente por horário.',
     'Três tarifas: Ponta (a mais cara), Intermediário e Fora ponta. Cada kWh paga a tarifa do horário em que foi consumido.',
     '17% (sem isenção por faixa).', '18% (sem isenção por faixa).',
     'O consumo mínimo que faltar é cobrado como Fora ponta. Com Geração Distribuída é sempre GD1.', 'Residencial', ''),
    ('B1 Desconto Social', 'B1CDE', 'Cliente com Desconto Social (Lei 15.235/2025).',
     'Até 120 kWh: tarifa reduzida. Acima de 120 kWh: tarifa cheia do B1.', ICMS_RES_ES, ICMS_RES_SP,
     'Não tem os 80 kWh grátis da Baixa Renda. A fatura mostra duas linhas de TUSD e de TE (até e acima de 120 kWh).',
     'Residencial (não é Baixa Renda)', ''),
    ('B1 Baixa Renda (MP 1300)', 'B1BRN/B1BPC/B1BRQ/B1BRI', 'Famílias da Tarifa Social de Energia.',
     'Os primeiros 80 kWh saem a tarifa zero. O restante paga a tarifa de Baixa Renda.', ICMS_RES_ES, ICMS_RES_SP,
     'Os 80 kWh aparecem como "Subvenção" e "Crédito" (um anula o outro; sobra só o ICMS desse valor). Em ES a bandeira dos 80 kWh entra na subvenção; em SP não. Com Geração Distribuída é sempre GD1. ES mostra o informativo "Benefício Tarifa Social".',
     'Residencial Baixa Renda', 'Em Aracruz a Baixa Renda pode estar isenta na lei municipal (a verificar).'),
    ('B2 Rural', 'B2RURAL', 'Produtor rural.', 'Uma tarifa única B2.', '4% (aparece na fatura como 12% sobre 1/3 do valor).', '12%.',
     'Existe também a versão Tarifa Branca (B2RURAL_TB), com os três horários.', 'Rural', 'Muitos municípios isentam a classe Rural.'),
    ('B2 Rural Irrigante', 'B2RUIRRG', 'Rural com serviço de irrigação.',
     'Consumo "ativo" paga a tarifa B2. Consumo no horário reservado paga só 40% da tarifa (desconto de 60%).', '4% (12% sobre 1/3).', '12%.',
     'A fatura tem linhas "Ativo" e "Reservado". Existe a versão Tarifa Branca (B2RUIRRG_TB).', 'Rural', 'Alguns municípios isentam só o Irrigante.'),
    ('B3 Comercial / Demais classes', 'B3', 'Comércio, serviços e demais classes.', 'Uma tarifa única B3.', '17%.', '18%.',
     'Existe a versão Tarifa Branca (B3_TB).', 'Demais classes', ''),
    ('B3 Consumo Próprio', 'B3_CP', 'B3 de consumo próprio.', 'Igual ao B3.', 'Isento.', '18% (cobra normal; confirmado em fatura real).',
     'Existe a versão Tarifa Branca (B3_CP_TB).', 'Demais classes', ''),
    ('B3 Poder Público Federal', 'B3_PPF', 'Órgãos federais.', 'Igual ao B3.', '17%.', '18%.',
     'Retenções na fonte sobre a energia: PIS 0,65% + CSLL 1% + IR 1,2% + COFINS 3% (total 5,85%). Elas saem do total da fatura. Existe a versão Tarifa Branca.',
     'Isento se o município isentar; senão Demais classes', ''),
    ('B3 Poder Público Estadual', 'B3_PPE', 'Órgãos estaduais.', 'Igual ao B3.', 'Isento.', 'Isento.',
     'Retenção só de Imposto de Renda: 1,2% da energia, que sai do total. Existe a versão Tarifa Branca.',
     'Isento se o município isentar; senão Demais classes', ''),
    ('B4A Iluminação Pública (rede)', 'B4A', 'Iluminação pública na rede de distribuição.', 'Uma tarifa própria B4A.', '17%.', '18%.',
     'Não tem consumo mínimo. Em SP tem retenção de Imposto de Renda de 1,2% da energia.', 'Isento (CIP = R$ 0,00)', 'No ES não há retenção de IR no B4A.'),
    ('B4B Iluminação Pública (bulbo)', 'B4B', 'Iluminação pública com bulbo de lâmpada.', 'Uma tarifa própria B4B.', '17%.', '18%.',
     'Não tem consumo mínimo.', 'Isento (CIP = R$ 0,00)', ''),
]
for i, rg in enumerate(regras):
    linha_texto(ws, 5 + i, rg, zebra=(i % 2 == 1), altura=96)
larguras(ws, [26, 22, 28, 40, 26, 30, 56, 24, 34])
ws.freeze_panes = 'C5'
ws.auto_filter.ref = 'A4:I%d' % (4 + len(regras))

# ---------------------------------------------------------------------------
# 3. Tarifas vigentes
# ---------------------------------------------------------------------------
ws = wb.create_sheet('3_Tarifas_vigentes')
NOMES = {
    'B1C': 'B1 Residencial', 'B1C_TB': 'B1 Residencial Tarifa Branca', 'B1CDE': 'B1 Desconto Social',
    'B1BRN/B1BPC/B1BRQ/B1BRI': 'B1 Baixa Renda', 'B2RURAL': 'B2 Rural', 'B2RURAL_TB': 'B2 Rural Tarifa Branca',
    'B2RUIRRG': 'B2 Rural Irrigante', 'B2RUIRRG_TB': 'B2 Irrigante Tarifa Branca',
    'B3': 'B3 Comercial / Demais classes (vale também para CP, PPF e PPE)', 'B3_TB': 'B3 Tarifa Branca',
    'B4A': 'B4A Iluminação Pública (rede)', 'B4B': 'B4B Iluminação Pública (bulbo)',
}
ORDEM = list(NOMES)
tar = [x for x in ler_csv('tarifas_aneel_vigencias.csv') if x['bloco'] == 'tarifas']
vig_atual = {}
for x in tar:
    d = x['distribuidora']
    if x['vigencia_inicio'] > vig_atual.get(d, ('', ''))[0]:
        vig_atual[d] = (x['vigencia_inicio'], x['resolucao'])
titulo(ws, 'Tarifas vigentes (valores em R$ por kWh, SEM impostos)',
       'Tarifa mais recente cadastrada de cada distribuidora. Quando o período de leitura passa pela data de início, '
       'o sistema usa a média das duas tarifas ponderada pelos dias. Fonte: ANEEL (Tarifa de Aplicação).', 8)
cabecalho(ws, 4, ['Distribuidora', 'Vigente desde', 'Resolução', 'Categoria', 'Horário / faixa', 'TUSD (R$/kWh)', 'TE (R$/kWh)', 'TUSD + TE (R$/kWh)'])
POSTO = {'Nao aplica': 'Único', 'Fora ponta': 'Fora ponta', 'Ponta': 'Ponta', 'Intermediário': 'Intermediário'}
FAIXA = {'ate': 'Até 120 kWh', 'acima': 'Acima de 120 kWh'}
r = 5
for d in ('ES', 'SP'):
    ini, res = vig_atual[d]
    linhas = [x for x in tar if x['distribuidora'] == d and x['vigencia_inicio'] == ini]
    linhas.sort(key=lambda x: (ORDEM.index(x['categoria']) if x['categoria'] in ORDEM else 99,
                               ['Único', 'Ponta', 'Intermediário', 'Fora ponta'].index(POSTO.get(x['posto'], x['posto']))
                               if POSTO.get(x['posto'], x['posto']) in ('Único', 'Ponta', 'Intermediário', 'Fora ponta') else 9,
                               x['faixa']))
    for x in linhas:
        if x['categoria'] not in NOMES:
            continue
        ws.cell(row=r, column=1, value='EDP ' + d)
        ws.cell(row=r, column=2, value=ini[8:10] + '/' + ini[5:7] + '/' + ini[:4])
        ws.cell(row=r, column=3, value=res)
        ws.cell(row=r, column=4, value=NOMES[x['categoria']])
        ws.cell(row=r, column=5, value=FAIXA.get(x['faixa']) or POSTO.get(x['posto'], x['posto']))
        ws.cell(row=r, column=6, value=float(x['tusd_rs_kwh']))
        ws.cell(row=r, column=7, value=float(x['te_rs_kwh']))
        ws.cell(row=r, column=8, value='=F%d+G%d' % (r, r))
        for c in range(1, 9):
            cel = ws.cell(row=r, column=c)
            cel.font = f()
            cel.border = BORDA
            cel.alignment = Alignment(vertical='top', wrap_text=(c in (3, 4)))
            if c >= 6:
                cel.number_format = '0.00000'
        r += 1
larguras(ws, [14, 14, 36, 44, 22, 16, 16, 20])
ws.freeze_panes = 'A5'
ws.auto_filter.ref = 'A4:H%d' % (r - 1)

# ---------------------------------------------------------------------------
# 4. CIP - como funciona
# ---------------------------------------------------------------------------
ws = wb.create_sheet('4_CIP_regras')
titulo(ws, 'CIP (Contribuição de Iluminação Pública): como funciona',
       'A CIP é cobrada pela prefeitura na fatura. O sistema calcula sozinho só para o ES (70 municípios); em SP o valor é digitado. '
       'A CIP soma direto no total, sem imposto.', 4)
ws['A4'] = 'Valor-base da CIP percentual'
ws['A4'].font = f(True, COR_CABECALHO, 11)
cabecalho(ws, 5, ['Item', 'O que é', 'Valor (R$)', 'Observação'])
ws.cell(row=6, column=1, value='Tarifa B4a atual')
ws.cell(row=6, column=2, value='Base do cálculo em 51 municípios (alíquota x B4a). Vale a partir de 07/08/2026.')
ws.cell(row=6, column=3, value=464.04)
ws.cell(row=6, column=4, value='Pode ser alterada: a aba 6_CIP_valores recalcula sozinha.')
ws.cell(row=7, column=1, value='Tarifa B4a anterior')
ws.cell(row=7, column=2, value='Vale até 06/08/2026. Se o período passa por 07/08, usa-se a média ponderada pelos dias.')
ws.cell(row=7, column=3, value=434.13)
ws.cell(row=7, column=4, value='')
for rr in (6, 7):
    for c in range(1, 5):
        cel = ws.cell(row=rr, column=c)
        cel.font = f(c == 3, '0000FF' if c == 3 else '000000')
        cel.border = BORDA
        cel.alignment = Alignment(wrap_text=True, vertical='top')
        if c == 3:
            cel.number_format = '#,##0.00'
            cel.fill = PatternFill('solid', start_color=COR_ENTRADA)
    ws.row_dimensions[rr].height = 42

ws['A9'] = 'Passo a passo'
ws['A9'].font = f(True, COR_CABECALHO, 11)
cabecalho(ws, 10, ['Passo', 'Regra', 'Em palavras simples', 'Exemplo'])
cip_passos = [
    ('1. Município', 'Só ES. Escolhe-se o município no formulário.', 'Em SP, ou se o município for "São José do Calçado", a CIP é digitada à mão.', ''),
    ('2. Classe', 'A categoria da fatura define a classe da tabela do município.', 'Veja a tabela de classes abaixo. Iluminação pública (B4A e B4B) não paga CIP.', 'B1 Residencial -> classe Residencial.'),
    ('3. Faixa de consumo', 'Usa o consumo faturado em kWh.', 'Vale a faixa em que o consumo cai; o limite de cima é INCLUSIVO (30 kWh cai em "até 30"). O consumo mínimo NÃO é considerado; o consumo já considera constante do medidor e Desconto BT.', '100 kWh em Afonso Cláudio: faixa 71 a 100.'),
    ('4. Valor - método percentual (51 municípios)', 'CIP = alíquota da faixa x Tarifa B4a.', 'A alíquota é um percentual da tarifa B4a (valor-base acima).', '2,88% x 464,04 = R$ 13,36.'),
    ('4. Valor - método valor fixo (18 municípios)', 'CIP = valor em R$ da faixa.', 'A prefeitura fixa o valor em reais; não depende da B4a (ex.: Vitória, Serra, Vila Velha).', 'Vitória, residencial, 100 kWh: R$ 6,44.'),
    ('4. Valor - manual (1 município)', 'São José do Calçado.', 'Lá a CIP é um percentual do valor TOTAL da fatura. O sistema não calcula; digite o valor.', ''),
    ('Isenções', 'Cada município tem as suas.', 'Iluminação pública: sempre isenta. Rural: alguns municípios isentam Rural, outros só o Irrigante. Poder Público Federal e Estadual: isentos só onde o município declarou; senão pagam como Demais classes. Veja a aba 5_CIP_municipios.', 'Conceição da Barra isenta Rural.'),
    ('Sem tabela', 'Município sem tabela de Rural e sem isenção declarada.', 'O Rural é calculado como Demais classes (aproximação, não é regra confirmada).', ''),
]
for i, p in enumerate(cip_passos):
    linha_texto(ws, 11 + i, p, zebra=(i % 2 == 1), altura=70)
r = 11 + len(cip_passos) + 1
ws.cell(row=r, column=1, value='Qual classe da CIP cada categoria usa').font = f(True, COR_CABECALHO, 11)
cabecalho(ws, r + 1, ['Categoria da fatura', 'Classe da tabela do município', 'Explicação', ''])
classes = [
    ('B1 Residencial, Tarifa Branca e Desconto Social (B1C, B1C_TB, B1CDE)', 'RESIDENCIAL', 'O Desconto Social paga como Residencial comum (decisão validada com a área em 24/09/2026).'),
    ('B1 Baixa Renda (B1BR...)', 'RESIDENCIAL BAIXA RENDA', ''),
    ('B2 Rural e Irrigante (B2RU...)', 'RURAL', 'Alguns municípios isentam.'),
    ('B3 Comercial, Consumo Próprio (B3, B3_CP e Tarifa Branca)', 'DEMAIS CLASSES', ''),
    ('B3 Poder Público Federal e Estadual (B3_PPF, B3_PPE)', 'PPF / PPE', 'Isento se o município declarou; senão Demais classes.'),
    ('B4A e B4B (iluminação pública)', 'ISENTO', 'CIP = R$ 0,00.'),
]
for i, c in enumerate(classes):
    linha_texto(ws, r + 2 + i, c + ('',), zebra=(i % 2 == 1), altura=44)
r = r + 2 + len(classes) + 1
ws.cell(row=r, column=1, value='Pontos de atenção').font = f(True, COR_CABECALHO, 11)
atencao = [
    'Aracruz: a lei municipal pode isentar a Baixa Renda e o sistema ainda cobra (a verificar).',
    'Poder Público Municipal é isento em muitos municípios, mas não existe como categoria no formulário.',
    'Valores conferidos na página da EDP (tabela de cálculo da CIP) e na planilha da área, em 22/10/2026.',
]
for i, t in enumerate(atencao):
    cel = ws.cell(row=r + 1 + i, column=1, value='- ' + t)
    cel.font = f()
    ws.merge_cells(start_row=r + 1 + i, start_column=1, end_row=r + 1 + i, end_column=4)
larguras(ws, [38, 46, 60, 40])
B4A_CELULA = "'4_CIP_regras'!$C$6"

# ---------------------------------------------------------------------------
# 5. CIP - municipios
# ---------------------------------------------------------------------------
ws = wb.create_sheet('5_CIP_municipios')
titulo(ws, 'CIP dos municípios do ES: método e isenções',
       'Como cada município calcula a CIP, a lei e quais classes são isentas. Os valores por faixa estão na aba 6_CIP_valores.', 7)
cabecalho(ws, 4, ['Município', 'Como a CIP é calculada', 'Lei municipal', 'Vigência da lei', 'Isenções declaradas', 'Observação da prefeitura/EDP', 'Chave interna'])
METODO = {'percentual': 'Percentual da Tarifa B4a (alíquota x B4a)', 'fixo': 'Valor fixo em R$ por faixa',
          'incompativel': 'Manual (percentual do valor da fatura)'}
mun = ler_csv('cip_es_municipios.csv')
mun.sort(key=lambda x: x['municipio'])
for i, m in enumerate(mun):
    iso = []
    if m['isenta_rural'] == 'true':
        iso.append('Rural')
    if m['isenta_irrigante'] == 'true':
        iso.append('Rural Irrigante')
    if m['isenta_ppf'] == 'true':
        iso.append('Poder Público Federal')
    if m['isenta_ppe'] == 'true':
        iso.append('Poder Público Estadual')
    linha_texto(ws, 5 + i, [m['municipio'], METODO.get(m['metodo'], m['metodo']), m['lei'], m['vigencia_lei'],
                            ', '.join(iso) if iso else '-', m['nota'], m['municipio_chave']], zebra=(i % 2 == 1))
larguras(ws, [28, 38, 16, 22, 34, 60, 26])
ws.freeze_panes = 'B5'
ws.auto_filter.ref = 'A4:G%d' % (4 + len(mun))

# ---------------------------------------------------------------------------
# 6. CIP - valores
# ---------------------------------------------------------------------------
ws = wb.create_sheet('6_CIP_valores')
titulo(ws, 'CIP por município, classe e faixa de consumo (valores em R$)',
       'Nos municípios por percentual, o valor é a alíquota x Tarifa B4a (aba 4_CIP_regras, célula C6). '
       'Use o filtro do cabeçalho para achar o município e a classe. Faixa em kWh faturados, limite de cima inclusivo.', 8)
cabecalho(ws, 4, ['Município', 'Classe', 'Faixa (kWh)', 'De (kWh)', 'Até (kWh)', 'Alíquota (% da B4a)', 'Valor da CIP (R$)', 'Observação'])
nome_mun = {m['municipio_chave']: m['municipio'] for m in mun}
mun_por_chave = {m['municipio_chave']: m for m in mun}
fx = ler_csv('cip_es_faixas.csv')
fx.sort(key=lambda x: (nome_mun.get(x['municipio_chave'], x['municipio_chave']), x['classe'], float(x['consumo_de_kwh_exclusivo'])))
r = 5
vistos = set()  # (município, classe, limite) já usados: a repetição é erro da tabela de origem
for x in fx:
    de_ex = float(x['consumo_de_kwh_exclusivo'])
    ate = x['consumo_ate_kwh_inclusivo']
    de_incl = 0 if de_ex == 0 else int(de_ex) + 1
    if ate == '':
        texto = 'Acima de %d' % int(de_ex)
    elif de_ex == 0:
        texto = 'Até %d' % int(float(ate))
    else:
        texto = '%d a %d' % (de_incl, int(float(ate)))
    ws.cell(row=r, column=1, value=nome_mun.get(x['municipio_chave'], x['municipio_chave']))
    ws.cell(row=r, column=2, value=x['classe'])
    ws.cell(row=r, column=3, value=texto)
    ws.cell(row=r, column=4, value=de_incl)
    ws.cell(row=r, column=5, value=int(float(ate)) if ate != '' else None)
    obs = ''
    dados_mun = mun_por_chave.get(x['municipio_chave'], {})
    if x['classe'] == 'RURAL' and dados_mun.get('isenta_rural') == 'true':
        # Isenção declarada vale mesmo que exista tabela de Rural (ver cip-municipios.js)
        ws.cell(row=r, column=7, value=0)
        obs = 'Isento: o município isenta a classe Rural'
    elif x['isento'] == 'true':
        ws.cell(row=r, column=7, value=0)
        obs = 'Isento'
    elif x['aliquota_sobre_tarifa_b4a'] != '':
        ws.cell(row=r, column=6, value=float(x['aliquota_sobre_tarifa_b4a']))
        ws.cell(row=r, column=7, value='=ROUND(F%d*%s,2)' % (r, B4A_CELULA))
    else:
        ws.cell(row=r, column=7, value=float(x['valor_fixo_rs']))
        obs = 'Valor fixo da prefeitura'
    if x['classe'] == 'RURAL' and dados_mun.get('isenta_irrigante') == 'true' and dados_mun.get('isenta_rural') != 'true':
        obs = (obs + '; ' if obs else '') + 'Rural Irrigante é isento neste município'
    if x['classe'] == 'INDUSTRIAL':
        obs = (obs + '; ' if obs else '') + 'Classe Industrial: o sistema não usa (não há categoria Industrial no Grupo B do formulário)'
    chave_faixa = (x['municipio_chave'], x['classe'], ate)
    if chave_faixa in vistos:
        # A tabela da prefeitura repete esta faixa com outro valor. O motor usa a
        # primeira faixa com o mesmo limite e ignora as repetidas.
        obs = (obs + '; ' if obs else '') + 'ATENÇÃO: faixa repetida na tabela da prefeitura; o sistema NÃO usa esta linha'
        ws.cell(row=r, column=8).fill = PatternFill('solid', start_color='FDE9D9')
    vistos.add(chave_faixa)
    ws.cell(row=r, column=8, value=obs)
    for c in range(1, 9):
        cel = ws.cell(row=r, column=c)
        cel.font = f()
        cel.border = BORDA
        cel.alignment = Alignment(vertical='top')
        if obs.startswith('ATENÇÃO') or 'ATENÇÃO' in obs:
            cel.fill = PatternFill('solid', start_color='FDE9D9')
    ws.cell(row=r, column=6).number_format = '0.00##%'
    ws.cell(row=r, column=7).number_format = '#,##0.00'
    r += 1
larguras(ws, [28, 26, 16, 10, 10, 20, 18, 26])
ws.freeze_panes = 'C5'
ws.auto_filter.ref = 'A4:H%d' % (r - 1)

wb.calculation.fullCalcOnLoad = True  # o Excel calcula as fórmulas ao abrir
wb.save(SAIDA)
print('gravado', SAIDA, '| linhas CIP:', len(fx), '| municipios:', len(mun))
