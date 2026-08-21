import { describe, expect, it } from "vitest";
import { planningChecklistAllowedRoles, planningChecklistTemplateTypes } from "./planningService";

describe("regras de checklist do planejamento", () => {
  it("mapeia cada fase ao seu tipo de modelo institucional", () => {
    expect(planningChecklistTemplateTypes).toEqual({
      demand: "CHECKLIST_DFD",
      demand_consolidation: "CHECKLIST_CONSOLIDACAO_DEMANDAS",
      pca: "CHECKLIST_PCA",
      opening_request: "CHECKLIST_ABERTURA",
    });
  });

  it("preserva a segregação de funções na conclusão dos itens", () => {
    expect(planningChecklistAllowedRoles("demand")).toEqual(["demandante", "administrador"]);
    expect(planningChecklistAllowedRoles("demand_consolidation")).toEqual(["administrador"]);
    expect(planningChecklistAllowedRoles("pca")).toEqual(["administrador"]);
    expect(planningChecklistAllowedRoles("opening_request")).toEqual(["compras"]);
  });
});
