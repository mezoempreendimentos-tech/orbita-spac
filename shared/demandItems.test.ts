import { describe, expect, it } from "vitest";
import { canIncludeNewDemandItem, demandItemValidationError, replaceConfirmedDemandItem, totalEstimatedValueOfDemandItems } from "./demandItems";

describe("itens repetíveis da DFD", () => {
  const validItem = { title: "Cadeira ergonômica", objectDescription: "Cadeira com regulagens e apoio lombar.", itemJustification: "Necessária para adequar os postos de trabalho.", quantity: "12", unitOfMeasure: "unidade", quantityJustification: "Quantidade compatível com os postos existentes.", estimatedValue: "750.00", estimatedValueJustification: "Estimativa baseada em cotações prévias do mercado.", priceResearchCertified: true };

  it("exige nome e especificação antes de confirmar o item", () => {
    expect(demandItemValidationError({ ...validItem, title: "Mesa" })).toContain("nome do item");
    expect(demandItemValidationError({ ...validItem, objectDescription: "Curta" })).toContain("especificação");
    expect(demandItemValidationError(validItem)).toBeNull();
  });

  it("exige justificativas e certificação para cada quantitativo e valor informado", () => {
    expect(demandItemValidationError({ ...validItem, itemJustification: "Curta" })).toContain("Justifique individualmente");
    expect(demandItemValidationError({ ...validItem, quantityJustification: "" })).toContain("Justifique a quantidade");
    expect(demandItemValidationError({ ...validItem, estimatedValueJustification: "" })).toContain("Justifique o valor");
    expect(demandItemValidationError({ ...validItem, priceResearchCertified: false })).toContain("pesquisa prévia");
  });

  it("libera a inclusão seguinte apenas depois da confirmação do item atual", () => {
    expect(canIncludeNewDemandItem([validItem], true)).toBe(false);
    expect(canIncludeNewDemandItem([validItem], false)).toBe(true);
  });

  it("consolida os valores declarados dos itens", () => {
    expect(totalEstimatedValueOfDemandItems([validItem, { ...validItem, estimatedValue: "1250.50" }])).toBe("2000.50");
    expect(totalEstimatedValueOfDemandItems([{ ...validItem, estimatedValue: undefined }])).toBeUndefined();
  });

  it("substitui apenas o item confirmado que foi reeditado", () => {
    const items = [{ ...validItem, localId: "item-1" }, { ...validItem, title: "Mesa de reunião", localId: "item-2" }];
    const result = replaceConfirmedDemandItem(items, "item-1", { ...validItem, title: "Cadeira presidente", estimatedValue: "980.00" });
    expect(result[0]).toMatchObject({ localId: "item-1", title: "Cadeira presidente", estimatedValue: "980.00" });
    expect(result[1]).toBe(items[1]);
  });
});
