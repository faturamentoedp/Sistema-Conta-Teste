import type { Metadata } from 'next';
import Link from 'next/link';
import PaginaFerramenta from '@/plataforma/componentes/PaginaFerramenta';
import { IconeGrafico } from '@/plataforma/componentes/Icones';
import { TEMAS } from '@/modulos/paineis/temas';

export const metadata: Metadata = { title: 'Painéis de Análise' };

export default function Page() {
  return (
    <PaginaFerramenta id="paineis">
      <h2 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Escolha o tema</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMAS.map((t) => (
          <Link key={t.id} href={t.rota}
            className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#2f364b] hover:shadow-md">
            <span className="text-[#2f364b]"><IconeGrafico className="w-7 h-7" /></span>
            <h3 className="mt-3 text-base font-bold text-black">{t.nome}</h3>
            <p className="mt-1 text-sm text-slate-600">{t.descricao}</p>
            <p className="mt-2 text-[11px] text-slate-500">Fonte: {t.fonte}</p>
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-[#2f364b]">Abrir painel →</span>
          </Link>
        ))}
        <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 flex items-center">
          Os próximos temas aparecerão aqui.
        </div>
      </div>
    </PaginaFerramenta>
  );
}
