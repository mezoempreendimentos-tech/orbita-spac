import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { createDemandConsolidation, registerDemandFinancialClassification } from "./planningTwoStageService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[]) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const db = {
    select: () => queryResult(selectResults.shift() ?? []),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: 1 }]; } }),
    update: () => ({ set: (value: unknown) => ({ where: async () => { updates.push(value); return {}; } }) }),
    transaction: async <T>(callback: (tx: typeof db) => Promise<T>) => callback(db),
  };
  return { db, inserts, updates };
}

describe("classificação financeira da DFD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite ao Financeiro registrar rubrica e ciência na trilha", async () => {
    const mocked = database([
      [{ role: "contabilidade" }],
      [{ id: 7, publicId: "DFD-1", status: "under_review" }],
    ]);
    vi.mocked(getDb).mockResolvedValue(mocked.db as never);

    await expect(registerDemandFinancialClassification(
      { id: 12, role: "user" },
      { demandPublicId: "DFD-1", budgetRubricCode: "339039", acknowledge: true, budgetNote: "Despesa corrente prevista para o exercício." },
    )).resolves.toEqual({ success: true, budgetRubricCode: "339039" });

    expect(mocked.updates).toContainEqual(expect.objectContaining({ budgetRubricCode: "339039", budgetAcknowledgedByUserId: 12, budgetNote: "Despesa corrente prevista para o exercício." }));
    expect(mocked.inserts).toContainEqual(expect.objectContaining({ demandId: 7, eventType: "financial_classified" }));
  });

  it("impede registro sem ciência ou por perfil que não seja Financeiro", async () => {
    const withoutAcknowledgement = database([[{ role: "contabilidade" }]]);
    vi.mocked(getDb).mockResolvedValue(withoutAcknowledgement.db as never);
    await expect(registerDemandFinancialClassification({ id: 12, role: "user" }, { demandPublicId: "DFD-1", budgetRubricCode: "339039", acknowledge: false })).rejects.toThrow("ciência do gasto");

    const wrongRole = database([[{ role: "demandante" }]]);
    vi.mocked(getDb).mockResolvedValue(wrongRole.db as never);
    await expect(registerDemandFinancialClassification({ id: 12, role: "user" }, { demandPublicId: "DFD-1", budgetRubricCode: "339039", acknowledge: true })).rejects.toThrow("perfil ativo do Financeiro");
  });

  it("bloqueia consolidação sem rubrica e ciência financeira", async () => {
    const mocked = database([
      [{ role: "administrador" }],
      [{ id: 7, publicId: "DFD-1", status: "accepted", budgetRubricCode: null, budgetAcknowledgedAt: null }],
    ]);
    vi.mocked(getDb).mockResolvedValue(mocked.db as never);

    await expect(createDemandConsolidation({ id: 1, role: "user" }, { title: "Consolidação de mobiliário", demandPublicIds: ["DFD-1"] })).rejects.toThrow("rubrica orçamentária e ciência");
  });
});
