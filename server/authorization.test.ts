import { describe, expect, it } from "vitest";
import { adminProcedure, router, protectedProcedure } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import { canActOnWorkflowByRole } from "../shared/authorization";

const protectedProbe = router({
  whoAmI: protectedProcedure.query(({ ctx }) => ctx.user.id),
});

const administrationProbe = router({
  canAccess: adminProcedure.query(() => true),
});

const authenticatedContext = {
  user: { id: 55, openId: "validated-user", name: "Validação", email: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: {} },
  res: {},
} as unknown as TrpcContext;

const anonymousContext = { user: null, req: { headers: {} }, res: {} } as unknown as TrpcContext;
const adminContext = {
  ...authenticatedContext,
  user: { ...authenticatedContext.user!, role: "admin" as const },
} as TrpcContext;

describe("autenticação e autorização de fluxos críticos", () => {
  it("exige um contexto autenticado nas procedures protegidas", async () => {
    await expect(protectedProbe.createCaller(anonymousContext).whoAmI()).rejects.toThrow();
    await expect(protectedProbe.createCaller(authenticatedContext).whoAmI()).resolves.toBe(55);
  });

  it("bloqueia perfil inadequado e permite o perfil responsável por checklist, tarefa, anexo e transição", () => {
    const demandante = ["demandante"];
    const compras = ["compras"];
    expect(canActOnWorkflowByRole("user", demandante, "chefia_compras")).toBe(false);
    expect(canActOnWorkflowByRole("user", compras, "demandante")).toBe(false);
    expect(canActOnWorkflowByRole("user", demandante, "demandante")).toBe(true);
    expect(canActOnWorkflowByRole("user", compras, "compras")).toBe(true);
  });

  it("preserva exceções controladas para administrador institucional e administrador da plataforma", () => {
    expect(canActOnWorkflowByRole("user", ["administrador"], "juridico")).toBe(true);
    expect(canActOnWorkflowByRole("admin", [], "autoridade_competente")).toBe(true);
  });

  it("restringe o módulo de Administração ao administrador da plataforma", async () => {
    await expect(administrationProbe.createCaller(authenticatedContext).canAccess()).rejects.toThrow();
    await expect(administrationProbe.createCaller(adminContext).canAccess()).resolves.toBe(true);
  });
});
