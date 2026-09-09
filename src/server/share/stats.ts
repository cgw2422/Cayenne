import "server-only";

import { prisma } from "@/lib/prisma";
import { formatAmount, METHOD_META } from "@/lib/brand";
import { METHOD_ICON } from "@/lib/share/icons";
import {
  dateColumnFromDayKey,
  dayKeyFromDateColumn,
  daysInMonth,
  diffDays,
  formatDayLong,
} from "@/lib/date";
import { streakFor, userToday } from "@/server/habit";
import type { SessionUser } from "@/server/auth";
import type { CardStats } from "@/lib/share/types";

/**
 * Builds the numbers a card may display, entirely from the user's own records.
 *
 * Nothing here reads measurements, journal entries, entry notes or moods. The
 * card renderer only ever sees this object, so private data has no path onto a
 * share card — not through a toggle, a query parameter, or a bug.
 */
export async function buildCardStats(
  user: SessionUser,
  options: { achievementId?: string; quoteOverride?: string | null } = {},
): Promise<CardStats> {
  const today = userToday(user);
  const summary = await streakFor(user);
  const startedOn = user.profile
    ? dayKeyFromDateColumn(user.profile.startedOn)
    : today;

  const monthStart = `${today.slice(0, 7)}-01`;
  const monthTotal = daysInMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1);

  const [common, achievement, challenge, monthDays, monthBadges, lastQuote] =
    await Promise.all([
      commonHabits(user.id),
      options.achievementId
        ? prisma.userAchievement.findFirst({
            where: { userId: user.id, achievementId: options.achievementId },
            include: { achievement: true },
          })
        : prisma.userAchievement.findFirst({
            where: { userId: user.id },
            orderBy: { unlockedAt: "desc" },
            include: { achievement: true },
          }),
      prisma.userChallenge.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        include: { challenge: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cayenneEntry.findMany({
        where: {
          userId: user.id,
          takenOn: {
            gte: dateColumnFromDayKey(monthStart),
            lte: dateColumnFromDayKey(today),
          },
        },
        distinct: ["takenOn"],
        select: { takenOn: true },
      }),
      prisma.userAchievement.count({
        where: { userId: user.id, unlockedAt: { gte: new Date(`${monthStart}T00:00:00Z`) } },
      }),
      prisma.quoteImpression.findFirst({
        where: { userId: user.id },
        orderBy: { shownOn: "desc" },
        include: { quote: true },
      }),
    ]);

  let challengeDay: number | null = null;
  if (challenge) {
    const logged = await prisma.cayenneEntry.findMany({
      where: { userId: user.id, takenOn: { gte: challenge.startedOn } },
      distinct: ["takenOn"],
      select: { takenOn: true },
    });
    challengeDay = Math.min(logged.length, challenge.challenge.durationDays);
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(dateColumnFromDayKey(today));

  return {
    displayName: user.displayName,
    streak: summary.current,
    longestStreak: summary.longest,
    totalDays: summary.totalDays,
    consistency: summary.consistency,
    daysSinceStart: Math.max(1, diffDays(startedOn, today) + 1),
    startedOn: formatDayLong(startedOn),
    todayLabel: formatDayLong(today),
    amountLabel: common.amountLabel,
    methodLabel: common.methodLabel,
    methodIcon: common.methodIcon,
    achievementTitle: achievement?.achievement.title ?? null,
    achievementDescription: achievement?.achievement.description ?? null,
    achievementValue: achievement?.achievement.threshold ?? null,
    challengeTitle: challenge?.challenge.title ?? null,
    challengeDay,
    challengeTotal: challenge?.challenge.durationDays ?? null,
    monthLabel,
    monthDaysLogged: monthDays.length,
    monthDaysTotal: monthTotal,
    monthAchievements: monthBadges,
    quote:
      options.quoteOverride !== undefined
        ? options.quoteOverride
        : (lastQuote?.quote.text ?? null),
  };
}

/** The user's most-used amount and method, for "usual amount" style stats. */
async function commonHabits(userId: string) {
  const [amounts, methods] = await Promise.all([
    prisma.cayenneEntry.groupBy({
      by: ["amount", "unit"],
      where: { userId },
      _count: { _all: true },
      orderBy: { _count: { amount: "desc" } },
      take: 1,
    }),
    prisma.cayenneEntry.groupBy({
      by: ["method"],
      where: { userId },
      _count: { _all: true },
      orderBy: { _count: { method: "desc" } },
      take: 1,
    }),
  ]);

  const amount = amounts[0];
  const method = methods[0];

  return {
    amountLabel: amount ? formatAmount(Number(amount.amount), amount.unit) : null,
    methodLabel: method ? METHOD_META[method.method].label : null,
    methodIcon: method ? METHOD_ICON[method.method] : null,
  };
}
