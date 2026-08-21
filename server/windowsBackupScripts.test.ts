import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const backupScript = readFileSync(new URL("../standalone/windows/backup-orbita.ps1", import.meta.url), "utf8");
const installScript = readFileSync(new URL("../standalone/windows/install-weekly-backup.ps1", import.meta.url), "utf8");

describe("rotina de backup semanal no Windows", () => {
  it("inclui banco, arquivos, manifesto de integridade e retenção", () => {
    expect(backupScript).toContain("mariadb-dump");
    expect(backupScript).toContain("docker cp");
    expect(backupScript).toContain("Get-FileHash");
    expect(backupScript).toContain("Select-Object -Skip $KeepWeeks");
    expect(backupScript).toContain("/api/selfhost/backups/report");
    expect(backupScript).toContain("BACKUP_REPORT_TOKEN");
  });

  it("cria uma tarefa semanal interativa para o usuário do Docker Desktop", () => {
    expect(installScript).toContain("/SC WEEKLY");
    expect(installScript).toContain("/IT");
    expect(installScript).toContain("backup-orbita.ps1");
  });
});
