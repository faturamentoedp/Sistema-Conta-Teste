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
            "resolucao": "REH Nº 1.072, DE 5 DE OUTUBRO DE 2010",
            "inicio": "2010-10-23",
            "fim": "2011-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.19611,
                        "te": 0.12926
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12207,
                        "te": 0.08045
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11224,
                        "te": 0.07398
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.19473,
                        "te": 0.12835
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10031,
                        "te": 0.06612
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11012,
                        "te": 0.07258
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.365, DE 2 DE OUTUBRO DE 2012",
            "inicio": "2011-10-23",
            "fim": "2012-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.1785,
                        "te": 0.13372
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11871,
                        "te": 0.12707
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.23829,
                        "te": 0.12707
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.35788,
                        "te": 0.20688
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11689,
                        "te": 0.08757
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.08244,
                        "te": 0.08321
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17014,
                        "te": 0.08321
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.25785,
                        "te": 0.13547
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.1071,
                        "te": 0.08023
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.07553,
                        "te": 0.07624
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.15589,
                        "te": 0.07624
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.23625,
                        "te": 0.12413
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.1785,
                        "te": 0.13372
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.13426,
                        "te": 0.12707
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.28493,
                        "te": 0.12707
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.4356,
                        "te": 0.20688
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09638,
                        "te": 0.0722
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10531,
                        "te": 0.07889
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.368, DE 16 DE OUTUBRO DE 2012",
            "inicio": "2012-10-23",
            "fim": "2013-01-23",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17835,
                        "te": 0.17059
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.12225,
                        "te": 0.16047
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.24663,
                        "te": 0.16047
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.37101,
                        "te": 0.2634
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11899,
                        "te": 0.11316
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.08495,
                        "te": 0.10508
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17617,
                        "te": 0.10508
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.26739,
                        "te": 0.17249
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11067,
                        "te": 0.10143
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.07783,
                        "te": 0.09628
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.16141,
                        "te": 0.09628
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.24499,
                        "te": 0.15804
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17883,
                        "te": 0.1709
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.13842,
                        "te": 0.16047
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.29514,
                        "te": 0.16047
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.45185,
                        "te": 0.2634
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09812,
                        "te": 0.0933
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.1072,
                        "te": 0.10194
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.415, DE 24 DE JANEIRO DE 2013",
            "inicio": "2013-01-24",
            "fim": "2013-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13529,
                        "te": 0.15057
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09046,
                        "te": 0.14144
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.1922,
                        "te": 0.14144
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.29395,
                        "te": 0.2326
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.0907,
                        "te": 0.09847
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.0621,
                        "te": 0.09194
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.13485,
                        "te": 0.09194
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.2076,
                        "te": 0.15119
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.0848,
                        "te": 0.08942
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.05733,
                        "te": 0.08487
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.12448,
                        "te": 0.08487
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.19163,
                        "te": 0.13956
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13573,
                        "te": 0.15089
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.10368,
                        "te": 0.14144
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.23188,
                        "te": 0.14144
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.36008,
                        "te": 0.2326
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.07456,
                        "te": 0.08221
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.08149,
                        "te": 0.08985
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.641, DE 22 DE OUTUBRO DE 2013",
            "inicio": "2013-10-23",
            "fim": "2014-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13894,
                        "te": 0.166
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09212,
                        "te": 0.15587
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.19814,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.30415,
                        "te": 0.25805
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09636,
                        "te": 0.11512
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.06756,
                        "te": 0.1081
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.14844,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.22931,
                        "te": 0.17896
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.08708,
                        "te": 0.09863
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.05846,
                        "te": 0.09352
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.12842,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.19839,
                        "te": 0.15483
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13965,
                        "te": 0.1662
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.10591,
                        "te": 0.15587
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.23948,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.37306,
                        "te": 0.25805
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.07827,
                        "te": 0.09255
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.08539,
                        "te": 0.10096
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.809, DE 21 DE OUTUBRO DE 2014",
            "inicio": "2014-10-23",
            "fim": "2015-03-01",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.15976,
                        "te": 0.20802
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.10351,
                        "te": 0.19527
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.216,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.32849,
                        "te": 0.32826
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11183,
                        "te": 0.14561
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.0764,
                        "te": 0.13669
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.16301,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.24963,
                        "te": 0.22978
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09585,
                        "te": 0.12381
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.06548,
                        "te": 0.11716
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.13972,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.21397,
                        "te": 0.19696
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.16056,
                        "te": 0.2082
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11873,
                        "te": 0.19527
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.2612,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.40367,
                        "te": 0.32826
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.08973,
                        "te": 0.11577
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09789,
                        "te": 0.1263
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.858, DE 27 DE FEVEREIRO DE 2015",
            "inicio": "2015-03-02",
            "fim": "2015-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21003,
                        "te": 0.22338
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.15288,
                        "te": 0.21036
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.26719,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.3815,
                        "te": 0.3465
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.14702,
                        "te": 0.15636
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11101,
                        "te": 0.14726
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.19903,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.28705,
                        "te": 0.24255
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12602,
                        "te": 0.13303
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09516,
                        "te": 0.12622
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.1706,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.24604,
                        "te": 0.2079
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21084,
                        "te": 0.22356
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.16838,
                        "te": 0.21036
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.31298,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.45757,
                        "te": 0.3465
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11738,
                        "te": 0.12422
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12805,
                        "te": 0.13551
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 1.973, DE 20 DE OUTUBRO DE 2015",
            "inicio": "2015-10-23",
            "fim": "2016-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23001,
                        "te": 0.27056
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.15273,
                        "te": 0.25814
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.27414,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.39555,
                        "te": 0.40717
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.16101,
                        "te": 0.18939
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11242,
                        "te": 0.1807
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.20842,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.30443,
                        "te": 0.28502
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13801,
                        "te": 0.16234
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09636,
                        "te": 0.15488
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17865,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.26094,
                        "te": 0.2443
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23001,
                        "te": 0.27056
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.16622,
                        "te": 0.25814
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.31461,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.46301,
                        "te": 0.40717
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12651,
                        "te": 0.14881
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13801,
                        "te": 0.16234
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.158, DE 18 DE OUTUBRO DE 2016",
            "inicio": "2016-10-23",
            "fim": "2017-03-31",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17265,
                        "te": 0.23034
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09985,
                        "te": 0.22128
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.2274,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.35495,
                        "te": 0.33001
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12086,
                        "te": 0.16124
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.07568,
                        "te": 0.1549
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17654,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.2774,
                        "te": 0.23101
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10359,
                        "te": 0.1382
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.06487,
                        "te": 0.13277
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.15132,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.23777,
                        "te": 0.19801
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17265,
                        "te": 0.23034
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11402,
                        "te": 0.22128
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.26991,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.42581,
                        "te": 0.33001
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09496,
                        "te": 0.12669
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10359,
                        "te": 0.1382
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.214, DE 28 DE MARÇO DE 2017",
            "inicio": "2017-04-01",
            "fim": "2017-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17265,
                        "te": 0.22485
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09985,
                        "te": 0.21579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.2274,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.35495,
                        "te": 0.32452
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12086,
                        "te": 0.15739
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.07568,
                        "te": 0.15105
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17654,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.2774,
                        "te": 0.22716
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10359,
                        "te": 0.13491
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.06487,
                        "te": 0.12947
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.15132,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.23777,
                        "te": 0.19471
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17265,
                        "te": 0.22485
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11402,
                        "te": 0.21579
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.26991,
                        "te": 0.0
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.42581,
                        "te": 0.32452
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.09496,
                        "te": 0.12367
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.10359,
                        "te": 0.13491
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.315, DE 17 DE OUTUBRO DE 2017",
            "inicio": "2017-10-23",
            "fim": "2018-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.20122,
                        "te": 0.28608
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.11081,
                        "te": 0.27368
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.26374,
                        "te": 0.0
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.0,
                        "te": 0.27368
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.41668,
                        "te": 0.42246
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.14085,
                        "te": 0.20026
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.0845,
                        "te": 0.19158
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.20544,
                        "te": 0.0
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.0,
                        "te": 0.19158
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.32637,
                        "te": 0.29572
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12073,
                        "te": 0.17165
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.07243,
                        "te": 0.16421
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.17609,
                        "te": 0.0
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.0,
                        "te": 0.16421
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.27975,
                        "te": 0.25348
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.20122,
                        "te": 0.28608
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.1278,
                        "te": 0.27368
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.31472,
                        "te": 0.0
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.0,
                        "te": 0.27368
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.50165,
                        "te": 0.42246
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.11067,
                        "te": 0.15734
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.12073,
                        "te": 0.17165
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.469, DE 16 DE OUTUBRO DE 2018",
            "inicio": "2018-10-23",
            "fim": "2019-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.24174,
                        "te": 0.31979
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.14402,
                        "te": 0.30465
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.3016,
                        "te": 0.30465
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.45919,
                        "te": 0.48643
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.16922,
                        "te": 0.22386
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.10796,
                        "te": 0.21325
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.23257,
                        "te": 0.21325
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.35718,
                        "te": 0.3405
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.14504,
                        "te": 0.19188
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.09254,
                        "te": 0.18279
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.19935,
                        "te": 0.18279
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.30615,
                        "te": 0.29186
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.24174,
                        "te": 0.31979
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.16153,
                        "te": 0.30465
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.35413,
                        "te": 0.30465
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.54673,
                        "te": 0.48643
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.13296,
                        "te": 0.17589
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.14504,
                        "te": 0.19188
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.629, DE 22 DE OUTUBRO DE 2019",
            "inicio": "2019-10-23",
            "fim": "2020-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.26449,
                        "te": 0.26124
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.18454,
                        "te": 0.24703
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.33818,
                        "te": 0.24703
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.49183,
                        "te": 0.41756
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.20102,
                        "te": 0.19854
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.15335,
                        "te": 0.18774
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.29634,
                        "te": 0.18774
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.43933,
                        "te": 0.31734
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17986,
                        "te": 0.17764
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.13721,
                        "te": 0.16798
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.26515,
                        "te": 0.16798
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.39308,
                        "te": 0.28394
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.26449,
                        "te": 0.26124
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.20962,
                        "te": 0.24703
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.41344,
                        "te": 0.24703
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.61726,
                        "te": 0.41756
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.14547,
                        "te": 0.14368
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.1587,
                        "te": 0.15674
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.790, DE 20 DE OUTUBRO DE 2020",
            "inicio": "2020-10-23",
            "fim": "2021-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.30118,
                        "te": 0.24493
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.20431,
                        "te": 0.23278
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.39045,
                        "te": 0.23278
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.57659,
                        "te": 0.37861
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.24697,
                        "te": 0.20084
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.18467,
                        "te": 0.19088
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.37157,
                        "te": 0.19088
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.55847,
                        "te": 0.31046
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.2289,
                        "te": 0.18615
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.17116,
                        "te": 0.17691
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.34438,
                        "te": 0.17691
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.51761,
                        "te": 0.28774
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.30118,
                        "te": 0.24493
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.2347,
                        "te": 0.23278
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.48162,
                        "te": 0.23278
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.72855,
                        "te": 0.37861
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.16565,
                        "te": 0.13471
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.18071,
                        "te": 0.14696
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 2.964, DE 21 DE OUTUBRO DE 2021",
            "inicio": "2021-10-23",
            "fim": "2022-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.32114,
                        "te": 0.31478
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.21269,
                        "te": 0.29943
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.42107,
                        "te": 0.29943
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.62945,
                        "te": 0.48372
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.2826,
                        "te": 0.27701
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.20775,
                        "te": 0.26349
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.43229,
                        "te": 0.26349
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.65683,
                        "te": 0.42567
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.26975,
                        "te": 0.26442
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.19831,
                        "te": 0.25152
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.41264,
                        "te": 0.25152
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.62698,
                        "te": 0.40632
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.32114,
                        "te": 0.31478
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.24671,
                        "te": 0.29943
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.52314,
                        "te": 0.29943
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.79956,
                        "te": 0.48372
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.17662,
                        "te": 0.17313
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.19268,
                        "te": 0.18887
                    }
                ]
            },
            "tarifas_scee": {}
        },
        {
            "resolucao": "REH Nº 3.129, DE 18 DE OUTUBRO DE 2022",
            "inicio": "2022-10-23",
            "fim": "2023-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.37743,
                        "te": 0.27614
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.26571,
                        "te": 0.26395
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.48038,
                        "te": 0.26395
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.69504,
                        "te": 0.41018
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.35478,
                        "te": 0.25957
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27242,
                        "te": 0.24812
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.5195,
                        "te": 0.24812
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.76659,
                        "te": 0.38557
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34723,
                        "te": 0.25405
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.26662,
                        "te": 0.24284
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.50845,
                        "te": 0.24284
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.75028,
                        "te": 0.37736
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.37743,
                        "te": 0.27614
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30076,
                        "te": 0.26395
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.58552,
                        "te": 0.26395
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.87028,
                        "te": 0.41018
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.20758,
                        "te": 0.15188
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.22646,
                        "te": 0.16568
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.37743,
                        "te": 0.01287
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.26571,
                        "te": 0.01484
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.48038,
                        "te": 0.01484
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.69504,
                        "te": -0.0088
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.35478,
                        "te": 0.01209
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27242,
                        "te": 0.01395
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.5195,
                        "te": 0.01395
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.76659,
                        "te": -0.00827
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.34723,
                        "te": 0.01184
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.26662,
                        "te": 0.01365
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.50845,
                        "te": 0.01365
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.75028,
                        "te": -0.00809
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.37743,
                        "te": 0.01287
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30076,
                        "te": 0.01484
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.58552,
                        "te": 0.01484
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.87028,
                        "te": -0.0088
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.20758,
                        "te": 0.00708
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.22646,
                        "te": 0.00772
                    }
                ]
            }
        },
        {
            "resolucao": "REH Nº 3.278, DE 17 DE OUTUBRO DE 2023",
            "inicio": "2023-10-23",
            "fim": "2024-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.29967
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27486,
                        "te": 0.28631
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.54227,
                        "te": 0.28631
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.80968,
                        "te": 0.44656
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.29967
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30057,
                        "te": 0.28631
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61941,
                        "te": 0.28631
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93824,
                        "te": 0.44656
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.29967
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30057,
                        "te": 0.28631
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61941,
                        "te": 0.28631
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93824,
                        "te": 0.44656
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.29967
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.31086,
                        "te": 0.28631
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.65026,
                        "te": 0.28631
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.98967,
                        "te": 0.44656
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21905,
                        "te": 0.16482
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23897,
                        "te": 0.1798
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.04773
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27486,
                        "te": 0.04773
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.54227,
                        "te": 0.04773
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.80968,
                        "te": 0.04773
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.04773
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30057,
                        "te": 0.04773
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61941,
                        "te": 0.04773
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93824,
                        "te": 0.04773
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.04773
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30057,
                        "te": 0.04773
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61941,
                        "te": 0.04773
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93824,
                        "te": 0.04773
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39828,
                        "te": 0.04773
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.31086,
                        "te": 0.04773
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.65026,
                        "te": 0.04773
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.98967,
                        "te": 0.04773
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21905,
                        "te": 0.02625
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23897,
                        "te": 0.02864
                    }
                ]
            }
        },
        {
            "resolucao": "REH Nº 3.408, DE 15 DE OUTUBRO DE 2024",
            "inicio": "2024-10-23",
            "fim": "2025-10-22",
            "tarifas": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.28093
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27395,
                        "te": 0.26735
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.54045,
                        "te": 0.26735
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.80696,
                        "te": 0.43036
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.29441,
                        "te": 0.27303
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.28093
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.29957,
                        "te": 0.26735
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61733,
                        "te": 0.26735
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93509,
                        "te": 0.43036
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.28093
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.29957,
                        "te": 0.26735
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61733,
                        "te": 0.26735
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93509,
                        "te": 0.43036
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.28093
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30982,
                        "te": 0.26735
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.64808,
                        "te": 0.26735
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.98634,
                        "te": 0.43036
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21832,
                        "te": 0.15451
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23817,
                        "te": 0.16856
                    }
                ]
            },
            "tarifas_scee": {
                "B1C": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.02933
                    }
                ],
                "B1C_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.27395,
                        "te": 0.02933
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.54045,
                        "te": 0.02933
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.80696,
                        "te": 0.02933
                    }
                ],
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.29441,
                        "te": 0.02142
                    }
                ],
                "B2RURAL": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.02933
                    }
                ],
                "B2RURAL_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.29957,
                        "te": 0.02933
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61733,
                        "te": 0.02933
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93509,
                        "te": 0.02933
                    }
                ],
                "B2RUIRRG": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.02933
                    }
                ],
                "B2RUIRRG_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.29957,
                        "te": 0.02933
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.61733,
                        "te": 0.02933
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.93509,
                        "te": 0.02933
                    }
                ],
                "B3": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.39695,
                        "te": 0.02933
                    }
                ],
                "B3_TB": [
                    {
                        "posto": "Fora ponta",
                        "tusd": 0.30982,
                        "te": 0.02933
                    },
                    {
                        "posto": "Intermediário",
                        "tusd": 0.64808,
                        "te": 0.02933
                    },
                    {
                        "posto": "Ponta",
                        "tusd": 0.98634,
                        "te": 0.02933
                    }
                ],
                "B4A": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.21832,
                        "te": 0.01613
                    }
                ],
                "B4B": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.23817,
                        "te": 0.0176
                    }
                ]
            }
        },
        {
            "resolucao": "REH Nº 3.541, DE 14 DE OUTUBRO DE 2025",
            "inicio": "2025-10-23",
            "fim": "2025-12-31",
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
                "B1BRN/B1BPC/B1BRQ/B1BRI": [
                    {
                        "posto": "Nao aplica",
                        "tusd": 0.3008,
                        "te": 0.30475
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
        },
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
    ]
};
