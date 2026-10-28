// Ambiente do build ('production' | 'preview' | 'local') e versão (commit),
// gravados em tempo de build por next.config.ts.
const AMBIENTE = process.env.NEXT_PUBLIC_AMBIENTE ?? 'local';
const VERSAO = process.env.NEXT_PUBLIC_VERSAO ?? '';

/**
 * Faixa de ambiente: a produção (validada) não mostra nada; qualquer outro
 * ambiente avisa, pra ninguém confundir o link de teste com o validado.
 */
export default function FaixaAmbiente() {
  if (AMBIENTE === 'production') return null;

  const teste = AMBIENTE === 'preview';
  return (
    <div
      role="status"
      className={`px-6 py-2 text-xs font-semibold flex flex-wrap items-center gap-x-3 gap-y-1 ${
        teste
          ? 'bg-amber-100 text-amber-900 border-b border-amber-300'
          : 'bg-slate-100 text-slate-700 border-b border-slate-300'
      }`}
    >
      <span className="uppercase tracking-wide">{teste ? 'Ambiente de teste' : 'Ambiente local'}</span>
      <span className="font-normal">
        {teste
          ? 'Pode conter regras ainda não validadas pela área. Para conferir uma conta oficial, use o link de produção.'
          : 'Execução na máquina do desenvolvedor.'}
      </span>
      {VERSAO && <span className="font-mono font-normal opacity-70">versão {VERSAO}</span>}
    </div>
  );
}
