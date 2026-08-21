import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mysql from "mysql2/promise";
import { compactDecrypt } from "jose";

const execFileAsync = promisify(execFile);
const folderId = process.argv[2];
if (!folderId || !/^[A-Za-z0-9_-]{10,500}$/.test(folderId)) throw new Error("Informe o ID válido da pasta do Google Drive.");
const databaseUrl = process.env.DATABASE_URL;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl || !clientId || !clientSecret || !jwtSecret) throw new Error("A configuração institucional do Drive não está disponível neste ambiente.");

const db = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await db.execute("SELECT encryptedRefreshToken FROM google_drive_connections WHERE userId = 6900001 AND revokedAt IS NULL LIMIT 1");
  const key = createHash("sha256").update(jwtSecret).digest();
  const decrypted = await compactDecrypt(rows[0].encryptedRefreshToken, key);
  const refreshToken = new TextDecoder().decode(decrypted.plaintext);
  const tokenBody = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString();
  const { stdout: tokenStdout } = await execFileAsync("curl", ["--silent", "--show-error", "--fail-with-body", "--request", "POST", "--header", "Content-Type: application/x-www-form-urlencoded", "--data", tokenBody, "https://oauth2.googleapis.com/token"]);
  const token = JSON.parse(tokenStdout);
  if (!token.access_token) throw new Error("Não foi possível renovar a autorização institucional do Google Drive.");
  const fields = encodeURIComponent("id,name,webViewLink,modifiedTime");
  const { stdout } = await execFileAsync("curl", ["--silent", "--show-error", "--fail-with-body", "--header", `Authorization: Bearer ${token.access_token}`, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=${fields}&supportsAllDrives=true`]);
  console.log(stdout);
} finally {
  await db.end();
}
