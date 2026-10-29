"""
Lê os exports oficiais da ANEEL e gera src/modulos/conta-teste/motor/vigencias.js, a base
tarifária por período de vigência.

Uso: python scripts/conta-teste/exportar-vigencias.py <export_ES.xlsx> <export_SP.xlsx>

Por padrão só entram as vigências que terminam em 2026-01-01 ou depois. Para trazer
o histórico (contas antigas de SP, por exemplo) use --desde=AAAA-MM-DD:
    python scripts/conta-teste/exportar-vigencias.py - "data (33).xlsx" --desde=2000-01-01

Use "-" no lugar de um dos arquivos para MANTER as vigências desse estado como já
estão em src/modulos/conta-teste/motor/vigencias.js - o caso de hoje, em que só SP tem tarifa nova:
    python scripts/conta-teste/exportar-vigencias.py - "data (33).xlsx"

Para ACRESCENTAR só a vigência nova (um reajuste que acabou de sair) sem reescrever
o histórico, passe um arquivo só com as linhas novas e --acrescentar:
    python scripts/conta-teste/exportar-vigencias.py - novas_sp.xlsx --acrescentar
(o CSV de dados abertos da ANEEL, tarifas-homologadas-distribuidoras-energia-eletrica.csv,
tem colunas diferentes do export do portal: filtre a distribuidora e converta para o
layout das COLUNAS abaixo antes - a unidade "MWh" vira "R$/MWh").

Cada arquivo pode ser o export já filtrado (só a EDP) ou a base nacional da ANEEL
com todas as distribuidoras (150 mil linhas): o script fica só com as linhas da
distribuidora de cada estado (EDP ES / EDP SP) e avisa quando a última vigência
do arquivo é anterior a hoje - sinal de que a base da ANEEL ainda não recebeu o
reajuste novo. (Até 22/10/2026 o script não filtrava: passar a base nacional
misturava Cemig, Copel etc. dentro de "ES" no vigencias.js.)

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


SIGLA_ANEEL = {'ES': 'EDP ES', 'SP': 'EDP SP'}


def ler(arquivo, sigla_estado):
    df = pd.read_excel(arquivo)
    df.columns = COLUNAS[:len(df.columns)]
    df = df.dropna(subset=['Subgrupo', 'Resolucao'])
    df = df[df.Sigla.astype(str).str.strip() == SIGLA_ANEEL[sigla_estado]]
    if df.empty:
        raise SystemExit(f'{arquivo}: nenhuma linha de "{SIGLA_ANEEL[sigla_estado]}" - arquivo errado?')
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


def vigencias_atuais():
    """Lê o VIGENCIAS que já está no vigencias.js (é JSON depois de 'export const VIGENCIAS =')."""
    with open('src/modulos/conta-teste/motor/vigencias.js', encoding='utf-8') as f:
        texto = f.read()
    inicio = texto.index('export const VIGENCIAS =') + len('export const VIGENCIAS =')
    return json.loads(texto[inicio:].strip().rstrip(';'))


DESDE = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--desde=')), '2026-01-01')
ACRESCENTAR = '--acrescentar' in sys.argv


def main():
    resultado = {}
    atuais = None
    for arquivo, sigla in ((sys.argv[1], 'ES'), (sys.argv[2], 'SP')):
        if arquivo == '-':
            atuais = atuais or vigencias_atuais()
            resultado[sigla] = atuais[sigla]
            print(f'{sigla}: mantido como está em vigencias.js ({len(atuais[sigla])} vigência(s))')
            continue
        df = ler(arquivo, sigla)
        vigencias = coletar(df, sigla)
        # so interessa a vigencia corrente e as futuras
        vigencias = [v for v in vigencias if v['fim'] >= DESDE]
        if ACRESCENTAR:
            # Soma as vigências do arquivo às que já estão em vigencias.js (uma do
            # arquivo substitui a existente de mesmo início), sem reescrever o
            # histórico já validado.
            atuais = atuais or vigencias_atuais()
            novos_inicios = {v['inicio'] for v in vigencias}
            vigencias = sorted(
                [v for v in atuais[sigla] if v['inicio'] not in novos_inicios] + vigencias,
                key=lambda v: v['inicio'])
        resultado[sigla] = vigencias
        ultimo_fim = max(v['fim'] for v in vigencias)
        if ultimo_fim < str(pd.Timestamp.today().date()):
            print(f'   ATENÇÃO: a última vigência de {sigla} no arquivo termina em {ultimo_fim}, '
                  f'antes de hoje - a base da ANEEL ainda não tem o reajuste novo.')
        print(f'{sigla}: {len(vigencias)} vigencia(s)')
        for v in vigencias:
            print(f"   {v['resolucao']}  {v['inicio']} a {v['fim']}  "
                  f"({len(v['tarifas'])} categorias, {len(v['tarifas_scee'])} SCEE)")

    corpo = json.dumps(resultado, ensure_ascii=False, indent=4)
    destino = 'src/modulos/conta-teste/motor/vigencias.js'
    with open(destino, 'w', encoding='utf-8') as f:
        f.write('// GERADO AUTOMATICAMENTE por scripts/conta-teste/exportar-vigencias.py - não edite à mão.\n')
        f.write('// Fonte: export oficial da ANEEL, linhas "Tarifa de Aplicação", em R$/kWh.\n')
        f.write('//\n')
        f.write('// Cada distribuidora tem uma lista de vigências ordenada por data. Quando o\n')
        f.write('// período de leitura cruza a virada, o motor rateia proporcionalmente aos dias.\n')
        f.write('// tarifas_scee são as tarifas de compensação usadas pela Geração Distribuída.\n\n')
        f.write('export const VIGENCIAS = ' + corpo + ';\n')
    print('\nGerado:', destino)


if __name__ == '__main__':
    main()
