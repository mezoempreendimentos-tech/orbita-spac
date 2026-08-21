import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { createAnnualPlan, createSupplier, saveReferenceList } from "./adminService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[][]) {
  const inserts: unknown[] = [];
  return {
    inserts,
    select: () => queryResult(selectResults.shift() ?? []),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: inserts.length }]; } }),
    update: () => ({ set: () => ({ where: async () => ({}) }) }),
  };
}

describe("operações administrativas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria lista configurável normalizada e registra auditoria", async () => {
    const db = database([[]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(saveReferenceList({ id: 1 }, { code: " modalidades contratação ", label: "Modalidades" })).resolves.toEqual({ id: 1, code: "MODALIDADES_CONTRATA_O" });
    expect(db.inserts).toHaveLength(2);
  });

  it("impede duplicidade de fornecedor e permite cadastro novo com auditoria", async () => {
    const db = database([[]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(createSupplier({ id: 2 }, { legalName: "Fornecedor Testável Ltda.", taxId: "12.345.678/0001-90", status: "active" })).resolves.toEqual({ id: 1 });
    expect(db.inserts).toHaveLength(2);
  });

  it("cria planejamento anual quando ainda não há exercício cadastrado", async () => {
    const db = database([[]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(createAnnualPlan({ id: 3 }, { fiscalYear: 2030, title: "PCA 2030", status: "draft" })).resolves.toEqual({ id: 1 });
    expect(db.inserts).toHaveLength(2);
  });
});
