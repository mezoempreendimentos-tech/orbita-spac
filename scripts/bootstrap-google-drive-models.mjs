import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mysql from "mysql2/promise";
import { compactDecrypt } from "jose";

const execFileAsync = promisify(execFile);
const folderId = "14IxVG2yC31qR3bSSzEGQGhgu0x5NDI85";
const actorUserId = 6900001;
const models = [
  {
    documentType: "ETP",
    name: "MODELO ETP — ÓRBITA",
    content: `ESTUDO TÉCNICO PRELIMINAR\n\nProcesso: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Descrição da necessidade\n\n2. Requisitos da contratação\n\n3. Levantamento de mercado\n\n4. Estimativa de quantidades e valores\n\n5. Solução proposta\n\n6. Justificativa técnica e econômica\n\n7. Resultados pretendidos\n\n8. Providências complementares\n`,
  },
  {
    documentType: "EDITAL",
    name: "MODELO EDITAL — ÓRBITA",
    content: `EDITAL OU AVISO DE CONTRATAÇÃO\n\nProcesso: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Identificação do procedimento\n\n2. Objeto\n\n3. Participação e habilitação\n\n4. Critério de julgamento\n\n5. Propostas e prazos\n\n6. Obrigações\n\n7. Anexos e publicação\n`,
  },
];

const databaseUrl = process.env.DATABASE_URL;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl || !clientId || !clientSecret || !jwtSecret) throw new Error("A configuração institucional do Drive não está disponível neste ambiente.");

async function curlJson(args) {
  try {
    const { stdout } = await execFileAsync("curl", ["--silent", "--show-error", "--fail-with-body", ...args]);
    return JSON.parse(stdout);
  } catch {
    throw new Error("A operação no Google Drive não pôde ser concluída. Verifique se as APIs necessárias estão habilitadas no projeto do Google Cloud.");
  }
}

const connection = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await connection.execute("SELECT encryptedRefreshToken FROM google_drive_connections WHERE userId = ? AND revokedAt IS NULL LIMIT 1", [actorUserId]);
  const row = rows[0];
  if (!row) throw new Error("Não há conexão Google Drive institucional ativa para criar os modelos.");
  const secret = createHash("sha256").update(jwtSecret).digest();
  const decrypted = await compactDecrypt(row.encryptedRefreshToken, secret);
  const refreshToken = new TextDecoder().decode(decrypted.plaintext);
  const token = await curlJson([
    "--request", "POST",
    "--header", "Content-Type: application/x-www-form-urlencoded",
    "--data", new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    "https://oauth2.googleapis.com/token",
  ]);
  if (!token.access_token) throw new Error("Não foi possível renovar a autorização institucional do Google Drive.");
  const authorizationHeader = `Authorization: Bearer ${token.access_token}`;
  const created = [];

  for (const model of models) {
    const query = new URLSearchParams({
      q: `name = '${model.name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`,
      fields: "files(id,name,webViewLink)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    const existing = await curlJson(["--header", authorizationHeader, `https://www.googleapis.com/drive/v3/files?${query}`]);
    if (existing.files?.[0]) {
      created.push({ documentType: model.documentType, ...existing.files[0], status: "existing" });
      continue;
    }
    const file = await curlJson([
      "--request", "POST",
      "--header", authorizationHeader,
      "--header", "Content-Type: application/json",
      "--data", JSON.stringify({ name: model.name, mimeType: "application/vnd.google-apps.document", parents: [folderId] }),
      "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true",
    ]);
    await curlJson([
      "--request", "POST",
      "--header", authorizationHeader,
      "--header", "Content-Type: application/json",
      "--data", JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: model.content } }] }),
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(file.id)}:batchUpdate`,
    ]);
    created.push({ documentType: model.documentType, ...file, status: "created" });
  }
  console.log(JSON.stringify({ folderId, created }, null, 2));
} finally {
  await connection.end();
}
