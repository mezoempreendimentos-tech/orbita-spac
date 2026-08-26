import { describe, expect, it } from "vitest";
import { publicAccessLabel, publicLandingContent, publicLandingVisual } from "./landingPresentation";

describe("apresentação pública da ÓRBITA", () => {
  it("preserva uma mensagem institucional concisa e três princípios de confiança", () => {
    expect(publicLandingContent.title).toBe("Contratações públicas");
    expect(publicLandingContent.titleAccent).toBe("em contexto.");
    expect(publicLandingContent.principles).toHaveLength(3);
    expect(publicLandingContent.principles.map(item => item.title)).toEqual([
      "Fluxo institucional",
      "Decisão responsável",
      "Memória auditável",
    ]);
  });

  it("ajusta a ação de acesso à situação da sessão", () => {
    expect(publicAccessLabel(false)).toBe("Entrar com conta institucional");
    expect(publicAccessLabel(true)).toBe("Abrir área de trabalho");
  });

  it("preserva a esfera de órbitas vetorial centralizada na composição de acesso", () => {
    expect(publicLandingVisual.heroAsset).toBe("inline:orbit-sphere-art");
    expect(publicLandingVisual.aspectRatio).toBe("16:9");
    expect(publicLandingVisual.treatment).toBe("esfera de órbitas vetorial com luminosidade controlada");
  });

  it("define a marca oficial do Sistema Órbita como ativo compartilhado", () => {
    expect(publicLandingVisual.logoAsset).toBe("inline:orbit-sphere-art");
    expect(publicLandingVisual.officialLabel).toBe("Sistema Órbita");
  });

  it("preserva a geometria aprovada da marca oficial", () => {
    expect(publicLandingVisual.officialLogo.orbitCount).toBe(3);
    expect(publicLandingVisual.officialLogo.satelliteCount).toBe(3);
    expect(publicLandingVisual.officialLogo.satelliteOrbitAssignments).toEqual([
      "diagonal superior-esquerda",
      "horizontal direita",
      "diagonal inferior-esquerda",
    ]);
    expect(publicLandingVisual.officialLogo.accessibleDescription).toContain("um em cada elipse");
  });

  it("comprova uma esfera-satélite distinta para cada elipse da marca oficial", () => {
    const { orbitCount, satelliteCount, satelliteOrbitAssignments, accessibleDescription } = publicLandingVisual.officialLogo;

    expect(satelliteOrbitAssignments).toHaveLength(orbitCount);
    expect(new Set(satelliteOrbitAssignments).size).toBe(orbitCount);
    expect(satelliteCount).toBe(satelliteOrbitAssignments.length);
    expect(accessibleDescription).toContain("Sistema Órbita");
    expect(accessibleDescription).toContain("um em cada elipse");
  });
});
