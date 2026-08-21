export type DemandReviewEventType = "analysis_started" | "complementation_requested" | "complementation_provided" | "approved" | "returned";

export type DemandReviewState = {
  code: "new" | "in_analysis" | "awaiting_complementation" | "complemented" | "approved";
  label: string;
  tone: "info" | "warning" | "success" | "neutral";
};

export function demandReviewState(status: string, events: Array<{ eventType: DemandReviewEventType; createdAt: Date | string }>): DemandReviewState {
  if (status === "accepted" || events.some(event => event.eventType === "approved")) return { code: "approved", label: "Analisada e aprovada", tone: "success" };
  const ordered = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = ordered[0]?.eventType;
  if (latest === "complementation_requested" || status === "returned") return { code: "awaiting_complementation", label: "Complementação solicitada", tone: "warning" };
  if (latest === "complementation_provided") return { code: "complemented", label: "Complementação recebida", tone: "info" };
  if (latest === "analysis_started" || status === "under_review") return { code: "in_analysis", label: "Em análise", tone: "info" };
  return { code: "new", label: "Ainda não analisada", tone: "neutral" };
}
