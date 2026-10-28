'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FERRAMENTAS } from '../ferramentas';
import { IconeDaFerramenta, IconeInicio } from './Icones';

const classeItem = (ativo: boolean) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    ativo ? 'bg-[#2f364b] text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

/** Menu principal: "Início" + uma entrada por ferramenta registrada. */
export default function MenuLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      <Link href="/" onClick={aoNavegar} aria-current={caminho === '/' ? 'page' : undefined} className={classeItem(caminho === '/')}>
        <IconeInicio />
        Início
      </Link>

      <p className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ferramentas</p>

      {FERRAMENTAS.map((f) => {
        const ativo = caminho === f.rota || caminho.startsWith(f.rota + '/');
        if (f.status === 'em-breve') {
          return (
            <span key={f.id} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">
              <IconeDaFerramenta nome={f.icone} />
              {f.nome}
              <span className="ml-auto text-[10px] uppercase tracking-wide">em breve</span>
            </span>
          );
        }
        return (
          <Link key={f.id} href={f.rota} onClick={aoNavegar} aria-current={ativo ? 'page' : undefined} className={classeItem(ativo)}>
            <IconeDaFerramenta nome={f.icone} />
            {f.nome}
          </Link>
        );
      })}
    </nav>
  );
}
