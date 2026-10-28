'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconeMenu } from './Icones';
import MenuLateral from './MenuLateral';

/**
 * Casca comum a todas as páginas: barra superior, menu lateral e área de
 * conteúdo. Em telas pequenas o menu vira uma gaveta; em telas largas o botão
 * da barra recolhe/mostra o menu para dar mais espaço às ferramentas.
 *
 * A faixa de ambiente chega pronta em `faixa` (é um componente de servidor).
 */
export default function Casca({ faixa, children }: { faixa: React.ReactNode; children: React.ReactNode }) {
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-[#2f364b] px-4 sm:px-6 py-4 flex items-center shadow-md">
        <button
          type="button"
          onClick={() => setGavetaAberta(true)}
          aria-label="Abrir menu"
          className="lg:hidden mr-3 text-white cursor-pointer"
        >
          <IconeMenu />
        </button>
        <button
          type="button"
          onClick={() => setMenuRecolhido((v) => !v)}
          aria-label={menuRecolhido ? 'Mostrar menu' : 'Recolher menu'}
          aria-expanded={!menuRecolhido}
          className="hidden lg:inline-flex mr-4 text-white cursor-pointer"
        >
          <IconeMenu />
        </button>

        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Logo EDP" width={80} height={30} className="object-contain" priority />
          <span className="text-slate-500 mx-3 text-2xl font-light">|</span>
          <span className="text-lg font-bold text-white">Plataforma de Faturamento</span>
        </Link>
      </header>

      {faixa}

      <div className="flex flex-1">
        {/* Menu fixo (telas largas) */}
        {!menuRecolhido && (
          <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 bg-white p-4">
            <MenuLateral />
          </aside>
        )}

        {/* Gaveta (telas pequenas) */}
        {gavetaAberta && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="w-64 max-w-[80%] bg-white p-4 shadow-xl">
              <MenuLateral aoNavegar={() => setGavetaAberta(false)} />
            </div>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setGavetaAberta(false)}
              className="flex-1 bg-black/40 cursor-pointer"
            />
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-12">{children}</main>
      </div>
    </div>
  );
}
