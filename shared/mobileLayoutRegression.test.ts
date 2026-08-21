import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("regressão de leitura em tela móvel", () => {
  it("mantém a triagem com um contêiner semântico e texto próprio para cada opção", () => {
    expect(home).toContain('<Field label="Sinais de atenção" full container>');
    expect(home).toContain('<span>A necessidade pode envolver dados pessoais</span>');
    expect(styles).toContain(".privacy-attention-options .checkbox-line,.planning-supervening-option{display:grid;grid-template-columns:20px minmax(0,1fr)");
  });

  it("mantém a necessidade superveniente em uma grade própria de caixa e texto", () => {
    expect(home).toContain('<Field label="Necessidade superveniente" full container>');
    expect(home).toContain('<label className="checkbox-line planning-supervening-option">');
    expect(home).toContain("Quando devo marcar esta opção?");
    expect(home).toContain("required={isSupervening}");
    expect(home).toContain("supervening-badge");
    expect(home).toContain("showOnlySupervening");
    expect(home).toContain("supervening-deadline");
    expect(styles).toContain(".planning-supervening-option{display:grid;grid-template-columns:20px minmax(0,1fr)");
  });

  it("move o status do MAPA para uma linha própria em telas estreitas", () => {
    expect(styles).toContain(".result-row{grid-template-columns:30px minmax(0,1fr)");
    expect(styles).toContain(".result-row .status{grid-column:2;justify-self:start");
  });

  it("mantém o controle individual da DFD utilizável em telas estreitas", () => {
    expect(home).toContain("function DemandControlDialog");
    expect(home).toContain("CONTROLE INDIVIDUAL DA DFD");
    expect(home).toContain("Abrir e acompanhar uma DFD");
    expect(styles).toContain(".demand-control-dialog{width:calc(100% - 1rem)");
    expect(styles).toContain(".demand-control-overview,.demand-detail-grid,.demand-action-panel{grid-template-columns:1fr}");
    expect(styles).toContain(".demand-action-buttons .button{width:100%;flex-basis:100%}");
  });

  it("mantém itens confirmados da PORTA compactos e legíveis em telas estreitas", () => {
    expect(home).toContain("function DemandItemsSequence");
    expect(home).toContain("Confirmar item");
    expect(home).toContain("Incluir novo item");
    expect(home).toContain("Confirme o item em preenchimento antes de enviar a DFD.");
    expect(styles).toContain(".demand-item-confirmed{grid-template-columns:28px minmax(0,1fr)");
    expect(styles).toContain(".demand-items-total{align-items:flex-start;flex-direction:column");
  });

  it("mantém a edição de item confirmável e utilizável em telas estreitas", () => {
    expect(home).toContain("ITEM EM EDIÇÃO");
    expect(home).toContain("Confirmar alterações");
    expect(home).toContain("Requer nova confirmação");
    expect(home).toContain("onClick={cancelEditor}");
    expect(styles).toContain(".demand-item-actions{grid-column:2;justify-items:start;grid-template-columns:repeat(2,max-content)");
  });

  it("mantém os filtros institucionais do MAPA utilizáveis em telas estreitas", () => {
    expect(home).toContain("map-type-filters");
    expect(home).toContain("map-result-groups");
    expect(home).toContain("mapaCategoryMeta[item].label");
    expect(home).toContain("mapaCategoryMeta[group.category].description");
    expect(styles).toContain(".map-type-filter{flex:1 1 calc(50% - 6px)");
    expect(styles).toContain(".map-result-group{padding:13px}");
  });

  it("mantém filtros avançados e prazos do MAPA legíveis em telas estreitas", () => {
    expect(home).toContain("map-advanced-filters");
    expect(home).toContain("Unidade requisitante");
    expect(home).toContain("Última atualização");
    expect(home).toContain("map-deadline-indicator overdue");
    expect(styles).toContain(".map-advanced-filters{grid-template-columns:1fr;padding:12px;gap:11px}");
    expect(styles).toContain(".map-result-group-heading{flex-direction:column}");
  });
});
