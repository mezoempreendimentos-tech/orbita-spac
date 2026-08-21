import { describe, expect, it } from "vitest";
import { hasPlanningPermission } from "./planningService";

describe("segregação de funções no planejamento", () => {
  it("permite que o setor requisitante crie DFD, sem permitir consolidação de PCA", () => {
    expect(hasPlanningPermission("user", ["demandante"], ["demandante"])).toBe(true);
    expect(hasPlanningPermission("user", ["demandante"], ["administrador"])).toBe(false);
  });

  it("restringe a consolidação e publicação do PCA à Administração", () => {
    expect(hasPlanningPermission("user", ["administrador"], ["administrador"])).toBe(true);
    expect(hasPlanningPermission("user", ["compras"], ["administrador"])).toBe(false);
  });

  it("reserva deliberações à Presidência e abertura de processo a Compras", () => {
    expect(hasPlanningPermission("user", ["autoridade_competente"], ["autoridade_competente"])).toBe(true);
    expect(hasPlanningPermission("user", ["compras"], ["autoridade_competente"])).toBe(false);
    expect(hasPlanningPermission("user", ["compras"], ["compras"])).toBe(true);
    expect(hasPlanningPermission("user", ["autoridade_competente"], ["compras"])).toBe(false);
  });

  it("permite a intervenção excepcional do administrador da plataforma", () => {
    expect(hasPlanningPermission("admin", [], ["compras"])).toBe(true);
  });
});
