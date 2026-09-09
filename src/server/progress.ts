import "server-only";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  dateColumnFromDayKey,
  dayKeyFromDateColumn,
  formatDayShort,
  type DayKey,
} from "@/lib/date";
import { FREE_HISTORY_DAYS } from "@/lib/entitlements";
import type { Entitlement } from "@prisma/client";

export const RANGES = {
  "7": { days: 7, label: "7 days" },
  "30": { days: 30, label: "30 days" },
  "90": { days: 90, label: "90 days" },
  "365": { days: 365, label: "1 year" },
  all: { days: null, label: "All time" },
} as const;

export type RangeKey = keyof typeof RANGES;

export function resolveRange(
  key: string | undefined,
  entitlement: Entitlement,
): { key: RangeKey; days: number | null; capped: boolean } {
  const requested = (key && key in RANGES ? key : "30") as RangeKey;
  const days = RANGES[requested].days;

  if (entitlement === "LIFETIME") return { key: requested, days, capped: false };

  const capped = days === null || days > FREE_HISTORY_DAYS;
  return {
    key: requested,
    days: capped ? FREE_HISTORY_DAYS : days,
    capped,
  };
}

export type TrendSeries = {
  amount: { x: DayKey; y: number | null; label: string }[];
  mood: { x: DayKey; y: number | null; label: string }[];
  consistency: { x: DayKey; y: number | null; label: string }[];
};

/**
 * Builds every trend series in one pass over the range so the Progress page
 * makes a single database round-trip for its charts.
 */
export async function trends(
  userId: string,
  today: DayKey,
  days: number,
): Promise<TrendSeries> {
  const start = addDays(today, -(days - 1));

  const entries = await prisma.cayenneEntry.findMany({
    where: { userId, takenOn: { gte: dateColumnFromDayKey(start) } },
    select: { takenOn: true, amount: true, unit: true, mood: true },
    orderBy: { takenOn: "asc" },
  });

  const byDay = new Map<DayKey, { amount: number; moods: number[] }>();
  for (const entry of entries) {
    const key = dayKeyFromDateColumn(entry.takenOn);
    const bucket = byDay.get(key) ?? { amount: 0, moods: [] };
    // Only teaspoon entries roll up into the amount trend; mixing mg would lie.
    if (entry.unit === "TSP") bucket.amount += Number(entry.amount);
    if (entry.mood !== null) bucket.moods.push(entry.mood);
    byDay.set(key, bucket);
  }

  const amount: TrendSeries["amount"] = [];
  const mood: TrendSeries["mood"] = [];
  const consistency: TrendSeries["consistency"] = [];

  // 7-day rolling consistency, so the line reads as a trend not a sawtooth.
  const window: number[] = [];

  for (let i = 0; i < days; i += 1) {
    const key = addDays(start, i);
    const bucket = byDay.get(key);
    const label = formatDayShort(key);

    amount.push({ x: key, y: bucket && bucket.amount > 0 ? bucket.amount : null, label });
    mood.push({
      x: key,
      y: bucket?.moods.length
        ? bucket.moods.reduce((a, b) => a + b, 0) / bucket.moods.length
        : null,
      label,
    });

    window.push(bucket ? 1 : 0);
    if (window.length > 7) window.shift();
    consistency.push({
      x: key,
      y: Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 100),
      label,
    });
  }

  return { amount, mood, consistency };
}

export async function loggedDaySet(
  userId: string,
  from: DayKey,
  to: DayKey,
): Promise<Set<DayKey>> {
  const rows = await prisma.cayenneEntry.findMany({
    where: {
      userId,
      takenOn: { gte: dateColumnFromDayKey(from), lte: dateColumnFromDayKey(to) },
    },
    distinct: ["takenOn"],
    select: { takenOn: true },
  });
  return new Set(rows.map((r) => dayKeyFromDateColumn(r.takenOn)));
}

export async function methodBreakdown(userId: string, from: DayKey) {
  const rows = await prisma.cayenneEntry.groupBy({
    by: ["method"],
    where: { userId, takenOn: { gte: dateColumnFromDayKey(from) } },
    _count: { method: true },
  });
  return rows
    .map((r) => ({ method: r.method, count: r._count.method }))
    .sort((a, b) => b.count - a.count);
}
