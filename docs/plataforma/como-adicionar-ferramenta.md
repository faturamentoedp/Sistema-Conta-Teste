# Como adicionar uma ferramenta à plataforma

Toda ferramenta segue o mesmo molde, para que as páginas fiquem padronizadas: mesma casca (barra + menu), mesma moldura de página e mesmo registro. Exemplo de referência: **Conta Teste**.

Use um `id` curto em minúsculas com hífen (ex.: `analise-cip`). O mesmo `id` nomeia a pasta, a rota e o registro.

## 1. Crie a pasta da ferramenta

```
src/modulos/<id>/
├── <Nome>.tsx        Componente principal da ferramenta ('use client' se tiver estado)
└── ...               Componentes, utilitários e regras só dela
```

Regras de negócio em JavaScript puro (como o `motor/` da Conta Teste) ficam dentro dessa pasta, para poderem ser testadas por script sem subir o Next.

## 2. Registre a ferramenta

Em [src/plataforma/ferramentas.ts](../../src/plataforma/ferramentas.ts), acrescente à lista `FERRAMENTAS`:

```ts
{
  id: 'analise-cip',
  nome: 'Análise de CIP',
  descricao: 'Uma frase dizendo o que a ferramenta faz.',
  rota: '/analise-cip',
  icone: 'calculadora',   // ver Icones.tsx; para um ícone novo, acrescente em IconeFerramenta e em Icones.tsx
  status: 'ativa',        // 'em-breve' mostra no menu sem link
}
```

Isso já coloca a ferramenta no menu lateral e na página inicial.

## 3. Crie a página

`src/app/<id>/page.tsx`:

```tsx
import type { Metadata } from 'next';
import PaginaFerramenta from '@/plataforma/componentes/PaginaFerramenta';
import AnaliseCip from '@/modulos/analise-cip/AnaliseCip';

export const metadata: Metadata = { title: 'Análise de CIP' };

export default function Page() {
  return (
    <PaginaFerramenta id="analise-cip">
      <AnaliseCip />
    </PaginaFerramenta>
  );
}
```

`PaginaFerramenta` põe o título e a descrição do registro no topo — por isso o nome da página é sempre o do menu. Dentro da ferramenta, use `TituloSecao` (de `@/plataforma/componentes/TituloSecao`) para os títulos de seção, e os estilos de `globals.css` (`modern-table`, `currency`) para tabelas.

### Tema claro e escuro

O botão de tema (barra do topo) vale para a plataforma inteira; o tema escuro é uma camada de CSS em `.dark` no fim de `src/app/globals.css`, que reaproveita a paleta da barra (#2f364b / #1f2536). Para a ferramenta nova já sair certa nos dois temas:

- Use as cores que a plataforma já usa (`bg-white`, `text-black`, `slate-*`, `border-slate-*`, `text-[#2f364b]` e os tons de aviso: amber, blue, emerald, purple, cyan, rose). Todas já têm versão escura.
- Se precisar de uma cor nova (ex.: `bg-teal-50`, `text-teal-700`), acrescente o equivalente escuro em `.dark` no `globals.css`. Sem isso, ela aparece igual nos dois temas e pode ficar ilegível no escuro.
- Fundos de página usam a variável `--bg-color`; evite fixar `#fff` em CSS próprio.

## 4. API (se precisar)

`src/app/api/<id>/<acao>/route.ts`. Mantenha a rota fina: valida a entrada e chama o código de `src/modulos/<id>/`.

## 5. Scripts e documentação

- Testes de regressão e importadores: `scripts/<id>/` (e um script no `package.json`, como `verificar`).
- Documentação: `docs/<id>/README.md`.

## Checklist antes de publicar

```bash
npx tsc --noEmit
```
```bash
npm run lint
```
```bash
npm run build
```

Se a ferramenta calcula valores, entregue junto o caso de validação (fatura real ou modelo oficial) no script de regressão dela.
