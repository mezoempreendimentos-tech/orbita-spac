import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auditEvents, documentSignatureRequests, planningDocuments, processDocuments, userProcessRoles } from "../drizzle/schema";
import { getDb } from "./db";

type Actor = { id: number; role: "user" | "admin" };
type SignatureScope = "planning" | "process";

export function govbrSignatureReadiness(configured = Boolean(process.env.GOVBR_SIGNATURE_CLIENT_ID && process.env.GOVBR_SIGNATURE_CLIENT_SECRET && process.env.GOVBR_SIGNATURE_REDIRECT_URI)) {
  return configured
    ? { configured: true, status: "ready_for_authorization" as const, message: "A integração gov.br está configurada para solicitar autorização de assinatura." }
    : { configured: false, status: "awaiting_credentials" as const, message: "A assinatura gov.br está preparada, mas aguarda credenciais, URL de retorno e homologação institucional." };
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

async function requireSignaturePermission(db: Awaited<ReturnType<typeof dbOrThrow>>, actor: Actor) {
  if (actor.role === "admin") return;
  const roles = await db.select({ role: userProcessRoles.role }).from(userProcessRoles).where(and(eq(userProcessRoles.userId, actor.id), eq(userProcessRoles.active, true)));
  const allowed = ["administrador", "instrumentalizacao", "juridico", "autoridade_competente"];
  if (!roles.some(item => allowed.includes(item.role))) throw new Error("A preparação de assinatura exige perfil de Administração, Instrumentalização, Jurídico ou Autoridade Competente.");
}

export async function listDocumentSignatureRequests(actor: Actor) {
  const db = await dbOrThrow();
  await requireSignaturePermission(db, actor);
  return db.select().from(documentSignatureRequests).orderBy(desc(documentSignatureRequests.requestedAt)).limit(60);
}

export async function listSignatureEligibleDocuments(actor: Actor) {
  const db = await dbOrThrow();
  await requireSignaturePermission(db, actor);
  const [planning, process] = await Promise.all([
    db.select({ id: planningDocuments.id, title: planningDocuments.title, version: planningDocuments.version, createdAt: planningDocuments.createdAt }).from(planningDocuments).orderBy(desc(planningDocuments.createdAt)).limit(30),
    db.select({ id: processDocuments.id, title: processDocuments.title, version: processDocuments.version, createdAt: processDocuments.createdAt }).from(processDocuments).orderBy(desc(processDocuments.createdAt)).limit(30),
  ]);
  return { planning, process };
}

export async function prepareGovbrSignature(actor: Actor, input: { documentScope: SignatureScope; documentId: number }) {
  const db = await dbOrThrow();
  await requireSignaturePermission(db, actor);
  const readiness = govbrSignatureReadiness();

  let processId: number | null = null;
  if (input.documentScope === "planning") {
    const [document] = await db.select({ id: planningDocuments.id }).from(planningDocuments).where(eq(planningDocuments.id, input.documentId)).limit(1);
    if (!document) throw new Error("O documento de planejamento não foi encontrado.");
  } else {
    const [document] = await db.select({ id: processDocuments.id, processId: processDocuments.processId }).from(processDocuments).where(eq(processDocuments.id, input.documentId)).limit(1);
    if (!document) throw new Error("O documento do processo não foi encontrado.");
    processId = document.processId;
  }

  const publicId = `ASS-${nanoid(10).toUpperCase()}`;
  const inserted = await db.insert(documentSignatureRequests).values({
    publicId,
    provider: "govbr",
    documentScope: input.documentScope,
    planningDocumentId: input.documentScope === "planning" ? input.documentId : undefined,
    processDocumentId: input.documentScope === "process" ? input.documentId : undefined,
    status: readiness.status,
    requestedByUserId: actor.id,
  });

  await db.insert(auditEvents).values({
    processId: processId ?? undefined,
    actorUserId: actor.id,
    eventType: "assinatura_govbr_preparada",
    summary: "Solicitação de assinatura gov.br preparada sem envio externo.",
    payload: { publicId, documentScope: input.documentScope, documentId: input.documentId, integrationConfigured: readiness.configured },
  });

  return { id: Number(inserted[0].insertId), publicId, status: readiness.status, readiness };
}
