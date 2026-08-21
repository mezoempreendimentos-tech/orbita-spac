const MASTER_ADMIN_EMAILS = new Set([
  "carlos@fozdoiguacu.pr.leg.br",
  "debora@fozdoiguacu.pr.leg.br",
]);

export function isMasterAdminEmail(email: string | null | undefined) {
  return Boolean(email && MASTER_ADMIN_EMAILS.has(email.trim().toLowerCase()));
}

export const masterAdminEmails = Array.from(MASTER_ADMIN_EMAILS);
