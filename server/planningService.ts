import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  annualPlans,
  annualPlanItems,
  auditEvents,
  demandCaseEvents,
  demandConsolidationDemands,
  demandConsolidations,
  demandItems,
  demands,
  documentTemplates,
  governanceSettings,
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
  privacyAssessments,
  procurementProcesses,
  processAlerts,
  referenceListItems,
  referenceLists,
  userProcessRoles,
  users,
  workflowChecklists,
  workflowSteps,
} from "../drizzle/schema";
import { workflowStepsFor } from "../shared/workflow";
import {   canConsolidateDemand, canInstantiateOpening, canPublishPca, canRequestOpening, canSubmitDemandToPresidency, canSubmitPca, openingDecisionStatus, pcaDecisionStatus, shouldEscalatePlanningAlert } from "../shared/planningPolicies";
import { superveningPlanningJustificationError } from "../shared/superveningDemand";
import { detailedDemandDescriptionError, detailedDemandJustificationError } from "../shared/demandDescription";
import { parsePlanningCalendarDate, planningCalendarKeys } from "../shared/planningCalendar";
import { demandItemValidationError, MAX_DEMAND_ITEMS, totalEstimatedValueOfDemandItems, type DemandItemInput } from "../shared/demandItems";
import { pcaSupplyLineAlertTitle } from "../shared/pcaSupplyLineAlert";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { notifyDemandAudience, type NotificationDb } from "./notificationService";

type Actor = { id: number; role: "user" | "admin" };
type PlanningEntityType = "demand" | "demand_consolidation" | "pca" | "consolidation" | "opening_request";
const publicId = (prefix: string) => `${prefix}-${nanoid(10).toUpperCase()}`;
export const planningDeadlineDays = { demand: 5, demand_consolidation: 3, pca: 3, opening_request: 2 } as const;
export const deadlineAt = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function configuredCalendarDate(db: Awaited<ReturnType<typeof dbOrThrow>>, key: string) {
  const [setting] = await db.select({ value: governanceSettings.value }).from(governanceSettings).where(and(eq(governanceSettings.settingKey, key), eq(governanceSettings.active, true))).limit(1);
  return parsePlanningCalendarDate(setting?.value);
}

export async function getPlanningCalendar() {
  const db = await dbOrThrow();
  const [rows] = await Promise.all([db.select({ settingKey: governanceSettings.settingKey, value: governanceSettings.value, label: governanceSettings.label, description: governanceSettings.description }).from(governanceSettings).where(and(eq(governanceSettings.category, "planning_calendar"), eq(governanceSettings.active, true))).orderBy(asc(governanceSettings.settingKey))]);
  const values = Object.fromEntries(rows.map(row => [row.settingKey, row.value]));
  return { definitions: planningCalendarKeys, values, rows };
}
export const planningChecklistTemplateTypes = {
  demand: "CHECKLIST_DFD",
  demand_consolidation: "CHECKLIST_CONSOLIDACAO_DEMANDAS",
  pca: "CHECKLIST_PCA",
  opening_request: "CHECKLIST_ABERTURA",
} as const;

export function planningChecklistAllowedRoles(entityType: PlanningEntityType) {
  return entityType === "demand" ? ["demandante", "administrador"] : entityType === "opening_request" ? ["compras"] : ["administrador"];
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

export function hasPlanningPermission(platformRole: "user" | "admin", processRoles: string[], allowedRoles: string[]) {
  return platformRole === "admin" || processRoles.includes("administrador") || processRoles.some(role => allowedRoles.includes(role));
}

async function canAct(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor, allowedRoles: string[]) {
  if (actor.role === "admin") return true;
  const rows = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  return hasPlanningPermission(actor.role, rows.map(row => row.role), allowedRoles);
}

async function requireRole(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor, allowedRoles: string[], message: string) {
  if (!(await canAct(db, actor, allowedRoles))) throw new Error(message);
}

async function audit(db: Awaited<ReturnType<typeof dbOrThrow>>, actorUserId: number | null, eventType: string, summary: string, payload: Record<string, unknown>) {
  await db.insert(auditEvents).values({ actorUserId, eventType, summary, payload });
}

async function instantiateChecklistFromTemplates(db: Awaited<ReturnType<typeof dbOrThrow>>, entityType: PlanningEntityType, entityPublicId: string, templateType: string) {
  const templates = await db.select().from(documentTemplates).where(and(eq(documentTemplates.active, true), eq(documentTemplates.documentType, templateType)));
  const rows = templates.flatMap(template => (template.content ?? "").split(/\r?\n/).map(item => item.trim()).filter(Boolean).map((title, index) => ({ entityType, entityPublicId, templateCode: template.code, code: `${template.code}_${index + 1}`, title, required: true })));
  if (rows.length) await db.insert(planningChecklistItems).values(rows).onDuplicateKeyUpdate({ set: { required: true } });
}

export async function saveDemandDraft(actor: Actor, input: { draftPublicId: string; unitId: number; title?: string; objectDescription?: string; justification?: string; annualPlanItemId?: number; supplyLineCnaeCode?: string; supplyLineCnaeDescription?: string; desiredContractDate?: Date; deliveryPeriod?: string; hasFutureFiscalImpact?: boolean; isSupervening?: boolean; planningJustification?: string; containsPersonalData?: boolean; containsSensitiveData?: boolean; privacyContext?: string; items?: DemandItemInput[] }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["demandante"], "A edição de rascunho exige perfil de setor requisitante.");
  const [draft] = await db.select().from(demands).where(and(eq(demands.publicId, input.draftPublicId), eq(demands.requesterUserId, actor.id), eq(demands.status, "draft"))).limit(1);
  if (!draft) throw new Error("O rascunho da DFD não foi encontrado ou não pertence ao usuário autenticado.");
  const [unit] = await db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(and(eq(organizationalUnits.id, input.unitId), eq(organizationalUnits.active, true))).limit(1);
  if (!unit) throw new Error("A unidade requisitante não está disponível.");
  return db.transaction(async tx => {
    await tx.update(demands).set({ requestingUnitId: input.unitId, title: input.title?.trim() || "Rascunho sem título", objectDescription: input.objectDescription?.trim() || "", justification: input.justification?.trim() || "", annualPlanItemId: input.annualPlanItemId, supplyLineCnaeCode: input.supplyLineCnaeCode?.trim() || undefined, supplyLineCnaeDescription: input.supplyLineCnaeDescription?.trim() || undefined, desiredContractDate: input.desiredContractDate, deliveryPeriod: input.deliveryPeriod?.trim() || undefined, hasFutureFiscalImpact: input.hasFutureFiscalImpact ?? false, isSupervening: input.isSupervening ?? false, planningJustification: input.planningJustification?.trim() || undefined, containsPersonalData: input.containsPersonalData ?? false, containsSensitiveData: input.containsSensitiveData ?? false, privacyContext: input.privacyContext?.trim() || undefined }).where(eq(demands.id, draft.id));
    await tx.delete(demandItems).where(eq(demandItems.demandId, draft.id));
    const items = (input.items ?? []).filter(item => item.title.trim() || item.objectDescription.trim());
    if (items.length) await tx.insert(demandItems).values(items.map((item, index) => ({ demandId: draft.id, sequence: index + 1, title: item.title.trim(), objectDescription: item.objectDescription.trim(), quantity: item.quantity || undefined, unitOfMeasure: item.unitOfMeasure?.trim() || undefined, estimatedValue: item.estimatedValue || undefined, itemJustification: item.itemJustification?.trim() || undefined, quantityJustification: item.quantityJustification?.trim() || undefined, estimatedValueJustification: item.estimatedValueJustification?.trim() || undefined, priceResearchCertifiedAt: item.priceResearchCertified ? new Date() : undefined, confirmed: true, confirmedAt: new Date() })));
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.draft_saved", `Rascunho ${draft.publicId} atualizado pelo setor requisitante.`, { demandPublicId: draft.publicId, demandId: draft.id, itemCount: items.length });
    return { publicId: draft.publicId };
  });
}

export async function createDemandDraft(actor: Actor, input: { unitId: number }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["demandante"], "A criação de rascunho exige perfil de setor requisitante.");
  const [unit] = await db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(and(eq(organizationalUnits.id, input.unitId), eq(organizationalUnits.active, true))).limit(1);
  if (!unit) throw new Error("A unidade requisitante não está disponível.");
  const demandPublicId = publicId("DFD");
  const result = await db.insert(demands).values({ publicId: demandPublicId, requestingUnitId: input.unitId, requesterUserId: actor.id, title: "Rascunho sem título", objectDescription: "", justification: "", status: "draft" });
  await audit(db, actor.id, "demand.draft_created", `Rascunho ${demandPublicId} criado pelo setor requisitante.`, { demandPublicId, demandId: Number(result[0].insertId) });
  return { id: Number(result[0].insertId), publicId: demandPublicId };
}

export async function listMyDemandDrafts(actor: Actor) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["demandante"], "A consulta de rascunhos exige perfil de setor requisitante.");
  return db.select({ demand: demands, unitName: organizationalUnits.name }).from(demands).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(and(eq(demands.requesterUserId, actor.id), eq(demands.status, "draft"))).orderBy(desc(demands.updatedAt));
}

export async function getMyDemandDraft(actor: Actor, demandPublicId: string) {
  const db = await dbOrThrow();
  const [row] = await db.select({ demand: demands, unitName: organizationalUnits.name }).from(demands).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(and(eq(demands.publicId, demandPublicId), eq(demands.requesterUserId, actor.id), eq(demands.status, "draft"))).limit(1);
  if (!row) throw new Error("Rascunho não encontrado.");
  const items = await db.select().from(demandItems).where(eq(demandItems.demandId, row.demand.id)).orderBy(asc(demandItems.sequence));
  return { ...row, items };
}

export async function createDemand(actor: Actor, input: {
  unitId: number;
  title: string;
  objectDescription: string;
  justification: string;
  quantity?: string;
  unitOfMeasure?: string;
  estimatedValue?: string;
  desiredContractDate?: Date;
  deliveryPeriod?: string;
  annualPlanItemId?: number;
  supplyLineCnaeCode?: string;
  supplyLineCnaeDescription?: string;
  requesterCertified?: boolean;
  hasFutureFiscalImpact?: boolean;
  isSupervening?: boolean;
  planningJustification?: string;
  containsPersonalData?: boolean;
  containsSensitiveData?: boolean;
  privacyContext?: string;
  items?: DemandItemInput[];
  draftPublicId?: string;
}) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["demandante"], "A criação de DFD exige perfil de setor requisitante.");
  const planningJustificationError = superveningPlanningJustificationError(input);
  const justificationError = detailedDemandJustificationError(input.justification);
  if (justificationError) throw new Error(justificationError);
  if (planningJustificationError) throw new Error(planningJustificationError);
  const descriptionError = detailedDemandDescriptionError(input.objectDescription);
  if (descriptionError) throw new Error(descriptionError);
  const supplyLineCnaeCode = input.supplyLineCnaeCode?.trim();
  const supplyLineCnaeDescription = input.supplyLineCnaeDescription?.trim();
  if (!supplyLineCnaeCode || !supplyLineCnaeDescription) throw new Error("Selecione a linha principal de fornecimento pela consulta oficial de CNAE.");
  if (!input.requesterCertified) throw new Error("Confirme a assinatura institucional antes de enviar a DFD.");
  const confirmedItems = input.items?.length ? input.items : [{ title: input.title, objectDescription: input.objectDescription, quantity: input.quantity, unitOfMeasure: input.unitOfMeasure, estimatedValue: input.estimatedValue }];
  if (confirmedItems.length > MAX_DEMAND_ITEMS) throw new Error(`Uma DFD pode ter no máximo ${MAX_DEMAND_ITEMS} itens confirmados.`);
  const itemValidationError = confirmedItems.map(demandItemValidationError).find(Boolean);
  if (itemValidationError) throw new Error(itemValidationError);
  const [unit] = await db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(and(eq(organizationalUnits.id, input.unitId), eq(organizationalUnits.active, true))).limit(1);
  if (!unit) throw new Error("A unidade requisitante não está disponível.");
  const existingDraftRows = input.draftPublicId ? await db.select().from(demands).where(and(eq(demands.publicId, input.draftPublicId), eq(demands.requesterUserId, actor.id), eq(demands.status, "draft"))).limit(1) : [];
  const existingDraft = existingDraftRows[0] ?? null;
  if (input.draftPublicId && !existingDraft) throw new Error("O rascunho da DFD não foi encontrado ou não pertence ao usuário autenticado.");
  const demandPublicId = existingDraft?.publicId ?? publicId("DFD");
  const estimatedTotal = totalEstimatedValueOfDemandItems(confirmedItems);
  return db.transaction(async tx => {
    let demandId: number;
    const demandValues = {
      requestingUnitId: input.unitId,
      requesterUserId: actor.id,
      title: input.title.trim(),
      objectDescription: input.objectDescription.trim(),
      justification: input.justification.trim(),
      quantity: confirmedItems.length === 1 ? confirmedItems[0].quantity || undefined : undefined,
      unitOfMeasure: confirmedItems.length === 1 ? confirmedItems[0].unitOfMeasure?.trim() || undefined : undefined,
      initialEstimatedValue: estimatedTotal,
      desiredContractDate: input.desiredContractDate,
      deliveryPeriod: input.deliveryPeriod?.trim() || undefined,
      annualPlanItemId: input.annualPlanItemId,
      supplyLineCnaeCode,
      supplyLineCnaeDescription,
      hasFutureFiscalImpact: input.hasFutureFiscalImpact ?? false,
      isSupervening: input.isSupervening ?? false,
      planningJustification: input.planningJustification?.trim() || undefined,
      containsPersonalData: input.containsPersonalData ?? false,
      containsSensitiveData: input.containsSensitiveData ?? false,
      privacyContext: input.privacyContext?.trim() || undefined,
      requesterCertifiedAt: new Date(),
      status: "submitted" as const,
    };
    if (existingDraft) {
      demandId = existingDraft.id;
      await tx.update(demands).set(demandValues).where(eq(demands.id, demandId));
      await tx.delete(demandItems).where(eq(demandItems.demandId, demandId));
    } else {
      const result = await tx.insert(demands).values({ publicId: demandPublicId, ...demandValues });
      demandId = Number(result[0].insertId);
    }
    await tx.insert(demandItems).values(confirmedItems.map((item, index) => ({ demandId, sequence: index + 1, title: item.title.trim(), objectDescription: item.objectDescription.trim(), quantity: item.quantity || undefined, unitOfMeasure: item.unitOfMeasure?.trim() || undefined, estimatedValue: item.estimatedValue || undefined, itemJustification: item.itemJustification?.trim() || undefined, quantityJustification: item.quantityJustification?.trim() || undefined, estimatedValueJustification: item.estimatedValueJustification?.trim() || undefined, priceResearchCertifiedAt: item.priceResearchCertified ? new Date() : undefined, confirmed: true, confirmedAt: new Date() })));
    await instantiateChecklistFromTemplates(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, "demand", demandPublicId, planningChecklistTemplateTypes.demand);
    const configuredDemandDeadline = await configuredCalendarDate(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, planningCalendarKeys.dfdApprovalDeadline);
    await tx.insert(planningAlerts).values({ entityType: "demand", entityPublicId: demandPublicId, severity: input.isSupervening || input.containsSensitiveData ? "warning" : "info", title: input.isSupervening ? "DFD superveniente aguardando análise da Diretoria de Administração dentro do calendário institucional." : input.containsSensitiveData ? "DFD com indicação de dados pessoais sensíveis requer triagem LGPD." : "DFD recebida pela Diretoria de Administração para triagem.", dueAt: configuredDemandDeadline ?? deadlineAt(planningDeadlineDays.demand) });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "demand.submitted", `DFD ${demandPublicId} enviada para triagem da Diretoria de Administração com ${confirmedItems.length} item(ns) confirmado(s).`, { demandId, demandPublicId, unitId: input.unitId, itemCount: confirmedItems.length, estimatedTotal: estimatedTotal ?? null, supplyLineCnaeCode: input.supplyLineCnaeCode, hasFutureFiscalImpact: input.hasFutureFiscalImpact ?? false, requesterCertifiedAt: new Date().toISOString() });
    return { id: demandId, publicId: demandPublicId };
  });
}

export async function getPlanningBoard() {
  const db = await dbOrThrow();
  const [demandRows, consolidationRows, openingRows, plans, planItems, documents, alerts, checklists, activeLists, activeListItems] = await Promise.all([
    db.select({ demand: demands, unitName: organizationalUnits.name, requesterName: users.name })
      .from(demands).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).leftJoin(users, eq(demands.requesterUserId, users.id)).orderBy(desc(demands.updatedAt)),
    db.select().from(planningConsolidations).orderBy(desc(planningConsolidations.updatedAt)),
    db.select({ request: openingRequests, demandPublicId: demands.publicId, demandTitle: demands.title, consolidationPublicId: planningConsolidations.publicId })
      .from(openingRequests).innerJoin(demands, eq(openingRequests.demandId, demands.id)).leftJoin(planningConsolidations, eq(openingRequests.consolidationId, planningConsolidations.id)).orderBy(desc(openingRequests.updatedAt)),
    db.select().from(annualPlans).orderBy(desc(annualPlans.fiscalYear)),
    db.select({ item: annualPlanItems, planTitle: annualPlans.title, fiscalYear: annualPlans.fiscalYear, unitName: organizationalUnits.name }).from(annualPlanItems).innerJoin(annualPlans, eq(annualPlanItems.planId, annualPlans.id)).leftJoin(organizationalUnits, eq(annualPlanItems.requestingUnitId, organizationalUnits.id)).orderBy(desc(annualPlans.fiscalYear), asc(annualPlanItems.code)),
    db.select().from(planningDocuments).orderBy(desc(planningDocuments.createdAt)),
    db.select().from(planningAlerts).where(eq(planningAlerts.status, "open")).orderBy(desc(planningAlerts.createdAt)),
    db.select().from(planningChecklistItems).orderBy(asc(planningChecklistItems.entityType), asc(planningChecklistItems.createdAt)),
    db.select().from(referenceLists).where(eq(referenceLists.active, true)).orderBy(asc(referenceLists.label)),
    db.select().from(referenceListItems).where(eq(referenceListItems.active, true)).orderBy(asc(referenceListItems.sortOrder), asc(referenceListItems.label)),
  ]);
  const links = await db.select().from(planningConsolidationDemands);
  const demandIdsByConsolidation = new Map<number, number[]>();
  for (const link of links) demandIdsByConsolidation.set(link.consolidationId, [...(demandIdsByConsolidation.get(link.consolidationId) ?? []), link.demandId]);
  return {
    demands: demandRows,
    consolidations: consolidationRows.map(row => {
      const demandIds = demandIdsByConsolidation.get(row.id) ?? [];
      return { ...row, demandIds, demandDetails: demandRows.filter(item => demandIds.includes(item.demand.id)).map(item => ({ publicId: item.demand.publicId, title: item.demand.title, unitName: item.unitName, estimatedValue: item.demand.initialEstimatedValue })) };
    }),
    openingRequests: openingRows,
    plans,
    planItems,
    documents,
    alerts,
    checklists,
    referenceLists: activeLists.map(list => ({ ...list, items: activeListItems.filter(item => item.listId === list.id) })),
  };
}

export async function createConsolidation(actor: Actor, input: { title: string; planId?: number; demandPublicIds: string[] }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A consolidação de demandas é responsabilidade da Diretoria de Administração.");
  const ids = Array.from(new Set(input.demandPublicIds));
  if (!ids.length) throw new Error("Selecione ao menos uma DFD para consolidar no PCA.");
  const selected = await db.select().from(demands).where(inArray(demands.publicId, ids));
  if (selected.length !== ids.length) throw new Error("Uma ou mais DFD selecionadas não foram encontradas.");
  if (selected.some(item => !canConsolidateDemand(item.status))) throw new Error("Somente DFD em triagem podem integrar um novo PCA.");
  if (input.planId) {
    const [plan] = await db.select({ id: annualPlans.id }).from(annualPlans).where(eq(annualPlans.id, input.planId)).limit(1);
    if (!plan) throw new Error("O planejamento anual selecionado não está disponível.");
  }
  const pcaPublicId = publicId("PCA");
  return db.transaction(async tx => {
    const result = await tx.insert(planningConsolidations).values({ publicId: pcaPublicId, planId: input.planId, title: input.title.trim(), status: "consolidating", createdByUserId: actor.id });
    const consolidationId = Number(result[0].insertId);
    await tx.insert(planningConsolidationDemands).values(selected.map((demand, index) => ({ consolidationId, demandId: demand.id, sequence: index + 1 })));
    await tx.update(demands).set({ status: "grouped" }).where(inArray(demands.id, selected.map(item => item.id)));
    await instantiateChecklistFromTemplates(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, "pca", pcaPublicId, planningChecklistTemplateTypes.pca);
    await tx.insert(planningAlerts).values({ entityType: "consolidation", entityPublicId: pcaPublicId, severity: "info", title: "PCA consolidado criado; complete a análise antes do encaminhamento à Presidência." });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.created", `PCA ${pcaPublicId} criado com ${selected.length} DFD(s) consolidada(s).`, { consolidationId, pcaPublicId, demandPublicIds: ids });
    return { id: consolidationId, publicId: pcaPublicId };
  });
}

export async function submitConsolidationToPresidency(actor: Actor, consolidationPublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "O encaminhamento do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, consolidationPublicId)).limit(1);
  if (!pca || !canSubmitPca(pca.status)) throw new Error("Este PCA não está disponível para encaminhamento à Presidência.");
  await db.update(planningConsolidations).set({ status: "presidency_review" }).where(eq(planningConsolidations.id, pca.id));
  await db.insert(planningAlerts).values({ entityType: "pca", entityPublicId: pca.publicId, severity: "warning", title: "PCA aguardando deliberação da Presidência.", dueAt: deadlineAt(planningDeadlineDays.pca) });
  await audit(db, actor.id, "pca.submitted_to_presidency", `PCA ${pca.publicId} encaminhado para deliberação da Presidência.`, { consolidationId: pca.id });
  return { success: true };
}

export async function decideConsolidation(actor: Actor, input: { consolidationPublicId: string; action: "approve" | "return" | "reject"; notes: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["autoridade_competente"], "A deliberação do PCA exige perfil da Presidência/autoridade competente.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, input.consolidationPublicId)).limit(1);
  if (!pca || pca.status !== "presidency_review") throw new Error("Este PCA não está aguardando deliberação da Presidência.");
  const status = pcaDecisionStatus(input.action);
  await db.update(planningConsolidations).set({ status, decidedByUserId: actor.id, decisionNotes: input.notes.trim() }).where(eq(planningConsolidations.id, pca.id));
  await db.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "consolidation"), eq(planningAlerts.entityPublicId, pca.publicId), eq(planningAlerts.status, "open")));
  if (input.action === "reject") {
    const links = await db.select({ demandId: planningConsolidationDemands.demandId }).from(planningConsolidationDemands).where(eq(planningConsolidationDemands.consolidationId, pca.id));
    if (links.length) await db.update(demands).set({ status: "under_review" }).where(inArray(demands.id, links.map(link => link.demandId)));
  }
  await audit(db, actor.id, `pca.${input.action}d`, `Presidência registrou ${input.action} para o PCA ${pca.publicId}.`, { consolidationId: pca.id, notes: input.notes.trim() });
  return { success: true };
}

export async function publishConsolidation(actor: Actor, input: { consolidationPublicId: string; publicationReference: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A publicação do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, input.consolidationPublicId)).limit(1);
  if (!pca || !canPublishPca(pca.status)) throw new Error("Somente PCA aprovado pela Presidência pode ser publicado.");
  if (!pca.documentUrl) throw new Error("Gere o documento consolidado do PCA antes de registrar a publicação.");
  const links = await db.select({ demandId: planningConsolidationDemands.demandId }).from(planningConsolidationDemands).where(eq(planningConsolidationDemands.consolidationId, pca.id));
  await db.transaction(async tx => {
    await tx.update(planningConsolidations).set({ status: "published", publicationReference: input.publicationReference.trim(), publishedAt: new Date() }).where(eq(planningConsolidations.id, pca.id));
    if (links.length) await tx.update(demands).set({ status: "published_in_pca" }).where(inArray(demands.id, links.map(link => link.demandId)));
    await tx.insert(planningAlerts).values({ entityType: "consolidation", entityPublicId: pca.publicId, severity: "info", title: "PCA publicado; DFD consolidadas estão disponíveis ao Setor de Compras." });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.published", `PCA ${pca.publicId} publicado e encaminhado ao Setor de Compras.`, { consolidationId: pca.id, publicationReference: input.publicationReference.trim() });
  });
  return { success: true };
}

export async function generateConsolidationArtifact(actor: Actor, consolidationPublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["administrador"], "A preparação do documento do PCA é responsabilidade da Diretoria de Administração.");
  const [pca] = await db.select().from(planningConsolidations).where(eq(planningConsolidations.publicId, consolidationPublicId)).limit(1);
  if (!pca || !["draft", "consolidating", "returned", "presidency_review", "approved_for_publication"].includes(pca.status)) throw new Error("Este PCA não está disponível para geração de documento.");
  const rows = await db.select({ demand: demands, unitName: organizationalUnits.name }).from(planningConsolidationDemands).innerJoin(demands, eq(planningConsolidationDemands.demandId, demands.id)).innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id)).where(eq(planningConsolidationDemands.consolidationId, pca.id)).orderBy(asc(planningConsolidationDemands.sequence));
  if (!rows.length) throw new Error("O PCA precisa conter ao menos uma DFD para gerar o documento consolidado.");
  const escape = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const table = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escape(row.demand.publicId)}</td><td>${escape(row.unitName)}</td><td>${escape(row.demand.title)}</td><td>${escape(row.demand.quantity ?? "—")}</td><td>${escape(row.demand.initialEstimatedValue ?? "—")}</td></tr>`).join("");
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escape(pca.title)}</title><style>body{font-family:Arial,sans-serif;color:#14213d;padding:36px}h1{font-size:22px}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:12px}th,td{border:1px solid #b8c4d6;padding:8px;text-align:left}th{background:#eaf0f8}footer{margin-top:24px;color:#5b6677;font-size:11px}</style><body><h1>Plano de Contratações Anual — PCA</h1><p><strong>Identificador:</strong> ${escape(pca.publicId)}<br><strong>Título:</strong> ${escape(pca.title)}<br><strong>Demandas consolidadas:</strong> ${rows.length}</p><h2>Tabela de demandas</h2><table><thead><tr><th>#</th><th>DFD</th><th>Unidade requisitante</th><th>Objeto</th><th>Quantidade</th><th>Estimativa inicial</th></tr></thead><tbody>${table}</tbody></table><footer>Documento consolidado gerado pela ÓRBITA para revisão e publicação institucional. A publicação externa exige registro de referência e validação do órgão.</footer></body></html>`;
  const stored = await storagePut(`planning/consolidation/${pca.publicId}/pca-consolidado.html`, html, "text/html; charset=utf-8");
  await db.transaction(async tx => {
    await tx.update(planningConsolidations).set({ documentKey: stored.key, documentUrl: stored.url }).where(eq(planningConsolidations.id, pca.id));
    const prior = await tx.select({ id: planningDocuments.id }).from(planningDocuments).where(and(eq(planningDocuments.entityType, "consolidation"), eq(planningDocuments.entityPublicId, pca.publicId), eq(planningDocuments.documentType, "PCA consolidado")));
    await tx.insert(planningDocuments).values({ entityType: "consolidation", entityPublicId: pca.publicId, documentType: "PCA consolidado", title: `PCA consolidado — ${pca.title}`, version: prior.length + 1, storageKey: stored.key, storageUrl: stored.url, mimeType: "text/html", sizeBytes: Buffer.byteLength(html), uploadedByUserId: actor.id });
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "pca.artifact_generated", `Documento consolidado do PCA ${pca.publicId} gerado com ${rows.length} demanda(s).`, { consolidationId: pca.id, demands: rows.map(row => row.demand.publicId), url: stored.url });
  });
  return { url: stored.url, demandCount: rows.length };
}

export async function createOpeningRequest(actor: Actor, input: { demandPublicId: string; proposedWorkflowType: "direct_contracting" | "bidding"; proposedModality: string; justification: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["compras"], "A solicitação de abertura é responsabilidade do Setor de Compras.");
  const [demand] = await db.select().from(demands).where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!demand || !canRequestOpening(demand.status)) throw new Error("A DFD precisa integrar um PCA publicado antes da solicitação de abertura.");
  const [link] = await db.select({ consolidationId: planningConsolidationDemands.consolidationId }).from(planningConsolidationDemands).innerJoin(planningConsolidations, eq(planningConsolidationDemands.consolidationId, planningConsolidations.id)).where(and(eq(planningConsolidationDemands.demandId, demand.id), eq(planningConsolidations.status, "published"))).limit(1);
  if (!link) throw new Error("Não foi localizado PCA publicado para esta DFD.");
  const requestPublicId = publicId("ABR");
  const result = await db.insert(openingRequests).values({ publicId: requestPublicId, demandId: demand.id, consolidationId: link.consolidationId, proposedWorkflowType: input.proposedWorkflowType, proposedModality: input.proposedModality.trim(), justification: input.justification.trim(), status: "presidency_review", requestedByUserId: actor.id });
  await instantiateChecklistFromTemplates(db, "opening_request", requestPublicId, planningChecklistTemplateTypes.opening_request);
  await db.update(demands).set({ status: "awaiting_opening" }).where(eq(demands.id, demand.id));
  await db.insert(planningAlerts).values({ entityType: "opening_request", entityPublicId: requestPublicId, severity: "warning", title: "Solicitação de abertura aguardando autorização da Presidência.", dueAt: deadlineAt(planningDeadlineDays.opening_request) });
  await audit(db, actor.id, "opening_request.submitted", `Solicitação ${requestPublicId} enviada à Presidência para abertura e definição de modalidade.`, { openingRequestId: Number(result[0].insertId), demandPublicId: demand.publicId, proposedWorkflowType: input.proposedWorkflowType, proposedModality: input.proposedModality.trim() });
  return { id: Number(result[0].insertId), publicId: requestPublicId };
}

export async function decideOpeningRequest(actor: Actor, input: { requestPublicId: string; action: "authorize" | "return" | "reject"; notes: string }) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["autoridade_competente"], "A autorização de abertura exige perfil da Presidência/autoridade competente.");
  const [request] = await db.select().from(openingRequests).where(eq(openingRequests.publicId, input.requestPublicId)).limit(1);
  if (!request || request.status !== "presidency_review") throw new Error("Esta solicitação não está aguardando decisão da Presidência.");
  const status = openingDecisionStatus(input.action);
  await db.transaction(async tx => {
    await tx.update(openingRequests).set({ status, decidedByUserId: actor.id, decisionNotes: input.notes.trim(), decidedAt: new Date() }).where(eq(openingRequests.id, request.id));
    await tx.update(demands).set({ status: input.action === "authorize" ? "opening_authorized" : "published_in_pca" }).where(eq(demands.id, request.demandId));
    await tx.update(planningAlerts).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(planningAlerts.entityType, "opening_request"), eq(planningAlerts.entityPublicId, request.publicId), eq(planningAlerts.status, "open")));
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, `opening_request.${input.action}d`, `Presidência registrou ${input.action} para a solicitação ${request.publicId}.`, { openingRequestId: request.id, notes: input.notes.trim() });
  });
  return { success: true };
}

async function pcaSupplyLineForecast(db: Awaited<ReturnType<typeof dbOrThrow>>, pcaId: number, cnaeCode: string) {
  const [grouped, direct, updates] = await Promise.all([
    db.select({ demandId: demandConsolidationDemands.demandId }).from(planningConsolidationGroups).innerJoin(demandConsolidationDemands, eq(planningConsolidationGroups.demandConsolidationId, demandConsolidationDemands.demandConsolidationId)).where(eq(planningConsolidationGroups.planningConsolidationId, pcaId)),
    db.select({ demandId: planningConsolidationDemands.demandId }).from(planningConsolidationDemands).where(eq(planningConsolidationDemands.consolidationId, pcaId)),
    db.select({ demandId: pcaUpdateDemands.demandId }).from(pcaUpdateDemands).innerJoin(pcaUpdates, eq(pcaUpdateDemands.pcaUpdateId, pcaUpdates.id)).where(and(eq(pcaUpdates.pcaId, pcaId), eq(pcaUpdates.status, "published"))),
  ]);
  const demandIds = Array.from(new Set([...grouped, ...direct, ...updates].map(row => row.demandId)));
  if (!demandIds.length) return null;
  const sameLine = await db.select({ estimatedValue: demands.initialEstimatedValue }).from(demands).where(and(inArray(demands.id, demandIds), eq(demands.supplyLineCnaeCode, cnaeCode)));
  if (!sameLine.length) return null;
  return { total: sameLine.reduce((total, demand) => total + Number(demand.estimatedValue ?? 0), 0), demandCount: sameLine.length };
}

export async function instantiateAuthorizedProcess(actor: Actor, requestPublicId: string) {
  const db = await dbOrThrow();
  await requireRole(db, actor, ["compras"], "A instauração de processo é responsabilidade do Setor de Compras.");
  const [request] = await db.select({ request: openingRequests, demand: demands }).from(openingRequests).innerJoin(demands, eq(openingRequests.demandId, demands.id)).where(eq(openingRequests.publicId, requestPublicId)).limit(1);
  if (!request || !canInstantiateOpening(request.request.status)) throw new Error("Somente solicitações autorizadas pela Presidência podem instaurar processo de contratação.");
  return db.transaction(async tx => {
    const steps = workflowStepsFor(request.request.proposedWorkflowType);
    const first = steps[0];
    const processPublicId = publicId(request.request.proposedWorkflowType === "bidding" ? "LIC" : "CD");
    const result = await tx.insert(procurementProcesses).values({ publicId: processPublicId, demandId: request.demand.id, workflowType: request.request.proposedWorkflowType, modality: request.request.proposedModality, title: request.demand.title, currentStepKey: first.key, currentResponsibleRole: first.role, status: "active", estimatedValue: request.demand.initialEstimatedValue ?? undefined, createdByUserId: actor.id, startedAt: new Date() });
    const processId = Number(result[0].insertId);
    await tx.insert(workflowSteps).values(steps.map((step, index) => ({ processId, stepKey: step.key, title: step.title, module: step.module, sequence: index + 1, status: index === 0 ? "in_progress" as const : "waiting" as const, assigneeRole: step.role, assigneeUserId: index === 0 ? actor.id : undefined, startedAt: index === 0 ? new Date() : undefined })));
    const savedSteps = await tx.select().from(workflowSteps).where(eq(workflowSteps.processId, processId));
    const baseChecklistRows = steps.map(step => ({ processId, workflowStepId: savedSteps.find(saved => saved.stepKey === step.key)?.id, code: `${step.key}_BASE`, title: step.checklist }));
    const officialTemplates = request.request.proposedWorkflowType === "direct_contracting"
      ? await tx.select().from(documentTemplates).where(and(eq(documentTemplates.active, true), eq(documentTemplates.templateKind, "checklist")))
      : [];
    const officialChecklistRows = officialTemplates.flatMap(template => {
      if (!template.workflowStepKey || !template.content) return [];
      const workflowStepId = savedSteps.find(saved => saved.stepKey === template.workflowStepKey)?.id;
      if (!workflowStepId) return [];
      return template.content.split(/\r?\n/).filter(Boolean).map((title, index) => ({
        processId,
        workflowStepId,
        code: `${template.code}_${String(index + 1).padStart(3, "0")}`,
        title,
      }));
    });
    await tx.insert(workflowChecklists).values([...baseChecklistRows, ...officialChecklistRows]);
    await tx.insert(processAlerts).values({ processId, workflowStepId: savedSteps[0]?.id, severity: "info", title: "Processo instaurado após autorização presidencial de abertura.", status: "open" });
    if (request.request.pcaId && request.demand.supplyLineCnaeCode) {
      const forecast = await pcaSupplyLineForecast(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, request.request.pcaId, request.demand.supplyLineCnaeCode);
      if (forecast) {
        await tx.insert(processAlerts).values({ processId, workflowStepId: savedSteps[0]?.id, severity: "info", title: pcaSupplyLineAlertTitle(request.demand.supplyLineCnaeCode, forecast.total), status: "open" });
      }
    }
    if (request.demand.containsPersonalData || request.demand.containsSensitiveData) {
      await tx.insert(privacyAssessments).values({
        processId,
        status: "in_review",
        containsPersonalData: request.demand.containsPersonalData,
        containsSensitiveData: request.demand.containsSensitiveData,
        treatmentDescription: request.demand.privacyContext || "Triagem iniciada na DFD; detalhar o tratamento na análise LGPD do processo.",
        riskLevel: request.demand.containsSensitiveData ? "medium" : "unknown",
        createdByUserId: actor.id,
      });
    }
    await tx.update(openingRequests).set({ status: "instantiated", processId }).where(eq(openingRequests.id, request.request.id));
    await tx.update(demands).set({ status: "process_instantiated" }).where(eq(demands.id, request.demand.id));
    await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, actor.id, "process.instantiated", `Processo ${processPublicId} instaurado após autorização da solicitação ${request.request.publicId}.`, { processId, processPublicId, openingRequestPublicId: request.request.publicId, modality: request.request.proposedModality, supplyLineCnaeCode: request.demand.supplyLineCnaeCode ?? null });
    return { id: processId, publicId: processPublicId };
  });
}

export async function uploadPlanningDocument(actor: Actor, input: { entityType: "demand" | "demand_consolidation" | "pca" | "consolidation" | "opening_request"; entityPublicId: string; documentType: string; title: string; fileName: string; mimeType: string; base64: string }) {
  const db = await dbOrThrow();
  const allowedRoles = input.entityType === "demand" ? ["demandante", "administrador"] : input.entityType === "opening_request" ? ["compras"] : ["administrador"];
  await requireRole(db, actor, allowedRoles, "Seu perfil não pode anexar documentos nesta fase.");
  const encoded = input.base64.includes(",") ? input.base64.split(",")[1] : input.base64;
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("O documento deve ter até 8 MB.");
  const sameType = await db.select({ id: planningDocuments.id }).from(planningDocuments).where(and(eq(planningDocuments.entityType, input.entityType), eq(planningDocuments.entityPublicId, input.entityPublicId), eq(planningDocuments.documentType, input.documentType)));
  const stored = await storagePut(`planning/${input.entityType}/${input.entityPublicId}/${input.fileName}`, bytes, input.mimeType || "application/octet-stream");
  await db.insert(planningDocuments).values({ entityType: input.entityType, entityPublicId: input.entityPublicId, documentType: input.documentType.trim(), title: input.title.trim(), version: sameType.length + 1, storageKey: stored.key, storageUrl: stored.url, mimeType: input.mimeType || undefined, sizeBytes: bytes.length, uploadedByUserId: actor.id });
  await audit(db, actor.id, "planning.document_uploaded", `Documento ${input.title.trim()} anexado à fase de planejamento.`, { entityType: input.entityType, entityPublicId: input.entityPublicId, documentType: input.documentType.trim() });
  return { url: stored.url };
}

export async function completePlanningChecklist(actor: Actor, input: { itemId: number; status: "completed" | "waived"; notes?: string }) {
  const db = await dbOrThrow();
  const [item] = await db.select().from(planningChecklistItems).where(eq(planningChecklistItems.id, input.itemId)).limit(1);
  if (!item) throw new Error("Item de checklist não encontrado.");
  const allowedRoles = planningChecklistAllowedRoles(item.entityType);
  await requireRole(db, actor, allowedRoles, "Seu perfil não pode concluir este checklist.");
  if (input.status === "waived" && !input.notes?.trim()) throw new Error("A dispensa do item exige justificativa.");
  await db.update(planningChecklistItems).set({ status: input.status, notes: input.notes?.trim() || null, completedByUserId: actor.id, completedAt: new Date() }).where(eq(planningChecklistItems.id, item.id));
  await audit(db, actor.id, "planning.checklist_updated", `Checklist ${item.code} registrado como ${input.status}.`, { itemId: item.id, entityType: item.entityType, entityPublicId: item.entityPublicId, status: input.status, notes: input.notes?.trim() || null });
  return { success: true };
}

export async function refreshPlanningDeadlineAlerts() {
  const db = await dbOrThrow();
  const now = new Date();
  const candidates = await db.select({ id: planningAlerts.id, status: planningAlerts.status, dueAt: planningAlerts.dueAt }).from(planningAlerts).where(inArray(planningAlerts.status, ["open", "acknowledged"]));
  const overdue = candidates.filter(alert => shouldEscalatePlanningAlert(alert, now));
  if (overdue.length) await db.update(planningAlerts).set({ severity: "critical" }).where(inArray(planningAlerts.id, overdue.map(alert => alert.id)));

  const approvalDeadline = await configuredCalendarDate(db, planningCalendarKeys.dfdApprovalDeadline);
  let forwardedDemandCount = 0;
  if (approvalDeadline && approvalDeadline.getTime() <= now.getTime()) {
    const demandCandidates = await db.select().from(demands).where(inArray(demands.status, ["submitted", "under_review", "returned"]));
    for (const demand of demandCandidates) {
      const existingPresidencyEvent = await db.select({ id: demandCaseEvents.id }).from(demandCaseEvents).where(and(eq(demandCaseEvents.demandId, demand.id), eq(demandCaseEvents.eventType, "sent_to_presidency"))).limit(1);
      if (existingPresidencyEvent.length) continue;
      await db.transaction(async tx => {
        await tx.update(demands).set({ status: "presidency_review" }).where(and(eq(demands.id, demand.id), inArray(demands.status, ["submitted", "under_review", "returned"])));
        await tx.insert(demandCaseEvents).values({ demandId: demand.id, actorUserId: null, eventType: "sent_to_presidency", note: `Encaminhamento automático pelo prazo final do calendário de aprovação de DFDs (${approvalDeadline.toISOString()}).` });
        await tx.insert(planningAlerts).values({ entityType: "demand", entityPublicId: demand.publicId, severity: "warning", title: "DFD encaminhada à Presidência para decisão no prazo final do calendário.", dueAt: null });
        await notifyDemandAudience(tx as unknown as NotificationDb, { demandId: demand.id, requesterUserId: demand.requesterUserId, demandPublicId: demand.publicId, title: "DFD encaminhada à Presidência", body: `A DFD ${demand.publicId} — ${demand.title} foi encaminhada à Presidência pelo encerramento do prazo do calendário. A decisão será tomada com base na versão disponível e no histórico de complementações.`, notificationType: "demand_sent_to_presidency", idempotencyPrefix: `demand-sent-to-presidency:${demand.publicId}` });
        await audit(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, null, "demand.sent_to_presidency", `DFD ${demand.publicId} encaminhada automaticamente à Presidência pelo prazo final.`, { demandId: demand.id, demandPublicId: demand.publicId, approvalDeadline: approvalDeadline.toISOString() });
      });
      forwardedDemandCount += 1;
    }
  }
  return { overdueCount: overdue.length, forwardedDemandCount };
}

export async function acknowledgePlanningAlert(actor: Actor, alertId: number) {
  const db = await dbOrThrow();
  const [alert] = await db.select().from(planningAlerts).where(eq(planningAlerts.id, alertId)).limit(1);
  if (!alert || alert.status !== "open") throw new Error("Este alerta não está disponível para confirmação de ciência.");
  const allowedRoles = alert.entityType === "demand" ? ["demandante", "administrador"] : alert.entityType === "consolidation" ? ["administrador", "autoridade_competente"] : ["compras", "autoridade_competente"];
  await requireRole(db, actor, allowedRoles, "Seu perfil não pode confirmar ciência deste alerta.");
  await db.update(planningAlerts).set({ status: "acknowledged" }).where(eq(planningAlerts.id, alert.id));
  await audit(db, actor.id, "planning.alert_acknowledged", `Ciência registrada para alerta de ${alert.entityType}.`, { alertId: alert.id, entityType: alert.entityType, entityPublicId: alert.entityPublicId });
  return { success: true };
}
