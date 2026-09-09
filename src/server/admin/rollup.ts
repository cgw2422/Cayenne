import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Daily rollups for admin analytics.
 *
 * The naive version of this page scans CayenneEntry, ShareCard and User across
 * a date range on every load, and gets slower every week the app is alive. It
 * doesn't here: a finished day cannot change, so each one is computed exactly
 * once and stored in `DailyStat`. A dashboard load reads at most 90 tiny rows
 * by primary key, plus one live pass over today.
 *
 * Backfilling is lazy — it happens on the first admin load that needs a day
 * that isn't there yet — so no scheduler is required. Each metric is one
 * grouped query over the whole missing window rather than one query per day,
 * so filling a year costs the same handful of round trips as filling a week.
 *
 * Everything here is bucketed by UTC day. The consumer app is timezone-aware
 * per user; admin reporting is not, because "signups on the 3rd" has to mean
 * one thing to be comparable across rows.
 */

/** A day, as the `YYYY-MM-DD` key used everywhere in this module. */
export type DayKey = string;

export type DailyRow = {
  day: DayKey;
  signups: number;
  activeUsers: number;
  entries: number;
  shareCards: number;
  shareImagesSaved: number;
  purchases: number;
  challengesStarted: number;
  challengesDone: number;
  recipesCreated: number;
};

/** Never fill more than this in one request, so a cold start stays responsive. */
const MAX_BACKFILL_DAYS = 400;

export function dayKey(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function utcMidnight(key: DayKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function todayKey(): DayKey {
  return dayKey(new Date());
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = utcMidnight(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dayKey(date);
}

/** Every day from `from` to `to`, inclusive. */
export function daysBetween(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) out.push(key);
  return out;
}

/**
 * Rolls up every finished day that hasn't been rolled up yet.
 *
 * Idempotent and safe to call concurrently: rows are written with
 * `skipDuplicates`, so two admins loading the dashboard at once cannot collide.
 */
export async function backfillDailyStats(): Promise<{ filled: number }> {
  const yesterday = addDays(todayKey(), -1);

  const [latest, earliest] = await Promise.all([
    prisma.dailyStat.findFirst({ orderBy: { day: "desc" }, select: { day: true } }),
    prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);

  // Nothing has ever happened, so there is nothing to roll up.
  if (!earliest) return { filled: 0 };

  const start = latest ? addDays(dayKey(latest.day), 1) : dayKey(earliest.createdAt);
  if (start > yesterday) return { filled: 0 };

  const from = start < addDays(yesterday, -MAX_BACKFILL_DAYS) ? addDays(yesterday, -MAX_BACKFILL_DAYS) : start;
  const rows = await computeRange(from, yesterday);

  await prisma.dailyStat.createMany({
    data: rows.map((row) => ({
      day: utcMidnight(row.day),
      signups: row.signups,
      activeUsers: row.activeUsers,
      entries: row.entries,
      shareCards: row.shareCards,
      shareImagesSaved: row.shareImagesSaved,
      purchases: row.purchases,
      challengesStarted: row.challengesStarted,
      challengesDone: row.challengesDone,
      recipesCreated: row.recipesCreated,
    })),
    skipDuplicates: true,
  });

  return { filled: rows.length };
}

/**
 * The series for a range, stored days plus today computed live.
 *
 * `from`/`to` are inclusive day keys. Days with no activity come back as zeroes
 * rather than gaps, so a chart never has to guess.
 */
export async function dailySeries(from: DayKey, to: DayKey): Promise<DailyRow[]> {
  const today = todayKey();
  const storedTo = to < today ? to : addDays(today, -1);

  const stored =
    from <= storedTo
      ? await prisma.dailyStat.findMany({
          where: { day: { gte: utcMidnight(from), lte: utcMidnight(storedTo) } },
          orderBy: { day: "asc" },
        })
      : [];

  const byDay = new Map<DayKey, DailyRow>();
  for (const row of stored) {
    byDay.set(dayKey(row.day), {
      day: dayKey(row.day),
      signups: row.signups,
      activeUsers: row.activeUsers,
      entries: row.entries,
      shareCards: row.shareCards,
      shareImagesSaved: row.shareImagesSaved,
      purchases: row.purchases,
      challengesStarted: row.challengesStarted,
      challengesDone: row.challengesDone,
      recipesCreated: row.recipesCreated,
    });
  }

  if (to >= today && from <= today) {
    const [live] = await computeRange(today, today);
    if (live) byDay.set(today, live);
  }

  return daysBetween(from, to).map((day) => byDay.get(day) ?? empty(day));
}

/** The earliest day worth charting: the day the first account was created. */
export async function firstActivityDay(): Promise<DayKey | null> {
  const first = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  return first ? dayKey(first.createdAt) : null;
}

function empty(day: DayKey): DailyRow {
  return {
    day,
    signups: 0,
    activeUsers: 0,
    entries: 0,
    shareCards: 0,
    shareImagesSaved: 0,
    purchases: 0,
    challengesStarted: 0,
    challengesDone: 0,
    recipesCreated: 0,
  };
}

type Bucket = { day: Date; count: bigint };

/**
 * One grouped pass per metric over the whole window.
 *
 * Raw SQL because the bucketing is `date_trunc`, which Prisma's `groupBy`
 * cannot express, and because `COUNT(DISTINCT "userId")` is the honest
 * definition of an active day and has no ORM equivalent either.
 */
async function computeRange(from: DayKey, to: DayKey): Promise<DailyRow[]> {
  const start = utcMidnight(from);
  const endExclusive = utcMidnight(addDays(to, 1));

  const [
    signups,
    activeUsers,
    entries,
    shareCards,
    shareImagesSaved,
    purchases,
    challengesStarted,
    challengesDone,
    recipesCreated,
  ] = await Promise.all([
    byTimestamp("User", "createdAt", start, endExclusive),
    prisma.$queryRaw<Bucket[]>`
      SELECT "takenOn" AS day, COUNT(DISTINCT "userId") AS count
      FROM "CayenneEntry"
      WHERE "takenOn" >= ${start} AND "takenOn" < ${endExclusive}
      GROUP BY 1`,
    prisma.$queryRaw<Bucket[]>`
      SELECT "takenOn" AS day, COUNT(*) AS count
      FROM "CayenneEntry"
      WHERE "takenOn" >= ${start} AND "takenOn" < ${endExclusive}
      GROUP BY 1`,
    byTimestamp("ShareCard", "createdAt", start, endExclusive),
    prisma.$queryRaw<Bucket[]>`
      SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*) AS count
      FROM "ShareEvent"
      WHERE "event" = 'IMAGE_SAVED'
        AND "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY 1`,
    byTimestamp("User", "entitledAt", start, endExclusive),
    byTimestamp("UserChallenge", "createdAt", start, endExclusive),
    byTimestamp("UserChallenge", "completedAt", start, endExclusive),
    prisma.$queryRaw<Bucket[]>`
      SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*) AS count
      FROM "Recipe"
      WHERE "isSystem" = false
        AND "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY 1`,
  ]);

  const index = (buckets: Bucket[]) =>
    new Map(buckets.map((b) => [dayKey(b.day), Number(b.count)]));

  const maps = {
    signups: index(signups),
    activeUsers: index(activeUsers),
    entries: index(entries),
    shareCards: index(shareCards),
    shareImagesSaved: index(shareImagesSaved),
    purchases: index(purchases),
    challengesStarted: index(challengesStarted),
    challengesDone: index(challengesDone),
    recipesCreated: index(recipesCreated),
  };

  return daysBetween(from, to).map((day) => ({
    day,
    signups: maps.signups.get(day) ?? 0,
    activeUsers: maps.activeUsers.get(day) ?? 0,
    entries: maps.entries.get(day) ?? 0,
    shareCards: maps.shareCards.get(day) ?? 0,
    shareImagesSaved: maps.shareImagesSaved.get(day) ?? 0,
    purchases: maps.purchases.get(day) ?? 0,
    challengesStarted: maps.challengesStarted.get(day) ?? 0,
    challengesDone: maps.challengesDone.get(day) ?? 0,
    recipesCreated: maps.recipesCreated.get(day) ?? 0,
  }));
}

/**
 * Counts rows per day by one timestamp column.
 *
 * Table and column names come only from the literal call sites above — never
 * from a request — and are validated against an allow-list regardless, because
 * an identifier cannot be parameterised and a helper that interpolates one is
 * exactly the shape SQL injection likes.
 */
const TABLES = new Set(["User", "ShareCard", "UserChallenge"]);
const COLUMNS = new Set(["createdAt", "entitledAt", "completedAt"]);

function byTimestamp(table: string, column: string, start: Date, endExclusive: Date) {
  if (!TABLES.has(table) || !COLUMNS.has(column)) {
    throw new Error(`Refusing to roll up unknown ${table}.${column}`);
  }
  return prisma.$queryRawUnsafe<Bucket[]>(
    `SELECT date_trunc('day', "${column}")::date AS day, COUNT(*) AS count
     FROM "${table}"
     WHERE "${column}" >= $1 AND "${column}" < $2
     GROUP BY 1`,
    start,
    endExclusive,
  );
}
