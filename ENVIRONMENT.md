# Variáveis de ambiente

Referência completa de todas as variáveis consumidas pelo Orbita. Ordenadas por
criticidade e agrupadas por origem.

> **Convenção**: o `server/_core/env.ts` é a única fonte canônica de leitura
> server-side; o `standalone/environment.template.txt` é o source-of-truth pra
> deploy standalone. Mantenha os dois em sincronia quando adicionar uma var.

## Críticas (build quebra ou app não funciona sem elas)

| Var | Lida em | Default se ausente | Obrigatória? | Notas |
|---|---|---|---|---|
| `JWT_SECRET` | `server/_core/env.ts`, `server/selfhost/localAuth.ts` | `""` | **Sim** | ≥ 32 chars. Usada pra assinar sessões JWT e pra hash comparison em `localAuth`. Trocar em prod invalida todas as sessões existentes. |
| `DATABASE_URL` | `server/_core/env.ts`, `drizzle.config.ts`, `server/db.ts` | `""` | **Sim** | `mysql://user:pass@host:3306/db`. Sem ela, o `getDb()` retorna null e queries falham. |
| `MYSQL_PASSWORD` | `standalone/compose.yaml` (passado pro MariaDB) | — | **Sim (standalone)** | Senha do usuário `orbita` no MariaDB. **Evite `$#!`** — quebram interpolação do compose. Use hex puro. |
| `MYSQL_ROOT_PASSWORD` | `standalone/compose.yaml` | — | **Sim (standalone)** | Senha do root. idem. |
| `LOCAL_ADMIN_PASSWORD` | `server/selfhost/localAuth.ts` | — | **Sim (1º start)** | Senha do admin criado no bootstrap se a tabela `users` está vazia. Troque após o 1º acesso. |

## Operacionais (recomendadas, com defaults seguros)

| Var | Lida em | Default | Efeito |
|---|---|---|---|
| `APP_PORT` | `standalone/compose.yaml` | `8080` | Porta host mapeada pro container. |
| `APP_ORIGIN` | `server/storage.ts` (signed URL) | `""` | Origin pra construir URLs absolutas em storage. Ex: `https://contratos.camarax.gov.br`. |
| `PORT` | `server/_core/index.ts` | `3000` | Porta em que o Express ouve dentro do container. No compose, o entrypoint força `8080`. |
| `LOCAL_ADMIN_EMAIL` | `server/selfhost/localAuth.ts` | `""` | Email do admin bootstrap. Se vazio, nenhum admin é criado (você terá que criar via seed manual). |
| `LOCAL_ADMIN_NAME` | idem | `"Administrador institucional"` | Nome do admin bootstrap. |
| `BACKUP_REPORT_TOKEN` | `server/selfhost/localBackupRoutes.ts` | `""` | Se setado, o endpoint de relatório de backup exige `X-Backup-Token: <valor>` header. Senão, aberto. |
| `CRON_TOKEN` | `server/planningDeadlineScheduler.ts` | `""` | Se setado, `/api/scheduled/planning-deadlines` exige `X-Cron-Token: <valor>`. Se vazio, **cai pra `BACKUP_REPORT_TOKEN`**, e se ambos vazios, o endpoint fica fechado. |
| `LOCAL_STORAGE_DIR` | `server/storage.ts` | `"./data/files"` (dev) / `/var/lib/orbita/files` (compose) | Onde `storagePut` grava arquivos. |

## Build-time (Dockerfile ARG → ENV)

| Var | Set em | Lida em | Default |
|---|---|---|---|
| `GIT_COMMIT` | `Dockerfile` ARG | `server/_core/meta.ts` (`/api/version`) | `no-commit` |
| `BUILD_TIME` | idem | idem | `unknown` |

Para passar valores reais:

```bash
docker build \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
  --build-arg BUILD_TIME=$(date -Iseconds) \
  -t standalone-orbita:latest \
  -f standalone/Dockerfile .
```

## Internas (setadas pelo código, não precisam ser setadas)

| Var | Set em | Efeito |
|---|---|---|
| `NODE_ENV` | `Dockerfile` (`ENV NODE_ENV=production`) | Modo prod ativa `serveStatic` em vez do Vite middleware; muda defaults. |
| `SELF_HOSTED` | idem | Flag que `vite.config.ts` usava (removida pós-rip-out). |
| `VITE_AUTH_MODE` | idem | Constant injetada no bundle do client (read em `const.ts:startLogin`). |

## Removidas no rip-out do Manus (2026-08-27)

Estas eram lidas pelo `server/_core/env.ts` antigo e por arquivos Manus que
foram deletados. Se você vir uma referência a elas em código antigo, é resíduo
a ser removido.

- `OAUTH_SERVER_URL` (Manus OAuth)
- `OWNER_OPEN_ID` (Manus)
- `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` (Manus Forge)
- `VITE_FRONTEND_FORGE_API_URL` / `VITE_FRONTEND_FORGE_API_KEY` (idem, client)
- `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID` (Manus OAuth, client)

## Como gerar secrets fortes

```bash
# 32 chars hex (JWT_SECRET, CRON_TOKEN, BACKUP_REPORT_TOKEN)
openssl rand -hex 32

# 16 chars hex (senhas de banco)
openssl rand -hex 16
```

**NUNCA** use chars `$#!` em senhas lidas via `docker compose --env-file`:
a expansão de variável do compose interpreta `$VAR` como substituição.

## Sanity check pós-deploy

```bash
# Sobe o stack
docker compose --env-file environment up -d

# Valida saúde + versão
curl -s http://localhost:8080/api/health  | jq
curl -s http://localhost:8080/api/version | jq
```
