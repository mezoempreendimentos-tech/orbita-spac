import { describe, expect, it } from "vitest";
import { canDeactivateLocalAccount, localPasswordError } from "./localAccountPolicies";

describe("políticas de contas locais", () => {
  it("exige senhas fortes para criação e redefinição", () => {
    expect(localPasswordError("curta1")).toBe("A senha deve ter ao menos 12 caracteres.");
    expect(localPasswordError("somenteletraslongas")).toBe("A senha deve conter letras e números.");
    expect(localPasswordError("SenhaInstitucional2027")).toBeNull();
  });

  it("impede a inativação da própria conta administrativa", () => {
    expect(canDeactivateLocalAccount(8, 8)).toBe(false);
    expect(canDeactivateLocalAccount(8, 9)).toBe(true);
  });
});
