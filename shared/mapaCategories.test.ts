import { describe, expect, it } from "vitest";
import { mapaCategoryFor, mapaCategoryMeta } from "./mapaCategories";

describe("categorias do MAPA", () => {
  it("separa DFD, planejamento e abertura antes da instauração", () => {
    expect(mapaCategoryFor({ kind: "DFD" })).toBe("dfd");
    expect(mapaCategoryFor({ kind: "Consolidação" })).toBe("planning");
    expect(mapaCategoryFor({ kind: "PCA" })).toBe("planning");
    expect(mapaCategoryFor({ kind: "Abertura" })).toBe("opening");
  });

  it("separa processos de contratação direta e licitação", () => {
    expect(mapaCategoryFor({ kind: "Processo", workflowType: "direct_contracting" })).toBe("direct");
    expect(mapaCategoryFor({ kind: "Processo", workflowType: "bidding" })).toBe("bidding");
    expect(mapaCategoryMeta.bidding.label).toBe("Licitações");
  });
});
