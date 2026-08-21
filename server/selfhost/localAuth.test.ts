import { describe, expect, it } from "vitest";
import { hashLocalPassword, isLocalMasterEmail, verifyLocalPassword } from "./localAuth";

describe("autenticação local", () => {
  it("protege a senha com hash e rejeita credenciais diferentes", () => {
    const hash = hashLocalPassword("senha-forte-institucional");
    expect(hash).not.toContain("senha-forte-institucional");
    expect(verifyLocalPassword("senha-forte-institucional", hash)).toBe(true);
    expect(verifyLocalPassword("senha-incorreta", hash)).toBe(false);
  });

  it("reconhece os e-mails mestres institucionais sem diferença de maiúsculas", () => {
    expect(isLocalMasterEmail("CARLOS@FOZDOIGUACU.PR.LEG.BR")).toBe(true);
    expect(isLocalMasterEmail("debora@fozdoiguacu.pr.leg.br")).toBe(true);
    expect(isLocalMasterEmail("servidor@fozdoiguacu.pr.leg.br")).toBe(false);
  });
});
