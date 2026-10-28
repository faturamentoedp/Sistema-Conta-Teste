import type { IconeFerramenta } from '../ferramentas';

type PropsIcone = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export function IconeInicio({ className = 'w-5 h-5' }: PropsIcone) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
    </svg>
  );
}

export function IconeMenu({ className = 'w-5 h-5' }: PropsIcone) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconeCalculadora({ className = 'w-5 h-5' }: PropsIcone) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}

const POR_NOME: Record<IconeFerramenta, (p: PropsIcone) => React.ReactElement> = {
  calculadora: IconeCalculadora,
};

export function IconeDaFerramenta({ nome, className }: { nome: IconeFerramenta } & PropsIcone) {
  const Icone = POR_NOME[nome];
  return <Icone className={className} />;
}
