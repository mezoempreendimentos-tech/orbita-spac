import { describe, expect, it } from "vitest";
import { normalizeGoogleDriveFolderId, planGoogleDriveFolder } from "./googleDriveFolderPolicy";

describe("política institucional de pastas do Google Drive", () => {
  it("reaproveita a pasta individual já vinculada ao processo", () => {
    expect(planGoogleDriveFolder("https://drive.google.com/drive/folders/1PastAExIStente2027", "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05")).toEqual({
      folderId: "1PastAExIStente2027",
      reuseExistingFolder: true,
    });
  });

  it("usa a pasta institucional anual quando não houver vínculo individual", () => {
    expect(planGoogleDriveFolder(null, "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05")).toEqual({
      folderId: "16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05",
      reuseExistingFolder: false,
    });
  });

  it("aceita tanto links como identificadores de pasta", () => {
    expect(normalizeGoogleDriveFolderId(" https://drive.google.com/drive/folders/16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05 ")).toBe("16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05");
  });
});
