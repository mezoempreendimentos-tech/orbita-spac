import { describe, expect, it } from "vitest";
import { buildDfdCsv, matchesDfdSearch } from "./dfdListTools";

describe("ferramentas da listagem de DFDs", () => {
  const row = { publicId: "DFD-2027-014", title: "Aquisição de café e açúcar" };

  it("localiza por título ou número de DFD sem diferenciar acentuação", () => {
    expect(matchesDfdSearch(row, "aquisicao")).toBe(true);
    expect(matchesDfdSearch(row, "2027-014")).toBe(true);
    expect(matchesDfdSearch(row, "mobiliário")).toBe(false);
  });

  it("gera CSV em português com células escapadas", () => {
    const csv = buildDfdCsv([{ ...row, unitName: "SPAC", estimatedValue: "1500,00", origin: "DFD isolada", status: "Em triagem" }]);
    expect(csv).toContain("Número da DFD");
    expect(csv).toContain('"DFD-2027-014"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
});
