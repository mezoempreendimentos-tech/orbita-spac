import { describe, expect, it } from "vitest";
import { createDfdVerificationCode } from "./dfdPdfVerificationService";

describe("código verificável da DFD", () => {
  it("emite um código assinado em duas partes para a revisão informada", () => {
    const code = createDfdVerificationCode({ v: 1, publicId: "DFD-2027-001", revision: "2026-08-20T12:00:00.000Z" });
    const [payload, signature] = code.split(".");
    expect(payload).toBeTruthy();
    expect(signature).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });
});
