import { describe, expect, it } from "vitest";
import { demandOriginCounts, filterDemandRowsByOrigin } from "./demandOriginFilter";

describe("filtro de origem das DFDs", () => {
  const rows = [
    { id: "DFD-1", isConsolidated: false },
    { id: "DFD-2", isConsolidated: true },
    { id: "DFD-3", isConsolidated: false },
  ];

  it("separa DFDs isoladas das que já passaram por consolidação", () => {
    expect(filterDemandRowsByOrigin(rows, "isolated").map(row => row.id)).toEqual(["DFD-1", "DFD-3"]);
    expect(filterDemandRowsByOrigin(rows, "consolidated").map(row => row.id)).toEqual(["DFD-2"]);
    expect(demandOriginCounts(rows)).toEqual({ all: 3, isolated: 2, consolidated: 1 });
  });
});
