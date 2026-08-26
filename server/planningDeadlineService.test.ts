import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { acknowledgePlanningAlert, refreshPlanningDeadlineAlerts } from "./planningService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy", "innerJoin", "leftJoin"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[][]) {
  const updates: unknown[] = [];
  const inserts: unknown[] = [];
  return {
    updates,
    inserts,
    select: () => queryResult(selectResults.shift() ?? []),
    update: () => ({ set: (value: unknown) => { updates.push(value); return { where: async () => ({}) }; } }),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: 1 }]; } }),
  };
}

describe("serviço de alertas de prazo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("escalona alertas vencidos reais para criticidade", async () => {
    const db = database([[{ id: 7, status: "open", dueAt: new Date(Date.now() - 1000) }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(refreshPlanningDeadlineAlerts()).resolves.toEqual({ overdueCount: 1, forwardedDemandCount: 0 });
    expect(db.updates).toEqual([{ severity: "critical" }]);
  });

  it("registra ciência de alerta com o perfil autorizado e cria auditoria", async () => {
    const db = database([[{ id: 11, entityType: "demand", entityPublicId: "DFD-ABC", status: "open" }], [{ role: "demandante" }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);
    await expect(acknowledgePlanningAlert({ id: 9, role: "user" }, 11)).resolves.toEqual({ success: true });
    expect(db.updates).toEqual([{ status: "acknowledged" }]);
    expect(db.inserts).toHaveLength(1);
  });
});
