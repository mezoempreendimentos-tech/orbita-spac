import { describe, expect, it } from "vitest";
import { calculateOpeningQuantityBalance, isOpeningQuantityWithinBalance } from "./openingRequestQuantities";

describe("saldo quantitativo de abertura do PCA", () => {
  it("mantém 12 unidades após reservar 1 de um item com 13", () => {
    expect(calculateOpeningQuantityBalance("13", "1")).toEqual({ total: 13, reserved: 1, available: 12 });
  });

  it("permite nova abertura enquanto houver saldo e bloqueia excesso", () => {
    expect(isOpeningQuantityWithinBalance(1, 12)).toBe(true);
    expect(isOpeningQuantityWithinBalance(12, 12)).toBe(true);
    expect(isOpeningQuantityWithinBalance(13, 12)).toBe(false);
    expect(isOpeningQuantityWithinBalance(0, 12)).toBe(false);
  });

  it("não produz saldo negativo", () => {
    expect(calculateOpeningQuantityBalance(13, 20).available).toBe(0);
  });
});
