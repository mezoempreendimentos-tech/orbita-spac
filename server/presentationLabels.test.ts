import { describe, expect, it } from "vitest";
import { presentationLabel, presentationRole, presentationStatus } from "../shared/presentationLabels";

describe("rótulos de apresentação em português", () => {
  it("traduz os valores técnicos conhecidos e nunca devolve o código interno", () => {
    expect(presentationLabel("CHECKLIST_DFD")).toBe("Checklist de DFD");
    expect(presentationLabel("demand_consolidation")).toBe("Consolidação de demandas");
    expect(presentationLabel("CHECKLIST_CONSOLIDACAO_DEMANDAS")).toBe("Checklist de consolidação de demandas");
    expect(presentationLabel("direct_contracting")).toBe("Contratação direta");
    expect(presentationLabel("UNKNOWN_INTERNAL_VALUE")).toBe("Informação institucional");
  });

  it("traduz estados e perfis, inclusive em fallback seguro", () => {
    expect(presentationStatus("awaiting_credentials")).toMatchObject({ text: "Aguardando credenciais", tone: "neutral" });
    expect(presentationStatus("needs_changes")).toMatchObject({ text: "Correções solicitadas", tone: "warning" });
    expect(presentationStatus("high")).toMatchObject({ text: "Alto", tone: "danger" });
    expect(presentationStatus("pending_review")).toMatchObject({ text: "Em revisão", tone: "warning" });
    expect(presentationStatus("ready_for_pca")).toMatchObject({ text: "Pronta para compor o PCA", tone: "success" });
    expect(presentationStatus("ready_for_review")).toMatchObject({ text: "Pronto para encaminhar", tone: "info" });
    expect(presentationStatus("unknown_status")).toMatchObject({ text: "Situação em atualização", tone: "neutral" });
    expect(presentationRole("administrador")).toBe("Administração");
    expect(presentationRole("unknown_role")).toBe("Perfil institucional não identificado");
  });
});
