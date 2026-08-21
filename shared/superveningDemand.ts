export const SUPERVENING_PLANNING_JUSTIFICATION_MIN_LENGTH = 10;
export const SUPERVENING_PLANNING_JUSTIFICATION_MESSAGE = "Informe a justificativa do planejamento com pelo menos 10 caracteres para registrar uma necessidade superveniente.";

export function superveningPlanningJustificationError(input: { isSupervening?: boolean; planningJustification?: string }) {
  if (!input.isSupervening) return null;
  return (input.planningJustification?.trim().length ?? 0) >= SUPERVENING_PLANNING_JUSTIFICATION_MIN_LENGTH ? null : SUPERVENING_PLANNING_JUSTIFICATION_MESSAGE;
}
