import { describe, expect, it } from "vitest";
import { demandPdfFileName } from "./demandPdfExport";

describe("exportação institucional da DFD", () => {
  it("gera nome de arquivo seguro a partir do identificador da demanda", () => {
    expect(demandPdfFileName("DFD 2027/001")).toBe("DFD-2027-001.pdf");
  });
});
