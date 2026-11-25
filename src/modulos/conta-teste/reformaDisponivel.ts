/**
 * A simulação da Reforma Tributária é preliminar: aparece na máquina local e no
 * ambiente de teste, nunca na produção. Quando a área validar as regras, troque
 * para `true`.
 */
export const REFORMA_DISPONIVEL = process.env.NEXT_PUBLIC_AMBIENTE !== 'production';
