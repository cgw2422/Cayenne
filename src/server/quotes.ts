import "server-only";

import type { QuoteCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { dateColumnFromDayKey, type DayKey } from "@/lib/date";

/**
 * Picks one quote per user per day and remembers it, so refreshing the dashboard
 * doesn't reshuffle the copy. Selection avoids anything the user has been shown
 * in the last 45 days before falling back to the full pool.
 */
export async function quoteOfTheDay(
  userId: string,
  today: DayKey,
  categories: QuoteCategory[],
) {
  const shownOn = dateColumnFromDayKey(today);

  const existing = await prisma.quoteImpression.findUnique({
    where: { userId_shownOn: { userId, shownOn } },
    include: { quote: true },
  });
  if (existing) return existing.quote;

  const recent = await prisma.quoteImpression.findMany({
    where: { userId },
    orderBy: { shownOn: "desc" },
    take: 45,
    select: { quoteId: true },
  });
  const recentIds = recent.map((r) => r.quoteId);

  // Retired quotes keep their impression history but are never picked again.
  const pool = await prisma.quote.findMany({
    where: { isActive: true, category: { in: categories }, id: { notIn: recentIds } },
    select: { id: true },
  });

  const fallback = pool.length
    ? pool
    : await prisma.quote.findMany({
        where: { isActive: true, category: { in: categories } },
        select: { id: true },
      });

  if (!fallback.length) return null;

  const picked = fallback[Math.floor(Math.random() * fallback.length)];

  // Two tabs opening at once must not blow up; the unique key settles the race.
  try {
    const impression = await prisma.quoteImpression.create({
      data: { userId, quoteId: picked.id, shownOn },
      include: { quote: true },
    });
    return impression.quote;
  } catch {
    const settled = await prisma.quoteImpression.findUnique({
      where: { userId_shownOn: { userId, shownOn } },
      include: { quote: true },
    });
    return settled?.quote ?? null;
  }
}

/** Which categories suit the user's current state. */
export function categoriesForState(streak: number, brokeStreak: boolean): QuoteCategory[] {
  if (brokeStreak) return ["COMEBACK", "ENCOURAGEMENT"];
  if (streak === 0) return ["DAILY", "ENCOURAGEMENT", "FUNNY"];
  if (streak >= 30) return ["MILESTONE", "STREAK", "DAILY", "FUNNY"];
  if (streak >= 7) return ["STREAK", "DAILY", "ENCOURAGEMENT", "FUNNY"];
  return ["DAILY", "ENCOURAGEMENT", "STREAK", "FUNNY"];
}

export async function randomQuote(categories: QuoteCategory[]) {
  const pool = await prisma.quote.findMany({
    where: { isActive: true, category: { in: categories } },
    select: { id: true, text: true },
  });
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
