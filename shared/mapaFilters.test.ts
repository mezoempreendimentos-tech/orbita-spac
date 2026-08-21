import { describe, expect, it } from "vitest";
import { deadlineSummary, filterMapaItems } from "./mapaFilters";

describe("filtros e prazos do MAPA", () => {
  const items = [
    { unitNames: ["SPAC"], createdAt: new Date("2026-08-01T12:00:00Z"), updatedAt: new Date("2026-08-10T12:00:00Z"), deadlineAlerts: [] },
    { unitNames: ["Diretoria Administrativa"], createdAt: new Date("2026-08-12T12:00:00Z"), updatedAt: new Date("2026-08-16T12:00:00Z"), deadlineAlerts: [] },
  ];

  it("filtra por unidade e por intervalo da data escolhida", () => {
    expect(filterMapaItems(items, { unitName: "SPAC", dateField: "createdAt" })).toHaveLength(1);
    expect(filterMapaItems(items, { unitName: "", dateField: "updatedAt", startDate: "2026-08-15", endDate: "2026-08-16" })).toEqual([items[1]]);
  });

  it("resume prazos pendentes e atrasados", () => {
    expect(deadlineSummary([{ dueAt: new Date("2026-08-17T12:00:00Z") }, { dueAt: new Date("2026-08-19T12:00:00Z") }, {}], new Date("2026-08-18T12:00:00Z"))).toEqual({ overdue: 1, pending: 1 });
  });
});
