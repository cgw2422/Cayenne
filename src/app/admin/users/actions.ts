"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { entitlementState, recordAdminAction } from "@/server/admin/audit";
import { requireAdmin } from "@/server/admin/guard";
import { revokeAllSessions } from "@/server/auth";

export type AdminResult = { ok: boolean; message: string };

/**
 * Account actions.
 *
 * Every one of these calls `requireAdmin()` for itself. A server action is a
 * public endpoint — the button that normally invokes it is not the only way in
 * — so authorization is decided here, never inherited from whatever page
 * happened to render the form.
 *
 * Every one also writes an audit row before returning, in the same code path as
 * the change, so there is no version of "it happened but wasn't logged".
 */

/** Reads the fields an audit entry needs, and proves the target exists. */
async function loadTarget(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      entitlement: true,
      entitlementSource: true,
      entitlementNote: true,
      entitlementProvider: true,
      disabledAt: true,
      role: true,
    },
  });
}

export async function grantLifetimeTo(input: {
  userId: string;
  source: "PAID" | "COMPLIMENTARY";
  note?: string;
  provider?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const target = await loadTarget(input.userId);
  if (!target) return { ok: false, message: "No such account." };

  const note = input.note?.trim().slice(0, 200) || null;
  const provider =
    input.provider?.trim().slice(0, 40) ||
    (input.source === "COMPLIMENTARY" ? "manual" : null);

  const before = entitlementState(target);

  await prisma.user.update({
    where: { id: target.id },
    data: {
      entitlement: "LIFETIME",
      entitledAt: target.entitlement === "LIFETIME" ? undefined : new Date(),
      entitlementSource: input.source,
      entitlementProvider: provider,
      entitlementNote: note,
    },
  });

  await recordAdminAction({
    admin,
    action: "GRANT_LIFETIME",
    target,
    before,
    after: entitlementState({
      entitlement: "LIFETIME",
      entitlementSource: input.source,
      entitlementNote: note,
    }),
    note,
  });

  revalidateUser(target.id);
  return { ok: true, message: "Lifetime granted." };
}

export async function revokeLifetimeFrom(input: {
  userId: string;
  note?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const target = await loadTarget(input.userId);
  if (!target) return { ok: false, message: "No such account." };
  if (target.entitlement !== "LIFETIME") {
    return { ok: false, message: "That account doesn't have lifetime." };
  }

  const before = entitlementState(target);

  await prisma.user.update({
    where: { id: target.id },
    data: {
      entitlement: "FREE",
      entitledAt: null,
      entitlementSource: null,
      entitlementProvider: null,
      entitlementNote: null,
    },
  });

  await recordAdminAction({
    admin,
    action: "REVOKE_LIFETIME",
    target,
    before,
    after: "entitlement=FREE",
    note: input.note?.trim().slice(0, 400) || null,
  });

  revalidateUser(target.id);
  return { ok: true, message: "Lifetime removed." };
}

export async function setAccountDisabled(input: {
  userId: string;
  disabled: boolean;
  note?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const target = await loadTarget(input.userId);
  if (!target) return { ok: false, message: "No such account." };

  // Locking yourself out of the admin is not a recoverable mistake from here.
  if (input.disabled && target.id === admin.id) {
    return { ok: false, message: "You can't disable your own account." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { disabledAt: input.disabled ? new Date() : null },
  });

  // Disabling has to bite immediately, not whenever their cookie expires.
  if (input.disabled) await revokeAllSessions(target.id);

  await recordAdminAction({
    admin,
    action: input.disabled ? "DISABLE_ACCOUNT" : "ENABLE_ACCOUNT",
    target,
    before: `disabled=${Boolean(target.disabledAt)}`,
    after: `disabled=${input.disabled}`,
    note: input.note?.trim().slice(0, 400) || null,
  });

  revalidateUser(target.id);
  return {
    ok: true,
    message: input.disabled ? "Account disabled." : "Account re-enabled.",
  };
}

/**
 * Forces a password change.
 *
 * There is no email provider wired up, so this is not a reset link — it is the
 * honest version the current architecture supports: every session is ended, and
 * the account is flagged so that the next successful sign-in must be followed
 * by choosing a new password before anything else. The user needs their current
 * password to get that far, which is the right trade with no mail out.
 */
export async function forcePasswordReset(input: {
  userId: string;
  note?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const target = await loadTarget(input.userId);
  if (!target) return { ok: false, message: "No such account." };

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordResetAt: new Date() },
  });
  await revokeAllSessions(target.id);

  await recordAdminAction({
    admin,
    action: "FORCE_PASSWORD_RESET",
    target,
    before: "passwordResetRequired=false",
    after: "passwordResetRequired=true sessionsRevoked=all",
    note: input.note?.trim().slice(0, 400) || null,
  });

  revalidateUser(target.id);
  return {
    ok: true,
    message: "Sessions ended. They must set a new password after signing in.",
  };
}

function revalidateUser(id: string) {
  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/entitlements");
}
