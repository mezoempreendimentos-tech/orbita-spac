export const publicLandingContent = {
  eyebrow: "Plataforma operacional de contratações",
  title: "Contratações públicas",
  titleAccent: "em contexto.",
  description: "Uma plataforma institucional para organizar a demanda, conduzir as decisões e preservar a memória de cada contratação.",
  brandSubtitle: "Plataforma integrada de contratações",
  principles: [
    { title: "Fluxo institucional", description: "Da demanda à formalização" },
    { title: "Decisão responsável", description: "Segregação de funções e LGPD" },
    { title: "Memória auditável", description: "Documentos, eventos e prazos" },
  ],
} as const;

export const publicLandingVisual = {
  heroAsset: "/manus-storage/logo-oficial-pedestal-fundo-preto_606c670b.png",
  logoAsset: "/manus-storage/logo-oficial-pedestal-fundo-preto_606c670b.png",
  aspectRatio: "16:9",
  treatment: "logotipo orbital tridimensional centralizado",
  officialLabel: "Sistema Órbita",
  officialLogo: {
    orbitCount: 3,
    satelliteCount: 3,
    satelliteOrbitAssignments: ["diagonal superior-esquerda", "horizontal direita", "diagonal inferior-esquerda"],
    accessibleDescription: "Logotipo oficial do Sistema Órbita com três elipses, três satélites — um em cada elipse — e assinatura Sistema Órbita em azul.",
  },
} as const;

export function publicAccessLabel(authenticated: boolean) {
  return authenticated ? "Abrir área de trabalho" : "Entrar com conta institucional";
}
