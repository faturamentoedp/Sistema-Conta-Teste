# -*- coding: utf-8 -*-
"""
Regera o bloco de dados de src/modulos/conta-teste/motor/cip-municipios.js (a partir de
"export const NOMES_MUNICIPIOS_ES") com os 70 municípios da página da EDP.

Passos:
  1. python scripts/conta-teste/importar-cip-site.py <saida-do-navegador> site-cip.json
  2. node scripts/_dump...  (opcional) ou deixe o --exatas apontar para um JSON com
     os dados antigos (planilha) - as alíquotas da planilha têm 5 casas e a página
     arredonda para 4; quando os dois batem, fica a da planilha.
  3. python scripts/conta-teste/gerar-cip-municipios.py site-cip.json src/modulos/conta-teste/motor/cip-municipios.js [exatas.json]

Regras de limpeza aplicadas aqui (todas por causa de inconsistências da própria
página, e documentadas no comentário gerado no arquivo):
  - classe "BAIXA RENDA" = "RESIDENCIAL BAIXA RENDA";
  - classe entre parênteses começando por "(ISENÇÃO ...)" (Conceição da Barra) não
    é uma tabela cobrável: vira isenção de Rural;
  - Fundão repete "DEMAIS CLASSES" no grupo B com faixas de grupo A (1.000/5.000):
    essas linhas são descartadas;
  - flags de isenção (rural, irrigante, Poder Público Federal/Estadual) saem do
    texto "Classes Isentas: ..." da página.
"""
import io
import json
import re
import sys
import unicodedata

SITE, JS = sys.argv[1], sys.argv[2]
EXATAS = sys.argv[3] if len(sys.argv) > 3 else None

site = json.load(io.open(SITE, encoding='utf-8'))
exatas = json.load(io.open(EXATAS, encoding='utf-8')) if EXATAS else {}


def chave(nome):
    a = unicodedata.normalize('NFKD', nome).encode('ascii', 'ignore').decode().upper().strip()
    return {'ALFREDO CHAVEZ': 'ALFREDO CHAVES', 'SANTA MARIA DO JETIBA': 'SANTA MARIA DE JETIBA',
            'VENDA NOVA DE IMIGRANTE': 'VENDA NOVA DO IMIGRANTE'}.get(a, a)


def nome_exibicao(nome):
    return {'Alfredo Chavez': 'Alfredo Chaves'}.get(nome, nome)


def num(v):
    if v is None:
        return 'null'
    if isinstance(v, float) and v == int(v):
        return repr(int(v))
    return repr(round(v, 6))


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def flags(isencao):
    t = unicodedata.normalize('NFKD', isencao or '').encode('ascii', 'ignore').decode().upper()
    t = t.replace('RURAL IRRIGANTE', '@IRRIG').replace('RURAL RESIDENCIAL', '@RURRES')
    return {
        'rural': 'RURAL' in t,
        'irrigante': 'RURAL' in t or '@IRRIG' in t,
        'ppf': 'FEDERAL' in t,
        'ppe': 'ESTADUAL' in t,
    }


linhas = []
nomes = {}
ordenados = sorted(site.keys(), key=lambda n: unicodedata.normalize('NFKD', nome_exibicao(n)).encode('ascii', 'ignore').decode().upper())
for nome in ordenados:
    b = site[nome]
    k = chave(nome)
    nomes[k] = nome_exibicao(nome)
    fl = flags(b['isencao'])
    classes = {}
    for f in b['faixas_b']:
        c = f['classe']
        if c == 'BAIXA RENDA':
            c = 'RESIDENCIAL BAIXA RENDA'
        if c.startswith('(ISENÇÃO'):
            fl['rural'] = True
            fl['irrigante'] = True
            continue
        classes.setdefault(c, []).append(f)
    # Fundão: linhas de grupo A (1.000/5.000) misturadas no grupo B
    if k == 'FUNDAO' and 'DEMAIS CLASSES' in classes:
        classes['DEMAIS CLASSES'] = [f for f in classes['DEMAIS CLASSES'] if f['max'] not in (1000.0, 5000.0) and f['min'] not in (1000.0, 5000.0)]

    antigas = exatas.get(k, {}).get('faixas', {})
    partes_classe = []
    for classe in sorted(classes):
        itens = sorted(classes[classe], key=lambda f: (f['max'] is None, f['max'] or 0))
        ex = {(x['max'], ) : x['aliquota'] for x in antigas.get(classe, []) if 'aliquota' in x}
        trechos = []
        for f in itens:
            if 'valor' in f:
                trechos.append('{ max: %s, valor: %s }' % (num(f['max']), num(f['valor'])))
            else:
                a = f['aliquota']
                exata = ex.get((f['max'],))
                if exata is not None and abs(exata - a) <= 0.00006:
                    a = exata  # a planilha guarda a alíquota com mais casas
                trechos.append('{ max: %s, aliquota: %s }' % (num(f['max']), num(a)))
        partes_classe.append("            '%s': [%s]," % (esc(classe), ', '.join(trechos)))

    linhas.append("    '%s': {" % esc(k))
    linhas.append("        nome: '%s'," % esc(nome_exibicao(nome)))
    linhas.append("        metodo: '%s'," % (b['metodo'] or 'percentual'))
    if b.get('lei'):
        linhas.append("        lei: '%s'," % esc(b['lei']))
    if b.get('vigencia'):
        linhas.append("        vigencia: '%s'," % esc(b['vigencia']))
    if b.get('isencao'):
        linhas.append("        nota: '%s'," % esc(b['isencao']))
    if fl['rural']:
        linhas.append("        isenta_rural: true,")
    if fl['irrigante']:
        linhas.append("        isenta_irrigante: true,")
    if fl['ppf']:
        linhas.append("        isenta_ppf: true,")
    if fl['ppe']:
        linhas.append("        isenta_ppe: true,")
    if b.get('incompativel'):
        linhas.append("        incompativel: '%s'," % esc(b['incompativel']))
    linhas.append("        faixas: {")
    linhas.extend(partes_classe)
    linhas.append("        },")
    linhas.append("    },")

bloco = ["export const NOMES_MUNICIPIOS_ES = {"]
for k in sorted(nomes, key=lambda x: unicodedata.normalize('NFKD', nomes[x]).encode('ascii', 'ignore').decode().upper()):
    bloco.append("    '%s': '%s'," % (esc(k), esc(nomes[k])))
bloco.append("};")
bloco.append("")
bloco.append("export const MUNICIPIOS_ES_CIP = Object.keys(NOMES_MUNICIPIOS_ES);")
bloco.append("")
bloco.append("export const CIP_MUNICIPIOS_ES = {")
bloco.extend(linhas)
bloco.append("};")

texto = io.open(JS, encoding='utf-8').read()
i = texto.index('export const NOMES_MUNICIPIOS_ES') if 'export const NOMES_MUNICIPIOS_ES' in texto else texto.index('export const MUNICIPIOS_ES_CIP')
texto = texto[:i] + '\n'.join(bloco) + '\n'
io.open(JS, 'w', encoding='utf-8', newline='').write(texto)
print('municípios gravados:', len(nomes), '| linhas de dados:', len(bloco))
