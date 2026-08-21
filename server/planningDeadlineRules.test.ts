import { describe, expect, it } from "vitest";
import { deadlineAt, planningDeadlineDays } from "./planningService";

describe("regras de prazo do planejamento", () => {
  it("define prazos diferentes para DFD, PCA e solicitação de abertura", () => {
    expect(planningDeadlineDays).toEqual({ demand: 5, demand_consolidation: 3, pca: 3, opening_request: 2 });
  });

  it("calcula vencimento futuro em dias corridos", () => {
    const start = Date.now();
    const due = deadlineAt(2).getTime();
    expect(due).toBeGreaterThanOrEqual(start + 2 * 24 * 60 * 60 * 1000 - 50);
    expect(due).toBeLessThanOrEqual(Date.now() + 2 * 24 * 60 * 60 * 1000 + 50);
  });
});
