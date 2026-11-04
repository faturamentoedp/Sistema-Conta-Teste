'use client';

/**
 * Visuais dos painéis (estilo Power BI), em SVG/HTML próprio.
 *
 * Regras seguidas: cor segue a entidade (a mesma série tem a mesma cor em todo
 * painel, via variáveis --viz-* do globals.css, com versão para o tema escuro);
 * marcas finas com ponta arredondada e 2px de folga entre segmentos; grade
 * discreta; tooltip em toda marca; clicar numa barra ou coluna FILTRA o painel
 * inteiro (filtro cruzado) - clicar de novo desfaz.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Assinatura dos filtros atuais. Quando muda, as barras e colunas são
 * remontadas e a animação de "surgir" toca de novo (o painel se remodela).
 */
export const ChaveAnimacao = createContext('');

/** Número que conta do valor anterior até o novo (~0,7 s). Sem animação para quem pediu menos movimento. */
export function NumeroAnimado({ valor, formatar }: { valor: number; formatar: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(0);
  // O que está na tela agora: uma contagem nova parte daqui, mesmo que a anterior não tenha terminado.
  const naTela = useRef(0);
  useEffect(() => {
    const de = naTela.current;
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let id = 0;
    if (semMovimento || de === valor) {
      naTela.current = valor;
      id = requestAnimationFrame(() => setMostrado(valor));
      return () => cancelAnimationFrame(id);
    }
    let inicio = -1;
    const passo = (t: number) => {
      // O horário do quadro pode vir antes do performance.now() de quem agendou: começa a contar no 1º quadro.
      if (inicio < 0) inicio = t;
      const p = Math.min(1, Math.max(0, (t - inicio) / 700));
      const atual = p >= 1 ? valor : de + (valor - de) * (1 - Math.pow(1 - p, 3));
      naTela.current = atual;
      setMostrado(atual);
      if (p < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [valor]);
  return <>{formatar(mostrado)}</>;
}

/** Largura real do elemento, para o SVG desenhar em pixels de verdade (texto não estica). */
function useLargura(padrao: number): [(el: HTMLDivElement | null) => void, number] {
  const [largura, setLargura] = useState(padrao);
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(320, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura];
}

export function CartaoVisual({ titulo, subtitulo, acoes, children, className = '' }: {
  titulo: string; subtitulo?: string; acoes?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`viz-surgir bg-white border border-slate-200 rounded-md shadow-sm p-4 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-black">{titulo}</h3>
          {subtitulo && <p className="text-[11px] text-slate-500 mt-0.5">{subtitulo}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

export function Kpi({ rotulo, valor, formatar, detalhe, cor }: {
  rotulo: string; valor: number | string; formatar?: (n: number) => string; detalhe?: string; cor?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-4 py-3 min-w-0" style={cor ? { borderLeft: `4px solid ${cor}` } : undefined}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{rotulo}</span>
      <span className="block text-2xl font-bold text-black mt-1">
        {typeof valor === 'number' ? <NumeroAnimado valor={valor} formatar={formatar ?? ((n) => Math.round(n).toLocaleString('pt-BR'))} /> : valor}
      </span>
      {detalhe && <span className="block text-[11px] text-slate-600 mt-0.5">{detalhe}</span>}
    </div>
  );
}

export interface ItemBarra {
  chave: string;
  rotulo: string;
  valor: number;
}

/**
 * Ranking em barras horizontais. Cada linha inteira é o alvo do clique/foco
 * (maior que a barra). Com algo selecionado, o resto fica esmaecido.
 */
export function BarrasHorizontais({ itens, cor, selecionados, aoClicar, total, vazio = 'Nada para mostrar com os filtros atuais.' }: {
  itens: ItemBarra[]; cor: string; selecionados: string[]; aoClicar?: (chave: string) => void; total: number; vazio?: string;
}) {
  const chave = useContext(ChaveAnimacao);
  if (itens.length === 0) return <p className="text-xs text-slate-500 py-6 text-center">{vazio}</p>;
  const max = Math.max(...itens.map((i) => i.valor), 1);
  const algumSelecionado = selecionados.length > 0;
  return (
    <ul className="space-y-1">
      {itens.map((i, posicao) => {
        const clicavel = !!aoClicar && i.chave !== '__outros__';
        const ativo = selecionados.includes(i.chave);
        const pct = total ? (100 * i.valor / total) : 0;
        const conteudo = (
          <>
            <span className="block text-xs text-slate-700 truncate text-left" title={i.rotulo}>{i.rotulo}</span>
            <span className="flex items-center gap-2 mt-0.5">
              <span className="flex-1 h-3 rounded-sm" style={{ background: 'var(--viz-trilho)' }}>
                <span
                  key={chave}
                  className="viz-crescer-x block h-3 rounded-r-[4px] transition-[width] duration-300"
                  style={{
                    width: `${Math.max(2, 100 * i.valor / max)}%`, background: cor, opacity: algumSelecionado && !ativo ? 0.35 : 1,
                    animationDelay: `${Math.min(posicao * 45, 450)}ms`,
                  }}
                />
              </span>
              <span className="w-24 shrink-0 text-right text-xs font-semibold text-black tabular-nums">
                {i.valor.toLocaleString('pt-BR')}
                <span className="font-normal text-slate-500"> · {pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
              </span>
            </span>
          </>
        );
        return (
          <li key={i.chave}>
            {clicavel ? (
              <button
                type="button"
                onClick={() => aoClicar!(i.chave)}
                aria-pressed={ativo}
                title={`${i.rotulo}: ${i.valor.toLocaleString('pt-BR')} (clique para filtrar)`}
                className={`w-full px-2 py-1 rounded cursor-pointer hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${ativo ? 'bg-slate-100' : ''}`}
              >
                {conteudo}
              </button>
            ) : (
              <div className="px-2 py-1">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface SerieDef {
  id: string;
  rotulo: string;
  cor: string;
}

export interface PontoTempo {
  chave: string;
  rotulo: string;
  valores: Record<string, number>;
}

const H = 240;
const M = { esq: 46, dir: 10, topo: 10, base: 28 };

/** Topo do eixo Y em 4 passos inteiros "redondos" (ex.: 0, 15, 30, 45, 60). */
function teto(n: number): number {
  const bruto = Math.max(n, 1) / 4;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    const passo = f * pot;
    if (passo >= bruto && Number.isInteger(passo)) return passo * 4;
  }
  return Math.ceil(bruto) * 4;
}

/** Colunas empilhadas no tempo. Passar o mouse mostra todas as séries do período; clicar filtra o período. */
export function ColunasNoTempo({ pontos, series, selecionado, aoClicar, descricao }: {
  pontos: PontoTempo[]; series: SerieDef[]; selecionado?: string; aoClicar?: (chave: string) => void; descricao: string;
}) {
  const [foco, setFoco] = useState<{ i: number; x: number; y: number } | null>(null);
  const [refLargura, W] = useLargura(860);
  const chave = useContext(ChaveAnimacao);
  if (pontos.length === 0) return <p className="text-xs text-slate-500 py-10 text-center">Sem datas para mostrar.</p>;

  const totais = pontos.map((p) => series.reduce((a, s) => a + (p.valores[s.id] ?? 0), 0));
  const maxY = teto(Math.max(...totais, 1));
  const larguraUtil = W - M.esq - M.dir;
  const alturaUtil = H - M.topo - M.base;
  const passo = larguraUtil / pontos.length;
  const largura = Math.max(2, Math.min(40, passo * 0.72));
  const y = (v: number) => M.topo + alturaUtil - (v / maxY) * alturaUtil;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);
  const cadaX = Math.ceil(pontos.length / Math.max(4, Math.floor(W / 70)));
  const tooltip = foco ? pontos[foco.i] : null;

  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const xSvg = ((e.clientX - r.left) / r.width) * W;
    const i = Math.floor((xSvg - M.esq) / passo);
    if (i < 0 || i >= pontos.length) { setFoco(null); return; }
    setFoco({ i, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div className="relative" ref={refLargura}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[11px] text-slate-600">
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.cor }} />
            {s.rotulo}
          </span>
        ))}
        {aoClicar && <span className="text-slate-400">Clique numa coluna para filtrar o período</span>}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={descricao}
        onPointerMove={mover}
        onPointerLeave={() => setFoco(null)}
        onClick={() => { if (foco && aoClicar) aoClicar(pontos[foco.i].chave); }}
        style={{ cursor: aoClicar ? 'pointer' : 'default' }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.esq} x2={W - M.dir} y1={y(t)} y2={y(t)} stroke="var(--viz-grade)" strokeWidth={1} />
            <text x={M.esq - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500" fontSize={11}>
              {Math.round(t).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}
        {pontos.map((p, i) => {
          const cx = M.esq + passo * i + passo / 2;
          const esmaecer = selecionado && selecionado !== p.chave;
          let base = 0;
          const nao_zeradas = series.filter((s) => (p.valores[s.id] ?? 0) > 0);
          return (
            <g key={p.chave} opacity={esmaecer ? 0.35 : 1}>
              {foco?.i === i && <rect x={M.esq + passo * i} y={M.topo} width={passo} height={alturaUtil} className="fill-slate-100" />}
              <g key={chave} className="viz-crescer-y" style={{ animationDelay: `${Math.min(i * (500 / pontos.length), 500)}ms` }}>
              {series.map((s) => {
                const v = p.valores[s.id] ?? 0;
                if (v <= 0) return null;
                const y0 = y(base);
                base += v;
                const ehTopo = nao_zeradas[nao_zeradas.length - 1]?.id === s.id;
                const folga = base - v > 0 ? 2 : 0;
                const y1 = y(base);
                const h = Math.max(1, y0 - y1 - folga);
                const x = cx - largura / 2;
                if (!ehTopo) return <rect key={s.id} x={x} y={y1} width={largura} height={h} fill={s.cor} />;
                const r = Math.min(4, largura / 2, h);
                return (
                  <path key={s.id} fill={s.cor}
                    d={`M${x},${y1 + h} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + largura - r} Q${x + largura},${y1} ${x + largura},${y1 + r} V${y1 + h} Z`} />
                );
              })}
              </g>
              {i % cadaX === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate-500" fontSize={11}>{p.rotulo}</text>
              )}
            </g>
          );
        })}
        <line x1={M.esq} x2={W - M.dir} y1={y(0)} y2={y(0)} className="stroke-slate-300" strokeWidth={1} />
      </svg>
      {tooltip && foco && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 bg-white border border-slate-200 rounded shadow-md px-3 py-2 text-xs"
          style={{ left: Math.min(foco.x + 12, 9999), top: Math.max(0, foco.y - 10), transform: foco.x > W / 2 ? 'translateX(-110%)' : undefined }}
        >
          <p className="font-semibold text-black mb-1">{tooltip.rotulo}</p>
          {series.map((s) => (
            <p key={s.id} className="flex items-center gap-2 text-slate-600">
              <span className="inline-block w-3 h-0.5" style={{ background: s.cor }} />
              <strong className="text-black tabular-nums">{(tooltip.valores[s.id] ?? 0).toLocaleString('pt-BR')}</strong> {s.rotulo}
            </p>
          ))}
          {series.length > 1 && (() => {
            const t = series.reduce((a, s) => a + (tooltip.valores[s.id] ?? 0), 0);
            const rej = tooltip.valores['rejeitadas'] ?? 0;
            return t > 0 && tooltip.valores['rejeitadas'] !== undefined
              ? <p className="text-slate-500 mt-1">Taxa de rejeição: {(100 * rej / t).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</p>
              : null;
          })()}
        </div>
      )}
    </div>
  );
}

/** Botões de alternância pequenos (ex.: Dia / Mês). */
export function Alternador<T extends string>({ opcoes, valor, aoMudar }: { opcoes: { id: T; rotulo: string }[]; valor: T; aoMudar: (v: T) => void }) {
  return (
    <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]">
      {opcoes.map((o) => (
        <button key={o.id} type="button" onClick={() => aoMudar(o.id)} aria-pressed={valor === o.id}
          className={`px-2 py-1 cursor-pointer ${valor === o.id ? 'bg-[#2f364b] text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
