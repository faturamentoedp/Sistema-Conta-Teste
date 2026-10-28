/** Chave do localStorage onde fica a escolha de tema ('claro' | 'escuro'). */
export const CHAVE_TEMA = 'tema-plataforma';

/**
 * Roda no <head>, antes da primeira pintura, para a página já abrir no tema
 * escolhido (sem piscar o claro). O padrão, sem escolha salva, é o claro.
 */
export const SCRIPT_TEMA_INICIAL =
  `try{if(localStorage.getItem('${CHAVE_TEMA}')==='escuro')document.documentElement.classList.add('dark')}catch(e){}`;
