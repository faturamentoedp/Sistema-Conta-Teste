'use client';

import { useSyncExternalStore } from 'react';
import { CHAVE_TEMA } from '../tema';
import { IconeLua, IconeSol } from './Icones';

// O tema vive na classe "dark" do <html> (é o que o CSS lê). O botão apenas
// observa essa classe, então não há estado duplicado nem efeito para sincronizar.
function assinar(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observador.disconnect();
}

const lerEscuro = () => document.documentElement.classList.contains('dark');

/** Alterna entre tema claro (padrão) e escuro, lembrando a escolha neste navegador. */
export default function BotaoTema() {
  const escuro = useSyncExternalStore(assinar, lerEscuro, () => false);

  const alternar = () => {
    const novo = !escuro;
    document.documentElement.classList.toggle('dark', novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo ? 'escuro' : 'claro');
    } catch {
      // Sem armazenamento (navegação privada): o tema vale só até recarregar.
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className="ml-auto inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
    >
      {escuro ? <IconeSol /> : <IconeLua />}
      <span className="hidden sm:inline">{escuro ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}
