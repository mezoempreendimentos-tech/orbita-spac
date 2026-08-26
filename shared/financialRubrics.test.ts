import { describe, expect, it } from "vitest";

import { getFinancialRubricByCode, searchFinancialRubrics } from "./financialRubrics";

describe("catálogo de natureza de despesa até o elemento", () => {
  it("localiza 339039 pelo código completo", () => {
    expect(getFinancialRubricByCode("339039")).toMatchObject({
      code: "339039",
      dottedCode: "3.3.90.39",
      title: "OUTROS SERVIÇOS DE TERCEIROS - PESSOA JURÍDICA",
      applicationYear: 2027,
    });
  });

  it("normaliza um código pontuado e não aceita desdobramento", () => {
    expect(getFinancialRubricByCode("3.3.90.39")).toMatchObject({ code: "339039" });
    expect(getFinancialRubricByCode("3.3.90.39.01.00")).toBeUndefined();
  });

  it("retorna os elementos 3390xx para uma busca por prefixo", () => {
    const results = searchFinancialRubrics("3390", 100);
    expect(results.length).toBeGreaterThan(10);
    expect(results.every(item => item.code.startsWith("3390"))).toBe(true);
    expect(results.some(item => item.code === "339039")).toBe(true);
  });

  it("busca por descrição sem exigir acentos ou hífen", () => {
    const results = searchFinancialRubrics("outros servicos pessoa juridica", 100);
    expect(results.some(item => item.code === "339039")).toBe(true);
  });
});
