import { describe, expect, it } from "vitest";
import { demandReviewState } from "./demandReviewState";

describe("demandReviewState", () => {
  it("indica DFD ainda não analisada quando não há evento", () => {
    expect(demandReviewState("submitted", [])).toMatchObject({ code: "new", label: "Ainda não analisada" });
  });

  it("distingue complementação solicitada, recebida e aprovação", () => {
    expect(demandReviewState("returned", [{ eventType: "complementation_requested", createdAt: "2026-08-18T10:00:00Z" }])).toMatchObject({ code: "awaiting_complementation" });
    expect(demandReviewState("under_review", [{ eventType: "complementation_provided", createdAt: "2026-08-18T11:00:00Z" }])).toMatchObject({ code: "complemented" });
    expect(demandReviewState("accepted", [{ eventType: "approved", createdAt: "2026-08-18T12:00:00Z" }])).toMatchObject({ code: "approved" });
  });
});
