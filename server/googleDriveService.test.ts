import { describe, expect, it } from "vitest";
import { googleDriveOAuth, googleDriveStatusFor, INSTITUTIONAL_PROCESS_FOLDER_SETTING_KEY } from "./googleDriveService";

describe("autorização individual do Google Drive", () => {
  it("usa retorno HTTPS e os escopos necessários para Drive e documentos", () => {
    expect(googleDriveOAuth.redirectUri).toMatch(/^https:\/\//);
    expect(googleDriveOAuth.scopes).toContain("https://www.googleapis.com/auth/drive");
    expect(googleDriveOAuth.scopes).toContain("https://www.googleapis.com/auth/documents");
  });

  it("mantém uma chave institucional explícita para a pasta anual de processos", () => {
    expect(INSTITUTIONAL_PROCESS_FOLDER_SETTING_KEY).toBe("google-drive.process-folder-2027");
  });

  it("apresenta estados claros para credenciais, conexão e pasta de destino", () => {
    expect(googleDriveStatusFor(false, null).status).toBe("not_configured");
    expect(googleDriveStatusFor(true, null).status).toBe("not_connected");
    expect(googleDriveStatusFor(true, { revokedAt: new Date(), rootFolderId: "pasta" }).status).toBe("reconnect_required");
    expect(googleDriveStatusFor(true, { revokedAt: null, rootFolderId: null }).status).toBe("folder_required");
    expect(googleDriveStatusFor(true, { revokedAt: null, rootFolderId: "pasta" }).status).toBe("ready");
  });
});
