/**
 * GET /api/health — liveness + DB readiness.
 *
 * Returns 200 when the process is up AND the database is reachable.
 * Returns 503 when the DB is unreachable, so an external orchestrator
 * (Docker healthcheck, k8s, load balancer) can mark the instance down.
 *
 * Response shape:
 *   { status: "ok" | "degraded", db: "ok" | "down", uptime, version, timestamp }
 *
 * Kept tiny on purpose: no auth, no DB writes, no external calls beyond
 * a single `SELECT 1` against the configured DATABASE_URL.
 */
import type { Express, Request, Response } from "express";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";
// ENV intentionally not imported: this route must run in any environment,
// including bootstrap where env validation may not have completed yet.
// (See server/_core/env.ts for the typed accessor if you need it elsewhere.)

const STARTED_AT = Date.now();

function readVersion(): string {
  // package.json sits at the project root, two levels up from this file in
  // source layout (server/_core/health.ts) and one level up from the bundled
  // esbuild output (dist/index.js). Try both, and fall back to npm env vars
  // injected by `npm run` / `pnpm run`.
  const candidates = [
    process.env.npm_package_version,
    (() => {
      try {
        const here = path.dirname(fileURLToPath(import.meta.url));
        for (const rel of ["..", "../..", "../../.."]) {
          const pkg = path.resolve(here, rel, "package.json");
          if (existsSync(pkg)) {
            const j = JSON.parse(readFileSync(pkg, "utf8")) as { version?: string };
            if (j.version) return j.version;
          }
        }
      } catch {
        // fall through
      }
      return undefined;
    })(),
  ];
  return candidates.find((v): v is string => typeof v === "string" && v.length > 0) ?? "0.0.0";
}

async function pingDb(timeoutMs: number): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  let conn: mysql.Connection | null = null;
  try {
    conn = await Promise.race([
      mysql.createConnection({
        uri: url,
        connectTimeout: Math.min(timeoutMs, 3000),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("db connect timeout")), timeoutMs)
      ),
    ]);
    await conn.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // ignore
      }
    }
  }
}

export function registerHealthRoute(app: Express): void {
  app.get("/api/health", async (_req: Request, res: Response) => {
    const dbOk = await pingDb(2000);
    const body = {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "down",
      uptime: Math.round((Date.now() - STARTED_AT) / 1000),
      version: readVersion(),
      env: process.env.NODE_ENV ?? "unknown",
      timestamp: new Date().toISOString(),
    };
    res.status(dbOk ? 200 : 503).json(body);
  });
}
