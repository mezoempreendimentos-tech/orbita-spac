import { desc } from "drizzle-orm";
import { localBackupExecutions } from "../drizzle/schema";
import { getDb } from "./db";

export type BackupExecutionForHealth = { status: "success" | "failed"; completedAt: Date };
export type BackupHealthStatus = "healthy" | "not_started" | "failed" | "overdue";

export function getBackupHealth(records: BackupExecutionForHealth[], now = new Date(), maxAgeDays = Number(process.env.BACKUP_MAX_AGE_DAYS ?? 8)) {
  const latest = records[0];
  if (!latest) return { status: "not_started" as const, severity: "warning" as const, message: "Nenhum backup local foi registrado. Execute uma cópia inicial para ativar o monitoramento.", lastCompletedAt: null };
  if (latest.status === "failed") return { status: "failed" as const, severity: "critical" as const, message: "O último backup local falhou. Verifique o histórico e execute uma nova cópia.", lastCompletedAt: latest.completedAt };
  const ageMs = now.getTime() - latest.completedAt.getTime();
  if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) return { status: "overdue" as const, severity: "critical" as const, message: `O último backup concluído excede ${maxAgeDays} dias. Verifique o agendamento semanal.`, lastCompletedAt: latest.completedAt };
  return { status: "healthy" as const, severity: "success" as const, message: "O último backup local foi concluído dentro do prazo previsto.", lastCompletedAt: latest.completedAt };
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export async function recordLocalBackupExecution(input: { status: "success" | "failed"; startedAt: Date; completedAt: Date; backupDirectory?: string; backupSizeBytes?: number; errorSummary?: string; source?: string }) {
  const db = await dbOrThrow();
  await db.insert(localBackupExecutions).values({
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    backupDirectory: input.backupDirectory?.slice(0, 1000),
    backupSizeBytes: input.backupSizeBytes === undefined ? undefined : String(Math.max(0, Math.trunc(input.backupSizeBytes))),
    errorSummary: input.errorSummary?.slice(0, 5000),
    source: input.source?.slice(0, 80) || "windows_powershell",
  });
}

export async function getLocalBackupStatus() {
  if (process.env.AUTH_MODE !== "local") return { enabled: false as const, health: null, history: [] };
  const db = await dbOrThrow();
  const history = await db.select().from(localBackupExecutions).orderBy(desc(localBackupExecutions.completedAt)).limit(12);
  return { enabled: true as const, health: getBackupHealth(history), history };
}

export async function getLocalBackupHealth() {
  if (process.env.AUTH_MODE !== "local") return { enabled: false as const, health: null };
  const db = await dbOrThrow();
  const latest = await db.select({ status: localBackupExecutions.status, completedAt: localBackupExecutions.completedAt }).from(localBackupExecutions).orderBy(desc(localBackupExecutions.completedAt)).limit(1);
  return { enabled: true as const, health: getBackupHealth(latest) };
}
