import { describe, expect, it } from "vitest";
import {
  canConsolidateDemand,
  canCreatePcaFromDemandConsolidation,
  canGeneratePcaArtifact,
  canInstantiateOpening,
  canPublishPca,
  canRequestOpening,
  canSubmitPca,
  isReferenceListItemValueValid,
  normalizeReferenceListCode,
  openingDecisionStatus,
  pcaDecisionStatus,
  shouldEscalatePlanningAlert,
} from "../shared/planningPolicies";

describe("fluxo institucional DFD–PCA–abertura", () => {
  it("permite a jornada positiva até a instauração somente após as decisões exigidas", () => {
    expect(canConsolidateDemand("accepted")).toBe(true);
    expect(canConsolidateDemand("partially_accepted")).toBe(true);
    expect(canCreatePcaFromDemandConsolidation("ready_for_pca")).toBe(true);
    expect(canGeneratePcaArtifact("draft")).toBe(true);
    expect(canSubmitPca("ready_for_review")).toBe(true);
    expect(pcaDecisionStatus("approve")).toBe("approved_for_publication");
    expect(canPublishPca("approved_for_publication")).toBe(true);
    expect(canRequestOpening("published_in_pca")).toBe(true);
    expect(openingDecisionStatus("authorize")).toBe("authorized");
    expect(canInstantiateOpening("authorized")).toBe(true);
  });

  it("bloqueia transições fora da ordem institucional", () => {
    expect(canConsolidateDemand("published_in_pca")).toBe(false);
    expect(canCreatePcaFromDemandConsolidation("included_in_pca")).toBe(false);
    expect(canGeneratePcaArtifact("presidency_review")).toBe(false);
    expect(canSubmitPca("draft")).toBe(false);
    expect(canPublishPca("presidency_review")).toBe(false);
    expect(canRequestOpening("grouped")).toBe(false);
    expect(canInstantiateOpening("presidency_review")).toBe(false);
  });

  it("mapeia devoluções e rejeições sem convertê-las em autorização", () => {
    expect(pcaDecisionStatus("return")).toBe("returned");
    expect(pcaDecisionStatus("reject")).toBe("rejected");
    expect(openingDecisionStatus("return")).toBe("returned");
    expect(openingDecisionStatus("reject")).toBe("rejected");
  });
});

describe("operações administrativas e alertas de planejamento", () => {
  it("normaliza códigos de listas e exige valores não vazios", () => {
    expect(normalizeReferenceListCode(" modalidades contratação ")).toBe("MODALIDADES_CONTRATA_O");
    expect(isReferenceListItemValueValid(" DISPENSA ")).toBe(true);
    expect(isReferenceListItemValueValid("   ")).toBe(false);
  });

  it("escalona somente alertas abertos ou reconhecidos que venceram", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    expect(shouldEscalatePlanningAlert({ status: "open", dueAt: new Date("2026-08-15T11:59:59Z") }, now)).toBe(true);
    expect(shouldEscalatePlanningAlert({ status: "acknowledged", dueAt: new Date("2026-08-15T12:00:00Z") }, now)).toBe(true);
    expect(shouldEscalatePlanningAlert({ status: "resolved", dueAt: new Date("2026-08-14T12:00:00Z") }, now)).toBe(false);
    expect(shouldEscalatePlanningAlert({ status: "open", dueAt: new Date("2026-08-16T12:00:00Z") }, now)).toBe(false);
  });
});
