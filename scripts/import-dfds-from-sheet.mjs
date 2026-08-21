import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const manifestPath = "/home/ubuntu/dfd_import_audit.json";
const actorUserId = 1;
const requestingUnitId = 30001;
const commit = process.argv.includes("--commit");

function publicId(reference) {
  return `DFD-IMP-${String(reference).trim().replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "").toUpperCase()}`;
}

function currency(value) {
  const normalized = String(value ?? "").replace(/R\$/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

function date(value) {
  const match = String(value ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]} 12:00:00` : null;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const rows = manifest.rows.map(row => ({ ...row, publicId: publicId(row.reference) }));
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não está disponível para a importação.");

const connection = await mysql.createConnection(databaseUrl);
const [existingRows] = await connection.query("SELECT publicId FROM demands WHERE publicId LIKE 'DFD-IMP-%'");
const existing = new Set(existingRows.map(row => row.publicId));
const pending = rows.filter(row => !existing.has(row.publicId));

console.log(JSON.stringify({ sourceDfdRows: rows.length, alreadyImported: rows.length - pending.length, pending: pending.length, commit }, null, 2));

if (!commit) {
  await connection.end();
  process.exit(0);
}

try {
  await connection.beginTransaction();
  for (const row of pending) {
    const title = String(row.title).trim().replace(/\s+/g, " ");
    const planningJustification = `Importação de DFD preexistente. Referência externa: ${row.reference}. Situação de origem: ${row.source_status || "não informada"}. Referência e origem preservadas na trilha de auditoria.`;
    const [result] = await connection.execute(
      `INSERT INTO demands (publicId, requestingUnitId, requesterUserId, title, objectDescription, justification, initialEstimatedValue, desiredContractDate, planningJustification, isSupervening, containsPersonalData, containsSensitiveData, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        row.publicId,
        requestingUnitId,
        actorUserId,
        title,
        `${title}. Registro importado da planilha de controle; complementar especificações técnicas na triagem institucional.`,
        "Importada de registro institucional pré-existente; a justificativa original deverá ser complementada pelo setor requisitante durante a triagem.",
        currency(row.estimated_value),
        date(row.desired_date),
        planningJustification,
        false,
        false,
        false,
      ],
    );
    await connection.execute(
      `INSERT INTO audit_events (actorUserId, eventType, summary, payload) VALUES (?, 'demand.imported', ?, ?)`,
      [
        actorUserId,
        `DFD ${row.publicId} importada da planilha de controle para triagem institucional.`,
        JSON.stringify({
          demandId: result.insertId,
          demandPublicId: row.publicId,
          sourceReference: row.reference,
          sourceStatus: row.source_status,
          sourceUrl: row.source_link,
          source: "Controle de Processos de Compras - 2027 V2 / Form_Responses",
          importScope: "DFD somente; nenhum PCA, pedido de abertura ou processo foi criado.",
        }),
      ],
    );
  }
  await connection.commit();
  console.log(JSON.stringify({ imported: pending.length, status: "submitted", createdPca: 0, createdOpeningRequests: 0, createdProcesses: 0 }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
