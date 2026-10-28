import Link from 'next/link';
import { FERRAMENTAS } from '@/plataforma/ferramentas';
import { IconeDaFerramenta } from '@/plataforma/componentes/Icones';

export default function Inicio() {
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Plataforma de Faturamento</h1>
        <p className="text-sm text-slate-600 mt-0.5">Escolha uma ferramenta para começar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FERRAMENTAS.map((f) => {
          const conteudo = (
            <>
              <span className="text-[#2f364b]">
                <IconeDaFerramenta nome={f.icone} className="w-7 h-7" />
              </span>
              <h2 className="mt-3 text-base font-bold text-black">{f.nome}</h2>
              <p className="mt-1 text-sm text-slate-600">{f.descricao}</p>
              <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-[#2f364b]">
                {f.status === 'ativa' ? 'Abrir →' : 'Em breve'}
              </span>
            </>
          );

          return f.status === 'ativa' ? (
            <Link
              key={f.id}
              href={f.rota}
              className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#2f364b] hover:shadow-md"
            >
              {conteudo}
            </Link>
          ) : (
            <div key={f.id} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 opacity-70">
              {conteudo}
            </div>
          );
        })}

        <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 flex items-center">
          As próximas ferramentas aparecerão aqui.
        </div>
      </div>
    </section>
  );
}
