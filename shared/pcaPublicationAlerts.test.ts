import { describe, expect, it } from "vitest";
import { pcaUpdatesAwaitingPublication } from "./pcaPublicationAlerts";

describe("alertas de publicação de PCA", () => {
  it("identifica somente atualizações autorizadas que ainda não foram publicadas", () => {
    const pending = pcaUpdatesAwaitingPublication([{ publicId: "PCA-2027", title: "PCA anual 2027", updates: [{ publicId: "ATU-1", updateNumber: 1, status: "approved_for_publication" }, { publicId: "ATU-2", updateNumber: 2, status: "published" }] }]);
    expect(pending).toEqual([{ pcaPublicId: "PCA-2027", pcaTitle: "PCA anual 2027", updatePublicId: "ATU-1", updateNumber: 1 }]);
  });
});
