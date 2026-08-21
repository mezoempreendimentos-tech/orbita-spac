import { describe, expect, it } from "vitest";
import { BIDDING_STEPS, DIRECT_CONTRACTING_STEPS, directStepByKey, workflowStepsFor } from "../shared/workflow";

describe("fluxo base de contratação direta", () => {
  it("mantém etapas com chaves únicas e sequência definida", () => {
    const keys = DIRECT_CONTRACTING_STEPS.map(step => step.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe("INITIAL_DEMAND");
    expect(keys.at(-1)).toBe("ARCHIVE");
  });

  it("atribui uma responsabilidade e checklist a cada etapa", () => {
    for (const step of DIRECT_CONTRACTING_STEPS) {
      expect(step.role.length).toBeGreaterThan(2);
      expect(step.checklist.length).toBeGreaterThan(10);
      expect(directStepByKey.get(step.key)).toEqual(step);
    }
  });

  it("preserva os marcos de decisão e encerramento do fluxo Bizagi", () => {
    const keys = DIRECT_CONTRACTING_STEPS.map(step => step.key);
    expect(keys).toContain("BUDGET");
    expect(keys).toContain("LEGAL");
    expect(keys).toContain("AUTHORIZATION");
    expect(keys).toContain("PUBLICATION");
    expect(keys).toContain("ARCHIVE");
  });

  it("configura a licitação com fases competitivas sem perder o núcleo de instrução", () => {
    const keys = BIDDING_STEPS.map(step => step.key);
    expect(keys).toContain("ETP");
    expect(keys).toContain("LEGAL");
    expect(keys).toContain("COMPETITIVE_SESSION");
    expect(keys).toContain("JUDGMENT");
    expect(keys).toContain("APPEALS");
    expect(keys).toContain("HOMOLOGATION");
    expect(workflowStepsFor("bidding")).toEqual(BIDDING_STEPS);
    expect(workflowStepsFor("direct_contracting")).toEqual(DIRECT_CONTRACTING_STEPS);
  });
});
