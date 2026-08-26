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
  heroAsset: "inline:orbit-sphere-art",
  logoAsset: "inline:orbit-sphere-art",
  aspectRatio: "16:9",
  treatment: "esfera de órbitas vetorial com luminosidade controlada",
  officialLabel: "Sistema Órbita",
  officialLogo: {
    orbitCount: 3,
    satelliteCount: 3,
    satelliteOrbitAssignments: ["diagonal superior-esquerda", "horizontal direita", "diagonal inferior-esquerda"],
    accessibleDescription: "Sistema Órbita: esfera de órbitas com três trajetórias cruzadas e três pontos de passagem, um em cada elipse, nas cores Azul Orbital, Violeta Conexão e Magenta Pulso.",
  },
} as const;

export function publicAccessLabel(authenticated: boolean) {
  return authenticated ? "Abrir área de trabalho" : "Entrar com conta institucional";
}
