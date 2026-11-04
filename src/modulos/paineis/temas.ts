/**
 * Temas dos Painéis de Análise. Cada tema é um painel com sua própria pasta em
 * src/modulos/paineis/<id>/ e sua página em src/app/paineis/<id>/page.tsx.
 * Para criar um tema novo, acrescente aqui e siga o modelo de rejeicao-nfe.
 */
export interface TemaPainel {
  id: string;
  nome: string;
  descricao: string;
  rota: string;
  fonte: string;
}

export const TEMAS: TemaPainel[] = [
  {
    id: 'rejeicao-nfe',
    nome: 'Rejeição de NF-e',
    descricao: 'Notas autorizadas e rejeitadas, taxa de rejeição, motivos e as características do erro 999 (erro não catalogado).',
    rota: '/paineis/rejeicao-nfe',
    fonte: 'Tabela de notas fiscais (Databricks rejeição_nfe, CSV ou Excel)',
  },
];
