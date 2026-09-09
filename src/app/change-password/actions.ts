"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validation";
import { hashPassword, requireUser, verifyPassword } from "@/server/auth";

export type ChangeResult = { ok: boolean; message: string };

/**
 * Sets a new password.
 *
 * Also the far end of an admin's "force password reset": that action ends every
 * session and flags the account, the app layout sends the user here on their
 * next request, and clearing `passwordResetAt` is what lets them back into the
 * app. Their current password is still required — with no mail provider wired
 * up, proving they are the account holder is the only honest gate available.
 */
export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<ChangeResult> {
  const user = await requireUser();
  if (!user.passwordHash) {
    return { ok: false, message: "This account signs in another way." };
  }

  if (!(await verifyPassword(input.current, user.passwordHash))) {
    return { ok: false, message: "That current password isn't right." };
  }

  const parsed = passwordSchema.safeParse(input.next);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Try another password." };
  }
  if (input.current === input.next) {
    return { ok: false, message: "That's the password you already have." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data), passwordResetAt: null },
  });

  // Every other session was signed with the old password's blessing.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  redirect("/sign-in?changed=1");
}
