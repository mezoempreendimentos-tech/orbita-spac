export type OpeningQuantityBalance = {
  total: number;
  reserved: number;
  available: number;
};

export function calculateOpeningQuantityBalance(totalQuantity: string | number | null | undefined, reservedQuantity: string | number | null | undefined): OpeningQuantityBalance {
  const total = Math.max(0, Number(totalQuantity ?? 0));
  const reserved = Math.max(0, Number(reservedQuantity ?? 0));
  return { total, reserved, available: Math.max(0, total - reserved) };
}

export function isOpeningQuantityWithinBalance(quantity: string | number | null | undefined, availableQuantity: string | number | null | undefined) {
  const requested = Number(quantity ?? 0);
  const available = Number(availableQuantity ?? 0);
  return Number.isFinite(requested) && requested > 0 && Number.isFinite(available) && requested <= available + 0.000001;
}
