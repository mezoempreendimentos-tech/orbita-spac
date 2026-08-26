export const MIN_DEMAND_JUSTIFICATION_LENGTH = 1000;
export const MIN_DEMAND_DESCRIPTION_LENGTH = 60;
export const MAX_DEMAND_SUMMARY_LENGTH = 60;

export function detailedDemandJustificationError(justification: string) {
  if (justification.trim().length < MIN_DEMAND_JUSTIFICATION_LENGTH) {
    return `A justificativa da DFD está insuficiente. Escreva pelo menos ${MIN_DEMAND_JUSTIFICATION_LENGTH} caracteres, explicando com clareza a necessidade, o interesse público, as consequências da não contratação, os quantitativos e a estimativa apresentada. Não envie justificativas genéricas ou superficiais.`;
  }
  return null;
}

export function detailedDemandDescriptionError(description: string) {
  const quantitativeReference = /\b\d+(?:[.,]\d+)?\s*(?:unidades?|itens?|metros?|m²|m3|quilogramas?|kg|litros?|l\b|dias?|meses?|horas?)\b/i;
  if (quantitativeReference.test(description)) return "Não informe quantitativos na descrição detalhada da DFD. Registre quantidade, unidade e justificativa em cada item.";
  if (description.trim().length < MIN_DEMAND_DESCRIPTION_LENGTH) return `A descrição detalhada da DFD deve ter pelo menos ${MIN_DEMAND_DESCRIPTION_LENGTH} caracteres. Explique o que será feito, para quem, onde e qual resultado deve ser entregue.`;
  return null;
}
