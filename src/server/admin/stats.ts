import "server-only";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  backfillDailyStats,
  dailySeries,
  firstActivityDay,
  todayKey,
  utcMidnight,
  type DailyRow,
  type DayKey,
} from "@/server/admin/rollup";

/** The ranges the dashboard offers. `ALL` starts at the first account. */
export const RANGES = ["7d", "30d", "90d", "all"] as const;
export type RangeId = (typeof RANGES)[number];

export const RANGE_LABEL: Record<RangeId, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

export function parseRange(raw: string | undefined): RangeId {
  return (RANGES as readonly string[]).includes(raw ?? "") ? (raw as RangeId) : "30d";
}

export type Totals = {
  users: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  active7: number;
  active30: number;
  lifetime: number;
  paidLifetime: number;
  compedLifetime: number;
  free: number;
  conversionPct: number;
  entries: number;
  entriesToday: number;
  shareCards: number;
  shareCardsThisMonth: number;
  challengesStarted: number;
  challengesCompleted: number;
  recipesCreated: number;
  openFeedback: number;
};

/**
 * Every headline number on the dashboard, from live indexed counts.
 *
 * These are `COUNT(*)` against indexed columns rather than anything scanned or
 * derived, so they stay cheap; the expensive part of admin analytics is the
 * per-day series, and that comes from the rollup table instead.
 */
export async function totals(): Promise<Totals> {
  const now = new Date();
  const startOfToday = utcMidnight(todayKey());
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

  const [
    users,
    newToday,
    newThisWeek,
    newThisMonth,
    active7,
    active30,
    lifetime,
    paidLifetime,
    compedLifetime,
    entries,
    entriesToday,
    shareCards,
    shareCardsThisMonth,
    challengesStarted,
    challengesCompleted,
    recipesCreated,
    openFeedback,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { entitlement: "LIFETIME" } }),
    prisma.user.count({ where: { entitlement: "LIFETIME", entitlementSource: "PAID" } }),
    prisma.user.count({
      where: { entitlement: "LIFETIME", entitlementSource: "COMPLIMENTARY" },
    }),
    prisma.cayenneEntry.count(),
    prisma.cayenneEntry.count({ where: { takenOn: { gte: startOfToday } } }),
    prisma.shareCard.count(),
    prisma.shareCard.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.userChallenge.count(),
    prisma.userChallenge.count({ where: { status: "COMPLETED" } }),
    prisma.recipe.count({ where: { isSystem: false } }),
    prisma.feedback.count({ where: { status: { in: ["NEW", "REVIEWING"] } } }),
  ]);

  return {
    users,
    newToday,
    newThisWeek,
    newThisMonth,
    active7,
    active30,
    lifetime,
    paidLifetime,
    compedLifetime,
    free: users - lifetime,
    // Comped accounts never bought anything, so counting them as conversions
    // would flatter the number into meaninglessness.
    conversionPct: users ? round1((paidLifetime / users) * 100) : 0,
    entries,
    entriesToday,
    shareCards,
    shareCardsThisMonth,
    challengesStarted,
    challengesCompleted,
    recipesCreated,
    openFeedback,
  };
}

export type Trends = { from: DayKey; to: DayKey; rows: DailyRow[] };

/** The charted series for a range, rolling up any days not yet stored. */
export async function trends(range: RangeId): Promise<Trends> {
  await backfillDailyStats();

  const to = todayKey();
  let from = addDays(to, -29);

  if (range === "7d") from = addDays(to, -6);
  if (range === "90d") from = addDays(to, -89);
  if (range === "all") from = (await firstActivityDay()) ?? from;

  // A brand-new app has one day of history; a chart of one point is not a
  // chart, so "all time" still shows at least a week of context.
  const floor = addDays(to, -6);
  if (from > floor) from = floor;

  return { from, to, rows: await dailySeries(from, to) };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
