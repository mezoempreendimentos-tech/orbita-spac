import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { createDemand, createOpeningRequest, submitConsolidationToPresidency } from "./planningService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[][]) {
  const inserts: unknown[] = [];
  const db = {
    inserts,
    select: () => queryResult(selectResults.shift() ?? []),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: inserts.length }]; } }),
    update: () => ({ set: () => ({ where: async () => ({}) }) }),
    transaction: async <T>(callback: (tx: typeof db) => Promise<T>) => callback(db),
  };
  return db;
}

function findAlert(inserts: unknown[]) {
  return inserts.find(value => !Array.isArray(value) && typeof value === "object" && value !== null && "entityType" in value && "dueAt" in value) as { entityType: string; dueAt: Date; severity?: string; title?: string } | undefined;
}

const requiredDemandData = { annualPlanItemId: 10, objectDescription: "Descrição detalhada da necessidade, do público atendido, do local de execução e do resultado esperado para a unidade demandante.", justification: "Necessidade institucional detalhada, com interesse público, consequências da não contratação, quantitativos e estimativa financeira devidamente fundamentada. ".repeat(20), supplyLineCnaeCode: "6201-5", supplyLineCnaeDescription: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", requesterCertified: true, items: [{ title: "Serviço especializado", objectDescription: "Serviço técnico com escopo institucional definido.", itemJustification: "Necessário para atender à necessidade institucional registrada.", quantity: "1", unitOfMeasure: "serviço", quantityJustification: "Quantidade compatível com a necessidade informada.", estimatedValue: "100.00", estimatedValueJustification: "Estimativa baseada em pesquisa prévia do demandante.", priceResearchCertified: true }] };

describe("criação de alertas com prazo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria DFD com alerta de triagem e dueAt", async () => {
    const db = database([[{ role: "demandante" }], [{ id: 1 }], [{ id: 10, requestingUnitId: 1, planStatus: "open" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await createDemand({ id: 1, role: "user" }, { unitId: 1, title: "Demanda de teste", objectDescription: "Descrição detalhada da demanda.", justification: "Justificativa institucional da demanda.", ...requiredDemandData });
    const alert = findAlert(db.inserts);
    expect(alert?.entityType).toBe("demand");
    expect(alert?.dueAt).toBeInstanceOf(Date);
  });

  it("persiste a indicação de gasto em exercícios financeiros futuros", async () => {
    const db = database([[{ role: "demandante" }], [{ id: 1 }], [{ id: 10, requestingUnitId: 1, planStatus: "open" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await createDemand({ id: 1, role: "user" }, { unitId: 1, title: "Demanda plurianual", objectDescription: "Descrição detalhada da necessidade com execução continuada.", justification: "Justificativa institucional para despesa em mais de um exercício.", hasFutureFiscalImpact: true, ...requiredDemandData });
    expect(db.inserts).toContainEqual(expect.objectContaining({ hasFutureFiscalImpact: true }));
  });

  it("destaca DFD superveniente com alerta de prazo de análise", async () => {
    const db = database([[{ role: "demandante" }], [{ id: 1 }], [{ id: 10, requestingUnitId: 1, planStatus: "open" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await createDemand({ id: 1, role: "user" }, { unitId: 1, title: "Demanda superveniente", objectDescription: "Descrição detalhada da necessidade superveniente.", justification: "Justificativa institucional da necessidade.", isSupervening: true, planningJustification: "Justificativa de planejamento suficiente.", ...requiredDemandData });
    const alert = findAlert(db.inserts);
    expect(alert).toMatchObject({ entityType: "demand", severity: "warning" });
    expect(alert?.title).toContain("superveniente recebida pelo Financeiro");
    expect(alert?.dueAt).toBeInstanceOf(Date);
  });

  it("cria PCA encaminhado à Presidência com alerta de prazo", async () => {
    const db = database([[{ role: "administrador" }], [{ id: 4, publicId: "PCA-1", status: "ready_for_review" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await submitConsolidationToPresidency({ id: 2, role: "user" }, "PCA-1");
    const alert = findAlert(db.inserts);
    expect(alert?.entityType).toBe("pca");
    expect(alert?.dueAt).toBeInstanceOf(Date);
  });

  it("cria solicitação de abertura com alerta de prazo", async () => {
    const db = database([[{ role: "compras" }], [{ id: 4, publicId: "DFD-1", status: "published_in_pca" }], [{ consolidationId: 2 }], []]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await createOpeningRequest({ id: 3, role: "user" }, { demandPublicId: "DFD-1", proposedWorkflowType: "direct_contracting", proposedModality: "Dispensa", justification: "Justificativa de abertura suficiente." });
    const alert = findAlert(db.inserts);
    expect(alert?.entityType).toBe("opening_request");
    expect(alert?.dueAt).toBeInstanceOf(Date);
  });
});
