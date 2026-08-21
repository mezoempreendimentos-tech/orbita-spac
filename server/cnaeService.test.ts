import { afterEach, describe, expect, it, vi } from "vitest";
import { searchOfficialCnaeClasses } from "./cnaeService";

afterEach(() => vi.unstubAllGlobals());

describe("consulta oficial de CNAE", () => {
  it("filtra código e descrição retornados pela API do IBGE", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "6201-5", descricao: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" }, { id: "0111-3", descricao: "CULTIVO DE CEREAIS" }] });
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchOfficialCnaeClasses("programas")).resolves.toEqual([{ code: "6201-5", description: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", label: "6201-5 — DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
