import { timingSafeEqual } from "node:crypto";
import type { Express, Request } from "express";
import { recordLocalBackupExecution } from "../backupStatusService";

function requestToken(request: Request) {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : String(request.headers["x-orbita-backup-token"] ?? "").trim();
}

function tokensMatch(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function registerLocalBackupRoutes(app: Express) {
  app.post("/api/selfhost/backups/report", async (request, response) => {
    const expectedToken = process.env.BACKUP_REPORT_TOKEN?.trim();
    if (!expectedToken) return response.status(503).json({ error: "O recebimento de status de backup não foi configurado nesta instalação." });
    if (!tokensMatch(requestToken(request), expectedToken)) return response.status(401).json({ error: "Credencial de backup inválida." });
    const body = request.body as Record<string, unknown>;
    const status = body.status === "success" || body.status === "failed" ? body.status : null;
    const startedAt = new Date(String(body.startedAt ?? ""));
    const completedAt = new Date(String(body.completedAt ?? ""));
    const backupSizeBytes = body.backupSizeBytes === undefined ? undefined : Number(body.backupSizeBytes);
    if (!status || Number.isNaN(startedAt.getTime()) || Number.isNaN(completedAt.getTime()) || (backupSizeBytes !== undefined && (!Number.isFinite(backupSizeBytes) || backupSizeBytes < 0))) {
      return response.status(400).json({ error: "Relatório de backup inválido." });
    }
    try {
      await recordLocalBackupExecution({ status, startedAt, completedAt, backupDirectory: typeof body.backupDirectory === "string" ? body.backupDirectory : undefined, backupSizeBytes, errorSummary: typeof body.errorSummary === "string" ? body.errorSummary : undefined, source: "windows_powershell" });
      return response.status(201).json({ success: true });
    } catch (error) {
      console.error("[Backup] Falha ao registrar execução local:", error);
      return response.status(500).json({ error: "Não foi possível registrar a execução do backup." });
    }
  });
}
