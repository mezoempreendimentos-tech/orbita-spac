import { createHash, randomBytes } from "node:crypto";
import { request as httpsRequest } from "node:https";
import { CompactEncrypt, compactDecrypt } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { governanceSettings, googleDriveConnections, googleDriveOAuthStates } from "../drizzle/schema";
import { normalizeGoogleDriveFolderId, planGoogleDriveFolder } from "../shared/googleDriveFolderPolicy";
import { getDb } from "./db";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const REDIRECT_URI = `${(process.env.APP_ORIGIN || "https://orbitavisual-pte9ypdg.manus.space").replace(/\/$/, "")}/api/integrations/google-drive/callback`;
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const INSTITUTIONAL_PROCESS_FOLDER_SETTING_KEY = "google-drive.process-folder-2027";

type TokenResponse = { access_token?: string; refresh_token?: string; scope?: string };
type GoogleHttpResponse<T> = { ok: boolean; status: number; body: T };
export type GoogleDriveDocumentRequest = { userId: number; processReference: string; processTitle: string; requestingUnit?: string | null; estimatedValue?: string | null; documentLabel: string; templateFileId: string; existingFolderId?: string | null };
export type GoogleDriveDocumentResult = { folderId: string; folderUrl: string; fileId: string; fileUrl: string; reusedExistingFolder: boolean; folderModifiedAt: Date | null };
export type GoogleDrivePdfUploadRequest = { userId: number; processReference: string; processTitle: string; existingFolderId?: string | null; fileName: string; contentBase64: string };
type GoogleDriveStatusConnection = { revokedAt: Date | null; rootFolderId: string | null };

function configOrThrow() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("A conexão com o Google Drive ainda não foi configurada pela Administração.");
  return { clientId, clientSecret };
}

function encryptionKey() {
  if (!process.env.JWT_SECRET) throw new Error("A proteção de credenciais não está disponível no momento.");
  return createHash("sha256").update(process.env.JWT_SECRET).digest();
}

async function encrypt(value: string) {
  return new CompactEncrypt(new TextEncoder().encode(value)).setProtectedHeader({ alg: "dir", enc: "A256GCM" }).encrypt(encryptionKey());
}

async function decrypt(value: string) {
  const result = await compactDecrypt(value, encryptionKey());
  return new TextDecoder().decode(result.plaintext);
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

async function googleHttpJson<T>(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string | Buffer }): Promise<GoogleHttpResponse<T>> {
  const target = new URL(url);
  const headers: Record<string, string> = { "User-Agent": "ORBITA/1.0", ...(init?.headers ?? {}) };
  if (init?.body !== undefined && !headers["Content-Length"]) headers["Content-Length"] = String(Buffer.byteLength(init.body));
  return new Promise((resolve, reject) => {
    const request = httpsRequest({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || undefined,
      path: `${target.pathname}${target.search}`,
      method: init?.method ?? "GET",
      family: 4,
      agent: false,
      headers,
    }, response => {
      const chunks: Buffer[] = [];
      response.on("data", chunk => chunks.push(Buffer.from(chunk)));
      response.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        try {
          resolve({ ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300), status: response.statusCode ?? 0, body: (raw ? JSON.parse(raw) : {}) as T });
        } catch {
          reject(new Error("O Google retornou uma resposta inválida durante a integração."));
        }
      });
    });
    request.setTimeout(15_000, () => request.destroy(new Error("A integração com o Google Drive demorou além do esperado. Tente novamente.")));
    request.on("error", reject);
    if (init?.body) request.write(init.body);
    request.end();
  });
}

function makeAuthorizationUrl(state: string) {
  const { clientId } = configOrThrow();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [DRIVE_SCOPE, DOCS_SCOPE, EMAIL_SCOPE, "openid"].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  }).toString();
  return url.toString();
}

export async function beginGoogleDriveAuthorization(userId: number) {
  const db = await dbOrThrow();
  const state = randomBytes(32).toString("base64url");
  await db.insert(googleDriveOAuthStates).values({ state, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  return { authorizationUrl: makeAuthorizationUrl(state) };
}

async function exchangeCode(code: string) {
  const { clientId, clientSecret } = configOrThrow();
  const response = await googleHttpJson<TokenResponse>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }).toString(),
  });
  if (!response.ok || !response.body.access_token) throw new Error("O Google não concluiu a autorização da conta. Tente conectar novamente.");
  return response.body;
}

async function emailFor(accessToken: string) {
  const response = await googleHttpJson<{ email?: string }>("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  return response.body.email ?? null;
}

export async function completeGoogleDriveAuthorization(input: { state: string; code?: string; error?: string }) {
  const db = await dbOrThrow();
  const [stateRow] = await db.select().from(googleDriveOAuthStates).where(eq(googleDriveOAuthStates.state, input.state)).limit(1);
  if (!stateRow || stateRow.expiresAt < new Date()) throw new Error("A autorização expirou. Retorne à ÓRBITA e tente conectar novamente.");
  await db.delete(googleDriveOAuthStates).where(eq(googleDriveOAuthStates.id, stateRow.id));
  if (input.error || !input.code) throw new Error("A autorização do Google Drive foi cancelada ou recusada.");
  const tokens = await exchangeCode(input.code);
  const accessToken = tokens.access_token as string;
  const [existing] = await db.select().from(googleDriveConnections).where(eq(googleDriveConnections.userId, stateRow.userId)).limit(1);
  const refreshToken = tokens.refresh_token ?? (existing ? await decrypt(existing.encryptedRefreshToken) : null);
  if (!refreshToken) throw new Error("O Google não entregou autorização renovável. Tente conectar novamente e aceite o consentimento solicitado.");
  const email = await emailFor(accessToken);
  const encryptedRefreshToken = await encrypt(refreshToken);
  await db.insert(googleDriveConnections).values({ userId: stateRow.userId, googleEmail: email, encryptedRefreshToken, grantedScopes: tokens.scope ?? null, connectedAt: new Date(), revokedAt: null }).onDuplicateKeyUpdate({ set: { googleEmail: email, encryptedRefreshToken, grantedScopes: tokens.scope ?? null, connectedAt: new Date(), revokedAt: null } });
  return { success: true };
}

function folderIdFrom(value: string) {
  return normalizeGoogleDriveFolderId(value);
}

function fileIdFrom(value: string) {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] ?? trimmed.match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
  const fileId = fromUrl ?? trimmed;
  if (!/^[A-Za-z0-9_-]{10,500}$/.test(fileId)) throw new Error("Informe o link ou o identificador de um modelo válido do Google Drive.");
  return fileId;
}

async function institutionalProcessFolderId(db: Awaited<ReturnType<typeof dbOrThrow>>) {
  const [setting] = await db.select({ value: governanceSettings.value })
    .from(governanceSettings)
    .where(and(eq(governanceSettings.settingKey, INSTITUTIONAL_PROCESS_FOLDER_SETTING_KEY), eq(governanceSettings.active, true)))
    .limit(1);
  return setting?.value?.trim() ? folderIdFrom(setting.value) : null;
}

export async function getGoogleDriveConnection(userId: number) {
  const db = await dbOrThrow();
  const [connection] = await db.select({ googleEmail: googleDriveConnections.googleEmail, rootFolderId: googleDriveConnections.rootFolderId, rootFolderUrl: googleDriveConnections.rootFolderUrl, connectedAt: googleDriveConnections.connectedAt, lastUsedAt: googleDriveConnections.lastUsedAt, revokedAt: googleDriveConnections.revokedAt }).from(googleDriveConnections).where(eq(googleDriveConnections.userId, userId)).limit(1);
  if (!connection) return null;
  const configuredRootFolderId = connection.rootFolderId ?? await institutionalProcessFolderId(db);
  return {
    ...connection,
    rootFolderId: configuredRootFolderId,
    rootFolderUrl: configuredRootFolderId ? `https://drive.google.com/drive/folders/${configuredRootFolderId}` : null,
    usingInstitutionalDefault: !connection.rootFolderId && Boolean(configuredRootFolderId),
  };
}

export async function getGoogleDriveStatus(userId: number) {
  const configured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() && process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim());
  const connection = await getGoogleDriveConnection(userId);
  return { ...googleDriveStatusFor(configured, connection), connection };
}

export function googleDriveStatusFor(configured: boolean, connection: GoogleDriveStatusConnection | null) {
  if (!configured) return { configured: false, status: "not_configured" as const, message: "A integração ainda não recebeu as credenciais Google OAuth na instalação local." };
  if (!connection) return { configured: true, status: "not_connected" as const, message: "As credenciais institucionais estão configuradas, mas sua conta ainda não foi conectada ao Google Drive." };
  if (connection.revokedAt) return { configured: true, status: "reconnect_required" as const, message: "A autorização do Google Drive foi revogada ou expirou. Conecte sua conta novamente." };
  if (!connection.rootFolderId) return { configured: true, status: "folder_required" as const, message: "Conta conectada. Defina a pasta institucional de destino para concluir a configuração." };
  return { configured: true, status: "ready" as const, message: "A integração individual com Google Drive está pronta para uso." };
}

export async function setGoogleDriveRootFolder(userId: number, folder: string) {
  const db = await dbOrThrow();
  const [connection] = await db.select({ id: googleDriveConnections.id }).from(googleDriveConnections).where(and(eq(googleDriveConnections.userId, userId), isNull(googleDriveConnections.revokedAt))).limit(1);
  if (!connection) throw new Error("Conecte primeiro a sua conta Google antes de definir a pasta de destino.");
  const folderId = folderIdFrom(folder);
  const rootFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  await db.update(googleDriveConnections).set({ rootFolderId: folderId, rootFolderUrl }).where(eq(googleDriveConnections.id, connection.id));
  return { folderId, rootFolderUrl };
}

export async function disconnectGoogleDrive(userId: number) {
  const db = await dbOrThrow();
  await db.update(googleDriveConnections).set({ revokedAt: new Date() }).where(eq(googleDriveConnections.userId, userId));
  return { success: true };
}

async function accessTokenFor(userId: number) {
  const db = await dbOrThrow();
  const [connection] = await db.select().from(googleDriveConnections).where(and(eq(googleDriveConnections.userId, userId), isNull(googleDriveConnections.revokedAt))).limit(1);
  if (!connection) throw new Error("Conecte sua conta Google antes de criar um arquivo no Drive.");
  const rootFolderId = connection.rootFolderId ?? await institutionalProcessFolderId(db);
  if (!rootFolderId) throw new Error("Defina a pasta institucional de destino no Google Drive antes de criar um arquivo.");
  const { clientId, clientSecret } = configOrThrow();
  const response = await googleHttpJson<TokenResponse>("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: await decrypt(connection.encryptedRefreshToken), grant_type: "refresh_token" }).toString() });
  const token = response.body;
  if (!response.ok || !token.access_token) {
    await db.update(googleDriveConnections).set({ revokedAt: new Date() }).where(eq(googleDriveConnections.id, connection.id));
    throw new Error("A autorização do Google Drive expirou ou foi revogada. Conecte sua conta novamente.");
  }
  await db.update(googleDriveConnections).set({ lastUsedAt: new Date() }).where(eq(googleDriveConnections.id, connection.id));
  return { accessToken: token.access_token, rootFolderId };
}

export async function getGoogleDriveFolderMetadata(userId: number, folder: string) {
  const folderId = folderIdFrom(folder);
  const { accessToken } = await accessTokenFor(userId);
  const metadata = await googleJson<{ id: string; name?: string; webViewLink?: string; modifiedTime?: string }>(accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,webViewLink,modifiedTime&supportsAllDrives=true`);
  return {
    folderId: metadata.id,
    folderUrl: metadata.webViewLink ?? `https://drive.google.com/drive/folders/${metadata.id}`,
    modifiedAt: metadata.modifiedTime ? new Date(metadata.modifiedTime) : null,
  };
}

async function googleJson<T>(accessToken: string, url: string, init?: RequestInit): Promise<T> {
  const response = await googleHttpJson<T>(url, {
    method: init?.method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init?.headers as Record<string, string> ?? {}) },
    body: typeof init?.body === "string" ? init.body : undefined,
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 || response.status === 404 ? "A conta Google conectada não possui acesso à pasta ou ao modelo informado." : `O Google Drive recusou a operação (${response.status}).`);
  return response.body;
}

async function resolveFolder(accessToken: string, rootFolderId: string, request: GoogleDriveDocumentRequest) {
  const folderPlan = planGoogleDriveFolder(request.existingFolderId, rootFolderId);
  if (folderPlan.reuseExistingFolder) {
    return { id: folderPlan.folderId, webViewLink: `https://drive.google.com/drive/folders/${folderPlan.folderId}`, reusedExistingFolder: true };
  }
  const name = `${request.processReference.replace(/\//g, ".")} - ${request.processTitle}`.slice(0, 240).replace(/'/g, "\\'");
  const query = encodeURIComponent(`name = '${name}' and '${folderPlan.folderId}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`);
  const found = await googleJson<{ files?: { id: string; webViewLink?: string }[] }>(accessToken, `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`);
  if (found.files?.[0]) return { ...found.files[0], reusedExistingFolder: true };
  const folder = await googleJson<{ id: string; webViewLink?: string }>(accessToken, "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true", { method: "POST", body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE, parents: [folderPlan.folderId] }) });
  return { ...folder, reusedExistingFolder: false };
}

export async function createGoogleDriveDocument(request: GoogleDriveDocumentRequest): Promise<GoogleDriveDocumentResult> {
  if (!request.templateFileId.trim()) throw new Error("O modelo editável do Google Drive ainda não foi indicado pela Administração para este documento.");
  const templateFileId = fileIdFrom(request.templateFileId);
  const { accessToken, rootFolderId } = await accessTokenFor(request.userId);
  const folder = await resolveFolder(accessToken, rootFolderId, request);
  const copied = await googleJson<{ id: string; webViewLink?: string }>(accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateFileId)}/copy?fields=id,webViewLink&supportsAllDrives=true`, { method: "POST", body: JSON.stringify({ name: `[${request.documentLabel}] Processo ${request.processReference}`.slice(0, 240), parents: [folder.id] }) });
  const replacements = { "{{PROCESSO}}": request.processReference, "{{OBJETO}}": request.processTitle, "{{VALOR}}": request.estimatedValue ?? "", "{{UNIDADE_REQUISITANTE}}": request.requestingUnit ?? "" };
  await googleJson(accessToken, `https://docs.googleapis.com/v1/documents/${encodeURIComponent(copied.id)}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: Object.entries(replacements).map(([containsText, replaceText]) => ({ replaceAllText: { containsText: { text: containsText, matchCase: true }, replaceText } })) }) });
  const folderMetadata = await googleJson<{ modifiedTime?: string }>(accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folder.id)}?fields=modifiedTime&supportsAllDrives=true`);
  return { folderId: folder.id, folderUrl: folder.webViewLink ?? `https://drive.google.com/drive/folders/${folder.id}`, fileId: copied.id, fileUrl: copied.webViewLink ?? `https://docs.google.com/document/d/${copied.id}/edit`, reusedExistingFolder: folder.reusedExistingFolder, folderModifiedAt: folderMetadata.modifiedTime ? new Date(folderMetadata.modifiedTime) : null };
}

export async function uploadGoogleDrivePdf(request: GoogleDrivePdfUploadRequest) {
  const fileName = request.fileName.trim().replace(/[\\/]/g, "-").slice(0, 240);
  if (!fileName.toLowerCase().endsWith(".pdf")) throw new Error("O arquivo institucional deve estar no formato PDF.");
  const pdf = Buffer.from(request.contentBase64, "base64");
  if (!pdf.length || pdf.length > 15 * 1024 * 1024 || pdf.subarray(0, 4).toString() !== "%PDF") throw new Error("O PDF informado é inválido ou ultrapassa o limite de 15 MB.");
  const { accessToken, rootFolderId } = await accessTokenFor(request.userId);
  const folder = await resolveFolder(accessToken, rootFolderId, { userId: request.userId, processReference: request.processReference, processTitle: request.processTitle, documentLabel: "DFD", templateFileId: "documento", existingFolderId: request.existingFolderId });
  const boundary = `orbita-${randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({ name: fileName, mimeType: "application/pdf", parents: [folder.id] });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`), pdf, Buffer.from(`\r\n--${boundary}--`)]);
  const response = await googleHttpJson<{ id?: string; webViewLink?: string }>("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body });
  if (!response.ok || !response.body.id) throw new Error(response.status === 401 || response.status === 403 || response.status === 404 ? "A conta Google conectada não possui acesso à pasta do processo." : `O Google Drive recusou o envio do PDF (${response.status}).`);
  const folderMetadata = await googleJson<{ modifiedTime?: string }>(accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folder.id)}?fields=modifiedTime&supportsAllDrives=true`);
  return { folderId: folder.id, folderUrl: folder.webViewLink ?? `https://drive.google.com/drive/folders/${folder.id}`, fileId: response.body.id, fileUrl: response.body.webViewLink ?? `https://drive.google.com/open?id=${response.body.id}`, reusedExistingFolder: folder.reusedExistingFolder, folderModifiedAt: folderMetadata.modifiedTime ? new Date(folderMetadata.modifiedTime) : null, sizeBytes: pdf.length };
}

export const googleDriveOAuth = { redirectUri: REDIRECT_URI, scopes: [DRIVE_SCOPE, DOCS_SCOPE] };
