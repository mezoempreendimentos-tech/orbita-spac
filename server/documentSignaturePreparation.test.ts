import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { prepareGovbrSignature } from "./documentSignatureService";

function queryResult<T>(value: T) {
  const query: Record<string, unknown> = {};
  for (const method of ["from", "where", "limit", "orderBy"]) query[method] = () => query;
  query.then = (resolve: (result: T) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject);
  return query;
}

function database(selectResults: unknown[][]) {
  const inserts: unknown[] = [];
  return {
    inserts,
    select: () => queryResult(selectResults.shift() ?? []),
    insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: inserts.length }]; } }),
  };
}

describe("preparação auditável de assinatura gov.br", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOVBR_SIGNATURE_CLIENT_ID;
    delete process.env.GOVBR_SIGNATURE_CLIENT_SECRET;
    delete process.env.GOVBR_SIGNATURE_REDIRECT_URI;
  });

  it("cria solicitação pendente e evento de auditoria para documento de planejamento sem envio externo", async () => {
    const db = database([[{ role: "administrador" }], [{ id: 21 }]]);
    vi.mocked(getDb).mockResolvedValue(db as never);

    const prepared = await prepareGovbrSignature({ id: 7, role: "user" }, { documentScope: "planning", documentId: 21 });

    expect(prepared.status).toBe("awaiting_credentials");
    expect(prepared.readiness.configured).toBe(false);
    expect(db.inserts).toHaveLength(2);
    expect(db.inserts[0]).toMatchObject({ planningDocumentId: 21, requestedByUserId: 7, status: "awaiting_credentials" });
    expect(db.inserts[1]).toMatchObject({ eventType: "assinatura_govbr_preparada", actorUserId: 7 });
  });

  it("bloqueia conta sem perfil autorizado antes de consultar o documento", async () => {
    const db = database([[]]);
    vi.mocked(getDb).mockResolvedValue(db as never);

    await expect(prepareGovbrSignature({ id: 8, role: "user" }, { documentScope: "planning", documentId: 21 })).rejects.toThrow("A preparação de assinatura exige perfil");
    expect(db.inserts).toHaveLength(0);
  });
});
