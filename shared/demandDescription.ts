export const MIN_DEMAND_JUSTIFICATION_LENGTH = 1000;

export function detailedDemandJustificationError(justification: string) {
  if (justification.trim().length < MIN_DEMAND_JUSTIFICATION_LENGTH) {
    return `A justificativa da DFD está insuficiente. Escreva pelo menos ${MIN_DEMAND_JUSTIFICATION_LENGTH} caracteres, explicando com clareza a necessidade, o interesse público, as consequências da não contratação, os quantitativos e a estimativa apresentada. Não envie justificativas genéricas ou superficiais.`;
  }
  return null;
}

export function detailedDemandDescriptionError(description: string) {
  const quantitativeReference = /\b\d+(?:[.,]\d+)?\s*(?:unidades?|itens?|metros?|m²|m3|quilogramas?|kg|litros?|l\b|dias?|meses?|horas?)\b/i;
  if (quantitativeReference.test(description)) return "Não informe quantitativos na descrição detalhada da DFD. Registre quantidade, unidade e justificativa em cada item.";
  return null;
}
