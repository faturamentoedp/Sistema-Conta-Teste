import { buscarFerramenta } from '../ferramentas';
import { IconeDaFerramenta } from './Icones';

/**
 * Moldura padrão de toda página de ferramenta: título e descrição vêm do
 * registro (src/plataforma/ferramentas.ts), então o nome da página é sempre
 * o mesmo do menu. O conteúdo da ferramenta entra como filho.
 */
export default function PaginaFerramenta({ id, children }: { id: string; children: React.ReactNode }) {
  const ferramenta = buscarFerramenta(id);

  return (
    <section>
      <div className="mb-6 flex items-start gap-3">
        <span className="mt-0.5 text-[#2f364b]">
          <IconeDaFerramenta nome={ferramenta.icone} className="w-6 h-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-black">{ferramenta.nome}</h1>
          <p className="text-sm text-slate-600 mt-0.5 max-w-3xl">{ferramenta.descricao}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
