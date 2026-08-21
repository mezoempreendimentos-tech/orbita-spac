export const mapaCategories = ["all", "dfd", "planning", "opening", "direct", "bidding"] as const;
export type MapaCategory = typeof mapaCategories[number];

export const mapaCategoryMeta: Record<MapaCategory, { label: string; description: string }> = {
  all: { label: "Todos", description: "Todos os registros institucionais" },
  dfd: { label: "DFDs", description: "Demandas formalizadas" },
  planning: { label: "Planejamento", description: "Consolidações e PCA" },
  opening: { label: "Aberturas", description: "Solicitações de abertura" },
  direct: { label: "Contratação direta", description: "Processos de contratação direta" },
  bidding: { label: "Licitações", description: "Processos licitatórios" },
};

export function mapaCategoryFor({ kind, workflowType }: { kind: "DFD" | "Consolidação" | "PCA" | "Abertura" | "Processo"; workflowType?: "direct_contracting" | "bidding" | null }): Exclude<MapaCategory, "all"> {
  if (kind === "DFD") return "dfd";
  if (kind === "Consolidação" || kind === "PCA") return "planning";
  if (kind === "Abertura") return "opening";
  return workflowType === "bidding" ? "bidding" : "direct";
}
