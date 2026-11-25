# -*- coding: utf-8 -*-
"""
Baixa o CSV de dados abertos da ANEEL (tarifas homologadas), filtra uma
distribuidora e grava um .xlsx no layout que exportar-vigencias.py entende.

Uso (na raiz do projeto):
    python scripts/conta-teste/aneel-dados-abertos.py SP 2027-10-01 novas_sp.xlsx
    python scripts/conta-teste/exportar-vigencias.py - novas_sp.xlsx --acrescentar

Para o ES, o arquivo vai na primeira posição e o SP fica com "-":
    python scripts/conta-teste/aneel-dados-abertos.py ES 2027-08-01 novas_es.xlsx
    python scripts/conta-teste/exportar-vigencias.py novas_es.xlsx - --acrescentar

A data é o início mínimo das vigências que entram. O download tem perto de
180 MB e pode levar alguns minutos. A ANEEL costuma atrasar alguns dias para
publicar um reajuste: se a vigência nova ainda não estiver lá, o script avisa.
Precisa de pandas e openpyxl.
"""
import csv
import io
import os
import ssl
import sys
import urllib.request

import pandas as pd

URL = ('https://dadosabertos.aneel.gov.br/dataset/5a583f3e-1646-4f67-bf0f-69db4203e89e/'
       'resource/fcf2906c-7c32-4b9b-a637-054e7a5234f4/download/'
       'tarifas-homologadas-distribuidoras-energia-eletrica.csv')

if len(sys.argv) != 4 or sys.argv[1] not in ('ES', 'SP'):
    raise SystemExit(__doc__)
SIGLA, DESDE, DESTINO = 'EDP ' + sys.argv[1], sys.argv[2], sys.argv[3]

# Na rede corporativa o HTTPS é reassinado pela CA da empresa; se o arquivo dela
# existir na pasta do usuário, é usado junto com os certificados do sistema.
contexto = ssl.create_default_context()
ca = os.path.join(os.path.expanduser('~'), 'edp-ca.pem')
if os.path.exists(ca):
    contexto.load_verify_locations(ca)

print('Baixando a base da ANEEL (pode levar alguns minutos)...')
pedido = urllib.request.Request(URL, headers={'User-Agent': 'conta-teste'})
linhas, ultima = [], ''
with urllib.request.urlopen(pedido, context=contexto, timeout=600) as resposta:
    leitor = csv.DictReader(io.TextIOWrapper(resposta, encoding='utf-8-sig', errors='replace', newline=''), delimiter=';')
    for l in leitor:
        if l.get('SigAgente') != SIGLA:
            continue
        ultima = max(ultima, l['DatInicioVigencia'])
        if l['DatInicioVigencia'] >= DESDE:
            linhas.append(l)

print(f'Última vigência de {SIGLA} publicada: começa em {ultima}')
if not linhas:
    raise SystemExit(f'Nenhuma linha de {SIGLA} com início a partir de {DESDE}: a ANEEL ainda não publicou.')


def numero(v):
    v = str(v or '').strip().replace('.', '').replace(',', '.')
    return float(v) if v else 0.0


def unidade(u):
    # o CSV aberto escreve "MWh"/"kW"; o export do portal (e o importador) usam "R$/MWh"
    return 'R$/' + str(u).strip()


df = pd.DataFrame(linhas)
saida = pd.DataFrame({
    'Sigla': df.SigAgente,
    'Resolucao': df.DscREH,
    'Inicio': pd.to_datetime(df.DatInicioVigencia),
    'Fim': pd.to_datetime(df.DatFimVigencia),
    'BaseTarifaria': df.DscBaseTarifaria,
    'Subgrupo': df.DscSubGrupo,
    'Modalidade': df.DscModalidadeTarifaria,
    'Classe': df.DscClasse,
    'Subclasse': df.DscSubClasse,
    'Detalhe': df.DscDetalhe,
    'Acessante': df.SigAgenteAcessante,
    'Posto': df.NomPostoTarifario,
    'Unidade': df.DscUnidadeTerciaria.map(unidade),
    'TUSD': df.VlrTUSD.map(numero),
    'TE': df.VlrTE.map(numero),
})
saida.to_excel(DESTINO, index=False)
print(f'{len(saida)} linhas gravadas em {DESTINO}')
