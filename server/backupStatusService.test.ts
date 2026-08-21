import { describe, expect, it } from "vitest";
import { getBackupHealth } from "./backupStatusService";

describe("saúde dos backups locais", () => {
  const now = new Date("2026-08-21T12:00:00.000Z");

  it("alerta quando ainda não há execução registrada", () => {
    expect(getBackupHealth([], now).status).toBe("not_started");
  });

  it("prioriza uma falha recente e identifica execução atrasada", () => {
    expect(getBackupHealth([{ status: "failed", completedAt: now }], now).status).toBe("failed");
    expect(getBackupHealth([{ status: "success", completedAt: new Date("2026-08-12T12:00:00.000Z") }], now).status).toBe("overdue");
  });

  it("considera saudável uma cópia concluída dentro do período", () => {
    expect(getBackupHealth([{ status: "success", completedAt: new Date("2026-08-18T12:00:00.000Z") }], now).status).toBe("healthy");
  });
});
