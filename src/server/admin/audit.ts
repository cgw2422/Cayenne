import "server-only";

import type { AdminAction } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AdminUser } from "@/server/admin/guard";

/**
 * The admin audit trail.
 *
 * Two things make this a record rather than a gesture. Emails are copied in at
 * write time, so deleting an account cannot quietly rewrite history — the row
 * still says who did what to whom. And there is no update or delete path: the
 * only operation this module offers is append.
 *
 * State summaries are short readable strings ("entitlement=FREE" ->
 * "entitlement=LIFETIME source=COMPLIMENTARY note=Beta tester") rather than
 * serialised objects, so a year-old row is still legible without tooling.
 */
export async function recordAdminAction(input: {
  admin: AdminUser;
  action: AdminAction;
  target?: { id: string; email: string } | null;
  targetLabel?: string | null;
  before?: string | null;
  after?: string | null;
  note?: string | null;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.admin.id,
      adminEmail: input.admin.email,
      action: input.action,
      targetUserId: input.target?.id ?? null,
      targetUserEmail: input.target?.email ?? null,
      targetLabel: input.targetLabel?.slice(0, 120) ?? null,
      beforeState: input.before?.slice(0, 400) ?? null,
      afterState: input.after?.slice(0, 400) ?? null,
      note: input.note?.slice(0, 400) ?? null,
    },
  });
}

/** Renders an entitlement state the way the audit log records it. */
export function entitlementState(user: {
  entitlement: string;
  entitlementSource: string | null;
  entitlementNote: string | null;
}) {
  const parts = [`entitlement=${user.entitlement}`];
  if (user.entitlementSource) parts.push(`source=${user.entitlementSource}`);
  if (user.entitlementNote) parts.push(`note=${user.entitlementNote}`);
  return parts.join(" ");
}

export const ACTION_LABEL: Record<AdminAction, string> = {
  GRANT_LIFETIME: "Granted lifetime",
  REVOKE_LIFETIME: "Removed lifetime",
  DISABLE_ACCOUNT: "Disabled account",
  ENABLE_ACCOUNT: "Re-enabled account",
  FORCE_PASSWORD_RESET: "Forced password reset",
  ROLE_CHANGED: "Changed role",
  QUOTE_CREATED: "Created quote",
  QUOTE_UPDATED: "Edited quote",
  QUOTE_DISABLED: "Disabled quote",
  QUOTE_ENABLED: "Re-enabled quote",
  CHALLENGE_CREATED: "Created challenge",
  CHALLENGE_UPDATED: "Edited challenge",
  ACHIEVEMENT_UPDATED: "Edited achievement",
  FEEDBACK_UPDATED: "Updated feedback",
};

/** Actions that change what somebody can do, as opposed to editing content. */
export const DESTRUCTIVE: AdminAction[] = [
  "GRANT_LIFETIME",
  "REVOKE_LIFETIME",
  "DISABLE_ACCOUNT",
  "ENABLE_ACCOUNT",
  "FORCE_PASSWORD_RESET",
  "ROLE_CHANGED",
];
