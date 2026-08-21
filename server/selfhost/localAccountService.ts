import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { auditEvents, localPasswordRecoveryRequests, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { hashLocalPassword, isLocalMasterEmail } from "./localAuth";
import { canDeactivateLocalAccount, localPasswordError } from "./localAccountPolicies";

type LocalActor = { id: number; role: "user" | "admin" };

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

async function audit(actorUserId: number | undefined, eventType: string, summary: string, payload?: Record<string, unknown>) {
  const db = await dbOrThrow();
  await db.insert(auditEvents).values({ actorUserId, eventType, summary, payload });
}

async function activeAdminCount(db: Awaited<ReturnType<typeof dbOrThrow>>) {
  const rows = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "admin"), eq(users.active, true), isNotNull(users.passwordHash)));
  return rows.length;
}

async function localUserOrThrow(userId: number) {
  const db = await dbOrThrow();
  const [user] = await db.select().from(users).where(and(eq(users.id, userId), isNotNull(users.passwordHash))).limit(1);
  if (!user) throw new Error("Conta local não encontrada.");
  return { db, user };
}

export async function listLocalAccounts() {
  const db = await dbOrThrow();
  const [accounts, recoveryRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt, updatedAt: users.updatedAt, lastSignedIn: users.lastSignedIn }).from(users).where(isNotNull(users.passwordHash)).orderBy(asc(users.name), asc(users.email)),
    db.select({ id: localPasswordRecoveryRequests.id, userId: localPasswordRecoveryRequests.userId, status: localPasswordRecoveryRequests.status, requestedAt: localPasswordRecoveryRequests.requestedAt, name: users.name, email: users.email }).from(localPasswordRecoveryRequests).innerJoin(users, eq(localPasswordRecoveryRequests.userId, users.id)).where(eq(localPasswordRecoveryRequests.status, "pending")).orderBy(desc(localPasswordRecoveryRequests.requestedAt)),
  ]);
  return { accounts, recoveryRequests: recoveryRows };
}

export async function createLocalAccount(actor: LocalActor, input: { name: string; email: string; password: string; role: "user" | "admin" }) {
  const passwordMessage = localPasswordError(input.password);
  if (passwordMessage) throw new Error(passwordMessage);
  const db = await dbOrThrow();
  const email = input.email.trim().toLowerCase();
  const role = isLocalMasterEmail(email) ? "admin" : input.role;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("Já existe uma conta cadastrada para este e-mail.");
  const result = await db.insert(users).values({ openId: `local:${email}`, name: input.name.trim(), email, loginMethod: "local", passwordHash: hashLocalPassword(input.password), role, active: true, lastSignedIn: new Date(0) });
  const userId = Number(result[0].insertId);
  await audit(actor.id, "conta_local_criada", "Conta local criada pela Administração.", { userId, email, role });
  return { userId, email, role };
}

export async function updateLocalAccount(actor: LocalActor, input: { userId: number; name: string; email: string; role: "user" | "admin"; active: boolean }) {
  const { db, user } = await localUserOrThrow(input.userId);
  const email = input.email.trim().toLowerCase();
  if (!canDeactivateLocalAccount(actor.id, user.id) && !input.active) throw new Error("Você não pode inativar a própria conta.");
  if (isLocalMasterEmail(user.email ?? email) && (!input.active || input.role !== "admin")) throw new Error("Os acessos mestres institucionais devem permanecer ativos e administrativos.");
  const intendedRole = isLocalMasterEmail(email) ? "admin" : input.role;
  if ((user.role === "admin" && (!input.active || intendedRole !== "admin")) && await activeAdminCount(db) <= 1) throw new Error("Mantenha ao menos uma conta administrativa local ativa.");
  const [sameEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (sameEmail && sameEmail.id !== user.id) throw new Error("Já existe uma conta cadastrada para este e-mail.");
  await db.update(users).set({ name: input.name.trim(), email, role: intendedRole, active: input.active }).where(eq(users.id, user.id));
  if (!input.active) await db.update(localPasswordRecoveryRequests).set({ status: "cancelled" }).where(and(eq(localPasswordRecoveryRequests.userId, user.id), eq(localPasswordRecoveryRequests.status, "pending")));
  await audit(actor.id, "conta_local_atualizada", "Dados de conta local atualizados pela Administração.", { userId: user.id, email, role: intendedRole, active: input.active });
  return { success: true };
}

export async function resetLocalAccountPassword(actor: LocalActor, input: { userId: number; password: string }) {
  const passwordMessage = localPasswordError(input.password);
  if (passwordMessage) throw new Error(passwordMessage);
  const { db, user } = await localUserOrThrow(input.userId);
  if (!user.active) throw new Error("Reative a conta antes de redefinir sua senha.");
  await db.update(users).set({ passwordHash: hashLocalPassword(input.password) }).where(eq(users.id, user.id));
  await db.update(localPasswordRecoveryRequests).set({ status: "resolved", resolvedAt: new Date(), resolvedByUserId: actor.id }).where(and(eq(localPasswordRecoveryRequests.userId, user.id), eq(localPasswordRecoveryRequests.status, "pending")));
  await audit(actor.id, "senha_local_redefinida", "Senha de conta local redefinida pela Administração.", { userId: user.id });
  return { success: true };
}

export async function requestLocalPasswordRecovery(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Informe um e-mail institucional válido.");
  const db = await dbOrThrow();
  const [user] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), eq(users.active, true), isNotNull(users.passwordHash))).limit(1);
  if (user) {
    const [open] = await db.select({ id: localPasswordRecoveryRequests.id }).from(localPasswordRecoveryRequests).where(and(eq(localPasswordRecoveryRequests.userId, user.id), eq(localPasswordRecoveryRequests.status, "pending"))).limit(1);
    if (!open) await db.insert(localPasswordRecoveryRequests).values({ userId: user.id });
    await audit(undefined, "recuperacao_senha_solicitada", "Solicitação de recuperação de senha local registrada.", { userId: user.id });
  }
  return { message: "Se houver uma conta local ativa para este e-mail, a solicitação foi registrada. Procure um administrador para definir uma nova senha." };
}
