import "server-only";

import { cache } from "react";
import type { Achievement, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  dateColumnFromDayKey,
  dayKeyFromDateColumn,
  todayInZone,
  type DayKey,
} from "@/lib/date";
import { summarise, type StreakSummary } from "@/lib/streak";
import type { SessionUser } from "@/server/auth";

/** Every logged day for a user, ascending. The basis of all streak maths. */
export const loggedDays = cache(async (userId: string): Promise<DayKey[]> => {
  const rows = await prisma.cayenneEntry.findMany({
    where: { userId },
    distinct: ["takenOn"],
    orderBy: { takenOn: "asc" },
    select: { takenOn: true },
  });
  return rows.map((r) => dayKeyFromDateColumn(r.takenOn));
});

export function userToday(user: SessionUser): DayKey {
  return todayInZone(user.profile?.timezone ?? "UTC");
}

export const streakFor = cache(
  async (user: SessionUser): Promise<StreakSummary> => {
    const days = await loggedDays(user.id);
    const today = userToday(user);
    const startedOn = user.profile
      ? dayKeyFromDateColumn(user.profile.startedOn)
      : today;
    return summarise(days, today, startedOn);
  },
);

/**
 * Recomputes the denormalised streak cache on `Profile`. Called after any write
 * that changes which days have entries.
 */
export async function refreshStreakCache(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;

  const rows = await prisma.cayenneEntry.findMany({
    where: { userId },
    distinct: ["takenOn"],
    orderBy: { takenOn: "asc" },
    select: { takenOn: true },
  });
  const days = rows.map((r) => dayKeyFromDateColumn(r.takenOn));
  const today = todayInZone(profile.timezone);
  const summary = summarise(days, today, dayKeyFromDateColumn(profile.startedOn));

  await prisma.profile.update({
    where: { userId },
    data: {
      currentStreak: summary.current,
      longestStreak: Math.max(summary.longest, profile.longestStreak),
      totalDays: summary.totalDays,
      lastLoggedOn: summary.lastLoggedOn
        ? dateColumnFromDayKey(summary.lastLoggedOn)
        : null,
      streakUpdatedAt: new Date(),
    },
  });

  return summary;
}

/**
 * Evaluates every achievement against the user's current stats and unlocks any
 * that are newly earned. Returns only the ones unlocked by this call, so the UI
 * can celebrate them exactly once.
 */
export async function evaluateAchievements(
  userId: string,
  summary: StreakSummary,
): Promise<Achievement[]> {
  const [catalog, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const already = new Set(unlocked.map((u) => u.achievementId));
  const pending = catalog.filter((a) => !already.has(a.id));
  if (!pending.length) return [];

  const needs = new Set(pending.map((a) => a.kind));
  const stats = {
    methodVariety: 0,
    earlyBird: 0,
    monthBest: 0,
    recipesSaved: 0,
  };

  if (needs.has("METHOD_VARIETY")) {
    const methods = await prisma.cayenneEntry.findMany({
      where: { userId },
      distinct: ["method"],
      select: { method: true },
    });
    stats.methodVariety = methods.length;
  }

  if (needs.has("EARLY_BIRD")) {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "takenOn")::bigint AS count
      FROM "CayenneEntry"
      WHERE "userId" = ${userId}
        AND EXTRACT(HOUR FROM "takenAt") < 9
    `;
    stats.earlyBird = Number(rows[0]?.count ?? 0);
  }

  if (needs.has("MONTH_DAYS")) {
    const rows = await prisma.$queryRaw<{ days: bigint }[]>`
      SELECT COUNT(DISTINCT "takenOn")::bigint AS days
      FROM "CayenneEntry"
      WHERE "userId" = ${userId}
      GROUP BY DATE_TRUNC('month', "takenOn")
      ORDER BY days DESC
      LIMIT 1
    `;
    stats.monthBest = Number(rows[0]?.days ?? 0);
  }

  if (needs.has("RECIPES_SAVED")) {
    stats.recipesSaved = await prisma.recipeFavorite.count({ where: { userId } });
  }

  const earned = pending.filter((a) => {
    switch (a.kind) {
      case "FIRST_ENTRY":
        return summary.totalDays >= 1;
      case "STREAK":
        return summary.longest >= a.threshold;
      case "TOTAL_DAYS":
        return summary.totalDays >= a.threshold;
      case "METHOD_VARIETY":
        return stats.methodVariety >= a.threshold;
      case "EARLY_BIRD":
        return stats.earlyBird >= a.threshold;
      case "MONTH_DAYS":
        return stats.monthBest >= a.threshold;
      case "RECIPES_SAVED":
        return stats.recipesSaved >= a.threshold;
      default:
        return false;
    }
  });

  if (!earned.length) return [];

  await prisma.userAchievement.createMany({
    data: earned.map((a) => ({ userId, achievementId: a.id })),
    skipDuplicates: true,
  });

  return earned;
}

/** Marks the freshly-unlocked badges as seen once their celebration has run. */
export async function markAchievementsSeen(userId: string, ids: string[]) {
  if (!ids.length) return;
  await prisma.userAchievement.updateMany({
    where: { userId, achievementId: { in: ids }, seenAt: null },
    data: { seenAt: new Date() },
  });
}

/** How many doses the user has logged today, against their chosen target. */
export async function dosesToday(user: SessionUser) {
  const today = userToday(user);
  const logged = await prisma.cayenneEntry.count({
    where: { userId: user.id, takenOn: dateColumnFromDayKey(today) },
  });
  const target = Math.max(1, user.profile?.dosesPerDay ?? 1);
  return { logged, target, complete: logged >= target, remaining: Math.max(0, target - logged) };
}

export type EntryWithGoals = Prisma.CayenneEntryGetPayload<{
  include: { goals: { include: { userGoal: { include: { goal: true } } } } };
}>;

export const entryInclude = {
  goals: { include: { userGoal: { include: { goal: true } } } },
} satisfies Prisma.CayenneEntryInclude;
