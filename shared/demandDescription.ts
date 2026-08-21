export function detailedDemandDescriptionError(description: string) {
  const quantitativeReference = /\b\d+(?:[.,]\d+)?\s*(?:unidades?|itens?|metros?|m²|m3|quilogramas?|kg|litros?|l\b|dias?|meses?|horas?)\b/i;
  if (quantitativeReference.test(description)) return "Não informe quantitativos na descrição detalhada da DFD. Registre quantidade, unidade e justificativa em cada item.";
  return null;
}
