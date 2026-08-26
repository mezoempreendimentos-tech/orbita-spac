export type PcaDecision = "approve" | "return" | "reject";
export type OpeningDecision = "authorize" | "return" | "reject";
export type DemandPresidencyDecision = "approve" | "partial" | "reject";

export const canConsolidateDemand = (status: string) => ["accepted", "partially_accepted"].includes(status);
export const canSubmitDemandToPresidency = (status: string) => ["submitted", "under_review", "returned"].includes(status);
export const canCreatePcaFromDemandConsolidation = (status: string) => status === "ready_for_pca";
export const canGeneratePcaArtifact = (status: string) => ["draft", "returned"].includes(status);
export const canSubmitPca = (status: string) => ["ready_for_review", "returned"].includes(status);
export const canPublishPca = (status: string) => status === "approved_for_publication";
export const canRequestOpening = (demandStatus: string) => demandStatus === "published_in_pca";
export const canInstantiateOpening = (openingStatus: string) => openingStatus === "authorized";
export const pcaDecisionStatus = (action: PcaDecision) => action === "approve" ? "approved_for_publication" : action === "return" ? "returned" : "rejected";
export const demandPresidencyDecisionStatus = (action: DemandPresidencyDecision) => action === "approve" ? "accepted" : action === "partial" ? "partially_accepted" : "rejected";
export const openingDecisionStatus = (action: OpeningDecision) => action === "authorize" ? "authorized" : action === "return" ? "returned" : "rejected";

export const normalizeReferenceListCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
export const isReferenceListItemValueValid = (value: string) => value.trim().length > 0;

export const shouldEscalatePlanningAlert = (alert: { status: "open" | "acknowledged" | "resolved"; dueAt: Date | null }, now = new Date()) => ["open", "acknowledged"].includes(alert.status) && Boolean(alert.dueAt) && (alert.dueAt as Date).getTime() <= now.getTime();
