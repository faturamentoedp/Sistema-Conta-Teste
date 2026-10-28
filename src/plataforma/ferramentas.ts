/**
 * Registro das ferramentas da plataforma.
 *
 * É a ÚNICA fonte da lista: o menu lateral, os cartões da página inicial e o
 * título de cada página saem daqui. Para publicar uma ferramenta nova, veja
 * docs/plataforma/como-adicionar-ferramenta.md.
 */

export type IconeFerramenta = 'calculadora';

export type StatusFerramenta = 'ativa' | 'em-breve';

export interface Ferramenta {
  /** Identificador estável; também é o nome da pasta em src/modulos/. */
  id: string;
  nome: string;
  descricao: string;
  /** Rota da página, a mesma pasta em src/app/. */
  rota: string;
  icone: IconeFerramenta;
  /** 'em-breve' aparece no menu e na página inicial, mas sem link. */
  status: StatusFerramenta;
}

export const FERRAMENTAS: Ferramenta[] = [
  {
    id: 'conta-teste',
    nome: 'Conta Teste',
    descricao: 'Simula a fatura de energia do Grupo B (EDP ES e SP): tarifas, tributos, bandeiras, CIP, Baixa Renda e Geração Distribuída.',
    rota: '/conta-teste',
    icone: 'calculadora',
    status: 'ativa',
  },
];

export function buscarFerramenta(id: string): Ferramenta {
  const ferramenta = FERRAMENTAS.find((f) => f.id === id);
  if (!ferramenta) throw new Error(`Ferramenta "${id}" não está registrada em src/plataforma/ferramentas.ts`);
  return ferramenta;
}
