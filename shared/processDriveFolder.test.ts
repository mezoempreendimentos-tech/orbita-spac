import { describe, expect, it } from "vitest";
import { processDriveFolderUrl } from "./processDriveFolder";

describe("acesso à pasta do processo no Drive", () => {
  it("prioriza a URL vinculada ao processo", () => {
    expect(processDriveFolderUrl({ provider: "google_drive", folderId: "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05", folderUrl: "https://drive.google.com/drive/folders/pasta-existente" })).toBe("https://drive.google.com/drive/folders/pasta-existente");
  });

  it("monta a URL a partir do identificador para vínculos importados", () => {
    expect(processDriveFolderUrl({ provider: "google_drive", folderId: "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05" })).toBe("https://drive.google.com/drive/folders/16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05");
  });

  it("não oferece acesso para processo sem pasta ou provedor incompatível", () => {
    expect(processDriveFolderUrl({})).toBeNull();
    expect(processDriveFolderUrl({ provider: "outro_provedor", folderId: "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05" })).toBeNull();
  });
});
