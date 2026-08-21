import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { createDemand, submitConsolidationToPresidency, decideConsolidation, createOpeningRequest, decideOpeningRequest, instantiateAuthorizedProcess } from "./planningService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function roleDatabase(role: string) {
  return { select: () => queryResult([{ role }]), insert: () => ({ values: async () => [{ insertId: 1 }] }), update: () => ({ set: () => ({ where: async () => ({}) }) }), transaction: async <T>(callback: (db: never) => Promise<T>) => callback(this as never) };
}

describe("bloqueios reais por papel no planejamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("impede Compras de criar DFD ou encaminhar PCA", async () => {
    vi.mocked(getDb).mockResolvedValue(roleDatabase("compras") as never);
    await expect(createDemand({ id: 1, role: "user" }, { unitId: 1, title: "DFD indevida", objectDescription: "Descrição suficientemente longa.", justification: "Justificativa suficientemente longa." })).rejects.toThrow("perfil de setor requisitante");
    await expect(submitConsolidationToPresidency({ id: 1, role: "user" }, "PCA-1")).rejects.toThrow("Diretoria de Administração");
  });

  it("impede Administração de deliberar PCA ou autorizar abertura", async () => {
    vi.mocked(getDb).mockResolvedValue(roleDatabase("administrador") as never);
    await expect(decideConsolidation({ id: 2, role: "user" }, { consolidationPublicId: "PCA-1", action: "approve", notes: "Tentativa indevida." })).rejects.toThrow("Presidência");
    await expect(decideOpeningRequest({ id: 2, role: "user" }, { requestPublicId: "ABR-1", action: "authorize", notes: "Tentativa indevida." })).rejects.toThrow("Presidência");
  });

  it("impede Demandante de solicitar abertura ou instaurar processo", async () => {
    vi.mocked(getDb).mockResolvedValue(roleDatabase("demandante") as never);
    await expect(createOpeningRequest({ id: 3, role: "user" }, { demandPublicId: "DFD-1", proposedWorkflowType: "direct_contracting", proposedModality: "Dispensa", justification: "Tentativa indevida de abertura." })).rejects.toThrow("Setor de Compras");
    await expect(instantiateAuthorizedProcess({ id: 3, role: "user" }, "ABR-1")).rejects.toThrow("Setor de Compras");
  });
});
