import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { refreshPlanningDeadlineAlerts } from "./planningService";

// Auth: the scheduler endpoint is invoked by an external cron (systemd timer,
// Windows Task Scheduler, GitHub Actions, etc.) and authenticates via a static
// shared secret. Set CRON_TOKEN to a 32+ char hex string. Falls back to
// BACKUP_REPORT_TOKEN if CRON_TOKEN is unset, so a single secret can guard
// both the backup report and the scheduler when convenient.
function authorizedCronRequest(req: Request): boolean {
  const expected = process.env.CRON_TOKEN?.trim() || process.env.BACKUP_REPORT_TOKEN?.trim();
  if (!expected) return false;
  const presented =
    (req.headers["x-cron-token"] as string | undefined)?.trim() ??
    (typeof req.query.token === "string" ? req.query.token.trim() : undefined);
  if (!presented) return false;
  // Constant-time compare so a timing oracle can't leak the secret byte-by-byte.
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function runPlanningDeadlineScheduler(req: Request, res: Response) {
  if (!authorizedCronRequest(req)) {
    return res.status(403).json({ error: "cron-only" });
  }
  try {
    const result = await refreshPlanningDeadlineAlerts();
    return res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, context: { path: req.path }, timestamp: new Date().toISOString() });
  }
}
