import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { demands, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getDemandControl } from "./planningTwoStageService";

type VerificationPayload = { v: 1; publicId: string; revision: string };

function secret() {
  if (!process.env.JWT_SECRET) throw new Error("A chave de verificação institucional não está disponível.");
  return process.env.JWT_SECRET;
}

function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

function origin() { return (process.env.APP_ORIGIN || "https://orbitavisual-pte9ypdg.manus.space").replace(/\/$/, ""); }

export function createDfdVerificationCode(payload: VerificationPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export async function issueDfdPdfVerification(actor: { id: number; role: "user" | "admin" }, demandPublicId: string) {
  const control = await getDemandControl(actor, demandPublicId);
  const code = createDfdVerificationCode({ v: 1, publicId: control.demand.publicId, revision: control.demand.updatedAt.toISOString() });
  return { code, verificationUrl: `${origin()}/api/public/dfd-verification?code=${encodeURIComponent(code)}` };
}

export async function verifyDfdPdfVerificationCode(code: string) {
  const [encoded, provided] = code.split(".");
  if (!encoded || !provided || !/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]+$/.test(provided)) return { valid: false as const, reason: "Código de verificação inválido." };
  const expected = sign(encoded);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return { valid: false as const, reason: "Código de verificação inválido." };
  let payload: VerificationPayload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as VerificationPayload; } catch { return { valid: false as const, reason: "Código de verificação inválido." }; }
  if (payload.v !== 1 || !payload.publicId || !payload.revision) return { valid: false as const, reason: "Código de verificação inválido." };
  const db = await getDb();
  if (!db) return { valid: false as const, reason: "Não foi possível consultar a autenticidade no momento." };
  const [demand] = await db.select({ publicId: demands.publicId, title: demands.title, updatedAt: demands.updatedAt, requesterName: users.name }).from(demands).leftJoin(users, eq(demands.requesterUserId, users.id)).where(eq(demands.publicId, payload.publicId)).limit(1);
  if (!demand) return { valid: false as const, reason: "DFD não encontrada." };
  if (demand.updatedAt.toISOString() !== payload.revision) return { valid: false as const, reason: "Este PDF corresponde a uma versão anterior da DFD." };
  return { valid: true as const, publicId: demand.publicId, title: demand.title, requesterName: demand.requesterName || "Usuário institucional", updatedAt: demand.updatedAt };
}
