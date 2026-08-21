import { describe, expect, it } from "vitest";
import { dashboardAlertKey } from "./dashboardAlerts";

describe("dashboardAlertKey", () => {
  it("distingue alertas com o mesmo identificador vindos de fontes diferentes", () => {
    expect(dashboardAlertKey({ id: 90001, source: "process" })).toBe("process-90001");
    expect(dashboardAlertKey({ id: 90001, source: "planning" })).toBe("planning-90001");
  });
});
