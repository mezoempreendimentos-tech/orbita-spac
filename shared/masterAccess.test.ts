import { describe, expect, it } from "vitest";
import { isMasterAdminEmail } from "./masterAccess";

describe("acessos mestres institucionais", () => {
  it("reconhece os dois e-mails institucionais independentemente de maiúsculas e espaços", () => {
    expect(isMasterAdminEmail(" Carlos@FozDoIguacu.Pr.Leg.Br ")).toBe(true);
    expect(isMasterAdminEmail("debora@fozdoiguacu.pr.leg.br")).toBe(true);
  });

  it("não concede perfil mestre por domínio ou endereço aproximado", () => {
    expect(isMasterAdminEmail("outro@fozdoiguacu.pr.leg.br")).toBe(false);
    expect(isMasterAdminEmail("carlos@fozdoiguacu.pr.leg.com")).toBe(false);
  });
});
