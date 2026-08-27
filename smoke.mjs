#!/usr/bin/env node
/**
 * Smoke E2E for the standalone build.
 *
 * Usage:  node smoke.mjs
 *
 * Assumes `docker compose --env-file environment up -d` has just been run and
 * the orbita container is at localhost:8080. Polls /api/health and the landing
 * page until the app answers (or 60s elapse), then asserts the contract:
 *   - /api/health returns 200, body has status:"ok", db:"ok", version:"x.y.z"
 *   - /api/version returns 200 with version field
 *   - / returns 200 with lang="pt-BR" and "ORB" in the title
 *   - mariadb has at least 40 tables (drizzle migrations applied)
 *
 * Exits 0 on success, non-zero with a clear diagnostic on any failure.
 *
 * Env vars (all optional):
 *   SMOKE_BASE              default http://localhost:8080
 *   SMOKE_MARIADB_CONTAINER default standalone-mariadb-1
 *   SMOKE_MARIADB_PASSWORD  if set, the script verifies the table count
 *   SMOKE_MIN_TABLES        default 40
 */
import { setTimeout as sleep } from "node:timers/promises";
import { spawn } from "node:child_process";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:8080";
const MARIADB = process.env.SMOKE_MARIADB_CONTAINER ?? "standalone-mariadb-1";
const MARIADB_PW = process.env.SMOKE_MARIADB_PASSWORD ?? "";
const MIN_TABLES = Number(process.env.SMOKE_MIN_TABLES ?? 40);
const TIMEOUT_MS = 60_000;

const log = (...a) => console.log("[smoke]", ...a);
const fail = (msg) => { console.error("[smoke] FAIL:", msg); process.exit(1); };

async function fetchWithTimeout(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 5_000);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function waitForHealthy() {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastErr = "no response yet";
  while (Date.now() < deadline) {
    try {
      const r = await fetchWithTimeout(`${BASE}/api/health`, { timeoutMs: 3_000 });
      if (r.status === 200) {
        const body = await r.json();
        if (body.db === "ok" && body.status === "ok") return body;
        lastErr = `unhealthy: ${JSON.stringify(body)}`;
      } else {
        lastErr = `HTTP ${r.status}`;
      }
    } catch (e) {
      lastErr = e?.message ?? String(e);
    }
    await sleep(1_000);
  }
  fail(`orbita never became healthy within ${TIMEOUT_MS / 1000}s: ${lastErr}`);
}

async function assertHealth(health) {
  if (health.status !== "ok") return fail(`status != "ok": ${health.status}`);
  if (health.db !== "ok") return fail(`db != "ok": ${health.db}`);
  if (!/^\d+\.\d+\.\d+/.test(health.version ?? "")) {
    return fail(`version not semver: ${health.version}`);
  }
  log(`health OK: status=${health.status} db=${health.db} version=${health.version} uptime=${health.uptime}s env=${health.env}`);
}

async function assertVersion() {
  const r = await fetchWithTimeout(`${BASE}/api/version`);
  if (r.status !== 200) return fail(`/api/version HTTP ${r.status}`);
  const v = await r.json();
  if (!v.version) return fail(`/api/version missing version: ${JSON.stringify(v)}`);
  log(`version OK: ${JSON.stringify(v)}`);
}

async function assertLanding() {
  const r = await fetchWithTimeout(`${BASE}/`);
  if (r.status !== 200) return fail(`/ HTTP ${r.status}`);
  const html = await r.text();
  if (!html.includes('lang="pt-BR"')) return fail('landing not pt-BR');
  // The brand ships as "ÓRBITA" (with diacritics) in the <title>/<meta> tags.
  // Normalize before matching so a future renameto "ORB" without accents still passes.
  const ascii = html.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!/ORBITA/i.test(ascii)) return fail('landing missing ORBITA brand');
  log(`landing OK (${html.length} bytes)`);
}

async function assertTableCount() {
  if (!MARIADB_PW) {
    log("skipping mariadb table count (SMOKE_MARIADB_PASSWORD not set)");
    return;
  }
  const result = await new Promise((resolve, reject) => {
    const p = spawn("docker", [
      "exec", MARIADB, "mariadb",
      "-uroot", `-p${MARIADB_PW}`,
      "-Nse",
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='orbita';",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => out += d.toString());
    p.stderr.on("data", (d) => err += d.toString());
    p.on("close", (code) => code === 0 ? resolve(out.trim()) : reject(new Error(`mariadb exit ${code}: ${err}`)));
  });
  const count = Number(result);
  if (!Number.isFinite(count) || count < MIN_TABLES) {
    return fail(`expected >= ${MIN_TABLES} tables, got ${count}`);
  }
  log(`mariadb OK: ${count} tables`);
}

(async () => {
  log(`target: ${BASE}`);
  const health = await waitForHealthy();
  await assertHealth(health);
  await assertVersion();
  await assertLanding();
  await assertTableCount();
  log("ALL SMOKE CHECKS PASSED");
})().catch((e) => fail(e?.stack ?? e?.message ?? String(e)));
