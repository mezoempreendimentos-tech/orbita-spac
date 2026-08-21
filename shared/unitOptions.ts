export type UnitOption = { id: number; name: string; code: string };

/**
 * A resposta de contexto pode conter a mesma unidade mais de uma vez quando
 * papéis institucionais são consolidados. O seletor deve exibir a unidade uma
 * única vez, pois o identificador é a referência usada no envio da DFD.
 */
export function uniqueUnitOptions(units: UnitOption[]) {
  const seen = new Set<number>();
  return units.filter(unit => {
    if (seen.has(unit.id)) return false;
    seen.add(unit.id);
    return true;
  });
}

export function unitOptionKey(unit: UnitOption) {
  return `unidade-${unit.id}`;
}
