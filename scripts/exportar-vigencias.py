"""
Lê os exports oficiais da ANEEL e gera src/lib/motor/vigencias.js, a base
tarifária por período de vigência.

Uso: python scripts/exportar-vigencias.py <export_ES.xlsx> <export_SP.xlsx>

Pega só as linhas "Tarifa de Aplicação" (é a tarifa efetivamente faturada, não
a Base Econômica) e converte de R$/MWh para R$/kWh. As linhas de acessante
"SCEE" são a tarifa de compensação usada pela Geração Distribuída e vão para um
bloco separado.
"""
import json
import sys
import unicodedata
import warnings

import pandas as pd

warnings.filterwarnings("ignore")

COLUNAS = ['Sigla', 'Resolucao', 'Inicio', 'Fim', 'BaseTarifaria', 'Subgrupo',
           'Modalidade', 'Classe', 'Subclasse', 'Detalhe', 'Acessante', 'Posto',
           'Unidade', 'TUSD', 'TE']


def limpar(v):
    txt = str(v or '').strip()
    txt = unicodedata.normalize('NFKD', txt).encode('ascii', 'ignore').decode()
    return txt.lower()


# categoria do formulario -> (subgrupo, modalidade, filtro de subclasse)
MAPA = {
    'B1C':                      ('B1', 'convencional', 'residencial'),
    'B1C_TB':                   ('B1', 'branca',       'residencial'),
    'B1CDE':                    ('B1', 'convencional', 'desconto social'),
    'B1BRN/B1BPC/B1BRQ/B1BRI':  ('B1', 'convencional', 'tarifa social'),
    'B2RURAL':                  ('B2', 'convencional', 'nao se aplica'),
    'B2RURAL_TB':               ('B2', 'branca',       'nao se aplica'),
    'B2RUIRRG':                 ('B2', 'convencional', 'irrigacao'),
    'B2RUIRRG_TB':              ('B2', 'branca',       'irrigacao'),
    'B3':                       ('B3', 'convencional', 'nao se aplica'),
    'B3_TB':                    ('B3', 'branca',       'nao se aplica'),
    'B4A':                      ('B4', 'convencional', 'b4a'),
    'B4B':                      ('B4', 'convencional', 'b4b'),
}

# "Residencial" casa com "Residencial Desconto Social" e "Residencial Tarifa
# Social"; sem esta exclusao o B1C herdaria a tarifa das subclasses sociais.
EXCLUIR_DO_RESIDENCIAL = ('desconto social', 'tarifa social')


def ler(arquivo):
    df = pd.read_excel(arquivo)
    df.columns = COLUNAS[:len(df.columns)]
    df = df.dropna(subset=['Subgrupo', 'Resolucao'])
    df = df[df.BaseTarifaria == 'Tarifa de Aplicação']
    df = df[df.Unidade == 'R$/MWh']
    df = df[~df.Modalidade.astype(str).str.contains('pré-pagamento', na=False)]
    return df


def coletar(df, sigla):
    saida = []
    # Agrupa pelo PERÍODO real, não pela resolução: uma mesma REH pode ter
    # sub-períodos com tarifas diferentes. Ex.: a REH 3.541 de SP muda o TE em
    # 01/01/2026, de 0,30475 para 0,29060.
    for (inicio, fim), bloco in df.groupby(['Inicio', 'Fim']):
        vig = {
            'resolucao': str(bloco.Resolucao.iloc[0]),
            'inicio': str(inicio.date()),
            'fim': str(fim.date()),
            'tarifas': {},
            'tarifas_scee': {},
        }
        for categoria, (subgrupo, modalidade, chave) in MAPA.items():
            # A marcação de Geração Distribuída vem na coluna Detalhe (SCEE),
            # não em Acessante. Acessante identifica geradores e concessionárias
            # específicas (ELFSM, PCH, NOVO GERADOR) e não interessa aqui.
            for detalhe, destino in (('nao se aplica', 'tarifas'), ('scee', 'tarifas_scee')):
                linhas = []
                for _, r in bloco.iterrows():
                    if str(r.Subgrupo) != subgrupo:
                        continue
                    if limpar(r.Modalidade) != modalidade:
                        continue
                    if limpar(r.Detalhe) != detalhe:
                        continue
                    if limpar(r.Acessante) != 'nao se aplica':
                        continue
                    # Só a Subclasse identifica a tarifa. Incluir a Classe faria
                    # a subclasse "Baixa Renda" (classe "Residencial") vazar
                    # para o B1C.
                    alvo = limpar(r.Subclasse)
                    if chave not in alvo:
                        continue
                    if chave == 'residencial' and any(e in alvo for e in EXCLUIR_DO_RESIDENCIAL):
                        continue
                    linhas.append({
                        'posto': str(r.Posto).replace('Não se aplica', 'Nao aplica'),
                        'tusd': round(float(r.TUSD) / 1000, 8),
                        'te': round(float(r.TE) / 1000, 8),
                    })

                # remove duplicatas preservando a ordem
                unicas = []
                for l in linhas:
                    if l not in unicas:
                        unicas.append(l)

                # Desconto Social tem duas faixas: a reduzida (menor TUSD) ate
                # 120 kWh e a cheia acima disso.
                if categoria == 'B1CDE' and len(unicas) == 2:
                    unicas.sort(key=lambda x: x['tusd'])
                    unicas[0]['faixa'] = 'ate'
                    unicas[1]['faixa'] = 'acima'

                if unicas:
                    vig[destino][categoria] = unicas
        saida.append(vig)
    saida.sort(key=lambda v: v['inicio'])
    return saida


def main():
    resultado = {}
    for arquivo, sigla in ((sys.argv[1], 'ES'), (sys.argv[2], 'SP')):
        df = ler(arquivo)
        vigencias = coletar(df, sigla)
        # so interessa a vigencia corrente e as futuras
        vigencias = [v for v in vigencias if v['fim'] >= '2026-01-01']
        resultado[sigla] = vigencias
        print(f'{sigla}: {len(vigencias)} vigencia(s)')
        for v in vigencias:
            print(f"   {v['resolucao']}  {v['inicio']} a {v['fim']}  "
                  f"({len(v['tarifas'])} categorias, {len(v['tarifas_scee'])} SCEE)")

    corpo = json.dumps(resultado, ensure_ascii=False, indent=4)
    destino = 'src/lib/motor/vigencias.js'
    with open(destino, 'w', encoding='utf-8') as f:
        f.write('// GERADO AUTOMATICAMENTE por scripts/exportar-vigencias.py - não edite à mão.\n')
        f.write('// Fonte: export oficial da ANEEL, linhas "Tarifa de Aplicação", em R$/kWh.\n')
        f.write('//\n')
        f.write('// Cada distribuidora tem uma lista de vigências ordenada por data. Quando o\n')
        f.write('// período de leitura cruza a virada, o motor rateia proporcionalmente aos dias.\n')
        f.write('// tarifas_scee são as tarifas de compensação usadas pela Geração Distribuída.\n\n')
        f.write('export const VIGENCIAS = ' + corpo + ';\n')
    print('\nGerado:', destino)


if __name__ == '__main__':
    main()
