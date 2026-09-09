"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAdminAction } from "@/server/admin/audit";
import { requireAdmin } from "@/server/admin/guard";

export type AdminResult = { ok: boolean; message: string };

/**
 * Content management.
 *
 * The point is to change copy without a deploy. The line it will not cross is
 * schema-coupled fields: an achievement's `slug`, `kind` and `threshold` are
 * what the unlock logic runs on, so only its display wording is editable here.
 * Editing a threshold from a web form would silently re-decide who has earned
 * what, and that is a migration, not a content edit.
 *
 * Nothing is ever deleted. Quotes and challenges are deactivated, so the
 * impressions and participants that reference them stay intact.
 */

const quoteSchema = z.object({
  text: z.string().trim().min(4, "Too short to be a quote.").max(240),
  category: z.enum(["DAILY", "STREAK", "COMEBACK", "MILESTONE", "FUNNY", "ENCOURAGEMENT"]),
  tone: z.enum(["CLEAN", "FUNNY", "MOTIVATIONAL", "PROUD", ""]).optional(),
  milestoneDays: z.coerce.number().int().min(0).max(3650).optional(),
});

export async function saveQuote(input: {
  id?: string;
  text: string;
  category: string;
  tone?: string;
  milestoneDays?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = quoteSchema.safeParse({
    text: input.text,
    category: input.category,
    tone: input.tone ?? "",
    milestoneDays: input.milestoneDays || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't validate." };
  }

  const data = {
    text: parsed.data.text,
    category: parsed.data.category,
    tone: parsed.data.tone ? parsed.data.tone : null,
    milestoneDays: parsed.data.milestoneDays || null,
  };

  try {
    if (input.id) {
      const before = await prisma.quote.findUnique({ where: { id: input.id } });
      if (!before) return { ok: false, message: "That quote no longer exists." };

      await prisma.quote.update({ where: { id: input.id }, data });
      await recordAdminAction({
        admin,
        action: "QUOTE_UPDATED",
        targetLabel: input.id,
        before: `${before.category} "${before.text}"`,
        after: `${data.category} "${data.text}"`,
      });
    } else {
      const created = await prisma.quote.create({ data });
      await recordAdminAction({
        admin,
        action: "QUOTE_CREATED",
        targetLabel: created.id,
        after: `${data.category} "${data.text}"`,
      });
    }
  } catch {
    // `text` is unique, which is the only realistic failure here.
    return { ok: false, message: "That quote already exists." };
  }

  revalidatePath("/admin/content");
  return { ok: true, message: input.id ? "Quote saved." : "Quote added." };
}

export async function setQuoteActive(input: {
  id: string;
  active: boolean;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const quote = await prisma.quote.findUnique({ where: { id: input.id } });
  if (!quote) return { ok: false, message: "That quote no longer exists." };

  await prisma.quote.update({
    where: { id: input.id },
    data: { isActive: input.active },
  });

  await recordAdminAction({
    admin,
    action: input.active ? "QUOTE_ENABLED" : "QUOTE_DISABLED",
    targetLabel: input.id,
    before: `active=${quote.isActive}`,
    after: `active=${input.active}`,
    note: quote.text.slice(0, 200),
  });

  revalidatePath("/admin/content");
  return { ok: true, message: input.active ? "Quote back in rotation." : "Quote retired." };
}

const challengeSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(400),
  durationDays: z.coerce.number().int().min(1).max(365),
  isPremium: z.boolean(),
  isActive: z.boolean(),
});

export async function saveChallenge(input: {
  id?: string;
  title: string;
  description: string;
  durationDays: string;
  isPremium: boolean;
  isActive: boolean;
}): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = challengeSchema.safeParse({
    title: input.title,
    description: input.description,
    durationDays: input.durationDays,
    isPremium: input.isPremium,
    isActive: input.isActive,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't validate." };
  }

  if (input.id) {
    const before = await prisma.challenge.findUnique({ where: { id: input.id } });
    if (!before) return { ok: false, message: "That challenge no longer exists." };

    // Duration is what "day 12 of 30" is measured against, so changing it moves
    // the finish line for everyone already running it. Allowed, but recorded.
    await prisma.challenge.update({ where: { id: input.id }, data: parsed.data });
    await recordAdminAction({
      admin,
      action: "CHALLENGE_UPDATED",
      targetLabel: before.slug,
      before: `"${before.title}" ${before.durationDays}d active=${before.isActive} premium=${before.isPremium}`,
      after: `"${parsed.data.title}" ${parsed.data.durationDays}d active=${parsed.data.isActive} premium=${parsed.data.isPremium}`,
    });
  } else {
    const slug = await uniqueSlug(parsed.data.title);
    const created = await prisma.challenge.create({
      data: { ...parsed.data, slug, sortOrder: 100 },
    });
    await recordAdminAction({
      admin,
      action: "CHALLENGE_CREATED",
      targetLabel: created.slug,
      after: `"${parsed.data.title}" ${parsed.data.durationDays}d premium=${parsed.data.isPremium}`,
    });
  }

  revalidatePath("/admin/content");
  revalidatePath("/more/challenges");
  return { ok: true, message: input.id ? "Challenge saved." : "Challenge added." };
}

const achievementSchema = z.object({
  title: z.string().trim().min(2).max(60),
  description: z.string().trim().min(4).max(200),
});

/**
 * Display wording only. `kind` and `threshold` decide who has earned the badge
 * and are not editable from here for that reason.
 */
export async function saveAchievementWording(input: {
  id: string;
  title: string;
  description: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = achievementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't validate." };
  }

  const before = await prisma.achievement.findUnique({ where: { id: input.id } });
  if (!before) return { ok: false, message: "That achievement no longer exists." };

  await prisma.achievement.update({ where: { id: input.id }, data: parsed.data });
  await recordAdminAction({
    admin,
    action: "ACHIEVEMENT_UPDATED",
    targetLabel: before.slug,
    before: `"${before.title}" — ${before.description}`,
    after: `"${parsed.data.title}" — ${parsed.data.description}`,
  });

  revalidatePath("/admin/content");
  return { ok: true, message: "Wording saved." };
}

async function uniqueSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "challenge";

  for (let suffix = 0; suffix < 50; suffix++) {
    const slug = suffix ? `${base}-${suffix}` : base;
    const clash = await prisma.challenge.findUnique({ where: { slug } });
    if (!clash) return slug;
  }
  return `${base}-${Date.now()}`;
}
