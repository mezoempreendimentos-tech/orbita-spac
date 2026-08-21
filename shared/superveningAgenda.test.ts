import { describe, expect, it } from "vitest";
import { filterSuperveningDemands, superveningApprovalDeadlineAlerts } from "./superveningAgenda";

const rows = [
  { demand: { publicId: "DFD-1", isSupervening: true, status: "submitted" } },
  { demand: { publicId: "DFD-2", isSupervening: false, status: "submitted" } },
  { demand: { publicId: "DFD-3", isSupervening: true, status: "published_in_pca" } },
];

describe("superveningAgenda", () => {
  it("filtra somente DFDs supervenientes quando solicitado", () => {
    expect(filterSuperveningDemands(rows, true).map(row => row.demand.publicId)).toEqual(["DFD-1", "DFD-3"]);
    expect(filterSuperveningDemands(rows, false)).toHaveLength(3);
  });

  it("destaca prazo aberto apenas para superveniente ainda aguardando análise", () => {
    const alerts = [
      { entityType: "demand", entityPublicId: "DFD-1", dueAt: new Date("2026-08-21T12:00:00Z"), status: "open" },
      { entityType: "demand", entityPublicId: "DFD-3", dueAt: new Date("2026-08-22T12:00:00Z"), status: "open" },
    ];
    expect(superveningApprovalDeadlineAlerts(rows, alerts)).toEqual([{ demandPublicId: "DFD-1", dueAt: new Date("2026-08-21T12:00:00Z") }]);
  });
});
