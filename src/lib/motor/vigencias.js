// GERADO AUTOMATICAMENTE por scripts/exportar-vigencias.py - não edite à mão.
// Fonte: export oficial da ANEEL, linhas "Tarifa de Aplicação", em R$/kWh.
//
// Cada distribuidora tem uma lista de vigências ordenada por data. Quando o
// período de leitura cruza a virada, o motor rateia proporcionalmente aos dias.
// tarifas_scee são as tarifas de compensação usadas pela Geração Distribuída.

export const VIGENCIAS = {
    "ES": [
        {
            "resolucao": "REH Nº 3.508, DE 5 DE AGOSTO DE 2025",
            "inicio": "2026-01-01",
            "fim": "2026-08-06",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.32068
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.36496,
                        "te": 0.30579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.65129,
                        "te": 0.30579
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93761,
                        "te": 0.48448
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34019,
                        "te": 0.29666,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.32068,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.32543,
                        "te": 0.28245
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.32068
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.30579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.30579
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.48448
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.32068
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.30579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.30579
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.48448
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.32068
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.30579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.30579
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.48448
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.25775,
                        "te": 0.17638
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.28118,
                        "te": 0.19241
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.04475
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.36496,
                        "te": 0.04475
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.65129,
                        "te": 0.04475
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93761,
                        "te": 0.04475
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34019,
                        "te": 0.02073,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.04475,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.32543,
                        "te": 0.02067
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.04475
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.04475
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.04475
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.04475
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.04475
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.04475
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.04475
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.04475
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.46863,
                        "te": 0.04475
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.38965,
                        "te": 0.04475
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.72534,
                        "te": 0.04475
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.06103,
                        "te": 0.04475
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.25775,
                        "te": 0.02461
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.28118,
                        "te": 0.02685
                    }
                ]
            }
        },
        {
            "resolucao": "REH Nº 3.600, DE 31 DE JULHO DE 2026",
            "inicio": "2026-08-07",
            "fim": "2027-08-06",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.33739
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.39741,
                        "te": 0.32107
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.69821,
                        "te": 0.32107
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99902,
                        "te": 0.51691
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.35642,
                        "te": 0.33759,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.33739,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34895,
                        "te": 0.32532
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.33739
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.32107
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.32107
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.51691
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.33739
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.32107
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.32107
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.51691
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.33739
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.32107
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.32107
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.51691
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.27848,
                        "te": 0.18556
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.30379,
                        "te": 0.20243
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.03437
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.39741,
                        "te": 0.03437
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.69821,
                        "te": 0.03437
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99902,
                        "te": 0.03437
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.35642,
                        "te": 0.03457,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.03437,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34895,
                        "te": 0.03457
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.03437
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.03437
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.03437
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.03437
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.03437
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.03437
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.03437
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.03437
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.50632,
                        "te": 0.03437
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.42334,
                        "te": 0.03437
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.77601,
                        "te": 0.03437
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.12867,
                        "te": 0.03437
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.27848,
                        "te": 0.03437
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.30379,
                        "te": 0.03437
                    }
                ]
            }
        }
    ],
    "SP": [
        {
            "resolucao": "REH Nº 3.541, DE 14 DE OUTUBRO DE 2025",
            "inicio": "2026-01-01",
            "fim": "2026-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.33003
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.33398,
                        "te": 0.31504
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.5998,
                        "te": 0.31504
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.86563,
                        "te": 0.49484
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.31629,
                        "te": 0.30475,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.33003,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.3008,
                        "te": 0.2906
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.33003
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.35954,
                        "te": 0.31504
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.67648,
                        "te": 0.31504
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99343,
                        "te": 0.49484
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.33003
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.35954,
                        "te": 0.31504
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.67648,
                        "te": 0.31504
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99343,
                        "te": 0.49484
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.33003
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.36976,
                        "te": 0.31504
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.70716,
                        "te": 0.31504
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.04455,
                        "te": 0.49484
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.25117,
                        "te": 0.18152
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.274,
                        "te": 0.19802
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.0522
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.33398,
                        "te": 0.0522
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.5998,
                        "te": 0.0522
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.86563,
                        "te": 0.0522
                    }
                ],
                "B1CDE": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.31629,
                        "te": 0.02692,
                        "faixa": "ate"
                    },
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.0522,
                        "faixa": "acima"
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.3008,
                        "te": 0.02692
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.0522
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.35954,
                        "te": 0.0522
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.67648,
                        "te": 0.0522
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99343,
                        "te": 0.0522
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.0522
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.35954,
                        "te": 0.0522
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.67648,
                        "te": 0.0522
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.99343,
                        "te": 0.0522
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.45667,
                        "te": 0.0522
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.36976,
                        "te": 0.0522
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.70716,
                        "te": 0.0522
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 1.04455,
                        "te": 0.0522
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.25117,
                        "te": 0.0522
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.274,
                        "te": 0.0522
                    }
                ]
            }
        }
    ],
    "SP": [
        {
            "resolucao": "REH Nº 3.390, DE 22 DE OUTUBRO DE 2024",
            "inicio": "2024-10-23",
            "fim": "2025-10-22",
            "tarifas": {
                "B1C": [
                    { "posto": "Nao aplica", "tusd": 0.39695, "te": 0.28093 }
                ],
                "B1C_TB": [
                    { "posto": "Fora ponta", "tusd": 0.27395, "te": 0.26735 },
                    { "posto": "Intermediário", "tusd": 0.54045, "te": 0.26735 },
                    { "posto": "Ponta", "tusd": 0.80696, "te": 0.43036 }
                ],
                "B1CDE": [
                    { "posto": "Nao aplica", "tusd": 0.31629, "te": 0.30475, "faixa": "ate" },
                    { "posto": "Nao aplica", "tusd": 0.39695, "te": 0.28093, "faixa": "acima" }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    { "posto": "Nao aplica", "tusd": 0.29441, "te": 0.27303 }
                ],
                "B1BRN": [
                    { "posto": "Nao aplica", "tusd": 0.30080, "te": 0.29060 }
                ],
                "B2RURAL": [
                    { "posto": "Nao aplica", "tusd": 0.39695, "te": 0.28093 }
                ],
                "B2RURAL_TB": [
                    { "posto": "Fora ponta", "tusd": 0.29957, "te": 0.26735 },
                    { "posto": "Intermediário", "tusd": 0.61733, "te": 0.26735 },
                    { "posto": "Ponta", "tusd": 0.93509, "te": 0.43036 }
                ],
                "B2RUIRRG": [
                    { "posto": "Nao aplica", "tusd": 0.39695, "te": 0.28093 }
                ],
                "B2RUIRRG_TB": [
                    { "posto": "Fora ponta", "tusd": 0.29957, "te": 0.26735 },
                    { "posto": "Intermediário", "tusd": 0.61733, "te": 0.26735 },
                    { "posto": "Ponta", "tusd": 0.93509, "te": 0.43036 }
                ],
                "B3": [
                    { "posto": "Nao aplica", "tusd": 0.39695, "te": 0.28093 }
                ],
                "B3_TB": [
                    { "posto": "Fora ponta", "tusd": 0.30982, "te": 0.26735 },
                    { "posto": "Intermediário", "tusd": 0.64808, "te": 0.26735 },
                    { "posto": "Ponta", "tusd": 0.98634, "te": 0.43036 }
                ],
                "B4A": [
                    { "posto": "Nao aplica", "tusd": 0.21832, "te": 0.15451 }
                ],
                "B4B": [
                    { "posto": "Nao aplica", "tusd": 0.23817, "te": 0.16856 }
                ]
            }
        },
        {
            "resolucao": "REH Nº 3.541, DE 21 DE OUTUBRO DE 2025",
            "inicio": "2025-10-23",
            "fim": "2026-10-22",
            "tarifas": {
                "B1C": [
                    { "posto": "Nao aplica", "tusd": 0.45667, "te": 0.33003 }
                ],
                "B1C_TB": [
                    { "posto": "Fora ponta", "tusd": 0.33398, "te": 0.31504 },
                    { "posto": "Intermediário", "tusd": 0.59980, "te": 0.31504 },
                    { "posto": "Ponta", "tusd": 0.86563, "te": 0.49484 }
                ],
                "B1CDE": [
                    { "posto": "Nao aplica", "tusd": 0.31629, "te": 0.30475, "faixa": "ate" },
                    { "posto": "Nao aplica", "tusd": 0.45667, "te": 0.33003, "faixa": "acima" }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    { "posto": "Nao aplica", "tusd": 0.30080, "te": 0.29060 }
                ],
                "B1BRN": [
                    { "posto": "Nao aplica", "tusd": 0.30080, "te": 0.29060 }
                ],
                "B2RURAL": [
                    { "posto": "Nao aplica", "tusd": 0.45667, "te": 0.33003 }
                ],
                "B2RURAL_TB": [
                    { "posto": "Fora ponta", "tusd": 0.38700, "te": 0.31504 },
                    { "posto": "Intermediário", "tusd": 0.69493, "te": 0.31504 },
                    { "posto": "Ponta", "tusd": 1.00287, "te": 0.49484 }
                ],
                "B2RUIRRG": [
                    { "posto": "Nao aplica", "tusd": 0.45667, "te": 0.33003 }
                ],
                "B2RUIRRG_TB": [
                    { "posto": "Fora ponta", "tusd": 0.38700, "te": 0.31504 },
                    { "posto": "Intermediário", "tusd": 0.69493, "te": 0.31504 },
                    { "posto": "Ponta", "tusd": 1.00287, "te": 0.49484 }
                ],
                "B3": [
                    { "posto": "Nao aplica", "tusd": 0.45667, "te": 0.33003 }
                ],
                "B3_TB": [
                    { "posto": "Fora ponta", "tusd": 0.36976, "te": 0.31504 },
                    { "posto": "Intermediário", "tusd": 0.70716, "te": 0.31504 },
                    { "posto": "Ponta", "tusd": 1.04455, "te": 0.49484 }
                ],
                "B4A": [
                    { "posto": "Nao aplica", "tusd": 0.25117, "te": 0.18152 }
                ],
                "B4B": [
                    { "posto": "Nao aplica", "tusd": 0.27400, "te": 0.19802 }
                ]
            }
        }
    ]
};
