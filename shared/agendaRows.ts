export type AgendaRowIdentity = { id: number | string };

/**
 * Mantém a primeira ocorrência de cada registro operacional para que a
 * renderização de listas da AGENDA nunca receba chaves React repetidas.
 */
export function uniqueAgendaRows<T extends AgendaRowIdentity>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    const key = String(row.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
