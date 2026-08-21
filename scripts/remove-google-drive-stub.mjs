import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mysql from "mysql2/promise";
import { compactDecrypt } from "jose";

const execFileAsync = promisify(execFile);
const fileId = process.argv[2];
const actorUserId = 6900001;
if (!fileId || !/^[A-Za-z0-9_-]{10,500}$/.test(fileId)) throw new Error("Informe o ID válido do arquivo temporário.");
const databaseUrl = process.env.DATABASE_URL;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl || !clientId || !clientSecret || !jwtSecret) throw new Error("A configuração institucional do Drive não está disponível neste ambiente.");

const connection = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await connection.execute("SELECT encryptedRefreshToken FROM google_drive_connections WHERE userId = ? AND revokedAt IS NULL LIMIT 1", [actorUserId]);
  const row = rows[0];
  if (!row) throw new Error("Não há conexão Google Drive institucional ativa para remover o arquivo temporário.");
  const key = createHash("sha256").update(jwtSecret).digest();
  const decrypted = await compactDecrypt(row.encryptedRefreshToken, key);
  const refreshToken = new TextDecoder().decode(decrypted.plaintext);
  const tokenBody = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString();
  const { stdout: tokenStdout } = await execFileAsync("curl", ["--silent", "--show-error", "--fail-with-body", "--request", "POST", "--header", "Content-Type: application/x-www-form-urlencoded", "--data", tokenBody, "https://oauth2.googleapis.com/token"]);
  const token = JSON.parse(tokenStdout);
  if (!token.access_token) throw new Error("Não foi possível renovar a autorização institucional do Google Drive.");
  await execFileAsync("curl", ["--silent", "--show-error", "--fail-with-body", "--request", "PATCH", "--header", `Authorization: Bearer ${token.access_token}`, "--header", "Content-Type: application/json", "--data", JSON.stringify({ trashed: true }), `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`]);
  console.log(JSON.stringify({ fileId, removed: true }));
} finally {
  await connection.end();
}
