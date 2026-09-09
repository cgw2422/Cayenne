"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";

export type FeedbackResult = { ok: boolean; message: string };

const schema = z.object({
  type: z.enum(["BUG", "FEATURE", "GENERAL"]),
  message: z
    .string()
    .trim()
    .min(4, "Tell us a bit more than that.")
    .max(2000, "That's longer than we can store — trim it down a little."),
});

/** How many pieces of feedback one account may send per day. */
const DAILY_LIMIT = 10;

/**
 * User feedback.
 *
 * Stores exactly what the person typed and nothing else — no attached
 * diagnostics, no measurements, no journal, no device fingerprint. The account
 * is linked so a reply is possible, and that link is severed rather than
 * cascading if the account is later deleted, so the report survives without
 * pointing at a ghost.
 */
export async function sendFeedback(input: {
  type: string;
  message: string;
}): Promise<FeedbackResult> {
  const user = await requireUser();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't send." };
  }

  const since = new Date(Date.now() - 86_400_000);
  const recent = await prisma.feedback.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });
  if (recent >= DAILY_LIMIT) {
    return {
      ok: false,
      message: "That's a lot of feedback for one day. Try again tomorrow.",
    };
  }

  await prisma.feedback.create({
    data: { userId: user.id, type: parsed.data.type, message: parsed.data.message },
  });

  return { ok: true, message: "Sent. Thank you — it goes straight to the person who builds this." };
}
