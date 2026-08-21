import { describe, expect, it } from "vitest";
import { detailedDemandDescriptionError } from "./demandDescription";

describe("descrição detalhada da DFD", () => {
  it("impede quantitativo com unidade na descrição geral", () => {
    expect(detailedDemandDescriptionError("Aquisição de 20 unidades de cadeiras ergonômicas.")).toContain("Não informe quantitativos");
  });

  it("permite descrição de escopo sem quantitativo", () => {
    expect(detailedDemandDescriptionError("Aquisição de cadeiras ergonômicas com apoio lombar e regulagens.")).toBeNull();
  });
});
