/** Título de seção padrão dentro das ferramentas (ex.: "Parâmetros de Entrada"). */
export default function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-black uppercase tracking-wide">{children}</h2>
      <hr className="mt-2 border-slate-200" />
    </div>
  );
}
