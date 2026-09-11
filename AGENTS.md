# ÓRBITA — Briefing do Sistema

> Plataforma institucional de gestão do ciclo de contratações públicas, da DFD
> à execução contratual. Self-hosted, Manus-free, com marca oficial v1.0.0.
>
> Este arquivo é a fonte canônica de briefing para agentes que vão trabalhar
> neste projeto. Ele diz **o que** o sistema é e **onde** estão as coisas; para
> o **porquê** das decisões de design, ler `docs/brand/` (6 docs).

---

## Identidade rápida

- **Nome**: ÓRBITA
- **Posicionamento**: Plataforma Integrada de Contratações Públicas
- **Manifesto de marca**: [`client/src/brand/manifests/icons.json`](./client/src/brand/manifests/icons.json) — hierarquia subsistema → módulo
- **Documentação de marca**: [`docs/brand/`](./docs/brand/) (6 docs canônicos)
- **Versão**: ver [`client/package.json`](./client/package.json) e `standalone/environment`

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 7 + TanStack Query 5 + tRPC 11 + Tailwind 4 (bridge via `@theme inline`) |
| Backend | Express 4.21 + tRPC 11 + Node 22 LTS |
| Banco | MariaDB 11 (Drizzle ORM 0.31, ~60 migrations) |
| Auth local | JWT em cookie HttpOnly (`AUTH_MODE=local`, `STORAGE_DRIVER=local`) |
| Tooling | pnpm 10, TypeScript estrito, vitest |

Manifesto de dependências: [`client/package.json`](./client/package.json), [`server/package.json`](./server/package.json), [`standalone/Dockerfile`](./standalone/Dockerfile).

---

## Arquitetura em alto nível

```
Browser (React 19 SPA)              ← client/src
  ↓ /api/trpc, /api/health, /files/{key}
Express 4.21 (Node 22)              ← server/
  ↓ drizzle-orm/mysql2
MariaDB 11                          ← container orbita-mariadb-local
```

Diretórios de domínio:

- `client/src/` — UI React (pages, components, hooks, contexts)
- `server/` — serviços (planning, procurement, demand, etc.) e tRPC routers
- `server/_core/` — runtime (Express, tRPC setup, vite, health, meta)
- `server/selfhost/` — rotas e serviços do modo standalone
- `drizzle/` — schema (`schema.ts`) + migrations SQL numeradas (0026+)
- `shared/` — código client/server (constantes, tipos, filtros)
- `standalone/` — Dockerfile, compose, entrypoint, template de env

---

## Identidade visual — Marca v1.0.0

> A hierarquia, os pictogramas e os tokens deste projeto vivem em 5 locais
> canônicos. Mexer em qualquer um exige coerência com os outros quatro.

### Hierarquia (do manifest oficial)

```
3 subsistemas (cada um com cor canônica)
├── fluxo-da-contratacao (#367CFF)  ← 10 módulos
├── transparencia      (#13BFAE)  ← 2 módulos
└── inteligencia-e-suporte (#9554E8) ← 8 módulos

20 módulos (cada um herda a cor do seu subsistema):
porta, agenda, lupa, régua, termômetro, lastro, maestro, elo, vigia, oráculo,
eco, vitrine, águia, farol, mapa, bússola, ímã, oficina, atlas, memória
```

### Onde está cada coisa

| Camada | Local |
|---|---|
| **Manifest canônico** (hierarquia subsistema → módulo) | [`client/src/brand/manifests/icons.json`](./client/src/brand/manifests/icons.json) |
| **Tokens CSS oficiais** | [`client/src/brand/tokens/orbita-tokens.css`](./client/src/brand/tokens/orbita-tokens.css) |
| **Componentes `.orbita-*`** | [`client/src/brand/css/orbita-components.css`](./client/src/brand/css/orbita-components.css) |
| **Pictogramas SVG master** | `client/public/orbita/modules/{id}/icone.svg` |
| **Pictogramas PNG 16/20/24/32** | `client/public/orbita/modules-png/{n}px/{id}.png` |
| **Pictogramas com cor currentColor** | `client/public/orbita/modules-current-color/{id}.svg` |
| **Símbolo dos subsistemas** | `client/public/orbita/subsystems/{id}/icone-subsistema.svg` |
| **Símbolo + assinatura da marca** | `client/public/orbita/brand/svg/{symbol-color,symbol-mono-dark,symbol-mono-white,signature-horizontal,signature-intermediate,*}.svg` |
| **Fontes locais** | `client/public/orbita/fonts/NotoSans-{Regular,Bold}.ttf` |
| **Documentação da marca** | [`docs/brand/`](./docs/brand/) (README, CHANGELOG, GUIA_DO_DESENVOLVEDOR, GOVERNANCA, ACESSIBILIDADE, VALIDACOES_NO_PRODUTO) |

### Como usar

**Cores / espaçamento / radius** — sempre via tokens `--orbita-*`. Nunca hardcode hex:

```css
min-height: var(--orbita-control-default);
background: var(--orbita-surface);
color: var(--orbita-text);
border-radius: var(--orbita-radius-md);
```

**Pictograma de módulo** — usar o helper `<Pkt id="porta" />` em React
(está em `client/src/pages/Home.tsx`, função `Pkt`). Em outros lugares
que precisarem, importar o master SVG `client/public/orbita/modules/{id}/icone.svg`.

**Pictograma de subsistema** — `<Pkt subsystem="fluxo-da-contratacao" />`
ou importar `client/public/orbita/subsystems/{id}/icone-subsistema.svg`.

**Símbolo / Wordmark** — usar `<Wordmark variant="intermediate|horizontal|symbol" />`
em React. Esse componente troca automaticamente entre `signature-intermediate.svg`
(light) e `signature-intermediate-negative.svg` (dark). Nunca usar `symbol-color.svg`
em fundo escuro (baixo contraste) — preferir `symbol-mono-white.svg`.

**Dark mode** — a landing (`/`) é **dark-only** (forçado no `<head>` antes do
React montar via `client/index.html`). O resto da app (`/jogar`, etc.) respeita
o toggle do usuário. O `<ThemeProvider>` lê o `data-theme` já presente no `<html>`
e mantém coerência entre `.dark` (shadcn/Tailwind) e `[data-theme="dark"]`
(tokens oficiais).

### Regras da marca (resumo)

- Pictograma do módulo NUNCA pode ser substituído pelo símbolo do subsistema.
- A cor do módulo é sempre a cor do seu subsistema — não trocar.
- Estado `active`: cor 100% + fundo tonal suave.
- Estado `inactive`: cor oficial com opacidade visual reduzida.
- Estado `disabled`: neutro, com atributo `disabled` ou `aria-disabled`.
- Sizes oficiais dos pictogramas: 16, 20, 24, 32 px.

---

## Como rodar

### Dev (rápido, com DB local)

```powershell
$env:DATABASE_URL = "mysql://orbita:06464ae5cdf614aae10949d7e32b456b@127.0.0.1:3306/orbita"
$env:JWT_SECRET   = "b3c29c31f4c6242f28022a032bc726e742b1aa9aed6d52fa7fdca5b199688e75"
$env:AUTH_MODE    = "local"
$env:STORAGE_DRIVER = "local"
$env:PORT         = "3000"
$env:NODE_ENV     = "development"
pnpm install
pnpm dev
```

### Standalone (Docker)

```powershell
cd standalone
cp environment.template.txt environment
# Editar environment: JWT_SECRET (>=32 hex), MYSQL_PASSWORD, LOCAL_ADMIN_PASSWORD
docker compose --env-file environment up -d --build
```

### Smoke E2E

```powershell
node smoke.mjs
```

Valida `/api/health`, `/api/version`, `/` (HTML), tabelas no MariaDB.
Imagens docker e o servidor precisam estar de pé.

### Build produção

```powershell
pnpm build      # vite (cliente) + esbuild (servidor)
pnpm start      # roda o build de dist/
```

---

## Convenções

### Commits

Conventional Commits em pt-BR (escopo em inglês quando é nome de subsistema):

```
feat(brand): landing + sidebar com 3 subsistemas colapsáveis e 20 pictogramas
fix(brand): admin section colapsa e ganha icone de engrenagem
docs(brand): linkar docs/brand/ na seção 'Identidade visual'
chore(release): bump version to 1.1.0
fix(dfd): wizard preserva dados entre steps
```

Onda típica de uma feature grande: 2-4 commits por onda lógica, não 1 commit monolítico.

### Branch / remote

- Branch principal: `main`
- Remote: `origin` = `https://github.com/mezoempreendimentos-tech/orbita-spac.git`
- Não fazer force push. Mudanças grandes → PR.

### `.gitignore` (regras não-óbvias)

- `_brand_inbox/` — zip de origem do pacote de marca (extraído em `client/public/orbita/`)
- `scripts/_archive/` — one-shots preservados mas não versionados
- `standalone/*.cjs` — scripts operacionais do container, regenerados
- `standalone/environment`, `.secrets.json` — credenciais (nunca commitar)

---

## Pendências conhecidas

| # | Item | Por quê |
|---|---|---|
| 1 | Migrar MariaDB → PostgreSQL | MariaDB armazena `json` como LONGTEXT; PG nativo é melhor pro schema |
| 2 | Auditar dependências não usadas | `@aws-sdk/*`, `streamdown`, `input-otp` parecem sem call sites |
| 3 | Testes E2E completos (Playwright) | `smoke.mjs` cobre só boot + health |
| 4 | wouter → TanStack Router | type-safe routes + prefetch |
| 5 | OpenTelemetry | spans em tRPC, drizzle, HTTP |
| 6 | Ngrok watchdog | ngrok cai por inatividade; religação manual via `C:\Tools\ngrok\ngrok.exe http --domain=blurred-scant-cried.ngrok-free.dev 3000` |
| 7 | Node detached do shell | hoje o node morre junto com o bash tool; precisa virar Windows Service |

---

## Serviços e credenciais

| Serviço | Comando / Local | Status esperado |
|---|---|---|
| MariaDB | `docker ps --filter "name=orbita-mariadb"` | `Up` |
| Servidor | `node dist/index.js` (com envs) | escutando em `:3000` |
| Túnel ngrok | `C:\Tools\ngrok\ngrok.exe http --domain=blurred-scant-cried.ngrok-free.dev 3000 --log=stdout` | `https://blurred-scant-cried.ngrok-free.dev` → 200 |
| Build | `pnpm build` | `dist/public/` + `dist/index.js` |

**Admin bootstrap** (criado no primeiro login se não existir):

- Email: `LOCAL_ADMIN_EMAIL` (default `mezoempreendimentos@gmail.com`)
- Senha: `LOCAL_ADMIN_PASSWORD` (em `standalone/environment`)

---

## Onde pedir ajuda

- **Marca / tokens / pictogramas**: ler [`docs/brand/GUIA_DO_DESENVOLVEDOR.md`](./docs/brand/GUIA_DO_DESENVOLVEDOR.md) primeiro
- **Arquitetura / tRPC / DB**: ver `server/_core/` e `drizzle/schema.ts`
- **Decisões de produto**: ver `RELATORIO.md` na raiz e changelog de cada commit
- **Operacional / DevOps**: ver [`ENVIRONMENT.md`](./ENVIRONMENT.md) e `.github/workflows/ci.yml`
- **Agente assistente**: `mavis` (este Mavis), com skill `mavis` carregada
