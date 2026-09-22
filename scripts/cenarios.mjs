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
    }
];
