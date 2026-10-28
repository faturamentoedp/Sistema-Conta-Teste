import type { Metadata } from 'next';
import PaginaFerramenta from '@/plataforma/componentes/PaginaFerramenta';
import ContaTeste from '@/modulos/conta-teste/ContaTeste';

export const metadata: Metadata = { title: 'Conta Teste' };

export default function Page() {
  return (
    <PaginaFerramenta id="conta-teste">
      <ContaTeste />
    </PaginaFerramenta>
  );
}
