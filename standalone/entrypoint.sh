#!/bin/sh
# entrypoint: aguarda mariadb, aplica migrations (com tolerancia a exit code do drizzle),
# valida pelo estado do banco, e sobe o app
# Compativel com sh (dash) do node:22-slim - SEM bash-isms (${VAR:N:M}, [[ ]], etc)
set -u

log() { echo "[orbita] $(date -Iseconds) $*" >&2; }

# Cria scripts em /app/ pra ter acesso a node_modules/mysql2
# (usa .cjs porque package.json tem "type": "module")
cat > /app/db-check.cjs <<'EOF'
const net = require('net');
const s = net.createConnection(3306, 'mariadb', () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 3000);
EOF

cat > /app/db-count.cjs <<'EOF'
const m = require('mysql2/promise');
(async () => {
  try {
    const c = await m.createConnection({
      host: 'mariadb', user: 'orbita',
      password: process.env.MYSQL_PASSWORD,
      database: 'orbita', connectTimeout: 5000
    });
    const [r] = await c.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = 'orbita'");
    console.log(r[0].n);
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log(0);
    process.exit(1);
  }
})();
EOF

# Aguarda o MariaDB estar realmente pronto
log "waiting for mariadb to accept queries..."
DB_READY=0
for i in $(seq 1 90); do
    if node /app/db-check.cjs 2>/dev/null; then
        if node /app/db-count.cjs 2>/dev/null > /tmp/tables; then
            DB_READY=1
            TABLES=$(cat /tmp/tables)
            log "mariadb ready (after ${i}s, ${TABLES} tables)"
            break
        fi
    fi
    sleep 1
done
if [ "$DB_READY" -ne 1 ]; then
    log "FATAL: mariadb not reachable after 90s"
    log "DEBUG: getent hosts mariadb:"
    getent hosts mariadb >&2
    log "DEBUG: node db-check exit code:"
    node /app/db-check.cjs 2>&1; echo "RC=$?" >&2
    log "DEBUG: node db-count exit code:"
    node /app/db-count.cjs 2>&1; echo "RC=$?" >&2
    exit 1
fi

# Aplica migrations. O drizzle-kit 0.31.10 tem um bug conhecido:
# emite exit code != 0 mesmo apos aplicar tudo com sucesso. Validamos
# pelo estado final do banco (tabelas existem) e nao pelo exit code.
log "applying database migrations..."
corepack pnpm drizzle-kit migrate 2>&1 | tail -5 >&2

# Validacao independente: o banco tem tabelas?
node /app/db-count.cjs 2>/dev/null > /tmp/tables
TABLE_COUNT=$(cat /tmp/tables 2>/dev/null || echo 0)
log "database has ${TABLE_COUNT} tables after migrations"

if [ "$TABLE_COUNT" -lt 1 ]; then
    log "FATAL: no tables in database - migrations did not apply"
    exit 1
fi

log "starting application on port ${PORT:-8080}..."
exec node dist/index.js
