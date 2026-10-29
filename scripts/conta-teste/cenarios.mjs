/**
 * Bateria de cenários usada para garantir que a versão autônoma calcula
 * exatamente igual à API. Compartilhado por capturar-referencia.mjs e
 * verificar.mjs.
 */
export const CENARIOS = [
    // ---------------------------------------------------------------------
    // Redutor SUDENE. Sem âncora de fatura real ainda - a planilha oficial
    // está criptografada e não pôde ser conferida. Estes cenários travam o
    // comportamento atual para detectar mudanças acidentais.
    // ---------------------------------------------------------------------
    {
        // Com o PIS/COFINS de setembro/2026 do ES cadastrado (1,280/5,870),
        // este caso passou a reproduzir EXATAMENTE o exemplo do plano oficial
        // do SUDENE: tarifa 0,00561344, preco unit 0,00728398 e total -R$ 0,95.
        // Antes batia -0,91, porque o mes caia na aliquota generica.
        nome: 'SUDENE cruzando a vigencia (21/08 a 22/09/2026, 130 kWh) - bate o plano oficial',
        modelo_oficial_linha_sudene: -0.95,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-08-21', data_leitura_atual: '2026-09-22',
            consumo_kwh: 130, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: [], sudene: true
        }
    },
    {
        nome: 'SUDENE em irrigante: linha de ativo e de reservado a 40%',
        params: {
            distribuidora: 'ES', categoria: 'B2RUIRRG', fase: 'trifasico',
            data_leitura_anterior: '2026-09-01', data_leitura_atual: '2026-10-01',
            consumo_kwh: 500, consumo_reservado: 300,
            bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: [], sudene: true
        }
    },
    {
        nome: 'SUDENE antes da vigencia nao gera linha',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-01', data_leitura_atual: '2026-07-31',
            consumo_kwh: 200, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: [], sudene: true
        }
    },
    // ---------------------------------------------------------------------
    // Casos ancorados em faturas reais conferidas na validação. O campo
    // fatura_real é o total impresso na conta: se o motor sair disso, é erro.
    // ---------------------------------------------------------------------
    {
        nome: 'FATURA REAL B1CDE Doc 265002360732 (desconto social, faixa de 120 kWh)',
        fatura_real: 159.01,
        params: {
            distribuidora: 'ES', categoria: 'B1CDE', fase: 'monofasico',
            data_leitura_anterior: '2026-05-22', data_leitura_atual: '2026-06-23',
            consumo_kwh: 154, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 26.22, ajustes: []
        }
    },
    {
        nome: 'FATURA REAL Baixa Renda ES Doc 257002385025 (subvenção dos 80 kWh)',
        fatura_real: 35.54,
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-06-03', data_leitura_atual: '2026-07-06',
            consumo_kwh: 100, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 8.51, ajustes: []
        }
    },
    {
        nome: 'FATURA REAL B1C cruzando a virada da REH 3.600 (21/07 a 20/08/2026)',
        fatura_real: 141.69,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-21', data_leitura_atual: '2026-08-20',
            consumo_kwh: 121, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 13.37,
            ajustes: [
                { nome: 'Multa', valor: 2.68 },
                { nome: 'Juros Mora', valor: 0.83 },
                { nome: 'Bônus de Itaipu Lei 10.438/02', valor: -11.71 },
                { nome: 'DOA HEVV TEL.08007264388', valor: 7.00 }
            ]
        }
    },
    {
        // Modelo da área para Baixa Renda ES ("Benefício Tarifa Social"), 450 kWh,
        // PIS/COFINS de outubro/2026 (1,10% / 5,08%), ICMS 17%. O modelo não
        // mostra as datas: 32 dias com 27 de bandeira amarela (BAM 380 de 450
        // kWh) e 5 de outra - reproduzido como 03/09 a 05/10/2026, amarela em
        // setembro e verde em outubro. Fecha o total do modelo (339,98) e os
        // dois informativos do modelo: Benefício 53,94 e Escassez -0,20.
        nome: 'MODELO ES Baixa Renda 450 kWh (Benefício Tarifa Social 53,94 / Escassez -0,20)',
        modelo_oficial: 339.98,
        beneficio_social_impresso: 53.94,
        escassez_impressa: -0.20,
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-09-03', data_leitura_atual: '2026-10-05',
            consumo_kwh: 450, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        // Fatura real Baixa Renda ES (ref. 09/2026, Inst. com leitura por média
        // aritmética), 413 kWh, 04/08 a 03/09/2026, bandeira amarela os 30
        // dias, PIS/COFINS 1,28% / 5,87%. A conta imprime "Benefício Tarifário
        // obtido com a Tarifa Social R$ 53,58" e "Escassez hídrica ... -0,26".
        // CIP 21,06 + multa 4,88 + juros 4,46 + IPCA 0,24; total 340,39.
        nome: 'FATURA REAL ES Baixa Renda 413 kWh (REH 3.600 em 28 de 30 dias, Benefício 53,58)',
        fatura_real: 340.39,
        beneficio_social_impresso: 53.58,
        escassez_impressa: -0.26,
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-08-04', data_leitura_atual: '2026-09-03',
            consumo_kwh: 413, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 21.06,
            ajustes: [
                { nome: 'Multa AGO/26', valor: 4.88 },
                { nome: 'Juros de Mora JUL/26', valor: 4.46 },
                { nome: 'Atualiz. Monet. IPCA JUL/26', valor: 0.24 }
            ]
        }
    },
    {
        // Fatura real Baixa Renda ES, ref. OUT/2026, 321 kWh, 09/09 a 08/10/2026
        // (29 dias; amarela 21 dias, verde 8), COM redutor SUDENE, CIP 23,86.
        // Total impresso 246,22; Escassez -0,13. Dois pontos que o motor errava:
        //  - o redutor SUDENE incide só nos 241 kWh faturados (não nos 321);
        //  - o redutor também abate a tarifa dos 80 kWh isentos, então o
        //    "Desconto Baixa Renda" sai 54,42 e não 55,03 (a conta fechava
        //    R$ 0,67 abaixo). Sem esses dois acertos o motor dava 245,55.
        nome: 'FATURA REAL ES Baixa Renda 321 kWh com SUDENE (OUT/2026, 241 kWh faturados)',
        fatura_real: 246.22,
        escassez_impressa: -0.13,
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-09-09', data_leitura_atual: '2026-10-08',
            consumo_kwh: 321, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 23.86, ajustes: [], sudene: true
        }
    },
    {
        // Fatura real SP Baixa Renda BPC, Lote 11 / UC 0.000.026.101.004-73, ref.
        // OUT/2026: 355 kWh medidos e 355 faturados (275 + 80 isentos) - aqui NÃO
        // houve a perda de 1,5% do ramal, então o toggle "Desconto BT" fica
        // desligado. 17/09 a 19/10/2026, 32 dias: AMARELA 18/09 a 30/09 (13
        // dias, Mês 1) e VERDE 01/10 a 19/10 (19 dias, Mês 2). Trazida pela
        // verificação de SP: invertendo a ordem das bandeiras (o padrão do
        // formulário é Verde/Amarela) o total sobe para 230,61 - o aviso de
        // trechos sob os campos de bandeira existe por causa disso.
        // Juros 0,56 + multa 4,79 de SET/26; total impresso 229,36.
        nome: 'FATURA REAL SP Baixa Renda BPC Lote 11 (355 kWh, amarela 13 dias e verde 19)',
        fatura_real: 229.36,
        fio_b_modelo: 70.56, // modelo da area SP: 355 kWh x TUSD Fio B 0,198766 (a fatura nao imprime o Fio B)
        escassez_impressa: -0.35, // rodape: "Encargo CDE - Escassez hidrica incluso da tarifa R$0,35-"
        params: {
            distribuidora: 'SP', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-09-17', data_leitura_atual: '2026-10-19',
            consumo_kwh: 355, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 0,
            ajustes: [
                { nome: 'Juros Mora Ref.: Set/26', valor: 0.56 },
                { nome: 'Multa Ref.: Set/26', valor: 4.79 }
            ]
        }
    },
    // ---------------------------------------------------------------------
    // Quatro faturas de SP trazidas pela verificação (Lara, 27/10/2026). O motor
    // já fechava o total em até R$ 0,01; o que não batia era o informativo de
    // Escassez Hídrica (um centavo a mais/menos em duas delas) - ver
    // ESCASSEZ_ARREDONDA_POR_COMPONENTE em tarifas-aneel.js.
    // ---------------------------------------------------------------------
    {
        // UC 0.000.133.313.004-97, B1 residencial bifásico. Medidor 4.466 -> 4.467
        // = 1 kWh, faturados 50 (consumo mínimo do bifásico). ICMS zero (até 90
        // kWh). Amarela os 31 dias. "Valor referente à fatura de Agosto" 45,93.
        nome: 'FATURA REAL SP B1 bifásico, 1 kWh medido -> 50 faturados (NF-e 027.587.971, SET/2026)',
        fatura_real: 103.80,
        escassez_impressa: -0.05,
        params: {
            distribuidora: 'SP', categoria: 'B1C', fase: 'bifasico',
            data_leitura_anterior: '2026-08-18', data_leitura_atual: '2026-09-18',
            consumo_kwh: 1, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 14.66,
            ajustes: [{ nome: 'Valor referente à fatura de Agosto / 2026', valor: 45.93 }]
        }
    },
    {
        // Mesma UC, ciclo seguinte: medidor 4.467 -> 4.467 (0 kWh), 50 faturados.
        // Amarela 19/09 a 30/09 (12 dias, Mês 1) e verde 01/10 a 20/10 (20 dias).
        nome: 'FATURA REAL SP B1 bifásico, 0 kWh medido -> 50 faturados (NF-e 029.977.277, OUT/2026)',
        fatura_real: 56.86,
        escassez_impressa: -0.05,
        params: {
            distribuidora: 'SP', categoria: 'B1C', fase: 'bifasico',
            data_leitura_anterior: '2026-09-18', data_leitura_atual: '2026-10-20',
            consumo_kwh: 0, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 14.66, ajustes: []
        }
    },
    {
        // UC 0.001.269.719.004-53, B3 comercial trifásico. Medidor 164 -> 167 com
        // constante 40 = 120 kWh: o formulário pede o consumo JÁ multiplicado pela
        // constante. ICMS 18%.
        nome: 'FATURA REAL SP B3 trifásico, 120 kWh (leitura 3 x constante 40) (NF-e 027.587.974, SET/2026)',
        fatura_real: 135.69,
        escassez_impressa: -0.14,
        params: {
            distribuidora: 'SP', categoria: 'B3', fase: 'trifasico',
            data_leitura_anterior: '2026-08-18', data_leitura_atual: '2026-09-18',
            consumo_kwh: 120, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 3.87,
            ajustes: [
                { nome: 'Multa Ref.: Ago/26', valor: 4.18 },
                { nome: 'Atualiz. Monet. IPCA Ref.: Jul/26', valor: 0.07 },
                { nome: 'Juros de Mora Ref.: Jul/26', valor: 1.08 }
            ]
        }
    },
    {
        // Mesma UC: medidor 167 -> 168 x 40 = 40 kWh, faturados 100 (consumo
        // mínimo do trifásico). Amarela 12 dias, verde 20.
        nome: 'FATURA REAL SP B3 trifásico, 40 kWh medido -> 100 faturados (NF-e 029.977.285, OUT/2026)',
        fatura_real: 110.31,
        escassez_impressa: -0.12,
        params: {
            distribuidora: 'SP', categoria: 'B3', fase: 'trifasico',
            data_leitura_anterior: '2026-09-18', data_leitura_atual: '2026-10-20',
            consumo_kwh: 40, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 3.18,
            ajustes: [
                { nome: 'Multa Ref.: Set/26', valor: 2.53 },
                { nome: 'Juros de Mora Ref.: Ago/26', valor: 1.67 }
            ]
        }
    },
    {
        // Baixa Renda de SP com a perda de 1,5% do ramal ("Desconto BT").
        // O consumo medido foi 394 kWh; a perda derruba para 388,09, que a
        // conta fatura arredondado para 388 - daí 388 - 80 isentos = 308,0000.
        // ATENÇÃO: o arredondamento acontece no formulário (page.tsx), não no
        // motor. Aqui o consumo já entra com a perda aplicada, então este
        // cenário cobre só a metade do motor; a regra do arredondamento em si
        // não tem cobertura automática.
        nome: 'FATURA REAL SP Baixa Renda Inst. 151389514 (perda de 1,5% no ramal)',
        fatura_real: 289.74,
        params: {
            distribuidora: 'SP', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-08-13', data_leitura_atual: '2026-09-15',
            consumo_kwh: 388, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 0,
            ajustes: [{ nome: 'C. Todos - 0800 283 8916', valor: 33.40 }]
        }
    },
    {
        // Confirma que a perda de 1,5% do ramal ("Desconto BT") não é
        // exclusiva do Baixa Renda: o B1CDE (Desconto Social Lei 15.235,
        // faixa de 120 kWh) também sofre. O medidor registrou 313 kWh
        // (leitura 10.294 - 9.981), mas a fatura cobra 308 (120 até + 188
        // acima) - exatamente round(313 x 0,985) = round(308,305) = 308.
        // Reportado pela Debora (SP) em 22/09/2026, NF-e 027.725.044.
        // Mesma ressalva do cenário anterior: o arredondamento é feito no
        // formulário (page.tsx), aqui o consumo já entra pós-perda.
        nome: 'FATURA REAL SP B1CDE NF-e 027.725.044 (Desconto Social, perda de 1,5% no ramal: 313 medido -> 308 faturado)',
        fatura_real: 308.97,
        escassez_impressa: -0.37, // rodape: "Encargo CDE - Escassez hidrica incluso na tarifa R$0,37-"
        params: {
            distribuidora: 'SP', categoria: 'B1CDE', fase: 'bifasico',
            data_leitura_anterior: '2026-08-19', data_leitura_atual: '2026-09-21',
            consumo_kwh: 308, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 10.31, ajustes: []
        }
    },
    {
        nome: 'FATURA REAL SP B1C 158 kWh (ICMS de 12% pela faixa de consumo)',
        fatura_real: 172.82,
        params: {
            distribuidora: 'SP', categoria: 'B1C', fase: 'bifasico',
            data_leitura_anterior: '2026-06-11', data_leitura_atual: '2026-07-13',
            consumo_kwh: 158, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 16.26,
            ajustes: [{ nome: 'Multa Ref.: Jun/26', valor: 3.37 }]
        }
    },
    {
        nome: 'MODELO SP B3 50 kWh (ICMS 18%, bandeira rateada 17/13 dias)',
        modelo_oficial: 52.85,
        fio_b_modelo: 9.94, // modelo da area SP (aba B3): 50 kWh x TUSD Fio B 0,198766
        params: {
            distribuidora: 'SP', categoria: 'B3', fase: 'monofasico',
            data_leitura_anterior: '2026-04-13', data_leitura_atual: '2026-05-13',
            consumo_kwh: 50, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 0, ajustes: [{ nome: 'Taxas', valor: 2.39 }]
        }
    },
    {
        nome: 'MODELO SP B1C_TB tarifa branca com os três postos',
        modelo_oficial: 613.54,
        params: {
            distribuidora: 'SP', categoria: 'B1C_TB', fase: 'trifasico',
            data_leitura_anterior: '2026-04-14', data_leitura_atual: '2026-05-14',
            consumo_ponta: 57, consumo_intermediario: 39, consumo_fora_ponta: 561,
            bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 0, ajustes: []
        }
    },
    // ---------------------------------------------------------------------
    // Categorias com GD além de B1C, conferidas em 09/09/2026 contra os
    // modelos oficiais "Grupo B/EDP_ES_RTA_2026_Modelo_Grupo B_MMGD_*.xlsx"
    // (GD1, GD1_TB, GD1_GERAR, GD2). Conclusão da análise: o motor já
    // implementava corretamente a divisão por faixa do B1CDE e o rateio
    // ativo/reservado do Irrigante - estes cenários só formalizam a
    // validação como regressão permanente, sem mudar nenhuma regra.
    // ---------------------------------------------------------------------
    {
        nome: 'MODELO GD1 - B1CDE, faixas até/acima 120 kWh com injeção nas duas',
        modelo_oficial: 144.26,
        params: {
            distribuidora: 'ES', categoria: 'B1CDE', fase: 'monofasico',
            data_leitura_anterior: '2026-07-21', data_leitura_atual: '2026-08-20',
            consumo_kwh: 724, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 0, ajustes: [{ nome: 'Bônus/Descontos', valor: -8.97 }],
            gd_ativo: true, gd_papel: 'receptor', gd_modalidade: 'GD1',
            geradoras: [{ consumo: 624, percentual: 100, modalidade: 'GD1' }]
        }
    },
    {
        nome: 'MODELO GD1 - Baixa Renda MP1300, injeção compensa só a faixa acima de 80 kWh',
        modelo_oficial: 32.3852,
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-07-21', data_leitura_atual: '2026-08-20',
            consumo_kwh: 444, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 0, ajustes: [{ nome: 'Multas', valor: -5.83 }],
            gd_ativo: true, gd_papel: 'receptor', gd_modalidade: 'GD1',
            geradoras: [{ consumo: 364, percentual: 100, modalidade: 'GD1' }]
        }
    },
    // ---------------------------------------------------------------------
    // Geração Distribuída, ancorada nos modelos oficiais em "Grupo B/".
    // A tolerância é maior porque o Excel bruteia linha a linha e o motor
    // distribui proporcionalmente - dá 2 centavos de diferença. A distribuição
    // proporcional foi mantida porque é a que reproduz as faturas reais.
    // ---------------------------------------------------------------------
    {
        nome: 'MODELO GD1 - B1 Res, 324 kWh consumidos e 274 injetados',
        modelo_oficial: 121.39,
        tolerancia: 0.05,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-24', data_leitura_atual: '2026-08-25',
            consumo_kwh: 324, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 46.36, ajustes: [{ nome: 'Doações', valor: -8.29 }],
            gd_ativo: true, gd_papel: 'receptor', gd_modalidade: 'GD1',
            geradoras: [{ consumo: 274, percentual: 100, modalidade: 'GD1' }]
        }
    },
    {
        nome: 'MODELO GD2 - B1 Res, 149 kWh consumidos e 57,503 injetados',
        modelo_oficial: 145.81,
        tolerancia: 0.05,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-24', data_leitura_atual: '2026-08-25',
            consumo_kwh: 149, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 40.37, ajustes: [{ nome: 'Bônus/Descontos', valor: -7.07 }],
            gd_ativo: true, gd_papel: 'receptor', gd_modalidade: 'GD2',
            geradoras: [{ consumo: 57.503, percentual: 100, modalidade: 'GD2' }]
        }
    },
    {
        nome: 'GD com duas geradoras em enquadramentos diferentes (GD1 + GD2)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-24', data_leitura_atual: '2026-08-25',
            consumo_kwh: 300, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 20, ajustes: [],
            gd_ativo: true, gd_papel: 'receptor',
            geradoras: [
                { consumo: 200, percentual: 50, modalidade: 'GD1' },
                { consumo: 400, percentual: 25, modalidade: 'GD2' }
            ]
        }
    },
    {
        nome: 'GD em Baixa Renda: enquadramento forçado a GD1',
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-07-24', data_leitura_atual: '2026-08-25',
            consumo_kwh: 200, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 5, ajustes: [],
            gd_ativo: true, gd_papel: 'receptor', gd_modalidade: 'GD2',
            geradoras: [{ consumo: 100, percentual: 100, modalidade: 'GD2' }]
        }
    },
    {
        nome: 'B1C convencional 250 kWh, virada de mês, bandeiras diferentes',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-05-10', data_leitura_atual: '2026-06-10',
            consumo_kwh: 250, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 12.5, ajustes: []
        }
    },
    {
        // Antes de 10/09/2026 este cenário se chamava "isencao de ICMS ate 90
        // no ES" e saía isento, porque o motor usava o limite trocado do
        // documento antigo de premissas. A planilha do Tributário fixou o
        // limite do ES em 50 kWh, então 80 kWh passa a pagar 17%.
        nome: 'B1C ES 80 kWh (acima da isencao de 50 kWh -> ICMS 17%)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-06-05', data_leitura_atual: '2026-07-05',
            consumo_kwh: 80, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    // ---------------------------------------------------------------------
    // Faixa de 50 a 90 kWh: é a única em que o limite antigo (trocado) e o da
    // planilha do Tributário divergem. Nenhuma fatura real cai aqui, por isso
    // o erro passou despercebido - estes três cenários travam a regra nova.
    // ---------------------------------------------------------------------
    {
        // Ciclo longo que cruza abril, maio e junho (5 + 31 + 2 = 38 dias).
        // Até 14/09/2026 o motor somava abril e maio num bloco só e cobrava os
        // dois com a bandeira do mês 1; agora cada mês paga a sua.
        nome: 'Tres bandeiras: periodo cruza 3 meses (25/04 a 02/06, 5/31/2 dias)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-04-25', data_leitura_atual: '2026-06-02',
            consumo_kwh: 380,
            bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA', bandeira_mes3: 'VERMELHA_P1',
            valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'B1C ES 40 kWh (dentro da isencao de 50 kWh -> ICMS zero)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-06-05', data_leitura_atual: '2026-07-05',
            consumo_kwh: 40, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'SP B1C 70 kWh (dentro da isencao de 90 kWh -> ICMS zero)',
        params: {
            distribuidora: 'SP', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-06-05', data_leitura_atual: '2026-07-05',
            consumo_kwh: 70, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        // A Cristiane confirmou em 10/09/2026: "baixa renda segue o mesmo para SP".
        nome: 'SP Baixa Renda 70 kWh (mesmas faixas do residencial -> ICMS zero)',
        params: {
            distribuidora: 'SP', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-06-05', data_leitura_atual: '2026-07-05',
            consumo_kwh: 70, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'B1C consumo abaixo do minimo monofasico (10 kWh)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-06-01', data_leitura_atual: '2026-06-28',
            consumo_kwh: 10, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 5, ajustes: []
        }
    },
    {
        nome: 'B1C_TB tarifa branca com os tres postos',
        params: {
            distribuidora: 'ES', categoria: 'B1C_TB', fase: 'trifasico',
            data_leitura_anterior: '2026-05-15', data_leitura_atual: '2026-06-15',
            consumo_ponta: 60, consumo_fora_ponta: 300, consumo_intermediario: 40,
            bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERMELHA_P1',
            valor_cip: 20, ajustes: []
        }
    },
    {
        nome: 'B1C_TB somente intermediario (exercita o fallback de posto)',
        params: {
            distribuidora: 'ES', categoria: 'B1C_TB', fase: 'trifasico',
            data_leitura_anterior: '2026-05-10', data_leitura_atual: '2026-06-10',
            consumo_ponta: 0, consumo_fora_ponta: 0, consumo_intermediario: 100,
            bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE', valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'B1BRN baixa renda 150 kWh',
        params: {
            distribuidora: 'ES', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'monofasico',
            data_leitura_anterior: '2026-05-20', data_leitura_atual: '2026-06-20',
            consumo_kwh: 150, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 3.2, ajustes: []
        }
    },
    {
        nome: 'FATURA REAL B2RURAL Doc 0.000.183.869.054-76 (icms 4% carga efetiva)',
        fatura_real: 874.51,
        params: {
            distribuidora: 'ES', categoria: 'B2RURAL', fase: 'trifasico',
            data_leitura_anterior: '2026-07-21', data_leitura_atual: '2026-08-20',
            consumo_kwh: 939, bandeira_mes1: 'AMARELA', bandeira_mes2: 'AMARELA',
            valor_cip: 0, ajustes: [{ nome: 'Juros de Mora', valor: 5.57 }]
        }
    },
    {
        nome: 'B2RURAL 400 kWh (icms 4% carga efetiva)',
        params: {
            distribuidora: 'ES', categoria: 'B2RURAL', fase: 'bifasico',
            data_leitura_anterior: '2026-05-01', data_leitura_atual: '2026-06-01',
            consumo_kwh: 400, bandeira_mes1: 'VERDE', bandeira_mes2: 'ESCASSEZ',
            valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'B2RUIRRG irrigante com consumo reservado',
        params: {
            distribuidora: 'ES', categoria: 'B2RUIRRG', fase: 'trifasico',
            data_leitura_anterior: '2026-05-12', data_leitura_atual: '2026-06-12',
            consumo_kwh: 500, consumo_reservado: 800,
            bandeira_mes1: 'VERMELHA_P1', bandeira_mes2: 'VERMELHA_P2',
            valor_cip: 15, ajustes: []
        }
    },
    {
        nome: 'B2RUIRRG_TB irrigante tarifa branca com reservado',
        params: {
            distribuidora: 'ES', categoria: 'B2RUIRRG_TB', fase: 'trifasico',
            data_leitura_anterior: '2026-05-12', data_leitura_atual: '2026-06-12',
            consumo_ponta: 50, consumo_fora_ponta: 200, consumo_intermediario: 30,
            consumo_reservado: 400, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 15, ajustes: []
        }
    },
    {
        nome: 'B3 comercial 1000 kWh no mesmo mes',
        params: {
            distribuidora: 'ES', categoria: 'B3', fase: 'trifasico',
            data_leitura_anterior: '2026-06-02', data_leitura_atual: '2026-06-30',
            consumo_kwh: 1000, bandeira_mes1: 'ESCASSEZ', bandeira_mes2: 'ESCASSEZ',
            valor_cip: 45.9, ajustes: []
        }
    },
    {
        nome: 'B4A iluminacao publica',
        params: {
            distribuidora: 'ES', categoria: 'B4A', fase: 'trifasico',
            data_leitura_anterior: '2026-05-01', data_leitura_atual: '2026-06-01',
            consumo_kwh: 2500, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        nome: 'B1C com multiplos ajustes (multa e devolucao)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-05-10', data_leitura_atual: '2026-06-10',
            consumo_kwh: 320, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 8, ajustes: [
                { nome: 'Multa por atraso', valor: 15.75 },
                { nome: 'Devolucao judicial', valor: -42.3 }
            ]
        }
    },
    {
        nome: 'B1C_GERAR isento de TUSD/TE',
        params: {
            distribuidora: 'ES', categoria: 'B1C_GERAR', fase: 'monofasico',
            data_leitura_anterior: '2026-05-10', data_leitura_atual: '2026-06-10',
            consumo_kwh: 300, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 10, ajustes: []
        }
    },
    {
        nome: 'SP B1C 250 kWh (acima de 200 kWh -> ICMS 18%)',
        params: {
            distribuidora: 'SP', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-05-10', data_leitura_atual: '2026-06-10',
            consumo_kwh: 250, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 12.5, ajustes: []
        }
    },
    {
        nome: 'ES virada de vigencia: leitura cruza 07/08/2026 (REH 3.508 -> 3.600)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-07-20', data_leitura_atual: '2026-08-20',
            consumo_kwh: 300, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            valor_cip: 10, ajustes: []
        }
    },
    {
        nome: 'ES totalmente na vigencia nova (REH 3.600)',
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'monofasico',
            data_leitura_anterior: '2026-09-10', data_leitura_atual: '2026-10-10',
            consumo_kwh: 300, bandeira_mes1: 'VERDE', bandeira_mes2: 'VERDE',
            valor_cip: 10, ajustes: []
        }
    },
    {
        nome: 'B3_TB comercial tarifa branca',
        params: {
            distribuidora: 'ES', categoria: 'B3_TB', fase: 'trifasico',
            data_leitura_anterior: '2026-06-10', data_leitura_atual: '2026-07-10',
            consumo_ponta: 120, consumo_fora_ponta: 800, consumo_intermediario: 90,
            bandeira_mes1: 'VERMELHA_P2', bandeira_mes2: 'VERDE',
            valor_cip: 60, ajustes: []
        }
    },
    {
        // Inst. 30875, Lote 31 (NF-e 063.607.546, OUT/2026, Vitória). A fatura
        // imprime "VERDE 01/10 a 02/10 - 02 dias" ANTES de "AMARELA 03/09 a 30/09
        // - 28 dias", mas a ordem do formulário é a das datas: Mês 1 = setembro
        // (Amarela), Mês 2 = outubro (Verde). Invertido, o total cai para R$ 403,13.
        // Escassez Hídrica: a fatura imprime -0,13 e o motor dá -0,19 (informativo,
        // não soma no total) - por isso escassez_impressa não foi ancorada aqui.
        nome: 'FATURA REAL ES B1 bifásico 351 kWh, Lote 31 (Amarela 28 dias, Verde 2 dias)',
        fatura_real: 410.48,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'bifasico',
            data_leitura_anterior: '2026-09-02', data_leitura_atual: '2026-10-02',
            consumo_kwh: 351, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 22.26, ajustes: []
        }
    },
    {
        // A mesma fatura (Inst. 30875, Lote 31) digitada NA ORDEM EM QUE A FATURA
        // IMPRIME - Verde (2 dias) antes de Amarela (28 dias) - com os dias de
        // cada bandeira. Tem que dar o mesmo total do cenário cronológico acima.
        nome: 'FATURA REAL ES B1 bifásico 351 kWh, Lote 31 na ordem da fatura (Verde 2 dias, Amarela 28 dias)',
        fatura_real: 410.48,
        params: {
            distribuidora: 'ES', categoria: 'B1C', fase: 'bifasico',
            data_leitura_anterior: '2026-09-02', data_leitura_atual: '2026-10-02',
            consumo_kwh: 351, bandeira_mes1: 'VERDE', bandeira_mes2: 'AMARELA',
            bandeiras_dias: [{ bandeira: 'VERDE', dias: 2 }, { bandeira: 'AMARELA', dias: 28 }],
            valor_cip: 22.26, ajustes: []
        }
    },
    {
        // Inst. 150671277 (SP, B4A, OUT/2026): leitura de 25/09 a 27/10 cruza a
        // virada de tarifa de SP em 23/10/2026 (Despacho ANEEL 3.611/2026) -
        // 27 dias na tarifa antiga e 5 na nova. Antes de cadastrar a vigência
        // nova o simulador dava R$ 285,19 contra 286,04 impresso. A fatura
        // imprime Verde (27 dias) antes de Amarela (5 dias); o formulário segue
        // a ordem das datas (Amarela = mês 1). Retenção de IR de 1,2% do B4A em SP.
        nome: 'FATURA REAL SP B4A 511 kWh, virada da tarifa em 23/10/2026 (Inst. 150671277)',
        fatura_real: 286.04,
        params: {
            distribuidora: 'SP', categoria: 'B4A', fase: 'trifasico',
            data_leitura_anterior: '2026-09-25', data_leitura_atual: '2026-10-27',
            consumo_kwh: 511, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 0, ajustes: []
        }
    },
    {
        // Lote 17 (SP, Baixa Renda, inst. 91649889, OUT/2026): mesma virada de
        // 23/10. 197 kWh medidos viram 194 faturados pela perda de 1,5% no ramal
        // (80 isentos + 114 cobrados). A Escassez impressa (-0,13) só fecha com a
        // janela nova de Escassez de SP, derivada desta fatura - ver
        // ENCARGO_ESCASSEZ_HIDRICA em tarifas-aneel.js.
        nome: 'FATURA REAL SP Baixa Renda 194 kWh faturados, virada da tarifa em 23/10/2026 (Lote 17)',
        fatura_real: 91.52,
        escassez_impressa: -0.13,
        params: {
            distribuidora: 'SP', categoria: 'B1BRN/B1BPC/B1BRQ/B1BRI', fase: 'bifasico',
            data_leitura_anterior: '2026-09-25', data_leitura_atual: '2026-10-27',
            consumo_kwh: 194, bandeira_mes1: 'AMARELA', bandeira_mes2: 'VERDE',
            valor_cip: 0,
            ajustes: [
                { nome: 'Multa Ref.: Set/26', valor: 1.59 },
                { nome: 'Juros de Mora Ref.: Jul/26', valor: 0.50 },
                { nome: 'Juros de Mora Ref.: Ago/26', valor: 0.45 }
            ]
        }
    }
];
