import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAnnualPlan,
  createAnnualPlanItem,
  createOrganizationalUnit,
  createSupplier,
  getAdministrationOverview,
  getPlanningOverview,
  saveDocumentTemplate,
  saveGovernanceSetting,
  saveReferenceList,
  saveReferenceListItem,
  setOrganizationalUnitStatus,
} from "./adminService";
import { beginGoogleDriveAuthorization, disconnectGoogleDrive, getGoogleDriveConnection, getGoogleDriveStatus, setGoogleDriveRootFolder } from "./googleDriveService";
import { createLocalAccount, listLocalAccounts, resetLocalAccountPassword, updateLocalAccount } from "./selfhost/localAccountService";
import { getLocalBackupHealth, getLocalBackupStatus } from "./backupStatusService";
import {
  createProcessTask,
  createProcessDocumentFromTemplate,
  addPrivacyRisk,
  addSupplierProposal,
  assignProcessRole,
  decidePrivacyAssessment,
  dashboardSummary,
  getProcessDetail,
  getUserProcessRoles,
  getWorkspaceStatus,
  listPlanItems,
  listAccessDirectory,
  listActiveSuppliers,
  listProcesses,
  getPrivacyAssessment,
  refreshProcessDriveFolderMetadata,
  saveDemandPdfToProcessDrive,
  savePrivacyAssessment,
  setupFirstUnit,
  transitionStep,
  updateProcessTask,
  updateChecklist,
  uploadProcessDocument,
} from "./procurementService";
import {
  acknowledgePlanningAlert,
  completePlanningChecklist,
  createDemand,
  createDemandDraft,
  saveDemandDraft,
  getMyDemandDraft,
  listMyDemandDrafts,
  decideOpeningRequest,
  instantiateAuthorizedProcess,
  refreshPlanningDeadlineAlerts,
  uploadPlanningDocument,
} from "./planningService";
import {
  createDemandConsolidation,
  createPca,
  createPcaUpdate,
  createTwoStageOpeningRequest,
  decidePca,
  decidePcaUpdate,
  generatePcaArtifact,
  generatePcaUpdateArtifact,
  getDemandControl,
  getTwoStagePlanningBoard,
  approveDemand,
  decideDemandAtPresidency,
  publishPca,
  publishPcaUpdate,
  provideDemandComplementation,
  requestDemandComplementation,
  startDemandAnalysis,
  submitPcaToPresidency,
  submitPcaUpdateToPresidency,
} from "./planningTwoStageService";
import { listDocumentSignatureRequests, listSignatureEligibleDocuments, prepareGovbrSignature } from "./documentSignatureService";
import { superveningPlanningJustificationError } from "../shared/superveningDemand";
import { searchOfficialCnaeClasses } from "./cnaeService";
import { issueDfdPdfVerification } from "./dfdPdfVerificationService";
import { listUserNotifications, markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from "./notificationService";

const planningAccessProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roles = await getUserProcessRoles(ctx.user.id);
  const allowed = ctx.user.role === "admin" || roles.some(role => ["administrador", "chefia_compras", "compras", "autoridade_competente", "instrumentalizacao"].includes(role));
  if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "A gestão do planejamento exige um perfil autorizado." });
  return next({ ctx });
});

const institutionalAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roles = await getUserProcessRoles(ctx.user.id);
  if (ctx.user.role !== "admin" && !roles.includes("administrador")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "A gestão institucional exige o perfil administrador." });
  }
  return next({ ctx });
});

const demandItemInput = z.object({
  title: z.string().min(5).max(500),
  objectDescription: z.string().min(10).max(10_000),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  unitOfMeasure: z.string().max(100).optional(),
  estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  itemJustification: z.string().min(10).max(5_000),
  quantityJustification: z.string().max(5_000).optional(),
  estimatedValueJustification: z.string().max(5_000).optional(),
  priceResearchCertified: z.boolean(),
});

const createDemandInput = z.object({
  unitId: z.number().int().positive(),
  title: z.string().min(5).max(500),
  objectDescription: z.string().min(10),
  justification: z.string().min(1000, "A justificativa da DFD deve ter pelo menos 1.000 caracteres."),
  quantity: z.string().max(32).optional(),
  unitOfMeasure: z.string().max(100).optional(),
  estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  desiredContractDate: z.date().optional(),
  deliveryPeriod: z.string().max(255).optional(),
  annualPlanItemId: z.number().int().positive().optional(),
  supplyLineCnaeCode: z.string().min(4).max(16),
  supplyLineCnaeDescription: z.string().min(3).max(1_000),
  requesterCertified: z.literal(true),
  hasFutureFiscalImpact: z.boolean().optional(),
  isSupervening: z.boolean().optional(),
  planningJustification: z.string().max(5000).optional(),
  containsPersonalData: z.boolean().optional(),
  containsSensitiveData: z.boolean().optional(),
  privacyContext: z.string().max(5000).optional(),
  items: z.array(demandItemInput).min(1).max(50),
  draftPublicId: z.string().min(4).max(48).optional(),
}).superRefine((input, context) => {
  const message = superveningPlanningJustificationError(input);
  if (message) context.addIssue({ code: z.ZodIssueCode.custom, path: ["planningJustification"], message });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  workspace: router({
    status: protectedProcedure.query(({ ctx }) => getWorkspaceStatus(ctx.user.id)),
    initialize: adminProcedure.input(z.object({ name: z.string().min(3).max(255), code: z.string().min(2).max(48).regex(/^[A-Za-z0-9_-]+$/) })).mutation(({ ctx, input }) => setupFirstUnit(ctx.user, input)),
    directory: institutionalAdminProcedure.query(() => listAccessDirectory()),
    assignRole: institutionalAdminProcedure.input(z.object({
      userId: z.number().int().positive(),
      unitId: z.number().int().positive(),
      role: z.enum(["demandante", "chefia_compras", "compras", "instrumentalizacao", "contabilidade", "juridico", "encarregado_lgpd", "agente_contratacao", "autoridade_competente", "gestao_contratos", "fiscal_contrato", "administrador"]),
    })).mutation(({ ctx, input }) => assignProcessRole(ctx.user, input)),
  }),
  administration: router({
    overview: institutionalAdminProcedure.query(() => getAdministrationOverview()),
    createUnit: institutionalAdminProcedure.input(z.object({ name: z.string().min(3).max(255), code: z.string().min(2).max(48).regex(/^[A-Za-z0-9_-]+$/) })).mutation(({ ctx, input }) => createOrganizationalUnit(ctx.user, input)),
    setUnitStatus: institutionalAdminProcedure.input(z.object({ unitId: z.number().int().positive(), active: z.boolean() })).mutation(({ ctx, input }) => setOrganizationalUnitStatus(ctx.user, input)),
    saveSetting: institutionalAdminProcedure.input(z.object({
      category: z.string().min(2).max(80),
      settingKey: z.string().min(2).max(120),
      label: z.string().min(3).max(255),
      value: z.string().max(10_000).optional(),
      description: z.string().max(10_000).optional(),
      active: z.boolean().optional(),
    })).mutation(({ ctx, input }) => saveGovernanceSetting(ctx.user, input)),
    saveReferenceList: institutionalAdminProcedure.input(z.object({ code: z.string().min(2).max(80), label: z.string().min(3).max(255), description: z.string().max(5000).optional(), active: z.boolean().optional() })).mutation(({ ctx, input }) => saveReferenceList(ctx.user, input)),
    saveReferenceListItem: institutionalAdminProcedure.input(z.object({ listId: z.number().int().positive(), value: z.string().min(1).max(120), label: z.string().min(2).max(255), sortOrder: z.number().int().min(0).max(10000).optional(), active: z.boolean().optional() })).mutation(({ ctx, input }) => saveReferenceListItem(ctx.user, input)),
    planning: institutionalAdminProcedure.query(() => getPlanningOverview()),
    createPlan: institutionalAdminProcedure.input(z.object({ fiscalYear: z.number().int().min(2020).max(2100), title: z.string().min(3).max(255), status: z.enum(["draft", "active", "closed"]) })).mutation(({ ctx, input }) => createAnnualPlan(ctx.user, input)),
    createPlanItem: institutionalAdminProcedure.input(z.object({
      planId: z.number().int().positive(),
      code: z.string().min(2).max(48),
      title: z.string().min(3).max(500),
      requestingUnitId: z.number().int().positive().optional(),
      estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      status: z.enum(["planned", "in_progress", "completed", "changed", "cancelled"]),
    })).mutation(({ ctx, input }) => createAnnualPlanItem(ctx.user, input)),
    saveTemplate: institutionalAdminProcedure.input(z.object({
      code: z.string().min(2).max(100),
      title: z.string().min(3).max(500),
      documentType: z.string().min(2).max(120),
      templateKind: z.enum(["checklist", "document"]).optional(),
      workflowStepKey: z.string().min(2).max(100).optional(),
      officialSourceUrl: z.string().url().max(1000).optional(),
      externalTemplateId: z.string().min(10).max(500).optional(),
      content: z.string().max(50_000).optional(),
      active: z.boolean().optional(),
    })).mutation(({ ctx, input }) => saveDocumentTemplate(ctx.user, input)),
    createSupplier: institutionalAdminProcedure.input(z.object({ legalName: z.string().min(3).max(500), taxId: z.string().min(11).max(32), email: z.string().email().max(320).optional(), phone: z.string().max(48).optional(), status: z.enum(["active", "pending_review", "restricted", "inactive"]), notes: z.string().max(10_000).optional() })).mutation(({ ctx, input }) => createSupplier(ctx.user, input)),
    localAccounts: institutionalAdminProcedure.query(() => listLocalAccounts()),
    backupStatus: institutionalAdminProcedure.query(() => getLocalBackupStatus()),
    createLocalAccount: institutionalAdminProcedure.input(z.object({ name: z.string().min(3).max(255), email: z.string().email().max(320), password: z.string().min(1).max(200), role: z.enum(["user", "admin"]) })).mutation(({ ctx, input }) => createLocalAccount(ctx.user, input)),
    updateLocalAccount: institutionalAdminProcedure.input(z.object({ userId: z.number().int().positive(), name: z.string().min(3).max(255), email: z.string().email().max(320), role: z.enum(["user", "admin"]), active: z.boolean() })).mutation(({ ctx, input }) => updateLocalAccount(ctx.user, input)),
    resetLocalAccountPassword: institutionalAdminProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(1).max(200) })).mutation(({ ctx, input }) => resetLocalAccountPassword(ctx.user, input)),
  }),
  backup: router({
    health: protectedProcedure.query(() => getLocalBackupHealth()),
  }),
  signature: router({
    list: protectedProcedure.query(({ ctx }) => listDocumentSignatureRequests(ctx.user)),
    eligibleDocuments: protectedProcedure.query(({ ctx }) => listSignatureEligibleDocuments(ctx.user)),
    prepareGovbr: protectedProcedure.input(z.object({ documentScope: z.enum(["planning", "process"]), documentId: z.number().int().positive() })).mutation(({ ctx, input }) => prepareGovbrSignature(ctx.user, input)),
  }),
  googleDrive: router({
    connection: protectedProcedure.query(({ ctx }) => getGoogleDriveConnection(ctx.user.id)),
    status: protectedProcedure.query(({ ctx }) => getGoogleDriveStatus(ctx.user.id)),
    beginAuthorization: protectedProcedure.mutation(({ ctx }) => beginGoogleDriveAuthorization(ctx.user.id)),
    setRootFolder: protectedProcedure.input(z.object({ folder: z.string().min(10).max(1000) })).mutation(({ ctx, input }) => setGoogleDriveRootFolder(ctx.user.id, input.folder)),
    disconnect: protectedProcedure.mutation(({ ctx }) => disconnectGoogleDrive(ctx.user.id)),
  }),
  cnae: router({
    search: protectedProcedure.input(z.object({ query: z.string().min(2).max(120) })).query(({ input }) => searchOfficialCnaeClasses(input.query)),
  }),
  dashboard: router({
    summary: protectedProcedure.query(() => dashboardSummary()),
    notifications: protectedProcedure.query(({ ctx }) => listUserNotifications(ctx.user.id)),
    unreadNotificationCount: protectedProcedure.query(({ ctx }) => unreadNotificationCount(ctx.user.id)),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead(ctx.user.id, input.notificationId)),
    markAllNotificationsRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
  }),
  privacy: router({
    assessment: protectedProcedure.input(z.object({ processPublicId: z.string().min(4).max(64) })).query(({ ctx, input }) => getPrivacyAssessment(ctx.user, input.processPublicId)),
    save: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      containsPersonalData: z.boolean(),
      containsSensitiveData: z.boolean(),
      containsVulnerableData: z.boolean(),
      largeScale: z.boolean(),
      publicAreaMonitoring: z.boolean(),
      solelyAutomatedDecision: z.boolean(),
      externalSharing: z.boolean(),
      internationalTransfer: z.boolean(),
      treatmentDescription: z.string().max(10_000).optional(),
      dataCategories: z.string().max(5_000).optional(),
      dataSubjectCategories: z.string().max(5_000).optional(),
      dataSource: z.string().max(5_000).optional(),
      purpose: z.string().max(5_000).optional(),
      legalBasis: z.string().max(180).optional(),
      necessityAssessment: z.string().max(10_000).optional(),
      retentionPolicy: z.string().max(5_000).optional(),
      disposalMethod: z.string().max(5_000).optional(),
      securityMeasures: z.string().max(10_000).optional(),
      riskLevel: z.enum(["unknown", "low", "medium", "high"]),
      dpoConsulted: z.boolean().optional(),
      dpoOpinion: z.string().max(10_000).optional(),
      reviewDueAt: z.date().optional(),
    })).mutation(({ ctx, input }) => savePrivacyAssessment(ctx.user, input)),
    addRisk: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      title: z.string().min(3).max(500),
      description: z.string().max(5_000).optional(),
      probability: z.enum(["low", "medium", "high"]),
      impact: z.enum(["low", "medium", "high"]),
      residualRisk: z.enum(["low", "medium", "high"]),
      mitigation: z.string().max(5_000).optional(),
      ownerRole: z.string().max(80).optional(),
    })).mutation(({ ctx, input }) => addPrivacyRisk(ctx.user, input)),
    decide: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      outcome: z.enum(["approved", "needs_changes", "risk_accepted", "not_applicable"]),
      justification: z.string().min(10).max(10_000),
    })).mutation(({ ctx, input }) => decidePrivacyAssessment(ctx.user, input)),
  }),
  planning: router({
    board: planningAccessProcedure.query(() => getTwoStagePlanningBoard()),
    demandControl: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48) })).query(({ ctx, input }) => getDemandControl(ctx.user, input.demandPublicId)),
    myDrafts: protectedProcedure.query(({ ctx }) => listMyDemandDrafts(ctx.user)),
    demandDraft: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48) })).query(({ ctx, input }) => getMyDemandDraft(ctx.user, input.demandPublicId)),
    demandPdfVerification: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48) })).query(({ ctx, input }) => issueDfdPdfVerification(ctx.user, input.demandPublicId)),
    startDemandAnalysis: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), note: z.string().max(5_000).optional() })).mutation(({ ctx, input }) => startDemandAnalysis(ctx.user, input.demandPublicId, input.note)),
    requestDemandComplementation: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), note: z.string().min(5, "Informe o que precisa ser complementado.").max(5_000) })).mutation(({ ctx, input }) => requestDemandComplementation(ctx.user, input)),
    provideDemandComplementation: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), note: z.string().min(5, "Descreva a complementação realizada.").max(5_000) })).mutation(({ ctx, input }) => provideDemandComplementation(ctx.user, input)),
    approveDemand: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), note: z.string().min(5, "Registre a motivação da aprovação.").max(5_000) })).mutation(({ ctx, input }) => approveDemand(ctx.user, input)),
    decideDemandAtPresidency: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), action: z.enum(["approve", "partial", "reject"]), notes: z.string().min(5).max(10_000), approvedItems: z.array(z.object({ itemId: z.number().int().positive(), approvedValue: z.string().regex(/^\\d+(\\.\\d{1,2})?$/).optional() })).optional() })).mutation(({ ctx, input }) => decideDemandAtPresidency(ctx.user, input)),
    createDemandDraft: protectedProcedure.input(z.object({ unitId: z.number().int().positive() })).mutation(({ ctx, input }) => createDemandDraft(ctx.user, input)),
    saveDemandDraft: protectedProcedure.input(z.object({ draftPublicId: z.string().min(4).max(48), unitId: z.number().int().positive(), title: z.string().max(500).optional(), objectDescription: z.string().optional(), justification: z.string().optional(), annualPlanItemId: z.number().int().positive().optional(), supplyLineCnaeCode: z.string().max(16).optional(), supplyLineCnaeDescription: z.string().max(1000).optional(), desiredContractDate: z.date().optional(), deliveryPeriod: z.string().max(255).optional(), hasFutureFiscalImpact: z.boolean().optional(), isSupervening: z.boolean().optional(), planningJustification: z.string().max(5000).optional(), containsPersonalData: z.boolean().optional(), containsSensitiveData: z.boolean().optional(), privacyContext: z.string().max(5000).optional(), items: z.array(demandItemInput).max(50).optional() })).mutation(({ ctx, input }) => saveDemandDraft(ctx.user, input)),
    createDemand: protectedProcedure.input(createDemandInput).mutation(({ ctx, input }) => createDemand(ctx.user, input)),
    createDemandConsolidation: protectedProcedure.input(z.object({ title: z.string().min(5).max(500), notes: z.string().max(5000).optional(), demandPublicIds: z.array(z.string().min(4).max(48)).min(1).max(100) })).mutation(({ ctx, input }) => createDemandConsolidation(ctx.user, input)),
    createPca: protectedProcedure.input(z.object({ title: z.string().min(5).max(500), planId: z.number().int().positive(), demandConsolidationPublicIds: z.array(z.string().min(4).max(64)).max(100), demandPublicIds: z.array(z.string().min(4).max(48)).max(100).optional() }).refine(input => input.demandConsolidationPublicIds.length > 0 || (input.demandPublicIds?.length ?? 0) > 0, { message: "Selecione ao menos uma consolidação ou uma DFD para o PCA." })).mutation(({ ctx, input }) => createPca(ctx.user, input)),
    createPcaUpdate: protectedProcedure.input(z.object({ pcaPublicId: z.string().min(4).max(64), title: z.string().min(5).max(500).optional(), demandPublicIds: z.array(z.string().min(4).max(48)).min(1).max(100) })).mutation(({ ctx, input }) => createPcaUpdate(ctx.user, input)),
    completeChecklist: protectedProcedure.input(z.object({ itemId: z.number().int().positive(), status: z.enum(["completed", "waived"]), notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => completePlanningChecklist(ctx.user, input)),
    acknowledgeAlert: protectedProcedure.input(z.object({ alertId: z.number().int().positive() })).mutation(({ ctx, input }) => acknowledgePlanningAlert(ctx.user, input.alertId)),
    refreshDeadlines: institutionalAdminProcedure.mutation(() => refreshPlanningDeadlineAlerts()),
    generatePcaArtifact: protectedProcedure.input(z.object({ pcaPublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => generatePcaArtifact(ctx.user, input.pcaPublicId)),
    generatePcaUpdateArtifact: protectedProcedure.input(z.object({ pcaUpdatePublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => generatePcaUpdateArtifact(ctx.user, input.pcaUpdatePublicId)),
    submitPca: protectedProcedure.input(z.object({ pcaPublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => submitPcaToPresidency(ctx.user, input.pcaPublicId)),
    submitPcaUpdate: protectedProcedure.input(z.object({ pcaUpdatePublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => submitPcaUpdateToPresidency(ctx.user, input.pcaUpdatePublicId)),
    decidePca: protectedProcedure.input(z.object({ pcaPublicId: z.string().min(4).max(64), action: z.enum(["approve", "return", "reject"]), notes: z.string().min(5).max(10_000) })).mutation(({ ctx, input }) => decidePca(ctx.user, input)),
    decidePcaUpdate: protectedProcedure.input(z.object({ pcaUpdatePublicId: z.string().min(4).max(64), action: z.enum(["approve", "return", "reject"]), notes: z.string().min(5).max(10_000) })).mutation(({ ctx, input }) => decidePcaUpdate(ctx.user, input)),
    publishPca: protectedProcedure.input(z.object({ pcaPublicId: z.string().min(4).max(64), publicationReference: z.string().min(3).max(500) })).mutation(({ ctx, input }) => publishPca(ctx.user, input)),
    publishPcaUpdate: protectedProcedure.input(z.object({ pcaUpdatePublicId: z.string().min(4).max(64), publicationReference: z.string().min(3).max(500) })).mutation(({ ctx, input }) => publishPcaUpdate(ctx.user, input)),
    createOpeningRequest: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), proposedWorkflowType: z.enum(["direct_contracting", "bidding"]), proposedModality: z.string().min(3).max(120), justification: z.string().min(10).max(10_000) })).mutation(({ ctx, input }) => createTwoStageOpeningRequest(ctx.user, input)),
    decideOpeningRequest: protectedProcedure.input(z.object({ requestPublicId: z.string().min(4).max(64), action: z.enum(["authorize", "return", "reject"]), notes: z.string().min(5).max(10_000) })).mutation(({ ctx, input }) => decideOpeningRequest(ctx.user, input)),
    instantiateProcess: protectedProcedure.input(z.object({ requestPublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => instantiateAuthorizedProcess(ctx.user, input.requestPublicId)),
    uploadDocument: protectedProcedure.input(z.object({ entityType: z.enum(["demand", "demand_consolidation", "pca", "consolidation", "opening_request"]), entityPublicId: z.string().min(4).max(64), documentType: z.string().min(2).max(120), title: z.string().min(2).max(500), fileName: z.string().min(1).max(200), mimeType: z.string().max(150), base64: z.string().min(4).max(12_000_000) })).mutation(({ ctx, input }) => uploadPlanningDocument(ctx.user, input)),
  }),
  procurement: router({
    list: protectedProcedure.query(() => listProcesses()),
    supplierDirectory: protectedProcedure.query(() => listActiveSuppliers()),
    detail: protectedProcedure.input(z.object({ publicId: z.string().min(4).max(64) })).query(({ input }) => getProcessDetail(input.publicId)),
    planItems: protectedProcedure.query(() => listPlanItems()),
    updateChecklist: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      checklistId: z.number().int().positive(),
      status: z.enum(["completed", "waived", "not_applicable"]),
      notes: z.string().max(5000).optional(),
    })).mutation(({ ctx, input }) => updateChecklist(ctx.user, input)),
    transition: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      action: z.enum(["complete", "return", "waive"]),
      note: z.string().min(3).max(5000),
      targetStepKey: z.string().max(100).optional(),
      outcome: z.enum(["success", "failure"]).optional(),
    })).mutation(({ ctx, input }) => transitionStep(ctx.user, input)),
    uploadDocument: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      workflowStepId: z.number().int().positive().optional(),
      documentType: z.string().min(2).max(120),
      title: z.string().min(2).max(500),
      fileName: z.string().min(1).max(200),
      mimeType: z.string().max(150),
      base64: z.string().min(4).max(12_000_000),
    })).mutation(({ ctx, input }) => uploadProcessDocument(ctx.user, input)),
    createDocumentFromTemplate: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      templateCode: z.string().min(2).max(100),
      workflowStepId: z.number().int().positive().optional(),
    })).mutation(({ ctx, input }) => createProcessDocumentFromTemplate(ctx.user, input)),
    refreshDriveFolderMetadata: protectedProcedure.input(z.object({ processPublicId: z.string().min(4).max(64) })).mutation(({ ctx, input }) => refreshProcessDriveFolderMetadata(ctx.user, input.processPublicId)),
    saveDemandPdfToDrive: protectedProcedure.input(z.object({ demandPublicId: z.string().min(4).max(48), fileName: z.string().min(5).max(240), contentBase64: z.string().min(100).max(22_000_000) })).mutation(({ ctx, input }) => saveDemandPdfToProcessDrive(ctx.user, input)),
    createTask: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      workflowStepId: z.number().int().positive().optional(),
      title: z.string().min(3).max(500),
      description: z.string().max(5000).optional(),
      required: z.boolean().optional(),
      assigneeRole: z.string().max(80).optional(),
      dueAt: z.date().optional(),
    })).mutation(({ ctx, input }) => createProcessTask(ctx.user, input)),
    updateTask: protectedProcedure.input(z.object({
      processPublicId: z.string().min(4).max(64),
      taskId: z.number().int().positive(),
      status: z.enum(["in_progress", "completed", "cancelled"]),
    })).mutation(({ ctx, input }) => updateProcessTask(ctx.user, input)),
    addSupplierProposal: protectedProcedure.input(z.object({ processPublicId: z.string().min(4).max(64), supplierId: z.number().int().positive(), offeredValue: z.string().regex(/^\d+(\.\d{1,2})?$/), notes: z.string().max(5000).optional() })).mutation(({ ctx, input }) => addSupplierProposal(ctx.user, input)),
  }),
});

export type AppRouter = typeof appRouter;
