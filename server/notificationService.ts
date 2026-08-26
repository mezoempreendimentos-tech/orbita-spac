import { and, asc, desc, eq } from "drizzle-orm";
import { userNotifications, userProcessRoles, users } from "../drizzle/schema";
import { getDb } from "./db";

export type NotificationDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type NotificationInput = {
  recipientUserId: number;
  entityType: string;
  entityPublicId: string;
  notificationType: string;
  title: string;
  body: string;
  idempotencyKey: string;
};

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Tente novamente em instantes.");
  return db;
}

export async function demandNotificationRecipients(db: NotificationDb, requesterUserId: number) {
  const [directorRows, adminRows] = await Promise.all([
    db.select({ userId: userProcessRoles.userId }).from(userProcessRoles).where(and(eq(userProcessRoles.role, "administrador"), eq(userProcessRoles.active, true))),
    db.select({ userId: users.id }).from(users).where(and(eq(users.role, "admin"), eq(users.active, true))),
  ]);
  return Array.from(new Set([requesterUserId, ...directorRows.map(row => row.userId), ...adminRows.map(row => row.userId)]));
}

export async function notifyUsers(db: NotificationDb, input: Omit<NotificationInput, "recipientUserId" | "idempotencyKey"> & { recipientUserIds: number[]; idempotencyPrefix: string }) {
  const recipients = Array.from(new Set(input.recipientUserIds));
  if (!recipients.length) return { created: 0 };
  const values: NotificationInput[] = recipients.map(recipientUserId => ({
    recipientUserId,
    entityType: input.entityType,
    entityPublicId: input.entityPublicId,
    notificationType: input.notificationType,
    title: input.title,
    body: input.body,
    idempotencyKey: `${input.idempotencyPrefix}:${recipientUserId}`,
  }));
  await db.insert(userNotifications).values(values).onDuplicateKeyUpdate({ set: { title: input.title, body: input.body } });
  return { created: recipients.length };
}

export async function notifyDemandAudience(db: NotificationDb, input: { demandId: number; requesterUserId: number; demandPublicId: string; title: string; body: string; notificationType: string; idempotencyPrefix: string }) {
  const recipients = await demandNotificationRecipients(db, input.requesterUserId);
  return notifyUsers(db, { recipientUserIds: recipients, entityType: "demand", entityPublicId: input.demandPublicId, notificationType: input.notificationType, title: input.title, body: input.body, idempotencyPrefix: input.idempotencyPrefix });
}

export async function listUserNotifications(userId: number) {
  const db = await dbOrThrow();
  return db.select().from(userNotifications).where(eq(userNotifications.recipientUserId, userId)).orderBy(asc(userNotifications.status), desc(userNotifications.createdAt)).limit(50);
}

export async function unreadNotificationCount(userId: number) {
  const db = await dbOrThrow();
  const rows = await db.select({ id: userNotifications.id }).from(userNotifications).where(and(eq(userNotifications.recipientUserId, userId), eq(userNotifications.status, "unread")));
  return rows.length;
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await dbOrThrow();
  const result = await db.update(userNotifications).set({ status: "read", readAt: new Date() }).where(and(eq(userNotifications.id, notificationId), eq(userNotifications.recipientUserId, userId), eq(userNotifications.status, "unread")));
  return { success: true, changed: Number(result[0]?.affectedRows ?? 0) };
}

export async function markAllNotificationsRead(userId: number) {
  const db = await dbOrThrow();
  await db.update(userNotifications).set({ status: "read", readAt: new Date() }).where(and(eq(userNotifications.recipientUserId, userId), eq(userNotifications.status, "unread")));
  return { success: true };
}
