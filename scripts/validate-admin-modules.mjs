import {
  createAnnualPlan,
  createAnnualPlanItem,
  createOrganizationalUnit,
  createSupplier,
  getAdministrationOverview,
  getPlanningOverview,
  saveDocumentTemplate,
  saveGovernanceSetting,
} from "../server/adminService.ts";
import { getDb } from "../server/db.ts";
import { users } from "../drizzle/schema.ts";

const db = await getDb();
if (!db) throw new Error("Banco indisponível para validação administrativa.");
const [user] = await db.select().from(users).orderBy(users.id).limit(1);
if (!user) throw new Error("Conta administradora indisponível.");
const actor = { id: user.id };

const unit = await createOrganizationalUnit(actor, { name: "[PLACEHOLDER] Unidade de Validação Administrativa", code: "ADM-TEST" });
await saveGovernanceSetting(actor, { category: "placeholder", settingKey: "placeholder.admin.validacao", label: "[PLACEHOLDER] Parâmetro de validação", value: "ativo", description: "Registro temporário de validação técnica." });
const plan = await createAnnualPlan(actor, { fiscalYear: 2099, title: "[PLACEHOLDER] Planejamento de validação", status: "draft" });
const planItem = await createAnnualPlanItem(actor, { planId: plan.id, code: "PAC-TEST-001", title: "[PLACEHOLDER] Item de planejamento", requestingUnitId: unit.id, estimatedValue: "0.00", status: "planned" });
const template = await saveDocumentTemplate(actor, { code: "PLACEHOLDER-ADM", title: "[PLACEHOLDER] Modelo administrativo", documentType: "Modelo de validação", content: "Conteúdo temporário de validação." });
const supplier = await createSupplier(actor, { legalName: "[PLACEHOLDER] Fornecedor de Validação", taxId: "99999999999999", status: "pending_review", notes: "Registro temporário sem efeito institucional." });
const [overview, planning] = await Promise.all([getAdministrationOverview(), getPlanningOverview()]);
const valid = overview.units.some(item => item.id === unit.id)
  && overview.settings.some(item => item.settingKey === "placeholder.admin.validacao")
  && overview.templates.some(item => item.id === template.id && item.version === 1)
  && overview.suppliers.some(item => item.id === supplier.id)
  && planning.plans.some(item => item.id === plan.id)
  && planning.items.some(item => item.item.id === planItem.id);
if (!valid) throw new Error("Validação administrativa não encontrou todas as entidades persistidas.");
console.log(JSON.stringify({ validation: "passed", unitId: unit.id, planId: plan.id, itemId: planItem.id, templateId: template.id, supplierId: supplier.id }));
