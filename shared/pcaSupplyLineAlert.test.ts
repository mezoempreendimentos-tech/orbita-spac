import { describe, expect, it } from "vitest";
import { pcaSupplyLineAlertTitle } from "./pcaSupplyLineAlert";

describe("alerta de valor previsto por linha de fornecimento", () => {
  it("informa a linha CNAE e o valor total previsto no PCA", () => {
    expect(pcaSupplyLineAlertTitle("6201-5", 12500)).toBe("PCA: valor previsto para a linha de fornecimento 6201-5 é R$ 12.500,00.");
  });
});
