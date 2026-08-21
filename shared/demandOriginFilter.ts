export type DemandOriginFilter = "all" | "isolated" | "consolidated";

export type DemandOriginRow<T> = T & { isConsolidated: boolean };

export function filterDemandRowsByOrigin<T>(rows: DemandOriginRow<T>[], filter: DemandOriginFilter) {
  if (filter === "all") return rows;
  return rows.filter(row => filter === "consolidated" ? row.isConsolidated : !row.isConsolidated);
}

export function demandOriginCounts<T>(rows: DemandOriginRow<T>[]) {
  const consolidated = rows.filter(row => row.isConsolidated).length;
  return { all: rows.length, consolidated, isolated: rows.length - consolidated };
}
