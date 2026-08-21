import { describe, expect, it } from "vitest";
import { unitOptionKey, uniqueUnitOptions } from "./unitOptions";

describe("opções de unidade institucional", () => {
  it("remove repetições por identificador e produz chaves únicas para a PORTA", () => {
    const units = uniqueUnitOptions([
      { id: 90001, name: "Câmara Municipal", code: "SPAC" },
      { id: 90001, name: "Câmara Municipal", code: "SPAC" },
      { id: 90002, name: "Setor de Compras", code: "COMPRAS" },
    ]);

    expect(units).toHaveLength(2);
    expect(units.map(unitOptionKey)).toEqual(["unidade-90001", "unidade-90002"]);
    expect(new Set(units.map(unitOptionKey)).size).toBe(units.length);
  });
});
