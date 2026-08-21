import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { decideConsolidation, decideOpeningRequest, instantiateAuthorizedProcess } from "./planningService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[][]) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const db = {
    inserts,
    updates,
    select: () => queryResult(selectResults.shift() ?? []),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: inserts.length }]; } }),
    update: () => ({ set: (value: unknown) => { updates.push(value); return { where: async () => ({}) }; } }),
    transaction: async <T>(callback: (tx: typeof db) => Promise<T>) => callback(db),
  };
  return db;
}

describe("decisões e instauração pelo serviço de planejamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registra aprovação de PCA somente pela autoridade competente e encerra o alerta", async () => {
    const db = database([[{ role: "autoridade_competente" }], [{ id: 4, publicId: "PCA-1", status: "presidency_review" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(decideConsolidation({ id: 7, role: "user" }, { consolidationPublicId: "PCA-1", action: "approve", notes: "Aprovação motivada." })).resolves.toEqual({ success: true });
    expect(db.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "approved_for_publication", decidedByUserId: 7 }), expect.objectContaining({ status: "resolved" })]));
  });

  it("autoriza abertura pela Presidência e devolve a DFD ao estado de abertura autorizada", async () => {
    const db = database([[{ role: "autoridade_competente" }], [{ id: 8, publicId: "ABR-1", status: "presidency_review", demandId: 5 }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(decideOpeningRequest({ id: 7, role: "user" }, { requestPublicId: "ABR-1", action: "authorize", notes: "Autorização motivada." })).resolves.toEqual({ success: true });
    expect(db.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "authorized", decidedByUserId: 7 }), expect.objectContaining({ status: "opening_authorized" })]));
  });

  it("instaura processo somente para abertura autorizada e cria a primeira etapa", async () => {
    const db = database([[{ role: "compras" }], [{ request: { id: 9, publicId: "ABR-1", status: "authorized", proposedWorkflowType: "direct_contracting", proposedModality: "Dispensa" }, demand: { id: 5, title: "Objeto da demanda", initialEstimatedValue: null, containsPersonalData: false, containsSensitiveData: false, privacyContext: null } }], []]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    const result = await instantiateAuthorizedProcess({ id: 3, role: "user" }, "ABR-1");
    expect(result.publicId).toMatch(/^CD-/);
    expect(db.inserts).toHaveLength(5);
    expect(db.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "instantiated" }), expect.objectContaining({ status: "process_instantiated" })]));
  });
});
