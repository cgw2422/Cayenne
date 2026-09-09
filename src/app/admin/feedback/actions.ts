"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAdminAction } from "@/server/admin/audit";
import { requireAdmin } from "@/server/admin/guard";

export type AdminResult = { ok: boolean; message: string };

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "REVIEWING", "PLANNED", "RESOLVED", "CLOSED"]),
  adminNote: z.string().trim().max(1000).optional(),
});

/**
 * Triage. The note is admin-only working memory — it is never shown to the
 * person who sent the feedback, and no screen in the consumer app reads it.
 */
export async function updateFeedback(input: {
  id: string;
  status: string;
  adminNote?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't validate." };
  }

  const before = await prisma.feedback.findUnique({
    where: { id: parsed.data.id },
    select: { status: true, user: { select: { id: true, email: true } } },
  });
  if (!before) return { ok: false, message: "That feedback no longer exists." };

  await prisma.feedback.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote?.trim() || null,
    },
  });

  await recordAdminAction({
    admin,
    action: "FEEDBACK_UPDATED",
    target: before.user ?? null,
    targetLabel: parsed.data.id,
    before: `status=${before.status}`,
    after: `status=${parsed.data.status}`,
  });

  revalidatePath("/admin/feedback");
  return { ok: true, message: "Updated." };
}
