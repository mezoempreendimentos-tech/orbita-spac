import { describe, expect, it } from "vitest";
import { govbrSignatureReadiness } from "./documentSignatureService";

describe("preparação de assinatura gov.br", () => {
  it("mantém a solicitação aguardando credenciais quando a integração não está configurada", () => {
    expect(govbrSignatureReadiness(false)).toEqual({
      configured: false,
      status: "awaiting_credentials",
      message: "A assinatura gov.br está preparada, mas aguarda credenciais, URL de retorno e homologação institucional.",
    });
  });

  it("libera apenas a próxima etapa de autorização quando as credenciais estiverem configuradas", () => {
    expect(govbrSignatureReadiness(true)).toEqual({
      configured: true,
      status: "ready_for_authorization",
      message: "A integração gov.br está configurada para solicitar autorização de assinatura.",
    });
  });
});
