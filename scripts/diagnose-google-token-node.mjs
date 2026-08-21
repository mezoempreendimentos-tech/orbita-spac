import { createHash } from "node:crypto";
import https from "node:https";
import mysql from "mysql2/promise";
import { compactDecrypt } from "jose";

const databaseUrl = process.env.DATABASE_URL;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET;
if (!databaseUrl || !clientId || !clientSecret || !jwtSecret) throw new Error("Configuração indisponível.");
const db = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await db.execute("SELECT encryptedRefreshToken FROM google_drive_connections WHERE userId = 6900001 AND revokedAt IS NULL LIMIT 1");
  const key = createHash("sha256").update(jwtSecret).digest();
  const decrypted = await compactDecrypt(rows[0].encryptedRefreshToken, key);
  const refreshToken = new TextDecoder().decode(decrypted.plaintext);
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString();
  const request = https.request({
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    family: 4,
    agent: false,
    headers: { "User-Agent": "ORBITA/1.0", "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(Buffer.byteLength(body)) },
  }, response => {
    const chunks = [];
    response.on("data", chunk => chunks.push(Buffer.from(chunk)));
    response.on("end", () => {
      const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      console.log(JSON.stringify({ status: response.statusCode, hasAccessToken: Boolean(parsed.access_token), error: parsed.error ?? null }));
    });
  });
  request.on("socket", socket => {
    socket.on("lookup", (_error, address) => console.log(`lookup:${address}`));
    socket.on("secureConnect", () => console.log("tls:ok"));
  });
  request.setTimeout(15_000, () => request.destroy(new Error("timeout")));
  request.on("error", error => console.log(`error:${error.message}`));
  request.write(body);
  request.end();
} finally {
  await db.end();
}
