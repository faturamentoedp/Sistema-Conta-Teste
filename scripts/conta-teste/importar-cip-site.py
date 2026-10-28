# -*- coding: utf-8 -*-
"""
Lê a tabela de CIP publicada em https://www.edp.com.br/tabela-de-calculo-cip/
(estado Espírito Santo) e grava um JSON estruturado, uma entrada por município.

Como obter a entrada: abrir a página, escolher "Espírito Santo" e rodar no
console do navegador:

    JSON.stringify(Object.fromEntries([...document.querySelectorAll('.table__option')].map(el =>
      [el.dataset.option, [...el.children].filter(k => !k.className.includes('d-md-none'))
        .map(k => k.innerText.trim()).filter(Boolean).join('\\n\\n')])))

(o site já traz os 70 municípios no HTML, escondidos; o filtro 'd-md-none'
descarta a versão mobile, que repete a mesma tabela.) Salve a saída num arquivo.

Uso:  python scripts/conta-teste/importar-cip-site.py entrada.json saida.json

A saída alimenta src/modulos/conta-teste/motor/cip-municipios.js. Layouts que o site mistura
(e este script resolve):
  - cabeçalho "Grupo" ou "Grupos", em qualquer caixa;
  - coluna GRUPO mesclada (A/B só na 1ª linha do bloco);
  - tabela percentual (alíquota x Tarifa B4a) ou de valor fixo em R$;
  - alíquota com ou sem "%" no texto;
  - faixas "0 à 30", "De 0 a 30", "Maior que 500", "Todas as faixas";
  - classe "Res. Baixa Renda", "RESIDENCIALBAIXA RENDA".
Casos que fogem do padrão são tratados à parte: Cachoeiro de Itapemirim (tabela
sem coluna de grupo, classe em duas linhas) e São José do Calçado (CIP =
percentual sobre o valor da fatura, não cabe no modelo faixa x B4a).
"""
import io
import json
import re
import sys

SRC = sys.argv[1]
DST = sys.argv[2]

with io.open(SRC, encoding='utf-8') as f:
    conteudo = f.read()

# O navegador salva a saída num array [{type, text}] com o JSON duplamente
# codificado e um rodapé "(captured at origin ...)" - aceita também o JSON puro.
try:
    bruto = json.loads(conteudo)
    if isinstance(bruto, list):
        texto = bruto[0]['text']
        corte = texto.find('\n\n(captured')
        if corte != -1:
            texto = texto[:corte]
        bruto = json.loads(json.loads(texto))
except (ValueError, KeyError):
    raise SystemExit('entrada não reconhecida')


def para_numero(s):
    s = s.strip().rstrip('%').strip().replace('.', '').replace(',', '.')
    return float(s)


def normaliza_classe(txt):
    t = re.sub(r'\s+', ' ', txt.strip().upper())
    t = t.replace('RESIDENCIALBAIXA RENDA', 'RESIDENCIAL BAIXA RENDA')
    t = t.replace('RES. BAIXA RENDA', 'RESIDENCIAL BAIXA RENDA')
    return t


def le_faixa(txt):
    tl = txt.strip().lower()
    m = re.search(r'([\d\.]+)\s*[aà]\s*([\d\.]+|∞)', tl)
    if m:
        return para_numero(m.group(1)), (None if m.group(2) == '∞' else para_numero(m.group(2)))
    m = re.search(r'maior\s*(?:que)?\s*([\d\.]+)', tl)
    if m:
        return para_numero(m.group(1)), None
    if 'todas as faixas' in tl:
        return 0, None
    return None, None


def le_bloco(texto):
    linhas = [l.strip() for l in texto.split('\n') if l.strip()]
    lei = vigencia = isencao = None
    for l in linhas:
        m = re.match(r'^Lei n[ºo°]\s*(.+)$', l, re.I)
        if m:
            lei = m.group(1).strip()
        m = re.match(r'^Vig[eê]ncia:\s*(.+)$', l, re.I)
        if m:
            vigencia = m.group(1).strip()
        if l.startswith('Classes Isentas') or l.startswith('Classe Isenta'):
            isencao = isencao or l

    inicio = next((i for i, l in enumerate(linhas) if l.lower() in ('grupo', 'grupos')), None)
    faixas = []
    percentual = None
    if inicio is not None:
        primeiro = inicio + 1
        while primeiro < len(linhas) and linhas[primeiro] not in ('A', 'B'):
            primeiro += 1
        rotulos = ' '.join(linhas[inicio + 1:primeiro]).lower()
        percentual = 'alíquota' in rotulos or 'aliquita' in rotulos
        por_linha = 5 if percentual else 3
        i, grupo = primeiro, None
        while i < len(linhas):
            l = linhas[i]
            if l in ('A', 'B'):
                grupo = l
                i += 1
                continue
            if l.startswith('Classes Isentas') or l.startswith('Classe Isenta'):
                break
            if i + por_linha - 1 >= len(linhas):
                break
            campos = linhas[i:i + por_linha]
            minimo, maximo = le_faixa(campos[1])
            if minimo is None:
                i += 1
                continue
            try:
                if percentual:
                    registro = {'aliquota': para_numero(campos[2]) / 100.0, 'tarifa_ref': para_numero(campos[3]), 'valor_ref': para_numero(campos[4])}
                else:
                    registro = {'valor': para_numero(campos[2])}
            except ValueError:
                i += 1
                continue
            registro.update({'grupo': grupo, 'classe': normaliza_classe(campos[0]), 'min': minimo, 'max': maximo})
            faixas.append(registro)
            i += por_linha
    return {
        'lei': lei, 'vigencia': vigencia, 'isencao': isencao,
        'metodo': 'percentual' if percentual else ('fixo' if percentual is False else None),
        'faixas_b': [f for f in faixas if f['grupo'] == 'B'],
    }


# Cachoeiro de Itapemirim: valores fixos, sem coluna de grupo (só baixa tensão),
# classe "RESIDENCIAL E RESIDENCIAL BAIXA RENDA" em duas linhas = mesmo valor
# para as duas. Conferido na página em 22/10/2026 e transcrito à mão.
def cachoeiro():
    res = [(0, 70, 0.00), (71, 150, 8.18), (151, 300, 24.54), (301, 500, 38.18), (501, 1000, 46.36), (1001, 3000, 54.54), (3001, 5000, 81.81), (5001, None, 136.35)]
    dem = [(0, 70, 13.64), (71, 150, 27.27), (151, 300, 40.91), (301, 500, 54.54), (501, 1000, 68.18), (1001, 3000, 109.08), (3001, 5000, 190.89), (5001, None, 272.70)]
    faixas = []
    for lo, hi, v in res:
        for c in ('RESIDENCIAL', 'RESIDENCIAL BAIXA RENDA'):
            faixas.append({'grupo': 'B', 'classe': c, 'min': lo, 'max': hi, 'valor': v})
    for lo, hi, v in dem:
        faixas.append({'grupo': 'B', 'classe': 'DEMAIS CLASSES', 'min': lo, 'max': hi, 'valor': v})
    return {'lei': '7.800/2019', 'vigencia': 'Janeiro de 2026', 'isencao': 'Classes Isentas: ILUMINAÇÃO PÚBLICA, PODER PÚBLICO - MUNICIPAL e RURAL', 'metodo': 'fixo', 'faixas_b': faixas}


INCOMPATIVEL = {'São José do Calçado': 'CIP = alíquota (%) sobre o valor total da fatura, não sobre a Tarifa B4a por faixa de kWh.'}

saida = {}
avisos = []
for nome, texto in bruto.items():
    if nome == 'Cachoeiro de Itapemirim':
        bloco = cachoeiro()
        # confere a transcrição manual contra o texto da página (valores fixos)
        valores_pagina = re.findall(r'\n(\d+,\d{2})\n', texto)
        for f in bloco['faixas_b']:
            if ('%.2f' % f['valor']).replace('.', ',') not in valores_pagina:
                avisos.append('Cachoeiro: valor %.2f não aparece mais na página' % f['valor'])
    elif nome in INCOMPATIVEL:
        bloco = {'lei': None, 'vigencia': None, 'isencao': None, 'metodo': 'incompativel', 'incompativel': INCOMPATIVEL[nome], 'faixas_b': []}
    else:
        bloco = le_bloco(texto)
    for f in bloco['faixas_b']:
        if 'aliquota' in f and abs(round(f['aliquota'] * f['tarifa_ref'], 2) - f['valor_ref']) > 0.03:
            avisos.append('%s | %s %s: %.2f != %.2f' % (nome, f['classe'], f['min'], round(f['aliquota'] * f['tarifa_ref'], 2), f['valor_ref']))
    if not bloco['faixas_b'] and bloco['metodo'] != 'incompativel':
        avisos.append('%s: sem faixas de grupo B' % nome)
    saida[nome] = bloco

with io.open(DST, 'w', encoding='utf-8') as f:
    json.dump(saida, f, ensure_ascii=False, indent=1)

print('municípios:', len(saida), '| faixas grupo B:', sum(len(b['faixas_b']) for b in saida.values()))
print('percentual:', sum(1 for b in saida.values() if b['metodo'] == 'percentual'), '| fixo:', sum(1 for b in saida.values() if b['metodo'] == 'fixo'), '| incompatível:', sum(1 for b in saida.values() if b['metodo'] == 'incompativel'))
print('avisos:', len(avisos))
for a in avisos:
    print(' -', a)
