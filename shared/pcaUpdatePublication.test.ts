import { describe, expect, it } from "vitest";
import { publicationReferenceError } from "./pcaUpdatePublication";

describe("confirmação de publicação da atualização do PCA", () => {
  it("exige referência de publicação antes da confirmação", () => {
    expect(publicationReferenceError("   ")).toBe("Informe a referência, URL ou comprovante da publicação.");
    expect(publicationReferenceError("Diário Oficial nº 123")).toBeNull();
  });
});
