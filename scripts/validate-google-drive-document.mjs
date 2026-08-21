import { and, eq } from "drizzle-orm";
import { processDocuments, procurementProcesses } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { createProcessDocumentFromTemplate } from "../server/procurementService.ts";

const processPublicId = "CD-CHGVTCNCHF";
const templateCode = "MODELO_ETP_ORBITA";
const workflowStepId = 90002;
const user = { id: 6900001, role: "admin" };

const db = await getDb();
if (!db) throw new Error("Banco de dados indisponível para validação.");
const [process] = await db.select({ id: procurementProcesses.id })
  .from(procurementProcesses)
  .where(eq(procurementProcesses.publicId, processPublicId))
  .limit(1);
if (!process) throw new Error("Processo de validação não encontrado.");

const [existing] = await db.select({ id: processDocuments.id, externalFileId: processDocuments.externalFileId, externalUrl: processDocuments.externalUrl })
  .from(processDocuments)
  .where(and(eq(processDocuments.processId, process.id), eq(processDocuments.documentType, "ETP")))
  .limit(1);

if (existing?.externalFileId) {
  console.log(JSON.stringify({ processPublicId, status: "already_validated", document: existing }, null, 2));
} else {
  const result = await createProcessDocumentFromTemplate(user, { processPublicId, templateCode, workflowStepId });
  console.log(JSON.stringify({ processPublicId, status: "created", document: result }, null, 2));
}
