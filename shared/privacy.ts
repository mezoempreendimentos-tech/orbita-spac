export type PrivacySignalInput = {
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  containsVulnerableData: boolean;
  largeScale: boolean;
  publicAreaMonitoring: boolean;
  solelyAutomatedDecision: boolean;
  externalSharing: boolean;
  internationalTransfer: boolean;
};

export function derivePrivacySignals(input: PrivacySignalInput) {
  const generalCriterion = input.largeScale || input.solelyAutomatedDecision;
  const specificCriterion = input.containsSensitiveData || input.containsVulnerableData || input.publicAreaMonitoring || input.solelyAutomatedDecision;
  const requiresReinforcedReview = input.containsSensitiveData || input.containsVulnerableData || input.publicAreaMonitoring || input.solelyAutomatedDecision || input.externalSharing || input.internationalTransfer;
  const ripdRecommended = Boolean(input.containsPersonalData && generalCriterion && specificCriterion);
  return { generalCriterion, specificCriterion, requiresReinforcedReview, ripdRecommended };
}

export function canManagePrivacyByRole(platformRole: "user" | "admin", processRoles: string[]) {
  return platformRole === "admin" || processRoles.includes("administrador") || processRoles.includes("juridico") || processRoles.includes("encarregado_lgpd");
}
