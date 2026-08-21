import { describe, expect, it } from "vitest";
import { SUPERVENING_PLANNING_JUSTIFICATION_MESSAGE, superveningPlanningJustificationError } from "./superveningDemand";

describe("superveningPlanningJustificationError", () => {
  it("dispensa justificativa para DFD prevista no planejamento", () => {
    expect(superveningPlanningJustificationError({ isSupervening: false, planningJustification: "" })).toBeNull();
  });

  it("exige justificativa com conteúdo mínimo para DFD superveniente", () => {
    expect(superveningPlanningJustificationError({ isSupervening: true, planningJustification: " curta " })).toBe(SUPERVENING_PLANNING_JUSTIFICATION_MESSAGE);
    expect(superveningPlanningJustificationError({ isSupervening: true, planningJustification: "Justificativa suficiente." })).toBeNull();
  });
});
