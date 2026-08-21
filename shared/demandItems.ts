export type DemandItemInput = {
  title: string;
  objectDescription: string;
  quantity?: string;
  unitOfMeasure?: string;
  estimatedValue?: string;
  itemJustification?: string;
  quantityJustification?: string;
  estimatedValueJustification?: string;
  priceResearchCertified?: boolean;
};

export const MAX_DEMAND_ITEMS = 50;

export function demandItemValidationError(item: DemandItemInput) {
  if (item.title.trim().length < 5) return "Informe o nome do item com ao menos 5 caracteres.";
  if (item.objectDescription.trim().length < 10) return "Descreva a especificação do item com ao menos 10 caracteres.";
  if ((item.itemJustification?.trim().length ?? 0) < 10) return "Justifique individualmente a necessidade deste item.";
  if (item.quantity && !/^\d+(\.\d{1,4})?$/.test(item.quantity)) return "Informe uma quantidade numérica válida.";
  if (item.quantity && (item.quantityJustification?.trim().length ?? 0) < 5) return "Justifique a quantidade indicada para este item.";
  if (item.estimatedValue && !/^\d+(\.\d{1,2})?$/.test(item.estimatedValue)) return "Informe um valor estimado válido.";
  if (item.estimatedValue && (item.estimatedValueJustification?.trim().length ?? 0) < 5) return "Justifique o valor estimado indicado para este item.";
  if (item.estimatedValue && !item.priceResearchCertified) return "Certifique que o preço estimado foi baseado em pesquisa prévia realizada pelo demandante.";
  return null;
}

export function canIncludeNewDemandItem(confirmedItems: DemandItemInput[], itemBeingEdited: boolean) {
  return confirmedItems.length < MAX_DEMAND_ITEMS && !itemBeingEdited;
}

export function replaceConfirmedDemandItem<T extends DemandItemInput & { localId: string }>(items: T[], localId: string, replacement: DemandItemInput) {
  return items.map(item => item.localId === localId ? { ...item, ...replacement } : item);
}

export function totalEstimatedValueOfDemandItems(items: DemandItemInput[]) {
  const declaredValues = items.map(item => item.estimatedValue?.trim()).filter((value): value is string => Boolean(value));
  if (!declaredValues.length) return undefined;
  return declaredValues.reduce((total, value) => total + Number(value), 0).toFixed(2);
}
