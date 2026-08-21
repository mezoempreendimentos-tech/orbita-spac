import { describe, expect, it } from "vitest";
import { uniqueAgendaRows } from "./agendaRows";

describe("uniqueAgendaRows", () => {
  it("remove identificadores repetidos mantendo a primeira ocorrência", () => {
    expect(uniqueAgendaRows([
      { id: 90001, label: "Primeira DFD" },
      { id: 90001, label: "Registro repetido" },
      { id: 90002, label: "Segunda DFD" },
    ])).toEqual([
      { id: 90001, label: "Primeira DFD" },
      { id: 90002, label: "Segunda DFD" },
    ]);
  });
});
