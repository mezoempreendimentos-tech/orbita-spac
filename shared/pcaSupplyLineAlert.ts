export function pcaSupplyLineAlertTitle(cnaeCode: string, total: number) {
  const value = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total);
  return `PCA: valor previsto para a linha de fornecimento ${cnaeCode} é ${value}.`;
}
