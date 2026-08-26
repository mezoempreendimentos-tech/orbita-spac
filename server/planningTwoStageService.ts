import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  annualPlanItems,
  annualPlans,
  auditEvents,
  demandCaseEvents,
  demandConsolidationDemands,
  demandConsolidations,
  demandItems,
  demands,
  documentTemplates,
  openingRequests,
  organizationalUnits,
  planningAlerts,
  planningChecklistItems,
  planningConsolidationDemands,
  planningConsolidationGroups,
  planningConsolidations,
  planningDocuments,
  pcaUpdateDemands,
  pcaUpdates,
  procurementProcesses,
  processAlerts,
  referenceListItems,
  referenceLists,
  userProcessRoles,
  users,
} from "../drizzle/schema";
import { canConsolidateDemand, canCreatePcaFromDemandConsolidation, canGeneratePcaArtifact, canPublishPca, canRequestOpening, canSubmitDemandToPresidency, canSubmitPca, demandPresidencyDecisionStatus, pcaDecisionStatus } from "../shared/planningPolicies";
import { notifyDemandAudience, type NotificationDb } from "./notificationService";
import { getDb } from "./db";
import { storagePut } from "./storage";

type Actor = { id: number; role: "user" | "admin" };
type EntityType = "demand" | "demand_consolidation" | "pca" | "opening_request";
type DemandCaseEventType = "analysis_started" | "complementation_requested" | "complementation_provided" | "sent_to_presidency" | "approved" | "partially_approved" | "presidency_rejected" | "financial_classified" | "returned" | "procurement_completed";

const publicId = (prefix: string) => `${prefix}-${nanoid(10).toUpperCase()}`;
const deadlineAt = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

async function requireRole(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor, allowedRoles: string[], message: string) {
  if (actor.role === "admin") return;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  if (!roles.some(item => item.role === "administrador" || allowedRoles.includes(item.role))) throw new Error(message);
}

async function audit(db: Awaited<ReturnType<typeof dbOrThrow>>, actorUserId: number, eventType: string, summary: string, payload: Record<string, unknown>) {
  await db.insert(auditEvents).values({ actorUserId, eventType, summary, payload });
}

const demandManagementRoles = ["administrador", "chefia_compras", "compras", "instrumentalizacao"];
const demandPresidencyRoles = ["autoridade_competente"];

async function demandManagementAccess(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return true;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return roles.some(item => demandManagementRoles.includes(item.role));
}

async function demandReviewAccess(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return true;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return roles.some(item => demandManagementRoles.includes(item.role));
}

async function requireDemandReviewer(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor, message: string) {
  if (!await demandReviewAccess(db, actor)) throw new Error(message);
}

async function demandPresidencyAccess(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return true;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return roles.some(item => demandPresidencyRoles.includes(item.role));
}

async function demandFinancialAccess(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return true;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return roles.some(item => item.role === "contabilidade");
}

async function demandOpeningAccess(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return true;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return roles.some(item => item.role === "administrador" || item.role === "compras");
}

async function recordDemandCaseEvent(db: Awaited<ReturnType<typeof dbOrThrow>>, demandId: number, actorUserId: number | null, eventType: DemandCaseEventType, note?: string) {
  await db.insert(demandCaseEvents).values({ demandId, actorUserId, eventType, note: note?.trim() || null });
}

async function instantiateChecklist(db: Awaited<ReturnType<typeof dbOrThrow>>, entityType: EntityType, entityPublicId: string, templateType: string) {
  const templates = await db.select().from(documentTemplates).where(and(eq(documentTemplates.active, true), eq(documentTemplates.documentType, templateType)));
  const rows = templates.flatMap(template => (template.content ?? "").split(/\r?\n/).map(item => item.trim()).filter(Boolean).map((title, index) => ({ entityType, entityPublicId, templateCode: template.code, code: `${template.code}_${index + 1}`, title, required: true })));
  if (rows.length) await db.insert(planningChecklistItems).values(rows).onDuplicateKeyUpdate({ set: { required: true } });
}

type PcaDemandDetail = { id: number; publicId: string; title: string; unitName: string; estimatedValue: unknown; origin: string };

async function collectPcaDemandDetails(db: Awaited<ReturnType<typeof dbOrThrow>>, pcaId: number, currentUpdateId?: number): Promise<PcaDemandDetail[]> {
  const [groupedRows, directRows, publishedUpdateRows, currentUpdateRows] = await Promise.all([
    db.select({ demand: demands, unitName: organizationalUnits.name, group: demandConsolidations }).from(planningConsolidationGroups).innerJoin(demandConsolidations, eq(planningConsolidationGroups.demandConsolidationId, demandConsolidations.id)).innerJoin(demandConsolidationDemands, eq(demandConsolidationDemands.demandConsolidationId, demandConsolidations.id)).innerJoin(demands, eq(demandConsolidationDemands.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(eq(planningConsolidationGroups.planningConsolidationId, pcaId)).orderBy(asc(planningConsolidationGroups.sequence), asc(demandConsolidationDemands.sequence)),
    db.select({ demand: demands, unitName: organizationalUnits.name }).from(planningConsolidationDemands).innerJoin(demands, eq(planningConsolidationDemands.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(eq(planningConsolidationDemands.consolidationId, pcaId)).orderBy(asc(planningConsolidationDemands.sequence)),
    db.select({ demand: demands, unitName: organizationalUnits.name, update: pcaUpdates }).from(pcaUpdateDemands).innerJoin(pcaUpdates, eq(pcaUpdateDemands.pcaUpdateId, pcaUpdates.id)).innerJoin(demands, eq(pcaUpdateDemands.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(and(eq(pcaUpdates.pcaId, pcaId), eq(pcaUpdates.status, "published"))).orderBy(asc(pcaUpdates.updateNumber), asc(pcaUpdateDemands.sequence)),
    currentUpdateId ? db.select({ demand: demands, unitName: organizationalUnits.name }).from(pcaUpdateDemands).innerJoin(demands, eq(pcaUpdateDemands.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(eq(pcaUpdateDemands.pcaUpdateId, currentUpdateId)).orderBy(asc(pcaUpdateDemands.sequence)) : Promise.resolve([]),
  ]);
  const rows: PcaDemandDetail[] = [
    ...groupedRows.map(row => ({ id: row.demand.id, publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: row.group.title })),
    ...directRows.map(row => ({ id: row.demand.id, publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: "DFD incluída diretamente" })),
    ...publishedUpdateRows.map(row => ({ id: row.demand.id, publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: `Atualização ${row.update.updateNumber}` })),
    ...currentUpdateRows.map(row => ({ id: row.demand.id, publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: "Atualização em elaboração" })),
  ];
  return Array.from(new Map(rows.map(row => [row.id, row])).values());
}

export async function getTwoStagePlanningBoard() {
  const db = await dbOrThrow();
  const [demandRows, demandGroupRows, demandLinks, pcaRows, pcaGroupLinks, directPcaDemandLinks, pcaUpdateRows, pcaUpdateDemandLinks, openingRows, plans, planItems, documents, alerts, processAlertRows, checklists, activeLists, activeListItems] = await Promise.all([
    db.select({ demand: demands, unitName: organizationalUnits.name, requesterName: users.name }).from(demands).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).leftJoin(users, eq(demands.requesterUserId, users.id)).orderBy(desc(demands.updatedAt)),
    db.select().from(demandConsolidations).orderBy(desc(demandConsolidations.updatedAt)),
    db.select().from(demandConsolidationDemands).orderBy(asc(demandConsolidationDemands.sequence)),
    db.select().from(planningConsolidations).orderBy(desc(planningConsolidations.updatedAt)),
    db.select().from(planningConsolidationGroups).orderBy(asc(planningConsolidationGroups.sequence)),
    db.select().from(planningConsolidationDemands).orderBy(asc(planningConsolidationDemands.sequence)),
    db.select().from(pcaUpdates).orderBy(desc(pcaUpdates.updateNumber)),
    db.select().from(pcaUpdateDemands).orderBy(asc(pcaUpdateDemands.sequence)),
    db.select({ request: openingRequests, demandPublicId: demands.publicId, demandTitle: demands.title, unitName: organizationalUnits.name, pcaPublicId: planningConsolidations.publicId }).from(openingRequests).innerJoin(demands, eq(openingRequests.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).leftJoin(planningConsolidations, eq(openingRequests.pcaId, planningConsolidations.id)).orderBy(desc(openingRequests.updatedAt)),
    db.select().from(annualPlans).orderBy(desc(annualPlans.fiscalYear)),
    db.select({ item: annualPlanItems, planTitle: annualPlans.title, fiscalYear: annualPlans.fiscalYear, unitName: organizationalUnits.name }).from(annualPlanItems).innerJoin(annualPlans, eq(annualPlanItems.planId, annualPlans.id)).leftJoin(organizationalUnits, eq(annualPlanItems.requestingUnitId, organizationalUnits.id)).orderBy(desc(annualPlans.fiscalYear), asc(annualPlanItems.code)),
    db.select().from(planningDocuments).orderBy(desc(planningDocuments.createdAt)),
    db.select().from(planningAlerts).where(eq(planningAlerts.status, "open")).orderBy(desc(planningAlerts.createdAt)),
    db.select({ alert: processAlerts, processPublicId: procurementProcesses.publicId }).from(processAlerts).innerJoin(procurementProcesses, eq(processAlerts.processId, procurementProcesses.id)).where(eq(processAlerts.status, "open")).orderBy(desc(processAlerts.createdAt)),
    db.select().from(planningChecklistItems).orderBy(asc(planningChecklistItems.entityType), asc(planningChecklistItems.createdAt)),
    db.select().from(referenceLists).where(eq(referenceLists.active, true)).orderBy(asc(referenceLists.label)),
    db.select().from(referenceListItems).where(eq(referenceListItems.active, true)).orderBy(asc(referenceListItems.sortOrder), asc(referenceListItems.label)),
  ]);

  const groupDetail = (groupId: number) => {
    const demandIds = demandLinks.filter(link => link.demandConsolidationId === groupId).map(link => link.demandId);
    return demandRows.filter(row => demandIds.includes(row.demand.id)).map(row => ({ publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue }));
  };

  const demandConsolidationsWithDetails = demandGroupRows.map(group => {
    const pcaPublicIds = pcaGroupLinks.filter(link => link.demandConsolidationId === group.id).map(link => pcaRows.find(pca => pca.id === link.planningConsolidationId)?.publicId).filter(Boolean);
    return { ...group, demandDetails: groupDetail(group.id), pcaPublicIds };
  });

  const pcas = pcaRows.map(pca => {
    const groupIds = pcaGroupLinks.filter(link => link.planningConsolidationId === pca.id).map(link => link.demandConsolidationId);
    const groups = demandConsolidationsWithDetails.filter(group => groupIds.includes(group.id));
    const groupedDetails = groups.flatMap(group => group.demandDetails.map(demand => ({ ...demand, origin: group.title })));
    const directDemandIds = directPcaDemandLinks.filter(link => link.consolidationId === pca.id).map(link => link.demandId);
    const directDetails = demandRows.filter(row => directDemandIds.includes(row.demand.id)).map(row => ({ publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: "DFD incluída diretamente" }));
    const updates = pcaUpdateRows.filter(update => update.pcaId === pca.id).map(update => {
      const updateDemandIds = pcaUpdateDemandLinks.filter(link => link.pcaUpdateId === update.id).map(link => link.demandId);
      return { ...update, demandDetails: demandRows.filter(row => updateDemandIds.includes(row.demand.id)).map(row => ({ publicId: row.demand.publicId, title: row.demand.title, unitName: row.unitName, estimatedValue: row.demand.initialEstimatedValue, origin: `Atualização ${update.updateNumber}` })) };
    });
    const updateDetails = updates.filter(update => update.status === "published").flatMap(update => update.demandDetails);
    const demandDetails = Array.from(new Map([...groupedDetails, ...directDetails, ...updateDetails].map(demand => [demand.publicId, demand])).values());
    return { ...pca, demandConsolidationIds: groupIds, demandConsolidations: groups.map(group => ({ publicId: group.publicId, title: group.title, demandCount: group.demandDetails.length })), directDemandDetails: directDetails, updates, demandDetails };
  });

  return {
    demands: demandRows,
    demandConsolidations: demandConsolidationsWithDetails,
    pcas,
    openingRequests: openingRows,
    plans,
    planItems,
    documents,
    alerts,
    processAlerts: processAlertRows,
    checklists,
    referenceLists: activeLists.map(list => ({ ...list, items: activeListItems.filter(item => item.listId === list.id) })),
  };
}

export async function getDemandControl(actor: Actor, demandPublicId: string) {
  const db = await dbOrThrow();
  const [row] = await db.select({ demand: demands, unitName: organizationalUnits.name, requesterName: users.name }).from(demands).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).leftJoin(users, eq(demands.requesterUserId, users.id)).where(eq(demands.publicId, demandPublicId)).limit(1);
  if (!row) throw new Error("DFD não encontrada.");
  const canReview = await demandReviewAccess(db, actor);
  const canApprove = await demandPresidencyAccess(db, actor);
  const canFinancial = await demandFinancialAccess(db, actor);
  const canOpen = await demandOpeningAccess(db, actor);
  const canRespond = row.demand.requesterUserId === actor.id;
  if (!canReview && !canApprove && !canFinancial && !canRespond) throw new Error("Você não possui acesso a esta DFD.");
  const [events, documents, alerts, requests, processes, items] = await Promise.all([
    db.select({ event: demandCaseEvents, actorName: users.name }).from(demandCaseEvents).leftJoin(users, eq(demandCaseEvents.actorUserId, users.id)).where(eq(demandCaseEvents.demandId, row.demand.id)).orderBy(desc(demandCaseEvents.createdAt)),
    db.select().from(planningDocuments).where(and(eq(planningDocuments.entityType, "demand"), eq(planningDocuments.entityPublicId, demandPublicId))).orderBy(desc(planningDocuments.createdAt)),
    db.select().from(planningAlerts).where(eq(planningAlerts.entityPublicId, demandPublicId)).orderBy(desc(planningAlerts.createdAt)),
    db.select().from(openingRequests).where(eq(openingRequests.demandId, row.demand.id)).orderBy(desc(openingRequests.createdAt)).limit(1),
    db.select().from(procurementProcesses).where(eq(procurementProcesses.demandId, row.demand.id)).orderBy(desc(procurementProcesses.createdAt)).limit(1),
    db.select().from(demandItems).where(eq(demandItems.demandId, row.demand.id)).orderBy(asc(demandItems.sequence)),
  ]);
  const itemSummary = items.length ? `\n\nItens confirmados (${items.length}): ${items.map(item => `${item.sequence}. ${item.title}${item.quantity ? ` — ${item.quantity} ${item.unitOfMeasure || "unidade(s)"}` : ""}${item.estimatedValue ? ` · ${item.estimatedValue}` : ""}`).join("; ")}.` : "";
  return { ...row, documentObjectDescription: row.demand.objectDescription, demand: { ...row.demand, objectDescription: `${row.demand.objectDescription}${itemSummary}` }, events, documents: documents.map(document => ({ ...document, fileUrl: document.storageUrl })), alerts, openingRequest: requests[0] ?? null, process: processes[0] ?? null, items, canReview, canApprove, canFinancial, canOpen, canRespond };
}

export async function startDemandAnalysis(actor: Actor, demandPublicId: string, note?: string) {
  const db = await dbOrThrow();
  await requireDemandReviewer(db, actor, "A análise de DFD exige um perfil institucional ativo.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, demandPublicId)).limit(1);
  if (!demand || !["submitted", "under_review"].includes(demand.status)) throw new Error("Esta DFD não está disponível para iniciar análise.");
  await db.transaction(async tx => {
    if (demand.status === "submitted") await tx.update(demands).set({ status: "under_review" }).where(eq(demands.id, demand.id));
    await recordDemandCaseEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, demand.id, actor.id, "analysis_started", note);
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.analysis_started", `Análise iniciada na DFD ${demand.publicId}.`, { demandId: demand.id, demandPublicId, note: note?.trim() || null });
  });
  return { success: true };
}

export async function requestDemandComplementation(actor: Actor, input: { demandPublicId: string; note: string }) {
  const db = await dbOrThrow();
  await requireDemandReviewer(db, actor, "A solicitação de complementação exige um perfil institucional ativo.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!demand || !["submitted", "under_review"].includes(demand.status)) throw new Error("Esta DFD não está disponível para solicitação de complementação.");
  await db.transaction(async tx => {
    await tx.update(demands).set({ status: "returned" }).where(eq(demands.id, demand.id));
    await recordDemandCaseEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, demand.id, actor.id, "complementation_requested", input.note);
    await tx.insert(planningAlerts).values({ entityType: "demand", entityPublicId: demand.publicId, severity: "warning", title: "DFD devolvida ao setor requisitante para complementação.", dueAt: deadlineAt(5) });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.complementation_requested", `Complementação solicitada para a DFD ${demand.publicId}.`, { demandId: demand.id, demandPublicId: demand.publicId, note: input.note.trim() });
  });
  return { success: true };
}

export async function provideDemandComplementation(actor: Actor, input: { demandPublicId: string; note: string }) {
  const db = await dbOrThrow();
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!demand || demand.requesterUserId !== actor.id || demand.status !== "returned") throw new Error("Somente o setor requisitante pode complementar uma DFD devolvida.");
  await db.transaction(async tx => {
    await tx.update(demands).set({ status: "under_review" }).where(eq(demands.id, demand.id));
    await recordDemandCaseEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, demand.id, actor.id, "complementation_provided", input.note);
    await tx.insert(planningAlerts).values({ entityType: "demand", entityPublicId: demand.publicId, severity: "info", title: "Complementação recebida; DFD retornou à análise da Administração.", dueAt: deadlineAt(5) });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.complementation_provided", `Complementação registrada para a DFD ${demand.publicId}.`, { demandId: demand.id, demandPublicId: demand.publicId, note: input.note.trim() });
  });
  return { success: true };
}

export async function approveDemand(actor: Actor, input: { demandPublicId: string; note: string }) {
  return decideDemandAtPresidency(actor, { demandPublicId: input.demandPublicId, action: "approve", notes: input.note });
}

export async function registerDemandFinancialClassification(actor: Actor, input: { demandPublicId: string; budgetRubricCode: string; acknowledge: boolean; budgetNote?: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["contabilidade"], "A classificação orçamentária exige um perfil ativo do Financeiro.");
  const budgetRubricCode = input.budgetRubricCode.trim();
  if (!/^\d{4,12}$/.test(budgetRubricCode)) throw new Error("Informe inicialmente apenas o código numérico da rubrica, por exemplo: 339039.");
  if (!input.acknowledge) throw new Error("Confirme a ciência do gasto antes de registrar a rubrica.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  const allowedStatuses = ["financial_review", "submitted", "under_review", "returned", "presidency_review", "accepted", "partially_accepted"] as const;
  if (!demand || !allowedStatuses.includes(demand.status as typeof allowedStatuses[number])) throw new Error("Esta DFD não está disponível para classificação financeira.");
  const nextStatus = demand.status === "financial_review" ? "submitted" : demand.status;
  await db.transaction(async tx => {
    await tx.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "demand"), eq(planningAlerts.entityPublicId, demand.publicId), eq(planningAlerts.status, "open")));
    await tx.update(demands).set({ status: nextStatus, budgetRubricCode, budgetAcknowledgedAt: new Date(), budgetAcknowledgedByUserId: actor.id, budgetNote: input.budgetNote?.trim() || null }).where(eq(demands.id, demand.id));
    await tx.insert(planningAlerts).values({ entityType: "demand", entityPublicId: demand.publicId, severity: "info", title: "DFD classificada pelo Financeiro e disponível para triagem da Diretoria de Administração.", dueAt: deadlineAt(5) });
    await recordDemandCaseEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, demand.id, actor.id, "financial_classified", `Rubrica orçamentária indicada: ${budgetRubricCode}. Ciência do gasto registrada para planejamento e LOA.${input.budgetNote?.trim() ? ` Observação: ${input.budgetNote.trim()}` : ""}`);
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.financial_classified", `Financeiro registrou a rubrica orçamentária da DFD ${demand.publicId}.`, { demandId: demand.id, demandPublicId: demand.publicId, budgetRubricCode, budgetAcknowledgedAt: new Date().toISOString(), budgetNote: input.budgetNote?.trim() || null });
  });
  return { success: true, budgetRubricCode };
}

export async function decideDemandAtPresidency(actor: Actor, input: { demandPublicId: string; action: "approve" | "partial" | "reject"; notes: string; approvedItems?: { itemId: number; approvedValue?: string }[] }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["autoridade_competente"], "Somente a Presidência pode aceitar, aprovar parcialmente ou rejeitar uma DFD.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!demand || demand.status !== "presidency_review") throw new Error("Esta DFD ainda não está na caixa de decisão da Presidência.");
  const items = await db.select().from(demandItems).where(eq(demandItems.demandId, demand.id)).orderBy(asc(demandItems.sequence));
  if (!items.length) throw new Error("A DFD precisa conter itens antes da decisão presidencial.");
  const selected = new Map((input.approvedItems ?? []).map(item => [item.itemId, item]));
  if (input.action === "partial" && !selected.size) throw new Error("Na aprovação parcial, selecione ao menos um item aprovado.");
  if (input.action !== "reject" && input.action === "approve" && selected.size && selected.size !== items.length) throw new Error("A aprovação integral deve abranger todos os itens ou use aprovação parcial.");
  if (input.action !== "reject" && input.action === "partial" && Array.from(selected.keys()).some(id => !items.some(item => item.id === id))) throw new Error("Um ou mais itens selecionados não pertencem à DFD.");
  const approvedItems = input.action === "reject" ? [] : items.filter(item => input.action === "approve" || selected.has(item.id));
  const approvedTotal = approvedItems.reduce((total, item) => {
    const selectedValue = selected.get(item.id)?.approvedValue;
    const original = Number(item.estimatedValue ?? 0);
    const value = selectedValue === undefined ? original : Number(selectedValue);
    if (!Number.isFinite(value) || value < 0) throw new Error("Informe valores aprovados válidos para os itens selecionados.");
    if (original > 0 && value > original) throw new Error("O valor aprovado de um item não pode superar sua estimativa apresentada.");
    return total + value;
  }, 0);
  if (input.action !== "reject" && approvedTotal <= 0) throw new Error("A decisão deve aprovar ao menos um item com valor maior que zero.");
  const status = demandPresidencyDecisionStatus(input.action);
  await db.transaction(async tx => {
    await tx.update(demands).set({ status, presidencyDecisionNotes: input.notes.trim(), presidencyDecidedByUserId: actor.id, presidencyDecidedAt: new Date(), presidencyApprovedValue: input.action === "reject" ? "0.00" : approvedTotal.toFixed(2) }).where(eq(demands.id, demand.id));
    await tx.update(demandItems).set({ presidencyDecision: input.action === "reject" ? "rejected" : "approved", presidencyApprovedValue: null }).where(eq(demandItems.demandId, demand.id));
    if (approvedItems.length) {
      for (const item of approvedItems) {
        await tx.update(demandItems).set({ presidencyDecision: "approved", presidencyApprovedValue: (selected.get(item.id)?.approvedValue ?? item.estimatedValue ?? "0.00") }).where(eq(demandItems.id, item.id));
      }
    }
    await recordDemandCaseEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, demand.id, actor.id, input.action === "approve" ? "approved" : input.action === "partial" ? "partially_approved" : "presidency_rejected", input.notes);
    await tx.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "demand"), eq(planningAlerts.entityPublicId, demand.publicId), eq(planningAlerts.status, "open")));
    await notifyDemandAudience(tx as unknown as NotificationDb, { demandId: demand.id, requesterUserId: demand.requesterUserId, demandPublicId: demand.publicId, title: input.action === "reject" ? "DFD rejeitada pela Presidência" : input.action === "partial" ? "DFD aprovada parcialmente pela Presidência" : "DFD aprovada pela Presidência", body: `A DFD ${demand.publicId} — ${demand.title} recebeu decisão presidencial. Valor aprovado: ${input.action === "reject" ? "R$ 0,00" : `R$ ${approvedTotal.toFixed(2)}`}. Consulte a DFD para ver a motivação e os itens aprovados.`, notificationType: "demand_presidency_decision", idempotencyPrefix: `demand-presidency-decision:${demand.publicId}` });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, `demand.presidency_${input.action}`, `Presidência registrou decisão ${input.action} para a DFD ${demand.publicId}.`, { demandId: demand.id, demandPublicId: demand.publicId, approvedItemIds: approvedItems.map(item => item.id), approvedTotal, notes: input.notes.trim() });
  });
  return { success: true, status, approvedTotal: approvedTotal.toFixed(2) };
}

export async function createDemandConsolidation(actor: Actor, input: { title: string; demandPublicIds: string[]; notes?: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A consolidação de demandas é responsabilidade da Diretoria de Administração.");
  const publicIds = Array.from(new Set(input.demandPublicIds));
  const selected = await db.select().from(demands).where(inArray(demands.publicId, publicIds));
  if (!publicIds.length || selected.length !== publicIds.length) throw new Error("Selecione DFD válidas para formar a consolidação de demandas.");
  if (selected.some(demand => !canConsolidateDemand(demand.status))) throw new Error("Somente DFDs aceitas pela Presidência podem integrar uma nova consolidação.");
  if (selected.some(demand => !demand.budgetRubricCode || !demand.budgetAcknowledgedAt)) throw new Error("Todas as DFDs selecionadas precisam ter rubrica orçamentária e ciência do Financeiro registradas antes da consolidação.");
  const demandConsolidationPublicId = publicId("CON");
  return db.transaction(async tx => {
    const result = await tx.insert(demandConsolidations).values({ publicId: demandConsolidationPublicId, title: input.title.trim(), notes: input.notes?.trim() || null, status: "ready_for_pca", createdByUserId: actor.id });
    const id = Number(result[0].insertId);
    await tx.insert(demandConsolidationDemands).values(selected.map((demand, index) => ({ demandConsolidationId: id, demandId: demand.id, sequence: index + 1 })));
    await tx.update(demands).set({ status: "grouped" }).where(inArray(demands.id, selected.map(demand => demand.id)));
    await instantiateChecklist(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, "demand_consolidation", demandConsolidationPublicId, "CHECKLIST_CONSOLIDACAO_DEMANDAS");
    await tx.insert(planningAlerts).values({ entityType: "demand_consolidation", entityPublicId: demandConsolidationPublicId, severity: "info", title: "Consolidação de demandas pronta para integrar o PCA.", dueAt: deadlineAt(3) });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand_consolidation.created", `Consolidação ${demandConsolidationPublicId} criada com ${selected.length} DFD(s).`, { demandConsolidationId: id, demandPublicIds: publicIds });
    return { id, publicId: demandConsolidationPublicId };
  });
}

export async function createPca(actor: Actor, input: { title: string; planId: number; demandConsolidationPublicIds: string[]; demandPublicIds?: string[] }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A elaboração do PCA é responsabilidade da Diretoria de Administração.");
  const groupPublicIds = Array.from(new Set(input.demandConsolidationPublicIds));
  const demandPublicIds = Array.from(new Set(input.demandPublicIds ?? []));
  if (!groupPublicIds.length && !demandPublicIds.length) throw new Error("Selecione ao menos uma consolidação de demandas ou uma DFD isolada para elaborar o PCA.");
  const selectedGroups = groupPublicIds.length ? await db.select().from(demandConsolidations).where(inArray(demandConsolidations.publicId, groupPublicIds)) : [];
  const selectedDemands = demandPublicIds.length ? await db.select().from(demands).where(inArray(demands.publicId, demandPublicIds)) : [];
  if (selectedGroups.length !== groupPublicIds.length) throw new Error("Selecione consolidações de demandas válidas para elaborar o PCA.");
  if (selectedDemands.length !== demandPublicIds.length) throw new Error("Selecione DFD válidas para incluir diretamente no PCA.");
  if (selectedGroups.some(group => !canCreatePcaFromDemandConsolidation(group.status))) throw new Error("Somente consolidações prontas podem integrar um novo PCA.");
  if (selectedDemands.some(demand => !canConsolidateDemand(demand.status))) throw new Error("Somente DFDs aceitas pela Presidência podem ser incluídas diretamente no PCA.");
  if (selectedDemands.some(demand => !demand.budgetRubricCode || !demand.budgetAcknowledgedAt)) throw new Error("Todas as DFDs selecionadas precisam ter rubrica orçamentária e ciência do Financeiro registradas antes de integrar o PCA.");
  const [plan] = await db.select({ id: annualPlans.id, fiscalYear: annualPlans.fiscalYear }).from(annualPlans).where(eq(annualPlans.id, input.planId)).limit(1);
  if (!plan) throw new Error("O planejamento anual selecionado não está disponível.");
  const [existingPca] = await db.select({ publicId: planningConsolidations.publicId }).from(planningConsolidations).where(eq(planningConsolidations.planId, input.planId)).limit(1);
  if (existingPca) throw new Error(`Já existe um PCA para o exercício selecionado (${existingPca.publicId}). Utilize a atualização do PCA anual.`);
  const pcaPublicId = publicId("PCA");
  return db.transaction(async tx => {
    const result = await tx.insert(planningConsolidations).values({ publicId: pcaPublicId, title: input.title.trim(), planId: input.planId, status: "draft", createdByUserId: actor.id });
    const id = Number(result[0].insertId);
    if (selectedGroups.length) await tx.insert(planningConsolidationGroups).values(selectedGroups.map((group, index) => ({ planningConsolidationId: id, demandConsolidationId: group.id, sequence: index + 1 })));
    if (selectedDemands.length) await tx.insert(planningConsolidationDemands).values(selectedDemands.map((demand, index) => ({ consolidationId: id, demandId: demand.id, sequence: index + 1 })));
    if (selectedGroups.length) await tx.update(demandConsolidations).set({ status: "included_in_pca" }).where(inArray(demandConsolidations.id, selectedGroups.map(group => group.id)));
    if (selectedDemands.length) await tx.update(demands).set({ status: "awaiting_pca_publication" }).where(inArray(demands.id, selectedDemands.map(demand => demand.id)));
    await instantiateChecklist(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, "pca", pcaPublicId, "CHECKLIST_PCA");
    await tx.insert(planningAlerts).values({ entityType: "pca", entityPublicId: pcaPublicId, severity: "info", title: "PCA criado; gere o documento único antes de encaminhar à Presidência." });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.created", `PCA anual ${pcaPublicId} criado para ${plan.fiscalYear}.`, { pcaId: id, fiscalYear: plan.fiscalYear, demandConsolidationPublicIds: groupPublicIds, directDemandPublicIds: demandPublicIds });
    return { id, publicId: pcaPublicId };
  });
}

export async function createPcaUpdate(actor: Actor, input: { pcaPublicId: string; title?: string; demandPublicIds: string[] }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A atualização do PCA é responsabilidade da Diretoria de Administração.");
  const demandPublicIds = Array.from(new Set(input.demandPublicIds));
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, input.pcaPublicId)).limit(1);
  if (!pca || pca.status !== "published") throw new Error("Somente um PCA anual já publicado pode receber atualização.");
  if (!demandPublicIds.length) throw new Error("Selecione ao menos uma DFD para a atualização do PCA.");
  const selectedDemands = await db.select().from(demands).where(inArray(demands.publicId, demandPublicIds));
  if (selectedDemands.length !== demandPublicIds.length) throw new Error("Selecione DFD válidas para atualizar o PCA.");
  if (selectedDemands.some(demand => !["submitted", "under_review", "accepted", "returned"].includes(demand.status))) throw new Error("Somente DFD em triagem podem ser encaminhadas para atualização do PCA.");
  if (selectedDemands.some(demand => !demand.budgetRubricCode || !demand.budgetAcknowledgedAt)) throw new Error("Todas as DFDs selecionadas precisam ter rubrica orçamentária e ciência do Financeiro registradas antes da atualização do PCA.");
  const existingDemandIds = new Set((await collectPcaDemandDetails(db, pca.id)).map(demand => demand.id));
  if (selectedDemands.some(demand => existingDemandIds.has(demand.id))) throw new Error("Uma ou mais DFD já integram o PCA anual publicado.");
  const [activeUpdate] = await db.select({ publicId: pcaUpdates.publicId }).from(pcaUpdates).where(and(eq(pcaUpdates.pcaId, pca.id), inArray(pcaUpdates.status, ["draft", "ready_for_review", "presidency_review", "approved_for_publication", "returned"]))).limit(1);
  if (activeUpdate) throw new Error(`Já existe uma atualização em andamento para este PCA (${activeUpdate.publicId}).`);
  const [lastUpdate] = await db.select({ updateNumber: pcaUpdates.updateNumber }).from(pcaUpdates).where(eq(pcaUpdates.pcaId, pca.id)).orderBy(desc(pcaUpdates.updateNumber)).limit(1);
  const updateNumber = Number(lastUpdate?.updateNumber ?? 0) + 1;
  const updatePublicId = publicId("ATU-PCA");
  return db.transaction(async tx => {
    const result = await tx.insert(pcaUpdates).values({ publicId: updatePublicId, pcaId: pca.id, updateNumber, title: input.title?.trim() || `Atualização ${updateNumber} do ${pca.title}`, status: "draft", createdByUserId: actor.id });
    const id = Number(result[0].insertId);
    await tx.insert(pcaUpdateDemands).values(selectedDemands.map((demand, index) => ({ pcaUpdateId: id, demandId: demand.id, sequence: index + 1 })));
    await tx.update(demands).set({ status: "awaiting_pca_publication" }).where(inArray(demands.id, selectedDemands.map(demand => demand.id)));
    await instantiateChecklist(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, "pca", updatePublicId, "CHECKLIST_PCA");
    await tx.insert(planningAlerts).values({ entityType: "pca", entityPublicId: updatePublicId, severity: "info", title: `Atualização ${updateNumber} do PCA criada; gere o documento revisado antes do encaminhamento.` });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.update_created", `Atualização ${updatePublicId} criada para o PCA ${pca.publicId}.`, { pcaId: pca.id, pcaUpdateId: id, updateNumber, demandPublicIds });
    return { id, publicId: updatePublicId, updateNumber };
  });
}

export async function generatePcaUpdateArtifact(actor: Actor, pcaUpdatePublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A preparação do documento de atualização é responsabilidade da Diretoria de Administração.");
  const [update] = await db.select().from(pcaUpdates).where(eq(pcaUpdates.publicId, pcaUpdatePublicId)).limit(1);
  if (!update || !canGeneratePcaArtifact(update.status)) throw new Error("Esta atualização não está disponível para geração de documento.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.id, update.pcaId)).limit(1);
  if (!pca) throw new Error("O PCA vinculado à atualização não foi encontrado.");
  const rows = await collectPcaDemandDetails(db, pca.id, update.id);
  if (!rows.length) throw new Error("A atualização precisa conter ao menos uma DFD para gerar o documento revisado.");
  const escape = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const table = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escape(row.origin)}</td><td>${escape(row.publicId)}</td><td>${escape(row.unitName)}</td><td>${escape(row.title)}</td><td>${escape(row.estimatedValue ?? "—")}</td></tr>`).join("");
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escape(update.title)}</title><style>body{font-family:Arial,sans-serif;color:#14213d;padding:36px}h1{font-size:22px}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:12px}th,td{border:1px solid #b8c4d6;padding:8px;text-align:left}th{background:#eaf0f8}footer{margin-top:24px;color:#5b6677;font-size:11px}</style><body><h1>Atualização do Plano de Contratações Anual — PCA</h1><p><strong>PCA:</strong> ${escape(pca.publicId)}<br><strong>Atualização:</strong> ${escape(update.publicId)}<br><strong>Título:</strong> ${escape(update.title)}<br><strong>Demandas no PCA após atualização:</strong> ${rows.length}</p><h2>Tabela consolidada de demandas</h2><table><thead><tr><th>#</th><th>Origem</th><th>DFD</th><th>Unidade requisitante</th><th>Objeto</th><th>Estimativa inicial</th></tr></thead><tbody>${table}</tbody></table><footer>Documento revisado gerado pela ÓRBITA para deliberação e publicação da atualização do PCA.</footer></body></html>`;
  const stored = await storagePut(`planning/pca/${pca.publicId}/updates/${update.publicId}.html`, html, "text/html; charset=utf-8");
  await db.transaction(async tx => {
    await tx.update(pcaUpdates).set({ documentKey: stored.key, documentUrl: stored.url, status: "ready_for_review" }).where(eq(pcaUpdates.id, update.id));
    const prior = await tx.select({ id: planningDocuments.id }).from(planningDocuments).where(and(eq(planningDocuments.entityType, "pca"), eq(planningDocuments.entityPublicId, update.publicId), eq(planningDocuments.documentType, "Atualização do PCA")));
    await tx.insert(planningDocuments).values({ entityType: "pca", entityPublicId: update.publicId, documentType: "Atualização do PCA", title: update.title, version: prior.length + 1, storageKey: stored.key, storageUrl: stored.url, mimeType: "text/html", sizeBytes: Buffer.byteLength(html), uploadedByUserId: actor.id });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.update_artifact_generated", `Documento revisado da atualização ${update.publicId} gerado.`, { pcaId: pca.id, pcaUpdateId: update.id, url: stored.url });
  });
  return { url: stored.url, demandCount: rows.length };
}

export async function submitPcaUpdateToPresidency(actor: Actor, pcaUpdatePublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "O encaminhamento da atualização é responsabilidade da Diretoria de Administração.");
  const [update] = await db.select().from(pcaUpdates).where(eq(pcaUpdates.publicId, pcaUpdatePublicId)).limit(1);
  if (!update || !canSubmitPca(update.status) || !update.documentUrl) throw new Error("Gere o documento revisado antes de encaminhar a atualização à Presidência.");
  await db.update(pcaUpdates).set({ status: "presidency_review" }).where(eq(pcaUpdates.id, update.id));
  await db.insert(planningAlerts).values({ entityType: "pca", entityPublicId: update.publicId, severity: "warning", title: "Atualização do PCA aguardando deliberação da Presidência.", dueAt: deadlineAt(3) });
  await audit(db, actor.id, "pca.update_submitted_to_presidency", `Atualização ${update.publicId} encaminhada à Presidência.`, { pcaUpdateId: update.id });
  return { success: true };
}

export async function decidePcaUpdate(actor: Actor, input: { pcaUpdatePublicId: string; action: "approve" | "return" | "reject"; notes: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["autoridade_competente"], "A deliberação exige perfil da Presidência/autoridade competente.");
  const [update] = await db.select().from(pcaUpdates).where(eq(pcaUpdates.publicId, input.pcaUpdatePublicId)).limit(1);
  if (!update || update.status !== "presidency_review") throw new Error("Esta atualização não está aguardando deliberação da Presidência.");
  const status = pcaDecisionStatus(input.action);
  await db.transaction(async tx => {
    await tx.update(pcaUpdates).set({ status, decidedByUserId: actor.id, decisionNotes: input.notes.trim() }).where(eq(pcaUpdates.id, update.id));
    await tx.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "pca"), eq(planningAlerts.entityPublicId, update.publicId), eq(planningAlerts.status, "open")));
    if (input.action === "reject") {
      const links = await tx.select({ demandId: pcaUpdateDemands.demandId }).from(pcaUpdateDemands).where(eq(pcaUpdateDemands.pcaUpdateId, update.id));
      if (links.length) await tx.update(demands).set({ status: "returned" }).where(inArray(demands.id, links.map(link => link.demandId)));
    }
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, `pca.update_${input.action}d`, `Presidência registrou ${input.action} para a atualização ${update.publicId}.`, { pcaUpdateId: update.id, notes: input.notes.trim() });
  });
  return { success: true };
}

export async function publishPcaUpdate(actor: Actor, input: { pcaUpdatePublicId: string; publicationReference: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A publicação da atualização é responsabilidade da Diretoria de Administração.");
  const [update] = await db.select().from(pcaUpdates).where(eq(pcaUpdates.publicId, input.pcaUpdatePublicId)).limit(1);
  if (!update || !canPublishPca(update.status) || !update.documentUrl) throw new Error("Somente atualização autorizada e documentada pode ser publicada.");
  const links = await db.select({ demandId: pcaUpdateDemands.demandId }).from(pcaUpdateDemands).where(eq(pcaUpdateDemands.pcaUpdateId, update.id));
  await db.transaction(async tx => {
    await tx.update(pcaUpdates).set({ status: "published", publicationReference: input.publicationReference.trim(), publishedAt: new Date() }).where(eq(pcaUpdates.id, update.id));
    if (links.length) await tx.update(demands).set({ status: "published_in_pca" }).where(inArray(demands.id, links.map(link => link.demandId)));
    await tx.insert(planningAlerts).values({ entityType: "pca", entityPublicId: update.publicId, severity: "info", title: "Atualização do PCA publicada; DFDs incluídas estão disponíveis ao Setor de Compras." });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.update_published", `Atualização ${update.publicId} publicada.`, { pcaUpdateId: update.id, publicationReference: input.publicationReference.trim() });
  });
  return { success: true };
}

export async function generatePcaArtifact(actor: Actor, pcaPublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A preparação do documento do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, pcaPublicId)).limit(1);
  if (!pca || !canGeneratePcaArtifact(pca.status)) throw new Error("Este PCA não está disponível para geração de documento.");
  const rows = await collectPcaDemandDetails(db, pca.id);
  if (!rows.length) throw new Error("O PCA precisa conter ao menos uma DFD para gerar o documento.");
  const escape = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const table = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escape(row.origin)}</td><td>${escape(row.publicId)}</td><td>${escape(row.unitName)}</td><td>${escape(row.title)}</td><td>${escape(row.estimatedValue ?? "—")}</td></tr>`).join("");
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escape(pca.title)}</title><style>body{font-family:Arial,sans-serif;color:#14213d;padding:36px}h1{font-size:22px}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:12px}th,td{border:1px solid #b8c4d6;padding:8px;text-align:left}th{background:#eaf0f8}footer{margin-top:24px;color:#5b6677;font-size:11px}</style><body><h1>Plano de Contratações Anual — PCA</h1><p><strong>Identificador:</strong> ${escape(pca.publicId)}<br><strong>Título:</strong> ${escape(pca.title)}<br><strong>Demandas consolidadas:</strong> ${rows.length}</p><h2>Tabela de demandas</h2><table><thead><tr><th>#</th><th>Consolidação</th><th>DFD</th><th>Unidade requisitante</th><th>Objeto</th><th>Estimativa inicial</th></tr></thead><tbody>${table}</tbody></table><footer>Documento PCA único gerado pela ÓRBITA para deliberação e publicação institucional.</footer></body></html>`;
  const stored = await storagePut(`planning/pca/${pca.publicId}/pca-unico.html`, html, "text/html; charset=utf-8");
  await db.transaction(async tx => {
    await tx.update(planningConsolidations).set({ documentKey: stored.key, documentUrl: stored.url, status: "ready_for_review" }).where(eq(planningConsolidations.id, pca.id));
    const prior = await tx.select({ id: planningDocuments.id }).from(planningDocuments).where(and(eq(planningDocuments.entityType, "pca"), eq(planningDocuments.entityPublicId, pca.publicId), eq(planningDocuments.documentType, "PCA único")));
    await tx.insert(planningDocuments).values({ entityType: "pca", entityPublicId: pca.publicId, documentType: "PCA único", title: `PCA único — ${pca.title}`, version: prior.length + 1, storageKey: stored.key, storageUrl: stored.url, mimeType: "text/html", sizeBytes: Buffer.byteLength(html), uploadedByUserId: actor.id });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.artifact_generated", `Documento único do PCA ${pca.publicId} gerado com ${rows.length} DFD(s).`, { pcaId: pca.id, url: stored.url });
  });
  return { url: stored.url, demandCount: rows.length };
}

export async function submitPcaToPresidency(actor: Actor, pcaPublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "O encaminhamento do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, pcaPublicId)).limit(1);
  if (!pca || !canSubmitPca(pca.status) || !pca.documentUrl) throw new Error("Gere o documento único do PCA antes de encaminhá-lo à Presidência.");
  await db.update(planningConsolidations).set({ status: "presidency_review" }).where(eq(planningConsolidations.id, pca.id));
  await db.insert(planningAlerts).values({ entityType: "pca", entityPublicId: pca.publicId, severity: "warning", title: "PCA aguardando deliberação da Presidência.", dueAt: deadlineAt(3) });
  await audit(db, actor.id, "pca.submitted_to_presidency", `PCA ${pca.publicId} encaminhado para deliberação da Presidência.`, { pcaId: pca.id });
  return { success: true };
}

export async function decidePca(actor: Actor, input: { pcaPublicId: string; action: "approve" | "return" | "reject"; notes: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["autoridade_competente"], "A deliberação do PCA exige perfil da Presidência/autoridade competente.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, input.pcaPublicId)).limit(1);
  if (!pca || pca.status !== "presidency_review") throw new Error("Este PCA não está aguardando deliberação da Presidência.");
  const status = pcaDecisionStatus(input.action);
  await db.transaction(async tx => {
    await tx.update(planningConsolidations).set({ status, decidedByUserId: actor.id, decisionNotes: input.notes.trim() }).where(eq(planningConsolidations.id, pca.id));
    await tx.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "pca"), eq(planningAlerts.entityPublicId, pca.publicId), eq(planningAlerts.status, "open")));
    if (input.action === "reject") {
      const groupLinks = await tx.select({ demandConsolidationId: planningConsolidationGroups.demandConsolidationId }).from(planningConsolidationGroups).where(eq(planningConsolidationGroups.planningConsolidationId, pca.id));
      if (groupLinks.length) await tx.update(demandConsolidations).set({ status: "returned" }).where(inArray(demandConsolidations.id, groupLinks.map(link => link.demandConsolidationId)));
    }
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, `pca.${input.action}d`, `Presidência registrou ${input.action} para o PCA ${pca.publicId}.`, { pcaId: pca.id, notes: input.notes.trim() });
  });
  return { success: true };
}

export async function publishPca(actor: Actor, input: { pcaPublicId: string; publicationReference: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A publicação do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, input.pcaPublicId)).limit(1);
  if (!pca || !canPublishPca(pca.status) || !pca.documentUrl) throw new Error("Somente PCA autorizado e documentado pode ser publicado.");
  const groupRows = await db.select({ demandConsolidationId: planningConsolidationGroups.demandConsolidationId }).from(planningConsolidationGroups).where(eq(planningConsolidationGroups.planningConsolidationId, pca.id));
  const [groupDemandRows, directDemandRows] = await Promise.all([
    groupRows.length ? db.select({ demandId: demandConsolidationDemands.demandId }).from(demandConsolidationDemands).where(inArray(demandConsolidationDemands.demandConsolidationId, groupRows.map(row => row.demandConsolidationId))) : Promise.resolve([]),
    db.select({ demandId: planningConsolidationDemands.demandId }).from(planningConsolidationDemands).where(eq(planningConsolidationDemands.consolidationId, pca.id)),
  ]);
  const demandIds = Array.from(new Set([...groupDemandRows, ...directDemandRows].map(row => row.demandId)));
  await db.transaction(async tx => {
    await tx.update(planningConsolidations).set({ status: "published", publicationReference: input.publicationReference.trim(), publishedAt: new Date() }).where(eq(planningConsolidations.id, pca.id));
    if (demandIds.length) await tx.update(demands).set({ status: "published_in_pca" }).where(inArray(demands.id, demandIds));
    await tx.insert(planningAlerts).values({ entityType: "pca", entityPublicId: pca.publicId, severity: "info", title: "PCA publicado; DFDs consolidadas e DFDs diretas estão disponíveis ao Setor de Compras." });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.published", `PCA ${pca.publicId} publicado e encaminhado ao Setor de Compras.`, { pcaId: pca.id, publicationReference: input.publicationReference.trim() });
  });
  return { success: true };
}

export async function createTwoStageOpeningRequest(actor: Actor, input: { demandPublicId: string; proposedWorkflowType: "direct_contracting" | "bidding"; proposedModality: string; justification: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["compras"], "A solicitação de abertura é responsabilidade do Setor de Compras.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!demand || !canRequestOpening(demand.status)) throw new Error("A DFD precisa integrar um PCA publicado antes da solicitação de abertura.");
  const [[groupLink], [directLink], [updateLink]] = await Promise.all([
    db.select({ pcaId: planningConsolidationGroups.planningConsolidationId }).from(demandConsolidationDemands).innerJoin(planningConsolidationGroups, eq(demandConsolidationDemands.demandConsolidationId, planningConsolidationGroups.demandConsolidationId)).innerJoin(planningConsolidations, eq(planningConsolidationGroups.planningConsolidationId, planningConsolidations.id)).where(and(eq(demandConsolidationDemands.demandId, demand.id), eq(planningConsolidations.status, "published"))).limit(1),
    db.select({ pcaId: planningConsolidationDemands.consolidationId }).from(planningConsolidationDemands).innerJoin(planningConsolidations, eq(planningConsolidationDemands.consolidationId, planningConsolidations.id)).where(and(eq(planningConsolidationDemands.demandId, demand.id), eq(planningConsolidations.status, "published"))).limit(1),
    db.select({ pcaId: pcaUpdates.pcaId }).from(pcaUpdateDemands).innerJoin(pcaUpdates, eq(pcaUpdateDemands.pcaUpdateId, pcaUpdates.id)).where(and(eq(pcaUpdateDemands.demandId, demand.id), eq(pcaUpdates.status, "published"))).limit(1),
  ]);
  const link = groupLink ?? directLink ?? updateLink;
  if (!link) throw new Error("Não foi localizado PCA publicado para esta DFD.");
  const requestPublicId = publicId("ABR");
  const result = await db.insert(openingRequests).values({ publicId: requestPublicId, demandId: demand.id, pcaId: link.pcaId, proposedWorkflowType: input.proposedWorkflowType, proposedModality: input.proposedModality.trim(), justification: input.justification.trim(), status: "presidency_review", requestedByUserId: actor.id });
  await instantiateChecklist(db, "opening_request", requestPublicId, "CHECKLIST_ABERTURA");
  await db.update(demands).set({ status: "awaiting_opening" }).where(eq(demands.id, demand.id));
  await db.insert(planningAlerts).values({ entityType: "opening_request", entityPublicId: requestPublicId, severity: "warning", title: "Solicitação de abertura aguardando autorização da Presidência.", dueAt: deadlineAt(2) });
  await audit(db, actor.id, "opening_request.submitted", `Solicitação ${requestPublicId} enviada à Presidência para abertura e definição de modalidade.`, { openingRequestId: Number(result[0].insertId), demandPublicId: demand.publicId, pcaId: link.pcaId });
  return { id: Number(result[0].insertId), publicId: requestPublicId };
}
