import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  annualPlanItems,
  auditEvents,
  demands,
  demandCaseEvents,
  documentTemplates,
  openingRequests,
  organizationalUnits,
  planningAlerts,
  planningConsolidations,
  processAlerts,
  processDecisions,
  processDocuments,
  processPublications,
  processTasks,
  privacyAssessments,
  privacyDecisions,
  privacyRisks,
  procurementProcesses,
  suppliers,
  supplierProposals,
  userProcessRoles,
  users,
  workflowChecklists,
  workflowSteps,
} from "../drizzle/schema";
import { canActOnWorkflowByRole } from "../shared/authorization";
import { canManagePrivacyByRole, derivePrivacySignals } from "../shared/privacy";
import { workflowStepsFor } from "../shared/workflow";
import { getDb } from "./db";
import { createGoogleDriveDocument, getGoogleDriveFolderMetadata, uploadGoogleDrivePdf } from "./googleDriveService";
import { storagePut } from "./storage";
import { notifyDemandAudience, type NotificationDb } from "./notificationService";

export type ProcessRole = "demandante" | "chefia_compras" | "compras" | "instrumentalizacao" | "contabilidade" | "juridico" | "encarregado_lgpd" | "agente_contratacao" | "autoridade_competente" | "gestao_contratos" | "fiscal_contrato" | "administrador";

export const PROCESS_ROLE_OPTIONS: ProcessRole[] = ["demandante", "chefia_compras", "compras", "instrumentalizacao", "contabilidade", "juridico", "encarregado_lgpd", "agente_contratacao", "autoridade_competente", "gestao_contratos", "fiscal_contrato", "administrador"];

const asId = (prefix: string) => `${prefix}-${nanoid(10).toUpperCase()}`;

const DOCUMENT_STEP_RULES: Record<string, string[]> = {
  ETP: ["ETP"],
  TR: ["TR_DRAFT", "TR_FINAL"],
  RPP: ["PRICE_RESEARCH"],
  EDITAL: ["NOTICE"],
};

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

export async function getUserProcessRoles(userId: number): Promise<ProcessRole[]> {
  const db = await dbOrThrow();
  const memberships = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, userId), eq(userProcessRoles.active, true)));
  return memberships.map(item => item.role as ProcessRole);
}

export async function userCanAct(user: { id: number; role: "user" | "admin" }, requiredRole: string) {
  return canActOnWorkflowByRole(user.role, await getUserProcessRoles(user.id), requiredRole);
}

async function writeAuditEvent(
  db: Awaited<ReturnType<typeof dbOrThrow>>,
  processId: number | null,
  actorUserId: number | null,
  eventType: string,
  summary: string,
  payload?: Record<string, unknown>,
) {
  await db.insert(auditEvents).values({
    processId: processId ?? undefined,
    actorUserId: actorUserId ?? undefined,
    eventType,
    summary,
    payload,
  });
}

export async function getWorkspaceStatus(userId: number) {
  const db = await dbOrThrow();
  const [unitRows, roles] = await Promise.all([
    db.select().from(organizationalUnits).orderBy(asc(organizationalUnits.name)),
    getUserProcessRoles(userId),
  ]);
  return { units: unitRows, roles, isConfigured: unitRows.length > 0 };
}

export async function setupFirstUnit(user: { id: number }, input: { name: string; code: string }) {
  const db = await dbOrThrow();
  const existing = await db.select().from(organizationalUnits).where(eq(organizationalUnits.code, input.code)).limit(1);
  let unitId: number;
  if (existing[0]) {
    unitId = existing[0].id;
  } else {
    const result = await db.insert(organizationalUnits).values({ name: input.name.trim(), code: input.code.trim().toUpperCase() });
    unitId = Number(result[0].insertId);
  }
  await db.insert(userProcessRoles).values({ userId: user.id, unitId, role: "administrador" }).onDuplicateKeyUpdate({ set: { active: true } });
  await writeAuditEvent(db, null, user.id, "workspace.initialized", `Unidade organizacional ${input.name.trim()} configurada.`, { unitId });
  return { unitId };
}

export async function listAccessDirectory() {
  const db = await dbOrThrow();
  const rows = await db.select({
    userId: users.id,
    name: users.name,
    email: users.email,
    platformRole: users.role,
    assignmentId: userProcessRoles.id,
    processRole: userProcessRoles.role,
    unitId: organizationalUnits.id,
    unitName: organizationalUnits.name,
  }).from(users)
    .leftJoin(userProcessRoles, and(eq(userProcessRoles.userId, users.id), eq(userProcessRoles.active, true)))
    .leftJoin(organizationalUnits, eq(userProcessRoles.unitId, organizationalUnits.id))
    .orderBy(asc(users.name));
  const directory = new Map<number, { id: number; name: string | null; email: string | null; platformRole: string; assignments: { id: number; role: string; unitId: number | null; unitName: string | null }[] }>();
  for (const row of rows) {
    const existing = directory.get(row.userId) ?? { id: row.userId, name: row.name, email: row.email, platformRole: row.platformRole, assignments: [] };
    if (row.assignmentId && row.processRole) existing.assignments.push({ id: row.assignmentId, role: row.processRole, unitId: row.unitId, unitName: row.unitName });
    directory.set(row.userId, existing);
  }
  return Array.from(directory.values());
}

export async function assignProcessRole(
  actor: { id: number },
  input: { userId: number; unitId: number; role: ProcessRole },
) {
  const db = await dbOrThrow();
  const [user, unit] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1),
    db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(and(eq(organizationalUnits.id, input.unitId), eq(organizationalUnits.active, true))).limit(1),
  ]);
  if (!user[0]) throw new Error("A conta escolhida ainda não está disponível na ÓRBITA.");
  if (!unit[0]) throw new Error("A unidade selecionada não está disponível.");
  await db.insert(userProcessRoles).values({ userId: input.userId, unitId: input.unitId, role: input.role }).onDuplicateKeyUpdate({ set: { active: true } });
  await writeAuditEvent(db, null, actor.id, "access.role_assigned", `Perfil ${input.role} atribuído a uma conta institucional.`, { assignedUserId: input.userId, unitId: input.unitId, role: input.role });
  return { success: true };
}

export async function createProcurementProcess(
  user: { id: number },
  input: {
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
    isSupervening?: boolean;
    planningJustification?: string;
    modality?: string;
    workflowType: "direct_contracting" | "bidding";
  },
) {
  const db = await dbOrThrow();
  const [unit] = await db.select().from(organizationalUnits).where(and(eq(organizationalUnits.id, input.unitId), eq(organizationalUnits.active, true))).limit(1);
  if (!unit) throw new Error("A unidade solicitante informada não está disponível.");

  return db.transaction(async tx => {
    const demandPublicId = asId("DFD");
    const processPublicId = asId(input.workflowType === "bidding" ? "LIC" : "CD");
    const demandResult = await tx.insert(demands).values({
      publicId: demandPublicId,
      requestingUnitId: input.unitId,
      requesterUserId: user.id,
      title: input.title.trim(),
      objectDescription: input.objectDescription.trim(),
      justification: input.justification.trim(),
      quantity: input.quantity || undefined,
      unitOfMeasure: input.unitOfMeasure?.trim() || undefined,
      initialEstimatedValue: input.estimatedValue || undefined,
      desiredContractDate: input.desiredContractDate,
      deliveryPeriod: input.deliveryPeriod?.trim() || undefined,
      annualPlanItemId: input.annualPlanItemId,
      isSupervening: input.isSupervening ?? false,
      planningJustification: input.planningJustification?.trim() || undefined,
      status: "submitted",
    });
    const demandId = Number(demandResult[0].insertId);
    const selectedSteps = workflowStepsFor(input.workflowType);
    const first = selectedSteps[0];
    const processResult = await tx.insert(procurementProcesses).values({
      publicId: processPublicId,
      demandId,
      workflowType: input.workflowType,
      modality: input.modality?.trim() || (input.workflowType === "bidding" ? "Pregão eletrônico" : "Dispensa de licitação"),
      title: input.title.trim(),
      currentStepKey: first.key,
      currentResponsibleRole: first.role,
      status: "active",
      estimatedValue: input.estimatedValue || undefined,
      createdByUserId: user.id,
      startedAt: new Date(),
    });
    const processId = Number(processResult[0].insertId);
    const stepsRows = selectedSteps.map((step, index) => ({
      processId,
      stepKey: step.key,
      title: step.title,
      module: step.module,
      sequence: index + 1,
      status: index === 0 ? "in_progress" as const : "waiting" as const,
      assigneeRole: step.role,
      assigneeUserId: index === 0 ? user.id : undefined,
      startedAt: index === 0 ? new Date() : undefined,
    }));
    await tx.insert(workflowSteps).values(stepsRows);
    const savedSteps = await tx.select().from(workflowSteps).where(eq(workflowSteps.processId, processId));
    const checklistRows = selectedSteps.map(step => {
      const saved = savedSteps.find(candidate => candidate.stepKey === step.key);
      return {
        processId,
        workflowStepId: saved?.id,
        code: `${step.key}_BASE`,
        title: step.checklist,
      };
    });
    const officialTemplates = input.workflowType === "direct_contracting"
      ? await tx.select().from(documentTemplates).where(and(eq(documentTemplates.active, true), eq(documentTemplates.templateKind, "checklist")))
      : [];
    const officialChecklistRows = officialTemplates.flatMap(template => {
      if (!template.workflowStepKey || !template.content) return [];
      const workflowStepId = savedSteps.find(step => step.stepKey === template.workflowStepKey)?.id;
      if (!workflowStepId) return [];
      return template.content.split(/\r?\n/).filter(Boolean).map((title, index) => ({ processId, workflowStepId, code: `${template.code}_${String(index + 1).padStart(3, "0")}`, title }));
    });
    await tx.insert(workflowChecklists).values([...checklistRows, ...officialChecklistRows]);
    await tx.insert(processAlerts).values({
      processId,
      workflowStepId: savedSteps[0]?.id,
      severity: "info",
      title: "Etapa inicial iniciada: formalização da demanda.",
      status: "open",
    });
    await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, processId, user.id, "process.created", `Processo de ${input.workflowType === "bidding" ? "licitação" : "contratação direta"} iniciado a partir de uma nova demanda.`, { demandPublicId, processPublicId, workflowType: input.workflowType });
    return { processId, publicId: processPublicId, demandPublicId };
  });
}

export async function listProcesses() {
  const db = await dbOrThrow();
  return db.select({
    id: procurementProcesses.id,
    publicId: procurementProcesses.publicId,
    title: procurementProcesses.title,
    status: procurementProcesses.status,
    workflowType: procurementProcesses.workflowType,
    currentStepKey: procurementProcesses.currentStepKey,
    currentResponsibleRole: procurementProcesses.currentResponsibleRole,
    estimatedValue: procurementProcesses.estimatedValue,
    externalFolderProvider: procurementProcesses.externalFolderProvider,
    externalFolderId: procurementProcesses.externalFolderId,
    externalFolderUrl: procurementProcesses.externalFolderUrl,
    externalFolderModifiedAt: procurementProcesses.externalFolderModifiedAt,
    createdAt: procurementProcesses.createdAt,
    updatedAt: procurementProcesses.updatedAt,
    demandPublicId: demands.publicId,
    requestingUnitName: organizationalUnits.name,
  }).from(procurementProcesses)
    .innerJoin(demands, eq(procurementProcesses.demandId, demands.id))
    .innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id))
    .orderBy(desc(procurementProcesses.updatedAt));
}

export async function refreshProcessDriveFolderMetadata(user: { id: number; role: "user" | "admin" }, processPublicId: string) {
  const db = await dbOrThrow();
  const [process] = await db.select({ id: procurementProcesses.id, externalFolderProvider: procurementProcesses.externalFolderProvider, externalFolderId: procurementProcesses.externalFolderId })
    .from(procurementProcesses)
    .where(eq(procurementProcesses.publicId, processPublicId))
    .limit(1);
  if (!process) throw new Error("Processo não encontrado.");
  if (process.externalFolderProvider !== "google_drive" || !process.externalFolderId) throw new Error("Este processo ainda não possui uma pasta vinculada ao Google Drive.");
  const folder = await getGoogleDriveFolderMetadata(user.id, process.externalFolderId);
  await db.update(procurementProcesses).set({
    externalFolderProvider: "google_drive",
    externalFolderId: folder.folderId,
    externalFolderUrl: folder.folderUrl,
    externalFolderModifiedAt: folder.modifiedAt,
  }).where(eq(procurementProcesses.id, process.id));
  await writeAuditEvent(db, process.id, user.id, "google_drive.folder_metadata_refreshed", "Data de modificação da pasta no Google Drive atualizada.", { folderId: folder.folderId, modifiedAt: folder.modifiedAt?.toISOString() ?? null });
  return folder;
}

export async function getProcessDetail(publicId: string) {
  const db = await dbOrThrow();
  const [process] = await db.select({
    process: procurementProcesses,
    demand: demands,
    unit: organizationalUnits,
  }).from(procurementProcesses)
    .innerJoin(demands, eq(procurementProcesses.demandId, demands.id))
    .innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id))
    .where(eq(procurementProcesses.publicId, publicId))
    .limit(1);
  if (!process) return null;
  const [steps, checklists, decisions, documents, publications, tasks, events, alerts, proposals] = await Promise.all([
    db.select().from(workflowSteps).where(eq(workflowSteps.processId, process.process.id)).orderBy(asc(workflowSteps.sequence)),
    db.select().from(workflowChecklists).where(eq(workflowChecklists.processId, process.process.id)),
    db.select().from(processDecisions).where(eq(processDecisions.processId, process.process.id)).orderBy(desc(processDecisions.createdAt)),
    db.select().from(processDocuments).where(eq(processDocuments.processId, process.process.id)).orderBy(desc(processDocuments.createdAt)),
    db.select().from(processPublications).where(eq(processPublications.processId, process.process.id)).orderBy(desc(processPublications.createdAt)),
    db.select().from(processTasks).where(eq(processTasks.processId, process.process.id)).orderBy(asc(processTasks.status), asc(processTasks.createdAt)),
    db.select().from(auditEvents).where(eq(auditEvents.processId, process.process.id)).orderBy(desc(auditEvents.createdAt)),
    db.select().from(processAlerts).where(eq(processAlerts.processId, process.process.id)).orderBy(desc(processAlerts.createdAt)),
    db.select({ proposal: supplierProposals, supplier: suppliers }).from(supplierProposals).innerJoin(suppliers, eq(supplierProposals.supplierId, suppliers.id)).where(eq(supplierProposals.processId, process.process.id)).orderBy(desc(supplierProposals.receivedAt)),
  ]);
  return { ...process, steps, checklists, decisions, documents, publications, tasks, events, alerts, proposals };
}

export async function listActiveSuppliers() {
  const db = await dbOrThrow();
  return db.select().from(suppliers).where(eq(suppliers.status, "active")).orderBy(asc(suppliers.legalName));
}

export async function addSupplierProposal(user: { id: number; role: "user" | "admin" }, input: { processPublicId: string; supplierId: number; offeredValue: string; notes?: string }) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const roles = await getUserProcessRoles(user.id);
  if (user.role !== "admin" && !roles.some(role => ["compras", "agente_contratacao", "administrador"].includes(role))) throw new Error("O registro de proposta exige perfil de Compras ou Agente de Contratação.");
  const db = await dbOrThrow();
  const [supplier] = await db.select().from(suppliers).where(and(eq(suppliers.id, input.supplierId), eq(suppliers.status, "active"))).limit(1);
  if (!supplier) throw new Error("Selecione um fornecedor ativo do diretório institucional.");
  const offeredValue = Number(input.offeredValue);
  if (!Number.isFinite(offeredValue) || offeredValue < 0) throw new Error("Informe um valor de proposta válido.");
  const result = await db.insert(supplierProposals).values({ processId: detail.process.id, supplierId: supplier.id, offeredValue: input.offeredValue, notes: input.notes?.trim() || null, status: "received" });
  const proposalId = Number(result[0].insertId);
  await writeAuditEvent(db, detail.process.id, user.id, "supplier.proposal_registered", `Proposta recebida do fornecedor ${supplier.legalName}.`, { proposalId, supplierId: supplier.id, offeredValue: input.offeredValue });
  return { id: proposalId };
}

async function canManagePrivacy(user: { id: number; role: "user" | "admin" }) {
  if (user.role === "admin") return true;
  return canManagePrivacyByRole(user.role, await getUserProcessRoles(user.id));
}

export type PrivacyAssessmentInput = {
  processPublicId: string;
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  containsVulnerableData: boolean;
  largeScale: boolean;
  publicAreaMonitoring: boolean;
  solelyAutomatedDecision: boolean;
  externalSharing: boolean;
  internationalTransfer: boolean;
  treatmentDescription?: string;
  dataCategories?: string;
  dataSubjectCategories?: string;
  dataSource?: string;
  purpose?: string;
  legalBasis?: string;
  necessityAssessment?: string;
  retentionPolicy?: string;
  disposalMethod?: string;
  securityMeasures?: string;
  riskLevel: "unknown" | "low" | "medium" | "high";
  dpoConsulted?: boolean;
  dpoOpinion?: string;
  reviewDueAt?: Date;
};

export async function getPrivacyAssessment(user: { id: number; role: "user" | "admin" }, processPublicId: string) {
  if (!(await canManagePrivacy(user))) throw new Error("A avaliação LGPD é acessível apenas aos perfis jurídico, encarregado LGPD ou administrador.");
  const detail = await getProcessDetail(processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const db = await dbOrThrow();
  const [assessment] = await db.select().from(privacyAssessments).where(eq(privacyAssessments.processId, detail.process.id)).limit(1);
  if (!assessment) return { process: detail.process, assessment: null, risks: [], decisions: [], signals: null };
  const [risks, decisions] = await Promise.all([
    db.select().from(privacyRisks).where(eq(privacyRisks.assessmentId, assessment.id)).orderBy(desc(privacyRisks.createdAt)),
    db.select().from(privacyDecisions).where(eq(privacyDecisions.assessmentId, assessment.id)).orderBy(desc(privacyDecisions.createdAt)),
  ]);
  const signals = derivePrivacySignals(assessment);
  return { process: detail.process, assessment, risks, decisions, signals };
}

export async function savePrivacyAssessment(user: { id: number; role: "user" | "admin" }, input: PrivacyAssessmentInput) {
  if (!(await canManagePrivacy(user))) throw new Error("A avaliação LGPD exige atuação do jurídico, encarregado LGPD ou administrador.");
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const db = await dbOrThrow();
  const signals = derivePrivacySignals(input);
  const hasPersonalData = input.containsPersonalData;
  const state: "in_review" | "not_applicable" = hasPersonalData ? "in_review" : "not_applicable";
  const values = {
    status: state,
    containsPersonalData: hasPersonalData,
    containsSensitiveData: input.containsSensitiveData,
    containsVulnerableData: input.containsVulnerableData,
    largeScale: input.largeScale,
    publicAreaMonitoring: input.publicAreaMonitoring,
    solelyAutomatedDecision: input.solelyAutomatedDecision,
    externalSharing: input.externalSharing,
    internationalTransfer: input.internationalTransfer,
    treatmentDescription: input.treatmentDescription?.trim() || null,
    dataCategories: input.dataCategories?.trim() || null,
    dataSubjectCategories: input.dataSubjectCategories?.trim() || null,
    dataSource: input.dataSource?.trim() || null,
    purpose: input.purpose?.trim() || null,
    legalBasis: input.legalBasis?.trim() || null,
    necessityAssessment: input.necessityAssessment?.trim() || null,
    retentionPolicy: input.retentionPolicy?.trim() || null,
    disposalMethod: input.disposalMethod?.trim() || null,
    securityMeasures: input.securityMeasures?.trim() || null,
    riskLevel: input.riskLevel,
    ripdRecommended: signals.ripdRecommended,
    dpoConsulted: input.dpoConsulted ?? false,
    dpoOpinion: input.dpoOpinion?.trim() || null,
    reviewDueAt: input.reviewDueAt,
    lastReviewedAt: new Date(),
  };
  await db.transaction(async tx => {
    const [existing] = await tx.select().from(privacyAssessments).where(eq(privacyAssessments.processId, detail.process.id)).limit(1);
    if (existing) {
      await tx.update(privacyAssessments).set(values).where(eq(privacyAssessments.id, existing.id));
    } else {
      await tx.insert(privacyAssessments).values({ processId: detail.process.id, createdByUserId: user.id, ...values });
    }
    if (signals.requiresReinforcedReview || signals.ripdRecommended || input.riskLevel === "high") {
      const [openAlert] = await tx.select().from(processAlerts).where(and(eq(processAlerts.processId, detail.process.id), eq(processAlerts.status, "open"), eq(processAlerts.title, "LGPD: revisão reforçada necessária."))).limit(1);
      if (!openAlert) await tx.insert(processAlerts).values({ processId: detail.process.id, severity: input.riskLevel === "high" ? "critical" : "warning", title: "LGPD: revisão reforçada necessária.", status: "open" });
    }
    await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, detail.process.id, user.id, "privacy.assessment_saved", "Análise LGPD atualizada; requer revisão humana antes de qualquer decisão institucional.", { ripdRecommended: signals.ripdRecommended, requiresReinforcedReview: signals.requiresReinforcedReview, riskLevel: input.riskLevel });
  });
  return getPrivacyAssessment(user, input.processPublicId);
}

export async function addPrivacyRisk(user: { id: number; role: "user" | "admin" }, input: { processPublicId: string; title: string; description?: string; probability: "low" | "medium" | "high"; impact: "low" | "medium" | "high"; residualRisk: "low" | "medium" | "high"; mitigation?: string; ownerRole?: string }) {
  if (!(await canManagePrivacy(user))) throw new Error("O registro de riscos LGPD exige atuação do jurídico, encarregado LGPD ou administrador.");
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const db = await dbOrThrow();
  const [assessment] = await db.select().from(privacyAssessments).where(eq(privacyAssessments.processId, detail.process.id)).limit(1);
  if (!assessment) throw new Error("Preencha primeiro a análise LGPD do processo.");
  const result = await db.insert(privacyRisks).values({ assessmentId: assessment.id, title: input.title.trim(), description: input.description?.trim() || null, probability: input.probability, impact: input.impact, residualRisk: input.residualRisk, mitigation: input.mitigation?.trim() || null, ownerRole: input.ownerRole?.trim() || null });
  await writeAuditEvent(db, detail.process.id, user.id, "privacy.risk_added", `Risco LGPD registrado: ${input.title.trim()}`, { privacyRiskId: Number(result[0].insertId) });
  return { id: Number(result[0].insertId) };
}

export async function decidePrivacyAssessment(user: { id: number; role: "user" | "admin" }, input: { processPublicId: string; outcome: "approved" | "needs_changes" | "risk_accepted" | "not_applicable"; justification: string }) {
  if (!(await canManagePrivacy(user))) throw new Error("A decisão da análise LGPD exige atuação do jurídico, encarregado LGPD ou administrador.");
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const db = await dbOrThrow();
  const [assessment] = await db.select().from(privacyAssessments).where(eq(privacyAssessments.processId, detail.process.id)).limit(1);
  if (!assessment) throw new Error("Preencha a análise LGPD antes de registrar uma decisão.");
  await db.transaction(async tx => {
    await tx.insert(privacyDecisions).values({ assessmentId: assessment.id, outcome: input.outcome, justification: input.justification.trim(), decidedByUserId: user.id });
    await tx.update(privacyAssessments).set({ status: input.outcome, decidedByUserId: user.id, lastReviewedAt: new Date() }).where(eq(privacyAssessments.id, assessment.id));
    await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, detail.process.id, user.id, "privacy.decision_recorded", "Decisão de privacidade registrada por responsável humano.", { outcome: input.outcome });
  });
  return { success: true };
}

export async function updateChecklist(user: { id: number; role: "user" | "admin" }, input: { processPublicId: string; checklistId: number; status: "completed" | "waived" | "not_applicable"; notes?: string }) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const checklist = detail.checklists.find(item => item.id === input.checklistId);
  if (!checklist) throw new Error("Item de checklist não encontrado neste processo.");
  const step = detail.steps.find(item => item.id === checklist.workflowStepId);
  if (!step || !(await userCanAct(user, step.assigneeRole))) throw new Error("Você não possui permissão para alterar este checklist.");
  if (input.status === "waived" && !input.notes?.trim()) throw new Error("A dispensa de checklist exige justificativa.");
  const db = await dbOrThrow();
  await db.update(workflowChecklists).set({ status: input.status, notes: input.notes?.trim() || null, completedByUserId: user.id, completedAt: new Date() }).where(eq(workflowChecklists.id, input.checklistId));
  await writeAuditEvent(db, detail.process.id, user.id, "checklist.updated", `Checklist atualizado: ${checklist.title}`, { checklistId: checklist.id, status: input.status });
  return { success: true };
}

export async function transitionStep(
  user: { id: number; role: "user" | "admin" },
  input: { processPublicId: string; action: "complete" | "return" | "waive"; note: string; targetStepKey?: string; outcome?: "success" | "failure" },
) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const current = detail.steps.find(step => step.stepKey === detail.process.currentStepKey);
  if (!current) throw new Error("A etapa atual do processo não foi encontrada.");
  if (!(await userCanAct(user, current.assigneeRole))) throw new Error("Você não possui permissão para movimentar esta etapa.");
  if (!input.note.trim()) throw new Error("Informe uma justificativa ou registro para a movimentação.");
  const db = await dbOrThrow();

  if (input.action === "complete") {
    const pendingRequired = detail.checklists.filter(item => item.workflowStepId === current.id && item.required && item.status === "pending");
    if (pendingRequired.length) throw new Error("Conclua, justifique ou marque como não aplicáveis todos os itens obrigatórios do checklist antes de avançar.");
    const incompleteTasks = detail.tasks.filter(task => task.workflowStepId === current.id && task.required && !["completed", "cancelled"].includes(task.status));
    if (incompleteTasks.length) throw new Error("Conclua ou cancele justificadamente todas as tarefas obrigatórias desta etapa antes de avançar.");
    const next = detail.steps.find(step => step.sequence === current.sequence + 1);
    await db.transaction(async tx => {
      await tx.update(workflowSteps).set({ status: "completed", completionNote: input.note.trim(), completedAt: new Date() }).where(eq(workflowSteps.id, current.id));
      if (next) {
        await tx.update(workflowSteps).set({ status: "in_progress", startedAt: new Date() }).where(eq(workflowSteps.id, next.id));
        await tx.update(procurementProcesses).set({ currentStepKey: next.stepKey, currentResponsibleRole: next.assigneeRole }).where(eq(procurementProcesses.id, detail.process.id));
      } else {
        const closureOutcome = input.outcome ?? "success";
        await tx.update(procurementProcesses).set({ status: "archived", currentStepKey: null, currentResponsibleRole: null, closedAt: new Date(), closureOutcome, closureNote: input.note.trim() }).where(eq(procurementProcesses.id, detail.process.id));
        await tx.insert(demandCaseEvents).values({ demandId: detail.demand.id, actorUserId: user.id, eventType: "procurement_completed", note: input.note.trim() });
        await notifyDemandAudience(tx as unknown as NotificationDb, { demandId: detail.demand.id, requesterUserId: detail.demand.requesterUserId, demandPublicId: detail.demand.publicId, title: closureOutcome === "success" ? "Contratação finalizada com sucesso" : "Contratação finalizada sem sucesso", body: `A contratação vinculada à DFD ${detail.demand.publicId} — ${detail.demand.title} foi finalizada por Compras com resultado: ${closureOutcome === "success" ? "sucesso" : "fracasso"}. Consulte a DFD e a TRILHA para ver o registro final.`, notificationType: "procurement_completed", idempotencyPrefix: `procurement-completed:${detail.process.publicId}` });
      }
      await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, detail.process.id, user.id, "workflow.completed", `Etapa concluída: ${current.title}`, { stepKey: current.stepKey, note: input.note.trim(), nextStepKey: next?.stepKey, outcome: next ? null : input.outcome ?? "success" });
    });
    return { success: true };
  }

  if (input.action === "waive") {
    await db.transaction(async tx => {
      await tx.update(workflowSteps).set({ status: "skipped", completionNote: input.note.trim(), completedAt: new Date() }).where(eq(workflowSteps.id, current.id));
      await tx.insert(processDecisions).values({ processId: detail.process.id, workflowStepId: current.id, decisionType: "waiver", outcome: "waived", justification: input.note.trim(), decidedByUserId: user.id });
      const next = detail.steps.find(step => step.sequence === current.sequence + 1);
      if (next) {
        await tx.update(workflowSteps).set({ status: "in_progress", startedAt: new Date() }).where(eq(workflowSteps.id, next.id));
        await tx.update(procurementProcesses).set({ currentStepKey: next.stepKey, currentResponsibleRole: next.assigneeRole }).where(eq(procurementProcesses.id, detail.process.id));
      }
      await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, detail.process.id, user.id, "workflow.waived", `Etapa dispensada: ${current.title}`, { stepKey: current.stepKey, note: input.note.trim(), nextStepKey: next?.stepKey });
    });
    return { success: true };
  }

  if (!input.targetStepKey) throw new Error("Informe a etapa para a qual o processo deve retornar.");
  const target = detail.steps.find(step => step.stepKey === input.targetStepKey);
  if (!target || target.sequence >= current.sequence) throw new Error("O retorno precisa apontar para uma etapa anterior do processo.");
  await db.transaction(async tx => {
    await tx.update(workflowSteps).set({ status: "returned", completionNote: input.note.trim() }).where(eq(workflowSteps.id, current.id));
    await tx.update(workflowSteps).set({ status: "in_progress", startedAt: new Date(), completionNote: null }).where(eq(workflowSteps.id, target.id));
    await tx.update(procurementProcesses).set({ currentStepKey: target.stepKey, currentResponsibleRole: target.assigneeRole, status: "active" }).where(eq(procurementProcesses.id, detail.process.id));
    await tx.insert(processDecisions).values({ processId: detail.process.id, workflowStepId: current.id, decisionType: "return", outcome: "returned", justification: input.note.trim(), targetStepKey: target.stepKey, decidedByUserId: user.id });
    await writeAuditEvent(tx as unknown as Awaited<ReturnType<typeof dbOrThrow>>, detail.process.id, user.id, "workflow.returned", `Processo devolvido para: ${target.title}`, { fromStepKey: current.stepKey, targetStepKey: target.stepKey, note: input.note.trim() });
  });
  return { success: true };
}

export async function dashboardSummary() {
  const db = await dbOrThrow();
  const [counts, demandCounts, consolidationCounts, openingCounts, privacyCounts, supplierCounts, processAlertRows, planningAlertRows] = await Promise.all([
    db.select({ total: sql<number>`count(*)`, active: sql<number>`sum(case when ${procurementProcesses.status} = 'active' then 1 else 0 end)`, blocked: sql<number>`sum(case when ${procurementProcesses.status} = 'blocked' then 1 else 0 end)` }).from(procurementProcesses),
    db.select({ total: sql<number>`count(*)`, privacyFlagged: sql<number>`sum(case when ${demands.containsPersonalData} = true or ${demands.containsSensitiveData} = true then 1 else 0 end)` }).from(demands),
    db.select({ awaitingPresidency: sql<number>`sum(case when ${planningConsolidations.status} = 'presidency_review' then 1 else 0 end)`, published: sql<number>`sum(case when ${planningConsolidations.status} = 'published' then 1 else 0 end)` }).from(planningConsolidations),
    db.select({ awaitingPresidency: sql<number>`sum(case when ${openingRequests.status} = 'presidency_review' then 1 else 0 end)`, authorized: sql<number>`sum(case when ${openingRequests.status} = 'authorized' then 1 else 0 end)` }).from(openingRequests),
    db.select({ inReview: sql<number>`sum(case when ${privacyAssessments.status} = 'in_review' then 1 else 0 end)` }).from(privacyAssessments),
    db.select({ active: sql<number>`sum(case when ${suppliers.status} = 'active' then 1 else 0 end)` }).from(suppliers),
    db.select().from(processAlerts).where(eq(processAlerts.status, "open")).orderBy(desc(processAlerts.createdAt)).limit(8),
    db.select().from(planningAlerts).where(eq(planningAlerts.status, "open")).orderBy(desc(planningAlerts.createdAt)).limit(8),
  ]);
  const recentProcesses = await listProcesses();
  const [processCounts] = counts;
  const [demandCount] = demandCounts;
  const [consolidationCount] = consolidationCounts;
  const [openingCount] = openingCounts;
  const [privacyCount] = privacyCounts;
  const [supplierCount] = supplierCounts;
  const alerts = [...processAlertRows.map(alert => ({ ...alert, source: "process" as const })), ...planningAlertRows.map(alert => ({ ...alert, source: "planning" as const }))].sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).slice(0, 8);
  return {
    counts: { total: Number(processCounts?.total ?? 0), active: Number(processCounts?.active ?? 0), blocked: Number(processCounts?.blocked ?? 0) },
    planning: { demands: Number(demandCount?.total ?? 0), privacyFlaggedDemands: Number(demandCount?.privacyFlagged ?? 0), pcaAwaitingPresidency: Number(consolidationCount?.awaitingPresidency ?? 0), pcaPublished: Number(consolidationCount?.published ?? 0), openingsAwaitingPresidency: Number(openingCount?.awaitingPresidency ?? 0), openingsAuthorized: Number(openingCount?.authorized ?? 0), privacyInReview: Number(privacyCount?.inReview ?? 0), activeSuppliers: Number(supplierCount?.active ?? 0) },
    alerts,
    recentProcesses: recentProcesses.slice(0, 8),
  };
}

export async function listPlanItems() {
  const db = await dbOrThrow();
  return db.select().from(annualPlanItems).orderBy(asc(annualPlanItems.code));
}

export async function uploadProcessDocument(
  user: { id: number; role: "user" | "admin" },
  input: { processPublicId: string; workflowStepId?: number; documentType: string; title: string; fileName: string; mimeType: string; base64: string },
) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const step = input.workflowStepId ? detail.steps.find(item => item.id === input.workflowStepId) : detail.steps.find(item => item.stepKey === detail.process.currentStepKey);
  const requiredRole = step?.assigneeRole ?? detail.process.currentResponsibleRole;
  if (!requiredRole || !(await userCanAct(user, requiredRole))) throw new Error("Você não possui permissão para anexar documentos nesta etapa.");
  const normalized = input.base64.replace(/^data:[^;]+;base64,/, "");
  const binary = Buffer.from(normalized, "base64");
  if (!binary.length) throw new Error("O arquivo enviado está vazio ou inválido.");
  if (binary.length > 8 * 1024 * 1024) throw new Error("O arquivo ultrapassa o limite operacional de 8 MB.");
  const safeFileName = input.fileName.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 160) || "documento";
  const { key, url } = await storagePut(`orbita/${detail.process.publicId}/${step?.stepKey ?? "geral"}/${safeFileName}`, binary, input.mimeType || "application/octet-stream");
  const db = await dbOrThrow();
  const versions = detail.documents.filter(item => item.documentType === input.documentType);
  const result = await db.insert(processDocuments).values({
    processId: detail.process.id,
    workflowStepId: step?.id,
    documentType: input.documentType.trim(),
    title: input.title.trim(),
    version: versions.length + 1,
    storageKey: key,
    storageUrl: url,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: binary.length,
    uploadedByUserId: user.id,
  });
  await writeAuditEvent(db, detail.process.id, user.id, "document.uploaded", `Documento anexado: ${input.title.trim()}`, { documentId: Number(result[0].insertId), workflowStepId: step?.id, storageKey: key });
  return { id: Number(result[0].insertId), url };
}

export async function saveDemandPdfToProcessDrive(
  user: { id: number; role: "user" | "admin" },
  input: { demandPublicId: string; fileName: string; contentBase64: string },
) {
  const db = await dbOrThrow();
  const [record] = await db.select({ process: procurementProcesses, demand: demands, unitName: organizationalUnits.name }).from(procurementProcesses)
    .innerJoin(demands, eq(procurementProcesses.demandId, demands.id))
    .innerJoin(organizationalUnits, eq(demands.requestingUnitId, organizationalUnits.id))
    .where(eq(demands.publicId, input.demandPublicId)).limit(1);
  if (!record) throw new Error("A DFD ainda não possui processo instaurado; o PDF poderá ser salvo no Drive após a instauração.");
  const roles = await getUserProcessRoles(user.id);
  if (user.role !== "admin" && record.demand.requesterUserId !== user.id && !roles.length) throw new Error("Você não possui permissão para salvar esta DFD na pasta do processo.");
  const uploaded = await uploadGoogleDrivePdf({ userId: user.id, processReference: record.process.publicId, processTitle: record.demand.title, existingFolderId: record.process.externalFolderId, fileName: input.fileName, contentBase64: input.contentBase64.replace(/^data:application\/pdf;base64,/, "") });
  const versions = await db.select({ id: processDocuments.id }).from(processDocuments).where(and(eq(processDocuments.processId, record.process.id), eq(processDocuments.documentType, "DFD_PDF")));
  const result = await db.insert(processDocuments).values({ processId: record.process.id, documentType: "DFD_PDF", title: `DFD exportada — ${record.demand.publicId}`, version: versions.length + 1, status: "published", externalProvider: "google_drive", externalFileId: uploaded.fileId, externalUrl: uploaded.fileUrl, mimeType: "application/pdf", sizeBytes: uploaded.sizeBytes, uploadedByUserId: user.id });
  await db.update(procurementProcesses).set({ externalFolderProvider: "google_drive", externalFolderId: uploaded.folderId, externalFolderUrl: uploaded.folderUrl, externalFolderModifiedAt: uploaded.folderModifiedAt }).where(eq(procurementProcesses.id, record.process.id));
  await writeAuditEvent(db, record.process.id, user.id, "demand.pdf_saved_to_drive", `PDF da DFD salvo no Google Drive: ${record.demand.publicId}`, { demandPublicId: record.demand.publicId, documentId: Number(result[0].insertId), externalFileId: uploaded.fileId, folderId: uploaded.folderId });
  return { documentId: Number(result[0].insertId), fileUrl: uploaded.fileUrl, folderUrl: uploaded.folderUrl };
}

export async function createProcessDocumentFromTemplate(
  user: { id: number; role: "user" | "admin" },
  input: { processPublicId: string; templateCode: string; workflowStepId?: number },
) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const step = input.workflowStepId ? detail.steps.find(item => item.id === input.workflowStepId) : detail.steps.find(item => item.stepKey === detail.process.currentStepKey);
  const requiredRole = step?.assigneeRole ?? detail.process.currentResponsibleRole;
  if (!requiredRole || !(await userCanAct(user, requiredRole))) throw new Error("Você não possui permissão para criar documentos nesta etapa.");

  const db = await dbOrThrow();
  const [template] = await db.select().from(documentTemplates).where(and(eq(documentTemplates.code, input.templateCode.trim().toUpperCase()), eq(documentTemplates.active, true))).limit(1);
  if (!template || template.templateKind !== "document") throw new Error("O modelo solicitado não está disponível para criação de arquivo.");
  if (template.workflowStepKey && template.workflowStepKey !== step?.stepKey) throw new Error("Este modelo só pode ser criado na etapa institucional correspondente.");
  const allowedSteps = DOCUMENT_STEP_RULES[template.documentType];
  if (allowedSteps && (!step?.stepKey || !allowedSteps.includes(step.stepKey))) throw new Error("Este documento só pode ser criado na etapa institucional correspondente.");

  const driveDocument = await createGoogleDriveDocument({
    userId: user.id,
    processReference: detail.process.publicId,
    processTitle: detail.process.title,
    requestingUnit: detail.unit.name,
    estimatedValue: detail.process.estimatedValue,
    documentLabel: template.documentType,
    templateFileId: template.externalTemplateId ?? "",
    existingFolderId: detail.process.externalFolderId,
  });

  if (
    !detail.process.externalFolderId
    || detail.process.externalFolderId !== driveDocument.folderId
    || detail.process.externalFolderProvider !== "google_drive"
    || !detail.process.externalFolderUrl
  ) {
    await db.update(procurementProcesses).set({
      externalFolderProvider: "google_drive",
      externalFolderId: driveDocument.folderId,
      externalFolderUrl: driveDocument.folderUrl,
      externalFolderModifiedAt: driveDocument.folderModifiedAt,
    }).where(eq(procurementProcesses.id, detail.process.id));
  }

  const version = detail.documents.filter(item => item.documentType === template.documentType).length + 1;
  const result = await db.insert(processDocuments).values({
    processId: detail.process.id,
    workflowStepId: step?.id,
    documentType: template.documentType,
    title: `[${template.documentType}] Processo ${detail.process.publicId}`,
    version,
    externalProvider: "google_drive",
    externalFileId: driveDocument.fileId,
    externalUrl: driveDocument.fileUrl,
    mimeType: "application/vnd.google-apps.document",
    uploadedByUserId: user.id,
  });
  const documentId = Number(result[0].insertId);
  await writeAuditEvent(db, detail.process.id, user.id, "document.created_from_template", `Documento criado a partir do modelo: ${template.title}.`, {
    documentId,
    templateCode: template.code,
    workflowStepId: step?.id,
    externalProvider: "google_drive",
    externalFileId: driveDocument.fileId,
    folderId: driveDocument.folderId,
    folderReuse: driveDocument.reusedExistingFolder,
  });
  return { id: documentId, url: driveDocument.fileUrl, folderUrl: driveDocument.folderUrl };
}

export async function createProcessTask(
  user: { id: number; role: "user" | "admin" },
  input: { processPublicId: string; workflowStepId?: number; title: string; description?: string; required?: boolean; assigneeRole?: string; dueAt?: Date },
) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const step = input.workflowStepId ? detail.steps.find(item => item.id === input.workflowStepId) : detail.steps.find(item => item.stepKey === detail.process.currentStepKey);
  const requiredRole = step?.assigneeRole ?? detail.process.currentResponsibleRole;
  if (!requiredRole || !(await userCanAct(user, requiredRole))) throw new Error("Você não possui permissão para criar tarefas nesta etapa.");
  const db = await dbOrThrow();
  const result = await db.insert(processTasks).values({
    processId: detail.process.id,
    workflowStepId: step?.id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    required: input.required ?? false,
    assigneeRole: input.assigneeRole?.trim() || requiredRole,
    dueAt: input.dueAt,
    createdByUserId: user.id,
  });
  await writeAuditEvent(db, detail.process.id, user.id, "task.created", `Tarefa criada: ${input.title.trim()}`, { taskId: Number(result[0].insertId), workflowStepId: step?.id });
  return { id: Number(result[0].insertId) };
}

export async function updateProcessTask(
  user: { id: number; role: "user" | "admin" },
  input: { processPublicId: string; taskId: number; status: "in_progress" | "completed" | "cancelled" },
) {
  const detail = await getProcessDetail(input.processPublicId);
  if (!detail) throw new Error("Processo não encontrado.");
  const task = detail.tasks.find(item => item.id === input.taskId);
  if (!task) throw new Error("Tarefa não encontrada neste processo.");
  const permittedByRole = task.assigneeRole ? await userCanAct(user, task.assigneeRole) : false;
  if (task.assigneeUserId !== user.id && !permittedByRole && user.role !== "admin") throw new Error("Você não possui permissão para atualizar esta tarefa.");
  const db = await dbOrThrow();
  await db.update(processTasks).set({
    status: input.status,
    completedByUserId: input.status === "completed" ? user.id : null,
    completedAt: input.status === "completed" ? new Date() : null,
  }).where(eq(processTasks.id, task.id));
  await writeAuditEvent(db, detail.process.id, user.id, "task.updated", `Tarefa ${input.status === "completed" ? "concluída" : "atualizada"}: ${task.title}`, { taskId: task.id, status: input.status });
  return { success: true };
}
