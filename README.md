# ÓRBITA — Plataforma Integrada de Contratações

Sistema self-hosted para gestão do ciclo de contratações públicas, da DFD à
execução contratual. Stack: **React 19 + Vite 7 + TanStack Query 5 + tRPC 11 +
Drizzle 0.31 + MariaDB 11 + Express 4.21 + Node 22 LTS + pnpm 10**.

> **Standalone-first.** Este build é Manus-free: não há OAuth hospedado, não há
> storage S3, não há chamadas pra plataforma Manus. A autenticação é local
> (sessão JWT em cookie HttpOnly) e o storage é filesystem local.

---

## Quick start (modo standalone, em Docker)

```bash
# 1. Gere um arquivo de ambiente a partir do template
cp standalone/environment.template.txt standalone/environment
# Edite standalone/environment: defina JWT_SECRET (>= 32 chars hex) e senhas
# fortes para MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, LOCAL_ADMIN_PASSWORD.

# 2. Suba o stack
cd standalone
docker compose --env-file environment up -d --build

# 3. Verifique
curl http://localhost:8080/api/health
# {"status":"ok","db":"ok","uptime":12,"version":"1.0.0",...}

# 4. Acesse
# http://localhost:8080/ — landing
# http://localhost:8080/login — login institucional
#   (use o email/senha de LOCAL_ADMIN_EMAIL/LOCAL_ADMIN_PASSWORD do environment)
```

> O primeiro start leva ~3 min (pnpm install + vite build + esbuild dentro do
> container). Os próximos são instantâneos graças ao cache de layers do
> Docker.

## Quick start (modo dev)

```bash
# Requer Node 22 LTS + pnpm 10 + MariaDB 11 rodando localmente
pnpm install
cp .env.example .env   # ajuste DATABASE_URL e JWT_SECRET
pnpm dev               # tsx watch + Vite dev server
```

## Comandos úteis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe Express + Vite dev server com HMR |
| `pnpm build` | Build produção: vite (cliente) + esbuild (servidor) |
| `pnpm start` | Roda o build de produção (assume `dist/`) |
| `pnpm test` | Roda os unit tests (vitest) |
| `pnpm check` | Typecheck estrito (`tsc --noEmit`) |
| `pnpm db:push` | Gera SQL e aplica migrations pendentes via drizzle-kit |
| `docker compose --env-file environment up -d --build` | Suba o stack standalone |
| `node smoke.mjs` | Smoke E2E (assumes stack up): /api/health, /api/version, /, mariadb |
| `cd standalone && ./entrypoint.sh` | Manual: o que o container roda no startup |

## Variáveis de ambiente

Veja [`ENVIRONMENT.md`](./ENVIRONMENT.md) para a referência completa (todas as
variáveis, defaults, obrigatoriedade).

Resumo das obrigatórias:

| Var | Usada por | Notas |
|---|---|---|
| `JWT_SECRET` | `server/_core/cookies.ts`, `_core/env.ts` | 32+ chars hex, nunca rotacionar em produção sem invalidar sessões |
| `DATABASE_URL` | `drizzle`, `server/db.ts` | `mysql://user:pass@host:3306/db` |
| `MYSQL_PASSWORD` | `standalone/compose.yaml` (passado pro MariaDB) | 16+ chars hex; **evite `$#!`** (quebram interpolação do compose) |
| `MYSQL_ROOT_PASSWORD` | idem | idem |
| `LOCAL_ADMIN_PASSWORD` | `server/selfhost/localAuth.ts` | Senha do admin bootstrap criado no primeiro start |
| `BACKUP_REPORT_TOKEN` | `server/selfhost/localBackupRoutes.ts` | Header `X-Backup-Token` para o endpoint de relatório |
| `CRON_TOKEN` | `server/planningDeadlineScheduler.ts` | Header `X-Cron-Token` para o scheduler; cai pra `BACKUP_REPORT_TOKEN` se ausente |

Opcionais:

| Var | Default | Efeito |
|---|---|---|
| `APP_PORT` | `8080` | Porta HTTP do orbita |
| `APP_ORIGIN` | — | Origin pra cookies/links (ex: `https://contratos.camarax.gov.br`) |
| `PORT` | `3000` | Alias (Express ouve) |
| `LOCAL_ADMIN_EMAIL` | — | Email do admin bootstrap (criado se não existir) |
| `LOCAL_ADMIN_NAME` | `Administrador institucional` | Nome do admin bootstrap |
| `AUTH_MODE` | `local` | Sempre `local` neste build (outros valores não têm handler) |
| `STORAGE_DRIVER` | `local` | Sempre `local` (outros valores não têm handler) |
| `LOCAL_STORAGE_DIR` | `/var/lib/orbita/files` | Onde os arquivos são gravados |
| `GIT_COMMIT` | `no-commit` | Setado em build time (Dockerfile ARG) — lido por `/api/version` |
| `BUILD_TIME` | `unknown` | idem |

## Endpoints de ops

| Path | Método | O que retorna |
|---|---|---|
| `/api/health` | GET | `{status, db, uptime, version, env, timestamp}`. 503 se DB down. |
| `/api/version` | GET | `{version, commit, buildTime, node}`. Metadados de build. |
| `/api/trpc/*` | POST | tRPC: rotas em `server/routers.ts` |
| `/api/oauth/callback` | GET | Stub que joga erro (modo hosted não disponível) |
| `/api/scheduled/planning-deadlines` | POST | Scheduler; exige header `X-Cron-Token` |
| `/login` | GET | UI de login (autenticação local) |
| `/files/{key}` | GET | Arquivos do storage local |

## Arquitetura

```
┌─────────────────────────────┐
│ Browser (React 19 SPA)      │
│  - Vite dev / vite build    │
│  - tRPC client (fetch)      │
└──────────────┬──────────────┘
               │ /api/trpc, /api/health, /files/{key}
┌──────────────▼──────────────┐
│ Express 4.21 (Node 22)     │
│  - tRPC router              │
│  - local auth (JWT)         │
│  - /api/health, /api/version│
│  - express.static dist/     │
└──────────────┬──────────────┘
               │ drizzle-orm/mysql2
┌──────────────▼──────────────┐
│ MariaDB 11                  │
│  - 26 migrations            │
│  - 51 tables                │
└─────────────────────────────┘
```

Diretórios:

- `client/src/` — UI React (componentes, pages, hooks)
- `server/` — serviços de domínio (planning, procurement, demand, etc.) e tRPC routers
- `server/_core/` — runtime (Express, tRPC setup, vite, health, meta)
- `server/selfhost/` — rotas e serviços do modo standalone
- `drizzle/` — schema (`schema.ts`) + migrations SQL (0026, etc.)
- `shared/` — código compartilhado client/server (constantes, tipos, filtros)
- `standalone/` — Dockerfile, compose, entrypoint, template de env

## CI

GitHub Actions em `.github/workflows/ci.yml`:

- `static` — typecheck + unit tests (com MariaDB de serviço)
- `build` — vite + esbuild + verificação dos artefatos
- `smoke` — build da imagem, sobe compose, valida /api/health + /api/version + / + tabelas no MariaDB
- `docs` — arquivos obrigatórios

## Pendências / melhorias conhecidas

Veja `RELATORIO.md` para o pente fino completo. Top priorities remanescentes:

1. **Migrar MariaDB → PostgreSQL** — MariaDB armazena `json` como LONGTEXT,
   perdendo queries JSON nativas. PG nativo é muito melhor pro schema atual.
2. **Auditar dependências não usadas** (`@aws-sdk/*`, `streamdown`, `input-otp` parecem não ter call sites)
3. **Adicionar testes E2E completos** (Playwright) — o `smoke.mjs` cobre só
   boot + health; precisa cobrir fluxos de planejamento.
4. **Migrar wouter → TanStack Router** — wouter é mínimo mas TanStack tem
   type-safe routes e prefetch.
5. **OpenTelemetry** — instrumentar spans pra tRPC, drizzle, e HTTP requests.

## Licença

MIT
