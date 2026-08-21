import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { users, type User } from "../../drizzle/schema";
import { getDb } from "../db";

export const LOCAL_SESSION_COOKIE = "orbita_session";
const encoder = new TextEncoder();
const masterEmails = new Set(["carlos@fozdoiguacu.pr.leg.br", "debora@fozdoiguacu.pr.leg.br"]);
export const isLocalMasterEmail = (email: string) => masterEmails.has(email.trim().toLowerCase());
const secret = () => {
  const value = process.env.JWT_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("Defina JWT_SECRET com pelo menos 32 caracteres para o modo local.");
  return encoder.encode(value);
};

export function hashLocalPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const digest = scryptSync(password, salt, 64).toString("base64url");
  return `${salt}.${digest}`;
}

export function verifyLocalPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(".");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

async function ensureBootstrapAdministrator() {
  const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!email || !password) return;
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!existing) await db.insert(users).values({ openId: `local:${email}`, email, name: process.env.LOCAL_ADMIN_NAME?.trim() || "Administrador institucional", loginMethod: "local", role: "admin", passwordHash: hashLocalPassword(password), active: true, lastSignedIn: new Date() });
  else if (!existing.passwordHash) await db.update(users).set({ name: existing.name || process.env.LOCAL_ADMIN_NAME?.trim() || "Administrador institucional", loginMethod: "local", role: "admin", active: true, passwordHash: hashLocalPassword(password) }).where(eq(users.id, existing.id));
  else if (isLocalMasterEmail(email) && existing.role !== "admin") await db.update(users).set({ role: "admin" }).where(eq(users.id, existing.id));
}

export async function authenticateLocalCredentials(email: string, password: string) {
  await ensureBootstrapAdministrator();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (!user?.passwordHash || !verifyLocalPassword(password, user.passwordHash)) throw new Error("E-mail ou senha inválidos.");
  if (!user.active) throw new Error("Esta conta está inativa. Procure a Administração para regularizar o acesso.");
  const role = isLocalMasterEmail(normalizedEmail) ? "admin" : user.role;
  await db.update(users).set({ lastSignedIn: new Date(), role }).where(eq(users.id, user.id));
  return { ...user, role };
}

export async function createLocalSession(user: User) {
  return new SignJWT({ userId: user.id, openId: user.openId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
}

export async function authenticateLocalRequest(req: Request): Promise<User | null> {
  const token = parseCookieHeader(req.headers.cookie || "")[LOCAL_SESSION_COOKIE];
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const id = Number(verified.payload.userId);
    if (!Number.isInteger(id)) return null;
    const db = await getDb();
    if (!db) return null;
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  } catch { return null; }
}
