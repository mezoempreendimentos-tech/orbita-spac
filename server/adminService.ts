import { and, asc, desc, eq } from "drizzle-orm";
import {
  annualPlanItems,
  annualPlans,
  auditEvents,
  documentTemplates,
  governanceSettings,
  organizationalUnits,
  referenceListItems,
  referenceLists,
  suppliers,
} from "../drizzle/schema";
import { getDb } from "./db";
import { isReferenceListItemValueValid, normalizeReferenceListCode } from "../shared/planningPolicies";

type AdminActor = { id: number };

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

async function writeAdminAudit(actorUserId: number, eventType: string, summary: string, payload?: Record<string, unknown>) {
  const db = await dbOrThrow();
  await db.insert(auditEvents).values({ actorUserId, eventType, summary, payload });
}

export async function getAdministrationOverview() {
  const db = await dbOrThrow();
  const [units, settings, plans, templates, supplierRows, lists, listItems] = await Promise.all([
    db.select().from(organizationalUnits).orderBy(asc(organizationalUnits.name)),
    db.select().from(governanceSettings).orderBy(asc(governanceSettings.category), asc(governanceSettings.label)),
    db.select().from(annualPlans).orderBy(desc(annualPlans.fiscalYear)),
    db.select().from(documentTemplates).orderBy(asc(documentTemplates.documentType), asc(documentTemplates.title)),
    db.select().from(suppliers).orderBy(asc(suppliers.legalName)),
    db.select().from(referenceLists).orderBy(asc(referenceLists.label)),
    db.select().from(referenceListItems).orderBy(asc(referenceListItems.listId), asc(referenceListItems.sortOrder), asc(referenceListItems.label)),
  ]);
  return { units, settings, plans, templates, suppliers: supplierRows, referenceLists: lists.map(list => ({ ...list, items: listItems.filter(item => item.listId === list.id) })) };
}

export async function createOrganizationalUnit(actor: AdminActor, input: { name: string; code: string }) {
  const db = await dbOrThrow();
  const code = input.code.trim().toUpperCase();
  const [existing] = await db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(eq(organizationalUnits.code, code)).limit(1);
  if (existing) throw new Error("Já existe uma unidade cadastrada com esta sigla ou código.");
  const result = await db.insert(organizationalUnits).values({ name: input.name.trim(), code });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.unit_created", `Unidade organizacional cadastrada: ${input.name.trim()}.`, { unitId: id, code });
  return { id };
}

export async function setOrganizationalUnitStatus(actor: AdminActor, input: { unitId: number; active: boolean }) {
  const db = await dbOrThrow();
  const [unit] = await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, input.unitId)).limit(1);
  if (!unit) throw new Error("Unidade organizacional não encontrada.");
  await db.update(organizationalUnits).set({ active: input.active }).where(eq(organizationalUnits.id, input.unitId));
  await writeAdminAudit(actor.id, "admin.unit_status_changed", `Unidade ${unit.name} ${input.active ? "ativada" : "inativada"}.`, { unitId: unit.id, active: input.active });
  return { success: true };
}

export async function saveGovernanceSetting(actor: AdminActor, input: { category: string; settingKey: string; label: string; value?: string; description?: string; active?: boolean }) {
  const db = await dbOrThrow();
  const key = input.settingKey.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
  if (!key) throw new Error("Informe uma chave válida para o parâmetro.");
  await db.insert(governanceSettings).values({
    category: input.category.trim(),
    settingKey: key,
    label: input.label.trim(),
    value: input.value?.trim() || null,
    description: input.description?.trim() || null,
    active: input.active ?? true,
    updatedByUserId: actor.id,
  }).onDuplicateKeyUpdate({ set: {
    category: input.category.trim(),
    label: input.label.trim(),
    value: input.value?.trim() || null,
    description: input.description?.trim() || null,
    active: input.active ?? true,
    updatedByUserId: actor.id,
  } });
  await writeAdminAudit(actor.id, "admin.governance_setting_saved", `Parâmetro de governança atualizado: ${input.label.trim()}.`, { settingKey: key, category: input.category.trim() });
  return { settingKey: key };
}

export async function saveReferenceList(actor: AdminActor, input: { code: string; label: string; description?: string; active?: boolean }) {
  const db = await dbOrThrow();
  const code = normalizeReferenceListCode(input.code);
  if (!code) throw new Error("Informe um código válido para a lista.");
  const [existing] = await db.select().from(referenceLists).where(eq(referenceLists.code, code)).limit(1);
  if (existing) {
    await db.update(referenceLists).set({ label: input.label.trim(), description: input.description?.trim() || null, active: input.active ?? true, updatedByUserId: actor.id }).where(eq(referenceLists.id, existing.id));
    await writeAdminAudit(actor.id, "admin.reference_list_updated", `Lista configurável atualizada: ${input.label.trim()}.`, { listId: existing.id, code });
    return { id: existing.id, code };
  }
  const result = await db.insert(referenceLists).values({ code, label: input.label.trim(), description: input.description?.trim() || null, active: input.active ?? true, createdByUserId: actor.id, updatedByUserId: actor.id });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.reference_list_created", `Lista configurável criada: ${input.label.trim()}.`, { listId: id, code });
  return { id, code };
}

export async function saveReferenceListItem(actor: AdminActor, input: { listId: number; value: string; label: string; sortOrder?: number; active?: boolean }) {
  const db = await dbOrThrow();
  const [list] = await db.select().from(referenceLists).where(eq(referenceLists.id, input.listId)).limit(1);
  if (!list) throw new Error("Lista configurável não encontrada.");
  const value = input.value.trim();
  if (!isReferenceListItemValueValid(value)) throw new Error("Informe um valor válido para o item.");
  await db.insert(referenceListItems).values({ listId: list.id, value, label: input.label.trim(), sortOrder: input.sortOrder ?? 0, active: input.active ?? true }).onDuplicateKeyUpdate({ set: { label: input.label.trim(), sortOrder: input.sortOrder ?? 0, active: input.active ?? true } });
  await writeAdminAudit(actor.id, "admin.reference_list_item_saved", `Item ${input.label.trim()} salvo na lista ${list.code}.`, { listId: list.id, listCode: list.code, value });
  return { listId: list.id, value };
}

export async function createAnnualPlan(actor: AdminActor, input: { fiscalYear: number; title: string; status: "draft" | "active" | "closed" }) {
  const db = await dbOrThrow();
  const [existing] = await db.select({ id: annualPlans.id }).from(annualPlans).where(eq(annualPlans.fiscalYear, input.fiscalYear)).limit(1);
  if (existing) throw new Error("Já existe um planejamento anual para este exercício.");
  const result = await db.insert(annualPlans).values({ fiscalYear: input.fiscalYear, title: input.title.trim(), status: input.status });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.plan_created", `Planejamento anual ${input.fiscalYear} cadastrado.`, { planId: id, fiscalYear: input.fiscalYear });
  return { id };
}

export async function createAnnualPlanItem(actor: AdminActor, input: { planId: number; code: string; title: string; requestingUnitId?: number; quantity?: string; unitOfMeasure?: string; estimatedValue?: string; status: "planned" | "in_progress" | "completed" | "changed" | "cancelled" }) {
  const db = await dbOrThrow();
  const [plan] = await db.select({ id: annualPlans.id }).from(annualPlans).where(eq(annualPlans.id, input.planId)).limit(1);
  if (!plan) throw new Error("Planejamento anual não encontrado.");
  const quantity = input.quantity?.trim() || undefined;
  if (quantity !== undefined && (!/^\\d+(\\.\\d{1,4})?$/.test(quantity) || Number(quantity) <= 0)) throw new Error("A quantidade total do item deve ser maior que zero.");
  if (input.requestingUnitId) {
    const [unit] = await db.select({ id: organizationalUnits.id }).from(organizationalUnits).where(and(eq(organizationalUnits.id, input.requestingUnitId), eq(organizationalUnits.active, true))).limit(1);
    if (!unit) throw new Error("A unidade vinculada ao item não está disponível.");
  }
  const result = await db.insert(annualPlanItems).values({
    planId: input.planId,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    requestingUnitId: input.requestingUnitId,
    quantity,
    unitOfMeasure: input.unitOfMeasure?.trim() || undefined,
    estimatedValue: input.estimatedValue || undefined,
    status: input.status,
  });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.plan_item_created", `Item ${input.code.trim().toUpperCase()} incluído no planejamento anual.`, { planItemId: id, planId: input.planId });
  return { id };
}

export async function getPlanningOverview() {
  const db = await dbOrThrow();
  const [plans, items] = await Promise.all([
    db.select().from(annualPlans).orderBy(desc(annualPlans.fiscalYear)),
    db.select({ item: annualPlanItems, unitName: organizationalUnits.name }).from(annualPlanItems).leftJoin(organizationalUnits, eq(annualPlanItems.requestingUnitId, organizationalUnits.id)).orderBy(desc(annualPlanItems.updatedAt)),
  ]);
  return { plans, items };
}

export async function saveDocumentTemplate(actor: AdminActor, input: { code: string; title: string; documentType: string; templateKind?: string; workflowStepKey?: string; officialSourceUrl?: string; externalTemplateId?: string; content?: string; active?: boolean }) {
  const db = await dbOrThrow();
  const code = input.code.trim().toUpperCase();
  const [existing] = await db.select().from(documentTemplates).where(eq(documentTemplates.code, code)).limit(1);
  if (existing) {
    await db.update(documentTemplates).set({
      title: input.title.trim(),
      documentType: input.documentType.trim(),
      templateKind: input.templateKind?.trim() || existing.templateKind,
      workflowStepKey: input.workflowStepKey?.trim() || null,
      officialSourceUrl: input.officialSourceUrl?.trim() || null,
      sourceVerifiedAt: input.officialSourceUrl?.trim() ? new Date() : existing.sourceVerifiedAt,
      externalTemplateId: input.externalTemplateId?.trim() || null,
      content: input.content?.trim() || null,
      active: input.active ?? true,
      version: existing.version + 1,
      createdByUserId: actor.id,
    }).where(eq(documentTemplates.id, existing.id));
    await writeAdminAudit(actor.id, "admin.template_versioned", `Modelo ${code} atualizado para a versão ${existing.version + 1}.`, { templateId: existing.id, code, version: existing.version + 1 });
    return { id: existing.id, version: existing.version + 1 };
  }
  const result = await db.insert(documentTemplates).values({
    code,
    title: input.title.trim(),
    documentType: input.documentType.trim(),
    templateKind: input.templateKind?.trim() || "checklist",
    workflowStepKey: input.workflowStepKey?.trim() || null,
    officialSourceUrl: input.officialSourceUrl?.trim() || null,
    sourceVerifiedAt: input.officialSourceUrl?.trim() ? new Date() : null,
    externalTemplateId: input.externalTemplateId?.trim() || null,
    content: input.content?.trim() || null,
    active: input.active ?? true,
    createdByUserId: actor.id,
  });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.template_created", `Modelo institucional ${code} cadastrado.`, { templateId: id, code });
  return { id, version: 1 };
}

export async function createSupplier(actor: AdminActor, input: { legalName: string; taxId: string; email?: string; phone?: string; status: "active" | "pending_review" | "restricted" | "inactive"; notes?: string }) {
  const db = await dbOrThrow();
  const taxId = input.taxId.replace(/\D/g, "");
  if (taxId.length < 11) throw new Error("Informe um CPF ou CNPJ válido para identificação do fornecedor.");
  const [existing] = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.taxId, taxId)).limit(1);
  if (existing) throw new Error("Já existe fornecedor cadastrado com esta identificação.");
  const result = await db.insert(suppliers).values({ legalName: input.legalName.trim(), taxId, email: input.email?.trim() || null, phone: input.phone?.trim() || null, status: input.status, notes: input.notes?.trim() || null });
  const id = Number(result[0].insertId);
  await writeAdminAudit(actor.id, "admin.supplier_created", `Fornecedor cadastrado: ${input.legalName.trim()}.`, { supplierId: id, status: input.status });
  return { id };
}
