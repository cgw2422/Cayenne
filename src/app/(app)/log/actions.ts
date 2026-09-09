"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { entrySchema, fieldErrors, type ActionState } from "@/lib/validation";
import { dateColumnFromDayKey, toDayKey, todayInZone } from "@/lib/date";
import { dosesToday, evaluateAchievements, refreshStreakCache } from "@/server/habit";
import { milestoneReached, MILESTONE_TITLES } from "@/lib/streak";
import { categoriesForState, randomQuote } from "@/server/quotes";

export type SaveEntryResult = ActionState & {
  streak?: number;
  milestone?: number | null;
  headline?: string;
  subline?: string;
  badges?: { title: string; description: string }[];
};

export async function saveEntry(input: {
  takenAt: string;
  method: string;
  amount: number;
  unit: string;
  mood: number | null;
  notes: string | null;
  userGoalIds: string[];
  entryId?: string;
}): Promise<SaveEntryResult> {
  const user = await requireUser();

  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const takenAt = new Date(data.takenAt);
  if (Number.isNaN(takenAt.getTime())) {
    return { ok: false, errors: { takenAt: "Pick a valid date and time." } };
  }
  if (takenAt.getTime() > Date.now() + 60_000) {
    return { ok: false, errors: { takenAt: "That's in the future." } };
  }

  // The client sends a local ISO string; its calendar day is the streak day.
  const takenOn = dateColumnFromDayKey(toDayKey(takenAt));

  // Only the user's own goals can be attached — never trust the posted ids.
  const ownedGoals = data.userGoalIds.length
    ? await prisma.userGoal.findMany({
        where: { userId: user.id, id: { in: data.userGoalIds } },
        select: { id: true },
      })
    : [];

  if (input.entryId) {
    const existing = await prisma.cayenneEntry.findFirst({
      where: { id: input.entryId, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, errors: { form: "That entry no longer exists." } };

    await prisma.$transaction([
      prisma.entryGoal.deleteMany({ where: { entryId: existing.id } }),
      prisma.cayenneEntry.update({
        where: { id: existing.id },
        data: {
          takenAt,
          takenOn,
          method: data.method,
          amount: data.amount,
          unit: data.unit,
          mood: data.mood,
          notes: data.notes || null,
          goals: {
            create: ownedGoals.map((g) => ({ userGoalId: g.id })),
          },
        },
      }),
    ]);
  } else {
    await prisma.cayenneEntry.create({
      data: {
        userId: user.id,
        takenAt,
        takenOn,
        method: data.method,
        amount: data.amount,
        unit: data.unit,
        mood: data.mood,
        notes: data.notes || null,
        goals: { create: ownedGoals.map((g) => ({ userGoalId: g.id })) },
      },
    });

    // Remember what they usually take so next time is one tap.
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        defaultMethod: data.method,
        defaultAmount: data.amount,
        defaultUnit: data.unit,
      },
    });
  }

  const summary = await refreshStreakCache(user.id);
  const badges = summary ? await evaluateAchievements(user.id, summary) : [];

  revalidatePath("/home");
  revalidatePath("/progress");
  revalidatePath("/log");

  const streak = summary?.current ?? 0;
  const milestone = milestoneReached(streak);
  const quote = await randomQuote(categoriesForState(streak, false));
  const doses = await dosesToday(user);

  // A milestone always wins. Otherwise, someone on a multi-dose routine wants to
  // know where they are in the day, not just that the day counted.
  let headline: string;
  let subline: string;

  if (milestone) {
    headline = `${milestone} days — ${MILESTONE_TITLES[milestone]}!`;
    subline = "That's a milestone worth posting.";
  } else if (doses.target > 1 && !doses.complete) {
    headline = `Dose ${doses.logged} of ${doses.target}`;
    subline = `${doses.remaining} more to go today.`;
  } else if (doses.target > 1) {
    headline = `All ${doses.target} doses done!`;
    subline = quote?.text ?? "That's the day, handled.";
  } else if (streak > 0) {
    headline = `Day ${streak}!`;
    subline = quote?.text ?? "Another day in the books.";
  } else {
    headline = "Logged.";
    subline = quote?.text ?? "Another day in the books.";
  }

  return {
    ok: true,
    streak,
    milestone,
    headline,
    subline,
    badges: badges.map((b) => ({ title: b.title, description: b.description })),
  };
}

export async function deleteEntry(entryId: string): Promise<ActionState> {
  const user = await requireUser();

  const { count } = await prisma.cayenneEntry.deleteMany({
    where: { id: entryId, userId: user.id },
  });
  if (!count) return { ok: false, message: "That entry no longer exists." };

  await refreshStreakCache(user.id);
  revalidatePath("/home");
  revalidatePath("/progress");
  revalidatePath("/log");
  return { ok: true, message: "Entry removed." };
}

export async function todaysEntries() {
  const user = await requireUser();
  const today = todayInZone(user.profile?.timezone ?? "UTC");
  return prisma.cayenneEntry.findMany({
    where: { userId: user.id, takenOn: dateColumnFromDayKey(today) },
    orderBy: { takenAt: "desc" },
  });
}
