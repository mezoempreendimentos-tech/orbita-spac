import {
  boolean,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 512 }),
  active: boolean("active").default(true).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const localPasswordRecoveryRequests = mysqlTable("local_password_recovery_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "resolved", "cancelled"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedByUserId: int("resolvedByUserId").references(() => users.id),
}, (table) => [
  index("local_password_recovery_user_status_idx").on(table.userId, table.status),
  index("local_password_recovery_requested_idx").on(table.requestedAt),
]);

export const localBackupExecutions = mysqlTable("local_backup_executions", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt").notNull(),
  backupDirectory: varchar("backupDirectory", { length: 1000 }),
  backupSizeBytes: decimal("backupSizeBytes", { precision: 18, scale: 0 }),
  errorSummary: text("errorSummary"),
  source: varchar("source", { length: 80 }).default("windows_powershell").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("local_backup_executions_completed_idx").on(table.completedAt),
  index("local_backup_executions_status_idx").on(table.status, table.completedAt),
]);

export const organizationalUnits = mysqlTable("organizational_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const governanceSettings = mysqlTable("governance_settings", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 80 }).notNull(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  value: text("value"),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("governance_settings_category_idx").on(table.category),
]);

export const referenceLists = mysqlTable("reference_lists", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("reference_lists_code_uq").on(table.code),
  index("reference_lists_active_idx").on(table.active),
]);

export const referenceListItems = mysqlTable("reference_list_items", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull().references(() => referenceLists.id),
  value: varchar("value", { length: 120 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("reference_list_items_value_uq").on(table.listId, table.value),
  index("reference_list_items_list_active_idx").on(table.listId, table.active),
]);

export const userProcessRoles = mysqlTable("user_process_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  unitId: int("unitId").references(() => organizationalUnits.id),
  role: mysqlEnum("role", [
    "demandante",
    "chefia_compras",
    "compras",
    "instrumentalizacao",
    "contabilidade",
    "juridico",
    "encarregado_lgpd",
    "agente_contratacao",
    "autoridade_competente",
    "gestao_contratos",
    "fiscal_contrato",
    "administrador",
  ]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_process_roles_user_unit_role_uq").on(table.userId, table.unitId, table.role),
  index("user_process_roles_user_idx").on(table.userId),
]);

export const annualPlans = mysqlTable("annual_plans", {
  id: int("id").autoincrement().primaryKey(),
  fiscalYear: int("fiscalYear").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("annual_plans_year_uq").on(table.fiscalYear)]);

export const annualPlanItems = mysqlTable("annual_plan_items", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().references(() => annualPlans.id),
  code: varchar("code", { length: 48 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  requestingUnitId: int("requestingUnitId").references(() => organizationalUnits.id),
  estimatedValue: decimal("estimatedValue", { precision: 14, scale: 2 }),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "changed", "cancelled"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("annual_plan_items_plan_code_uq").on(table.planId, table.code),
  index("annual_plan_items_status_idx").on(table.status),
]);

export const demands = mysqlTable("demands", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 48 }).notNull().unique(),
  requestingUnitId: int("requestingUnitId").notNull().references(() => organizationalUnits.id),
  requesterUserId: int("requesterUserId").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }).notNull(),
  objectDescription: text("objectDescription").notNull(),
  justification: text("justification").notNull(),
  quantity: decimal("quantity", { precision: 14, scale: 2 }),
  unitOfMeasure: varchar("unitOfMeasure", { length: 100 }),
  initialEstimatedValue: decimal("initialEstimatedValue", { precision: 14, scale: 2 }),
  desiredContractDate: timestamp("desiredContractDate"),
  deliveryPeriod: varchar("deliveryPeriod", { length: 255 }),
  annualPlanItemId: int("annualPlanItemId").references(() => annualPlanItems.id),
  supplyLineCnaeCode: varchar("supplyLineCnaeCode", { length: 16 }),
  supplyLineCnaeDescription: varchar("supplyLineCnaeDescription", { length: 1000 }),
  hasFutureFiscalImpact: boolean("hasFutureFiscalImpact").default(false).notNull(),
  isSupervening: boolean("isSupervening").default(false).notNull(),
  planningJustification: text("planningJustification"),
  containsPersonalData: boolean("containsPersonalData").default(false).notNull(),
  containsSensitiveData: boolean("containsSensitiveData").default(false).notNull(),
  privacyContext: text("privacyContext"),
  requesterCertifiedAt: timestamp("requesterCertifiedAt"),
  presidencyDecisionNotes: text("presidencyDecisionNotes"),
  presidencyDecidedByUserId: int("presidencyDecidedByUserId").references(() => users.id),
  presidencyDecidedAt: timestamp("presidencyDecidedAt"),
  presidencyApprovedValue: decimal("presidencyApprovedValue", { precision: 14, scale: 2 }),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "presidency_review", "accepted", "partially_accepted", "returned", "cancelled", "rejected", "grouped", "awaiting_pca_publication", "published_in_pca", "awaiting_opening", "opening_authorized", "process_instantiated"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const demandItems = mysqlTable("demand_items", {
  id: int("id").autoincrement().primaryKey(),
  demandId: int("demandId").notNull(),
  sequence: int("sequence").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  objectDescription: text("objectDescription").notNull(),
  quantity: decimal("quantity", { precision: 14, scale: 4 }),
  unitOfMeasure: varchar("unitOfMeasure", { length: 100 }),
  estimatedValue: decimal("estimatedValue", { precision: 14, scale: 2 }),
  itemJustification: text("itemJustification"),
  quantityJustification: text("quantityJustification"),
  estimatedValueJustification: text("estimatedValueJustification"),
  priceResearchCertifiedAt: timestamp("priceResearchCertifiedAt"),
  presidencyDecision: mysqlEnum("presidencyDecision", ["pending", "approved", "rejected"]).default("pending").notNull(),
  presidencyApprovedValue: decimal("presidencyApprovedValue", { precision: 14, scale: 2 }),
  confirmed: boolean("confirmed").default(true).notNull(),
  confirmedAt: timestamp("confirmedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.demandId], foreignColumns: [demands.id], name: "demand_item_demand_fk" }),
  uniqueIndex("demand_items_demand_sequence_uq").on(table.demandId, table.sequence),
  index("demand_items_demand_idx").on(table.demandId),
]);

export const demandCaseEvents = mysqlTable("demand_case_events", {
  id: int("id").autoincrement().primaryKey(),
  demandId: int("demandId").notNull(),
  eventType: mysqlEnum("eventType", ["analysis_started", "complementation_requested", "complementation_provided", "sent_to_presidency", "approved", "partially_approved", "presidency_rejected", "returned", "procurement_completed"]).notNull(),
  note: text("note"),
  actorUserId: int("actorUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.demandId], foreignColumns: [demands.id], name: "dce_demand_fk" }),
  foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "dce_actor_fk" }),
  index("dce_demand_created_idx").on(table.demandId, table.createdAt),
]);

export const planningConsolidations = mysqlTable("planning_consolidations", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  planId: int("planId").references(() => annualPlans.id),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["draft", "consolidating", "ready_for_review", "presidency_review", "approved_for_publication", "published", "returned", "rejected"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  decidedByUserId: int("decidedByUserId").references(() => users.id),
  decisionNotes: text("decisionNotes"),
  documentKey: varchar("documentKey", { length: 700 }),
  documentUrl: varchar("documentUrl", { length: 1000 }),
  publicationReference: varchar("publicationReference", { length: 500 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("planning_consolidations_status_idx").on(table.status),
  index("planning_consolidations_plan_idx").on(table.planId),
  uniqueIndex("planning_consolidations_plan_uq").on(table.planId),
]);

export const demandConsolidations = mysqlTable("demand_consolidations", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["draft", "ready_for_pca", "included_in_pca", "returned", "cancelled"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("demand_consolidations_status_idx").on(table.status),
]);

export const demandConsolidationDemands = mysqlTable("demand_consolidation_demands", {
  id: int("id").autoincrement().primaryKey(),
  demandConsolidationId: int("demandConsolidationId").notNull(),
  demandId: int("demandId").notNull(),
  sequence: int("sequence").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.demandConsolidationId], foreignColumns: [demandConsolidations.id], name: "dcd_consolidation_fk" }),
  foreignKey({ columns: [table.demandId], foreignColumns: [demands.id], name: "dcd_demand_fk" }),
  uniqueIndex("demand_consolidation_demands_uq").on(table.demandConsolidationId, table.demandId),
  index("demand_consolidation_demands_demand_idx").on(table.demandId),
]);

export const planningConsolidationGroups = mysqlTable("planning_consolidation_groups", {
  id: int("id").autoincrement().primaryKey(),
  planningConsolidationId: int("planningConsolidationId").notNull(),
  demandConsolidationId: int("demandConsolidationId").notNull(),
  sequence: int("sequence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.planningConsolidationId], foreignColumns: [planningConsolidations.id], name: "pcg_pca_fk" }),
  foreignKey({ columns: [table.demandConsolidationId], foreignColumns: [demandConsolidations.id], name: "pcg_demand_consolidation_fk" }),
  uniqueIndex("planning_consolidation_groups_uq").on(table.planningConsolidationId, table.demandConsolidationId),
  index("planning_consolidation_groups_pca_idx").on(table.planningConsolidationId),
]);

export const pcaUpdates = mysqlTable("pca_updates", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  pcaId: int("pcaId").notNull().references(() => planningConsolidations.id),
  updateNumber: int("updateNumber").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["draft", "ready_for_review", "presidency_review", "approved_for_publication", "published", "returned", "rejected"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  decidedByUserId: int("decidedByUserId").references(() => users.id),
  decisionNotes: text("decisionNotes"),
  documentKey: varchar("documentKey", { length: 700 }),
  documentUrl: varchar("documentUrl", { length: 1000 }),
  publicationReference: varchar("publicationReference", { length: 500 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("pca_updates_pca_number_uq").on(table.pcaId, table.updateNumber),
  index("pca_updates_pca_status_idx").on(table.pcaId, table.status),
]);

export const pcaUpdateDemands = mysqlTable("pca_update_demands", {
  id: int("id").autoincrement().primaryKey(),
  pcaUpdateId: int("pcaUpdateId").notNull().references(() => pcaUpdates.id),
  demandId: int("demandId").notNull().references(() => demands.id),
  sequence: int("sequence").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pca_update_demands_uq").on(table.pcaUpdateId, table.demandId),
  index("pca_update_demands_demand_idx").on(table.demandId),
]);

/** Mantida exclusivamente para a migração do PCA legado, antes da separação em duas etapas. */
export const planningConsolidationDemands = mysqlTable("planning_consolidation_demands", {
  id: int("id").autoincrement().primaryKey(),
  consolidationId: int("consolidationId").notNull(),
  demandId: int("demandId").notNull().references(() => demands.id),
  sequence: int("sequence").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.consolidationId], foreignColumns: [planningConsolidations.id], name: "pcd_consolidation_fk" }),
  uniqueIndex("planning_consolidation_demands_uq").on(table.consolidationId, table.demandId),
  index("planning_consolidation_demands_demand_idx").on(table.demandId),
]);

export const procurementProcesses = mysqlTable("procurement_processes", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  demandId: int("demandId").notNull().references(() => demands.id),
  workflowType: mysqlEnum("workflowType", ["direct_contracting", "bidding"]).notNull(),
  modality: varchar("modality", { length: 120 }),
  title: varchar("title", { length: 500 }).notNull(),
  currentStepKey: varchar("currentStepKey", { length: 100 }),
  currentResponsibleRole: varchar("currentResponsibleRole", { length: 80 }),
  status: mysqlEnum("status", ["draft", "active", "blocked", "suspended", "authorized", "contracted", "archived", "annulled", "revoked", "cancelled"]).default("draft").notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 14, scale: 2 }),
  externalFolderProvider: varchar("externalFolderProvider", { length: 80 }),
  externalFolderId: varchar("externalFolderId", { length: 500 }),
  externalFolderUrl: varchar("externalFolderUrl", { length: 1000 }),
  externalFolderModifiedAt: timestamp("externalFolderModifiedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  startedAt: timestamp("startedAt"),
  closedAt: timestamp("closedAt"),
  closureOutcome: mysqlEnum("closureOutcome", ["success", "failure"]),
  closureNote: text("closureNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("procurement_processes_status_idx").on(table.status),
  index("procurement_processes_current_step_idx").on(table.currentStepKey),
  index("procurement_processes_demand_idx").on(table.demandId),
]);

export const openingRequests = mysqlTable("opening_requests", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  demandId: int("demandId").notNull().references(() => demands.id),
  pcaId: int("pcaId"),
  consolidationId: int("consolidationId").references(() => planningConsolidations.id),
  proposedWorkflowType: mysqlEnum("proposedWorkflowType", ["direct_contracting", "bidding"]).notNull(),
  proposedModality: varchar("proposedModality", { length: 120 }).notNull(),
  justification: text("justification").notNull(),
  status: mysqlEnum("status", ["draft", "presidency_review", "authorized", "returned", "rejected", "instantiated"]).default("draft").notNull(),
  requestedByUserId: int("requestedByUserId").notNull().references(() => users.id),
  decidedByUserId: int("decidedByUserId").references(() => users.id),
  decisionNotes: text("decisionNotes"),
  decidedAt: timestamp("decidedAt"),
  processId: int("processId").references(() => procurementProcesses.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("opening_requests_demand_uq").on(table.demandId),
  index("opening_requests_status_idx").on(table.status),
  foreignKey({ columns: [table.pcaId], foreignColumns: [planningConsolidations.id], name: "opening_request_pca_fk" }),
  index("opening_requests_pca_idx").on(table.pcaId),
  index("opening_requests_consolidation_idx").on(table.consolidationId),
]);

export const planningDocuments = mysqlTable("planning_documents", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["demand", "demand_consolidation", "pca", "consolidation", "opening_request"]).notNull(),
  entityPublicId: varchar("entityPublicId", { length: 64 }).notNull(),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  version: int("version").default(1).notNull(),
  storageKey: varchar("storageKey", { length: 700 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1000 }).notNull(),
  mimeType: varchar("mimeType", { length: 150 }),
  sizeBytes: int("sizeBytes"),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("planning_documents_entity_idx").on(table.entityType, table.entityPublicId),
]);

export const planningAlerts = mysqlTable("planning_alerts", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["demand", "demand_consolidation", "pca", "consolidation", "opening_request"]).notNull(),
  entityPublicId: varchar("entityPublicId", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => [
  index("planning_alerts_entity_idx").on(table.entityType, table.entityPublicId),
  index("planning_alerts_status_idx").on(table.status),
]);

export const userNotifications = mysqlTable("user_notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientUserId: int("recipientUserId").notNull().references(() => users.id),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityPublicId: varchar("entityPublicId", { length: 64 }).notNull(),
  notificationType: varchar("notificationType", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["unread", "read"]).default("unread").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => [
  index("user_notifications_recipient_status_idx").on(table.recipientUserId, table.status),
  index("user_notifications_entity_idx").on(table.entityType, table.entityPublicId),
]);

export const planningChecklistItems = mysqlTable("planning_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["demand", "demand_consolidation", "pca", "consolidation", "opening_request"]).notNull(),
  entityPublicId: varchar("entityPublicId", { length: 64 }).notNull(),
  templateCode: varchar("templateCode", { length: 100 }),
  code: varchar("code", { length: 120 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  required: boolean("required").default(true).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "waived"]).default("pending").notNull(),
  notes: text("notes"),
  completedByUserId: int("completedByUserId").references(() => users.id),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("planning_checklist_entity_code_uq").on(table.entityType, table.entityPublicId, table.code),
  index("planning_checklist_entity_idx").on(table.entityType, table.entityPublicId),
  index("planning_checklist_status_idx").on(table.status),
]);

export const workflowSteps = mysqlTable("workflow_steps", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  stepKey: varchar("stepKey", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  module: varchar("module", { length: 80 }).notNull(),
  sequence: int("sequence").notNull(),
  status: mysqlEnum("status", ["waiting", "ready", "in_progress", "completed", "returned", "skipped", "blocked"]).default("waiting").notNull(),
  required: boolean("required").default(true).notNull(),
  assigneeRole: varchar("assigneeRole", { length: 80 }).notNull(),
  assigneeUserId: int("assigneeUserId").references(() => users.id),
  dueAt: timestamp("dueAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  completionNote: text("completionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("workflow_steps_process_key_uq").on(table.processId, table.stepKey),
  index("workflow_steps_assignee_idx").on(table.assigneeUserId),
  index("workflow_steps_status_idx").on(table.status),
]);

export const workflowChecklists = mysqlTable("workflow_checklists", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  workflowStepId: int("workflowStepId").references(() => workflowSteps.id),
  code: varchar("code", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  required: boolean("required").default(true).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "waived", "not_applicable"]).default("pending").notNull(),
  notes: text("notes"),
  completedByUserId: int("completedByUserId").references(() => users.id),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("workflow_checklists_step_code_uq").on(table.workflowStepId, table.code),
  index("workflow_checklists_process_idx").on(table.processId),
]);

export const processTasks = mysqlTable("process_tasks", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  workflowStepId: int("workflowStepId").references(() => workflowSteps.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  required: boolean("required").default(false).notNull(),
  assigneeRole: varchar("assigneeRole", { length: 80 }),
  assigneeUserId: int("assigneeUserId").references(() => users.id),
  dueAt: timestamp("dueAt"),
  completedByUserId: int("completedByUserId").references(() => users.id),
  completedAt: timestamp("completedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("process_tasks_process_idx").on(table.processId),
  index("process_tasks_step_idx").on(table.workflowStepId),
  index("process_tasks_assignee_idx").on(table.assigneeUserId),
  index("process_tasks_status_idx").on(table.status),
]);

export const privacyAssessments = mysqlTable("privacy_assessments", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  status: mysqlEnum("status", ["not_started", "in_review", "approved", "needs_changes", "risk_accepted", "not_applicable"]).default("not_started").notNull(),
  containsPersonalData: boolean("containsPersonalData").default(false).notNull(),
  containsSensitiveData: boolean("containsSensitiveData").default(false).notNull(),
  containsVulnerableData: boolean("containsVulnerableData").default(false).notNull(),
  largeScale: boolean("largeScale").default(false).notNull(),
  publicAreaMonitoring: boolean("publicAreaMonitoring").default(false).notNull(),
  solelyAutomatedDecision: boolean("solelyAutomatedDecision").default(false).notNull(),
  externalSharing: boolean("externalSharing").default(false).notNull(),
  internationalTransfer: boolean("internationalTransfer").default(false).notNull(),
  treatmentDescription: text("treatmentDescription"),
  dataCategories: text("dataCategories"),
  dataSubjectCategories: text("dataSubjectCategories"),
  dataSource: text("dataSource"),
  purpose: text("purpose"),
  legalBasis: varchar("legalBasis", { length: 180 }),
  necessityAssessment: text("necessityAssessment"),
  retentionPolicy: text("retentionPolicy"),
  disposalMethod: text("disposalMethod"),
  securityMeasures: text("securityMeasures"),
  riskLevel: mysqlEnum("riskLevel", ["unknown", "low", "medium", "high"]).default("unknown").notNull(),
  ripdRecommended: boolean("ripdRecommended").default(false).notNull(),
  dpoConsulted: boolean("dpoConsulted").default(false).notNull(),
  dpoOpinion: text("dpoOpinion"),
  reviewDueAt: timestamp("reviewDueAt"),
  lastReviewedAt: timestamp("lastReviewedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  decidedByUserId: int("decidedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("privacy_assessments_process_uq").on(table.processId),
  index("privacy_assessments_status_idx").on(table.status),
  index("privacy_assessments_risk_idx").on(table.riskLevel),
]);

export const privacyRisks = mysqlTable("privacy_risks", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => privacyAssessments.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  probability: mysqlEnum("probability", ["low", "medium", "high"]).default("medium").notNull(),
  impact: mysqlEnum("impact", ["low", "medium", "high"]).default("medium").notNull(),
  residualRisk: mysqlEnum("residualRisk", ["low", "medium", "high"]).default("medium").notNull(),
  mitigation: text("mitigation"),
  ownerRole: varchar("ownerRole", { length: 80 }),
  status: mysqlEnum("status", ["open", "in_treatment", "mitigated", "accepted"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("privacy_risks_assessment_idx").on(table.assessmentId),
  index("privacy_risks_status_idx").on(table.status),
]);

export const privacyDecisions = mysqlTable("privacy_decisions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => privacyAssessments.id),
  outcome: mysqlEnum("outcome", ["approved", "needs_changes", "risk_accepted", "not_applicable"]).notNull(),
  justification: text("justification").notNull(),
  decidedByUserId: int("decidedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("privacy_decisions_assessment_idx").on(table.assessmentId),
]);

export const processDocuments = mysqlTable("process_documents", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  workflowStepId: int("workflowStepId").references(() => workflowSteps.id),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  version: int("version").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "under_review", "approved", "superseded", "published", "rejected"]).default("draft").notNull(),
  storageKey: varchar("storageKey", { length: 700 }),
  storageUrl: varchar("storageUrl", { length: 1000 }),
  externalProvider: varchar("externalProvider", { length: 80 }),
  externalFileId: varchar("externalFileId", { length: 500 }),
  externalUrl: varchar("externalUrl", { length: 1000 }),
  mimeType: varchar("mimeType", { length: 150 }),
  sizeBytes: int("sizeBytes"),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("process_documents_process_idx").on(table.processId),
  index("process_documents_step_idx").on(table.workflowStepId),
]);

export const documentSignatureRequests = mysqlTable("document_signature_requests", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  provider: mysqlEnum("provider", ["govbr"]).default("govbr").notNull(),
  documentScope: mysqlEnum("documentScope", ["planning", "process"]).notNull(),
  planningDocumentId: int("planningDocumentId").references(() => planningDocuments.id),
  processDocumentId: int("processDocumentId").references(() => processDocuments.id),
  status: mysqlEnum("status", ["awaiting_credentials", "ready_for_authorization", "authorization_requested", "signed", "failed", "cancelled"]).default("awaiting_credentials").notNull(),
  contentHashSha256: varchar("contentHashSha256", { length: 128 }),
  signatureStorageKey: varchar("signatureStorageKey", { length: 700 }),
  signatureStorageUrl: varchar("signatureStorageUrl", { length: 1000 }),
  externalSignatureId: varchar("externalSignatureId", { length: 500 }),
  requestedByUserId: int("requestedByUserId").notNull().references(() => users.id),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  signedAt: timestamp("signedAt"),
  failureReason: varchar("failureReason", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("document_signature_requests_planning_idx").on(table.planningDocumentId),
  index("document_signature_requests_process_idx").on(table.processDocumentId),
  index("document_signature_requests_status_idx").on(table.status),
]);

export const processDecisions = mysqlTable("process_decisions", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  workflowStepId: int("workflowStepId").references(() => workflowSteps.id),
  decisionType: mysqlEnum("decisionType", ["approval", "return", "waiver", "budget", "legal_opinion", "authorization", "annulment", "revocation", "supplier_selection"]).notNull(),
  outcome: varchar("outcome", { length: 120 }).notNull(),
  justification: text("justification").notNull(),
  targetStepKey: varchar("targetStepKey", { length: 100 }),
  decidedByUserId: int("decidedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("process_decisions_process_idx").on(table.processId),
  index("process_decisions_type_idx").on(table.decisionType),
]);

export const processPublications = mysqlTable("process_publications", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  documentId: int("documentId").references(() => processDocuments.id),
  publicationType: varchar("publicationType", { length: 120 }).notNull(),
  destination: mysqlEnum("destination", ["pncp", "official_site", "tce_mural", "internal"]).notNull(),
  status: mysqlEnum("status", ["pending", "ready", "sent", "confirmed", "failed", "waived"]).default("pending").notNull(),
  dueAt: timestamp("dueAt"),
  sentAt: timestamp("sentAt"),
  confirmationReference: varchar("confirmationReference", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("process_publications_process_idx").on(table.processId),
  index("process_publications_status_idx").on(table.status),
]);

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  legalName: varchar("legalName", { length: 500 }).notNull(),
  taxId: varchar("taxId", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 48 }),
  status: mysqlEnum("status", ["active", "pending_review", "restricted", "inactive"]).default("pending_review").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supplierProposals = mysqlTable("supplier_proposals", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  offeredValue: decimal("offeredValue", { precision: 14, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["received", "under_review", "qualified", "disqualified", "selected", "withdrawn"]).default("received").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("supplier_proposals_process_idx").on(table.processId),
]);

export const processAlerts = mysqlTable("process_alerts", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => procurementProcesses.id),
  workflowStepId: int("workflowStepId").references(() => workflowSteps.id),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  dueAt: timestamp("dueAt"),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  resolvedByUserId: int("resolvedByUserId").references(() => users.id),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("process_alerts_process_idx").on(table.processId),
  index("process_alerts_status_idx").on(table.status),
]);

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").references(() => procurementProcesses.id),
  actorUserId: int("actorUserId").references(() => users.id),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  summary: varchar("summary", { length: 1000 }).notNull(),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("audit_events_process_idx").on(table.processId),
  index("audit_events_actor_idx").on(table.actorUserId),
  index("audit_events_type_idx").on(table.eventType),
]);

export const documentTemplates = mysqlTable("document_templates", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  documentType: varchar("documentType", { length: 120 }).notNull(),
  templateKind: varchar("templateKind", { length: 80 }).default("checklist").notNull(),
  workflowStepKey: varchar("workflowStepKey", { length: 100 }),
  officialSourceUrl: varchar("officialSourceUrl", { length: 1000 }),
  sourceVerifiedAt: timestamp("sourceVerifiedAt"),
  externalTemplateId: varchar("externalTemplateId", { length: 500 }),
  version: int("version").default(1).notNull(),
  content: text("content"),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const googleDriveConnections = mysqlTable("google_drive_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  googleEmail: varchar("googleEmail", { length: 320 }),
  encryptedRefreshToken: text("encryptedRefreshToken").notNull(),
  grantedScopes: text("grantedScopes"),
  rootFolderId: varchar("rootFolderId", { length: 500 }),
  rootFolderUrl: varchar("rootFolderUrl", { length: 1000 }),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("google_drive_connections_user_uq").on(table.userId),
]);

export const googleDriveOAuthStates = mysqlTable("google_drive_oauth_states", {
  id: int("id").autoincrement().primaryKey(),
  state: varchar("state", { length: 128 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("google_drive_oauth_states_expires_idx").on(table.expiresAt),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Demand = typeof demands.$inferSelect;
export type ProcurementProcess = typeof procurementProcesses.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
