/**
 * GET /api/version — build metadata for ops/deploy tracking.
 *
 * Returns whatever build-time info is available. All fields are best-effort:
 * missing env vars or files just mean an empty string. Useful for verifying
 * which exact build is running in a given environment.
 *
 * The three env vars below are expected to be set at build time (e.g. by
 * `standalone/Dockerfile` via `docker build --build-arg` or by CI). When unset
 * (local dev), we read the package.json version and a "no-commit" placeholder.
 */
import type { Express, Request, Response } from "express";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

let cachedVersion: string | null = null;
function readVersion(): string {
  if (cachedVersion !== null) return cachedVersion;
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    for (const rel of ["..", "../..", "../../.."]) {
      const pkg = path.resolve(here, rel, "package.json");
      if (existsSync(pkg)) {
        const j = JSON.parse(readFileSync(pkg, "utf8")) as { version?: string };
        if (j.version) {
          cachedVersion = j.version;
          return j.version;
        }
      }
    }
  } catch {
    // fall through
  }
  cachedVersion = "0.0.0";
  return cachedVersion;
}

let cachedBuildTime: string | null = null;
function readBuildTime(): string {
  if (cachedBuildTime !== null) return cachedBuildTime;
  cachedBuildTime = process.env.BUILD_TIME ?? "unknown";
  return cachedBuildTime;
}

export function registerMetaRoute(app: Express): void {
  app.get("/api/version", (_req: Request, res: Response) => {
    res.json({
      version: readVersion(),
      commit: process.env.GIT_COMMIT ?? process.env.COMMIT_SHA ?? "no-commit",
      buildTime: readBuildTime(),
      node: process.versions.node,
    });
  });
}
