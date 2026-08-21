import { describe, expect, it } from "vitest";
import { importedDemandPublicId, mapImportedDfd, parseBrazilianCurrency, parseBrazilianDate } from "./demandImport";

describe("mapeamento de importação de DFD", () => {
  it("preserva a referência externa e converte moeda e data brasileiras", () => {
    const mapped = mapImportedDfd({
      reference: "188/2026",
      title: "  Impressão de Fotos e Fornecimento de Adesivos \n",
      estimatedValue: "R$ 350,00",
      desiredDate: "01/01/2027",
      sourceStatus: "Em andamento",
      sourceLink: "https://exemplo.gov.br/dfd/188",
    });

    expect(importedDemandPublicId("188/2026")).toBe("DFD-IMP-188-2026");
    expect(parseBrazilianCurrency("R$ 1.622.955,50")).toBe("1622955.50");
    expect(parseBrazilianDate("01/01/2027")).toBe("2027-01-01 12:00:00");
    expect(mapped).toMatchObject({
      publicId: "DFD-IMP-188-2026",
      title: "Impressão de Fotos e Fornecimento de Adesivos",
      estimatedValue: "350.00",
      desiredContractDate: "2027-01-01 12:00:00",
    });
    expect(mapped.planningJustification).toContain("188/2026");
  });
});
