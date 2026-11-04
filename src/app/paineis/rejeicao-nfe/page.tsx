import type { Metadata } from 'next';
import Link from 'next/link';
import { IconeGrafico } from '@/plataforma/componentes/Icones';
import PainelRejeicaoNfe from '@/modulos/paineis/rejeicao-nfe/PainelRejeicaoNfe';

export const metadata: Metadata = { title: 'Rejeição de NF-e' };

export default function Page() {
  return (
    <section>
      <nav aria-label="Trilha" className="text-xs text-slate-500 mb-2">
        <Link href="/paineis" className="hover:underline">Painéis de Análise</Link>
        <span className="mx-1.5">›</span>
        <span className="text-slate-700">Rejeição de NF-e</span>
      </nav>
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 text-[#2f364b]"><IconeGrafico className="w-6 h-6" /></span>
        <div>
          <h1 className="text-xl font-bold text-black">Rejeição de NF-e</h1>
          <p className="text-sm text-slate-600 mt-0.5 max-w-3xl">
            Notas autorizadas e rejeitadas, motivos de rejeição e as características do erro 999. Filtros e cliques nos gráficos valem para o painel inteiro.
          </p>
        </div>
      </div>
      <PainelRejeicaoNfe />
    </section>
  );
}
