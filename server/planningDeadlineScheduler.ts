import type { Request, Response } from "express";
import { refreshPlanningDeadlineAlerts } from "./planningService";
import { sdk } from "./_core/sdk";

export async function runPlanningDeadlineScheduler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await refreshPlanningDeadlineAlerts();
    return res.json({ ok: true, taskUid: user.taskUid, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, context: { path: req.path }, timestamp: new Date().toISOString() });
  }
}
