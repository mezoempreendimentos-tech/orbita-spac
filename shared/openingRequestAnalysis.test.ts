import { describe, expect, it } from "vitest";

import { analyzePcaOpeningMatches, hasRequiredOpeningAnalysis, relevantObjectTerms } from "./openingRequestAnalysis";

describe("análise informativa de abertura no PCA", () => {
  it("remove termos genéricos e preserva palavras relevantes", () => {
    expect(relevantObjectTerms("Contratação de serviço para capacitação em gestão pública")).toEqual(["capacitacao", "gestao", "publica"]);
  });

  it("detecta a mesma subclasse e a mesma classe-base separadamente", () => {
    const target = { pcaItemId: 1, title: "Capacitação em gestão pública", cnaeFinalCode: "8599-6/04", cnaeOriginalCode: "8599-6/04", cnaeBaseCode: "85996" };
    const sameSubclass = { pcaItemId: 2, title: "Capacitação em gestão pública avançada", cnaeFinalCode: "8599-6/04", cnaeOriginalCode: "8599-6/04", cnaeBaseCode: "85996" };
    const sameBase = { pcaItemId: 3, title: "Capacitação técnica institucional", cnaeFinalCode: "8599-6/05", cnaeOriginalCode: "8599-6/05", cnaeBaseCode: "85996" };
    const matches = analyzePcaOpeningMatches(target, [sameSubclass, sameBase]);
    expect(matches).toEqual(expect.arrayContaining([
      expect.objectContaining({ pcaItemId: 2, matchType: "same_subclass" }),
      expect.objectContaining({ pcaItemId: 3, matchType: "same_base_class" }),
    ]));
    expect(matches.some(match => match.pcaItemId === 3 && match.matchType === "same_subclass")).toBe(false);
  });

  it("exige declaração sempre e justificativa quando houver alerta", () => {
    expect(hasRequiredOpeningAnalysis(false, false)).toBe(false);
    expect(hasRequiredOpeningAnalysis(true, false)).toBe(true);
    expect(hasRequiredOpeningAnalysis(true, true)).toBe(false);
    expect(hasRequiredOpeningAnalysis(true, true, "Análise formal registrada.")).toBe(true);
  });
});
