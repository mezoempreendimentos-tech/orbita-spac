#!/usr/bin/env node
/**
 * Smoke E2E para auth local + cookies.
 * - login via /api/auth/local/login
 * - captura Set-Cookie (orbita_session + qualquer outro)
 * - logout via tRPC mutation /api/trpc/auth.logout
 * - valida que AMBOS os cookies foram invalidados
 *
 * Uso:
 *   node scripts/smoke-auth.mjs http://127.0.0.1:3000
 *   node scripts/smoke-auth.mjs https://blurred-scant-cried.ngrok-free.dev
 */
const BASE = process.argv[2] || "http://127.0.0.1:3000";
const EMAIL = process.env.LOCAL_ADMIN_EMAIL || "mezoempreendimentos@gmail.com";
const PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "senhateste1@#";

const HEADERS = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" };

const fetchJson = async (url, opts = {}) => {
  const r = await fetch(url, { ...opts, headers: { ...HEADERS, ...(opts.headers || {}) }, redirect: "manual" });
  return { status: r.status, headers: r.headers, body: await r.text() };
};

const dumpCookies = (hdrs) => {
  const raw = hdrs.getSetCookie ? hdrs.getSetCookie() : (hdrs.raw ? hdrs.raw()["set-cookie"] : []);
  return raw.map((s) => {
    const [pair] = s.split(";");
    const [name, ...rest] = pair.split("=");
    return { name: name.trim(), value: rest.join("=").trim(), raw: s };
  });
};

const fail = (msg) => { console.error("[smoke-auth] FAIL:", msg); process.exit(1); };
const log = (...a) => console.log("[smoke-auth]", ...a);

const main = async () => {
  log(`base = ${BASE}`);
  log(`step 1: POST /api/auth/local/login`);
  const login = await fetchJson(`${BASE}/api/auth/local/login`, {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (login.status !== 200) fail(`login HTTP ${login.status}: ${login.body}`);
  const cookies = dumpCookies(login.headers);
  log(`  HTTP 200 OK. cookies set: ${cookies.map((c) => c.name).join(", ") || "(none)"}`);
  const orbita = cookies.find((c) => c.name === "orbita_session");
  const legacy = cookies.find((c) => c.name === "app_session_id");
  if (!orbita) fail("login não devolveu cookie orbita_session");
  log(`  orbita_session = ${orbita.value.slice(0, 40)}... expira ${orbita.raw.match(/Max-Age=(\d+)/i)?.[0] ?? "?"}`);

  log(`step 2: POST /api/trpc/auth.logout (com cookie orbita_session)`);
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const logout = await fetchJson(`${BASE}/api/trpc/auth.logout?batch=1`, {
    method: "POST",
    body: JSON.stringify({ "0": { json: null, meta: { values: ["undefined"] } } }),
    headers: { "x-trpc-source": "client", Cookie: cookieHeader },
  });
  log(`  HTTP ${logout.status}`);
  log(`  body: ${logout.body.slice(0, 200)}`);
  const logoutCookies = dumpCookies(logout.headers);
  if (logoutCookies.length === 0) fail("logout não devolveu nenhum Set-Cookie (deveria limpar cookies)");
  log(`  Set-Cookie headers:`);
  for (const c of logoutCookies) log(`    ${c.name}: ${c.raw}`);
  const isCleared = (raw) => /Max-Age=(-|0)|expires=Thu, 01 Jan 1970/i.test(raw);

  const orbitaCleared = logoutCookies.find((c) => c.name === "orbita_session" && isCleared(c.raw));
  if (!orbitaCleared) fail("logout NÃO limpou orbita_session (cookie ainda ativo)");
  log(`  ✅ orbita_session foi limpo (${orbitaCleared.raw})`);

  // Validação extra: app_session_id (legado Manus) também é limpo, se existir
  const legacyCleared = logoutCookies.find((c) => c.name === "app_session_id");
  if (legacyCleared) {
    if (!isCleared(legacyCleared.raw)) {
      fail("logout NÃO limpou app_session_id (cookie legado)");
    }
    log(`  ✅ app_session_id também foi limpo (${legacyCleared.raw})`);
  } else {
    log(`  (app_session_id não foi emitido neste login — esperado se orbita_session é o único cookie local)`);
  }

  log(`step 3: GET /api/auth/me sem cookie — deve retornar não-autenticado`);
  const me = await fetchJson(`${BASE}/api/auth/me`);
  log(`  HTTP ${me.status} body=${me.body.slice(0, 200)}`);

  log(`step 4: GET /api/trpc/auth.me com o MESMO cookie orbita_session — deve falhar`);
  const meTrpc = await fetchJson(`${BASE}/api/trpc/auth.me`, {
    headers: { Cookie: cookieHeader },
  });
  log(`  HTTP ${meTrpc.status} body=${meTrpc.body.slice(0, 200)}`);

  log("✅ smoke-auth PASS");
};

main().catch((e) => fail(e?.stack || String(e)));
