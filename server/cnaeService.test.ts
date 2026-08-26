import { afterEach, describe, expect, it, vi } from "vitest";
import { getOfficialCnaeSubclassByCode, resetCnaeCachesForTests, searchOfficialCnaeClasses, searchOfficialCnaeSubclasses } from "./cnaeService";

afterEach(() => { vi.unstubAllGlobals(); resetCnaeCachesForTests(); });

describe("consulta oficial de CNAE", () => {
  it("filtra código e descrição retornados pela API do IBGE", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "6201-5", descricao: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" }, { id: "0111-3", descricao: "CULTIVO DE CEREAIS" }] });
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchOfficialCnaeClasses("programas")).resolves.toEqual([{ code: "6201-5", description: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", label: "6201-5 — DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("consulta subclasse, preserva classe-base e reutiliza o cache oficial", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "6201500", descricao: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", classe: { id: "6201-5", descricao: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" } }] });
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchOfficialCnaeSubclasses("6201500")).resolves.toEqual([expect.objectContaining({ code: "6201-5/00", classCode: "6201-5", sourceUrl: expect.stringContaining("ibge.gov.br"), sourceVersion: expect.stringContaining("IBGE") })]);
    await expect(getOfficialCnaeSubclassByCode("6201-5/00")).resolves.toEqual(expect.objectContaining({ code: "6201-5/00", description: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", classDescription: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
