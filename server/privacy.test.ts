import { describe, expect, it } from "vitest";
import { canManagePrivacyByRole, derivePrivacySignals } from "../shared/privacy";

describe("sinalização configurável de privacidade", () => {
  const base = { containsPersonalData: true, containsSensitiveData: false, containsVulnerableData: false, largeScale: false, publicAreaMonitoring: false, solelyAutomatedDecision: false, externalSharing: false, internationalTransfer: false };

  it("não recomenda RIPD na ausência de critérios de revisão reforçada", () => {
    expect(derivePrivacySignals(base)).toMatchObject({ requiresReinforcedReview: false, ripdRecommended: false });
  });

  it("sinaliza revisão reforçada para dados sensíveis", () => {
    expect(derivePrivacySignals({ ...base, containsSensitiveData: true })).toMatchObject({ requiresReinforcedReview: true, ripdRecommended: false });
  });

  it("recomenda análise RIPD quando há critério geral e específico", () => {
    expect(derivePrivacySignals({ ...base, largeScale: true, containsSensitiveData: true })).toMatchObject({ generalCriterion: true, specificCriterion: true, ripdRecommended: true });
  });

  it("restringe a gestão LGPD a administração, jurídico e encarregado", () => {
    expect(canManagePrivacyByRole("user", ["demandante"])).toBe(false);
    expect(canManagePrivacyByRole("user", ["juridico"])).toBe(true);
    expect(canManagePrivacyByRole("user", ["encarregado_lgpd"])).toBe(true);
    expect(canManagePrivacyByRole("user", ["administrador"])).toBe(true);
    expect(canManagePrivacyByRole("admin", [])).toBe(true);
  });
});
