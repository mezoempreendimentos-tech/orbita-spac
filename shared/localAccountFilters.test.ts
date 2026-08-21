import { describe, expect, it } from "vitest";
import { filterLocalAccounts } from "./localAccountFilters";

const accounts = [
  { name: "Débora Lima", email: "debora@fozdoiguacu.pr.leg.br", active: true },
  { name: "Carlos Kasper", email: "carlos@fozdoiguacu.pr.leg.br", active: true },
  { name: "Conta arquivada", email: "arquivo@fozdoiguacu.pr.leg.br", active: false },
];

describe("filtros de contas locais", () => {
  it("pesquisa nome e e-mail ignorando maiúsculas e acentuação", () => {
    expect(filterLocalAccounts(accounts, "debora", "all")).toHaveLength(1);
    expect(filterLocalAccounts(accounts, "KASPER", "all")[0]?.name).toBe("Carlos Kasper");
  });

  it("separa contas ativas e inativas", () => {
    expect(filterLocalAccounts(accounts, "", "active")).toHaveLength(2);
    expect(filterLocalAccounts(accounts, "", "inactive")).toEqual([accounts[2]]);
  });
});
