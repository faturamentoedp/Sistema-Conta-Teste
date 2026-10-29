# ⚡ Plataforma de Faturamento EDP

Painel único com as ferramentas de faturamento da EDP. A página inicial é o **menu principal**; cada ferramenta tem a sua página, a sua pasta de código e a sua documentação. Não há login nem conta de usuário.

![Next.js](https://img.shields.io/badge/Framework-Next.js-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/Library-React-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## Ferramentas

| Ferramenta | Rota | O que faz | Documentação |
|---|---|---|---|
| **Conta Teste** | `/conta-teste` | Simula a fatura de energia do Grupo B (EDP ES e SP) | [docs/conta-teste/](docs/conta-teste/README.md) |

A lista que alimenta o menu e a página inicial está em [src/plataforma/ferramentas.ts](src/plataforma/ferramentas.ts). Para criar uma nova, siga [docs/plataforma/como-adicionar-ferramenta.md](docs/plataforma/como-adicionar-ferramenta.md).

## Como o projeto está organizado

```
src/
├── app/                      Só roteamento (páginas e APIs finas)
│   ├── layout.tsx            Layout raiz: casca da plataforma em volta de toda página
│   ├── page.tsx              "/"  Menu principal
│   ├── conta-teste/page.tsx  "/conta-teste"
│   └── api/
│       ├── conta-teste/calcular/route.ts   API da Conta Teste
│       └── calcular/route.ts               endereço antigo (repassa para a rota acima)
├── plataforma/               O que é COMUM a todas as ferramentas
│   ├── ferramentas.ts        Registro das ferramentas (menu, cartões, títulos)
│   └── componentes/          Casca (barra + menu), PaginaFerramenta, TituloSecao, ícones, faixa de ambiente
├── modulos/                  Uma pasta por ferramenta
│   └── conta-teste/
│       ├── ContaTeste.tsx    Tela (formulário)
│       ├── ResultadoFatura.tsx, exportarCsv.ts, utilitarios.ts, formatadores.ts, tipos.ts
│       └── motor/            Motor de cálculo (JavaScript puro): tarifas, tributos, CIP
└── proxy.ts                  Senha opcional (APP_SENHA), vale para a plataforma inteira

scripts/
├── conta-teste/              Regressão e importadores da ferramenta (verificar, cenários, ANEEL, CIP)
└── plataforma/               Publicação na Vercel, diagnóstico de rede e túnel

docs/
├── plataforma/               Como rodar/publicar e como adicionar ferramenta
└── conta-teste/              FAQ, documentação, regras de cálculo e dados de treinamento (Databricks)

ferramentas/                  Painel em Excel com botões para publicar e verificar (arquivos .bat)
Planilhas/                    Fontes oficiais usadas nas validações (modelos, faturas, regras)
public/images/                Logo
```

**Regra de ouro:** cada ferramenta vive só na sua pasta (`src/modulos/<id>`, `scripts/<id>`, `docs/<id>`). O que for compartilhado entre ferramentas sobe para `src/plataforma/`.

## Rodar na máquina

```bash
npm install
```
```bash
npm run dev
```
Abre em `http://localhost:3020`. Não precisa de banco nem de variável de ambiente. Detalhes (build, rede local, Vercel, produção x teste, túnel): [docs/plataforma/publicacao.md](docs/plataforma/publicacao.md).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` / `npm run build && npm start` | Roda em desenvolvimento / produção local (porta 3020) |
| `npm run lint` | ESLint |
| `npm run verificar` | Regressão dos 51 cenários da Conta Teste (centavo a centavo) |
| `npm run verificar-cip` | Regressão da CIP por município (37 casos) |
| `npm run publicar:teste` | Publica o link de teste na Vercel |
| `npm run publicar` | Publica a produção (só da `main`, com regressão passando) |
| `npm run rede` / `npm run share` | Diagnóstico de rede / túnel público (alternativas à Vercel) |

## Produção x Teste

`main` = só o que a área validou (produção). `teste` = tudo (preview, com faixa amarela "Ambiente de teste"). Passo a passo em [docs/plataforma/publicacao.md](docs/plataforma/publicacao.md).

---
*Equipe de Desenvolvimento | EDP - 2026*
