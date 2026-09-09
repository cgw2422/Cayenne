import { addDays, diffDays, type DayKey } from "@/lib/date";

export const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

export type Milestone = (typeof MILESTONES)[number];

export const MILESTONE_TITLES: Record<Milestone, string> = {
  3: "Warming Up",
  7: "Getting Spicy",
  14: "Feel the Heat",
  30: "Red Hot",
  60: "Seriously Spicy",
  90: "Pepper Pro",
  180: "On Fire",
  365: "Cayenne Legend",
};

export type StreakSummary = {
  current: number;
  longest: number;
  totalDays: number;
  thisMonth: number;
  loggedToday: boolean;
  lastLoggedOn: DayKey | null;
  /** 0–100, share of days logged since the user started. */
  consistency: number;
  nextMilestone: Milestone | null;
  daysToNextMilestone: number | null;
};

/**
 * Computes every streak figure from the distinct set of logged days.
 *
 * A streak stays alive while today is unlogged — you have until the end of the
 * day to keep it. It only breaks once a full day has passed with no entry.
 */
export function summarise(
  loggedDays: DayKey[],
  today: DayKey,
  startedOn: DayKey,
): StreakSummary {
  const unique = Array.from(new Set(loggedDays)).sort();
  const set = new Set(unique);
  const totalDays = unique.length;

  let current = 0;
  if (totalDays > 0) {
    // Anchor on today if logged, otherwise yesterday (grace period).
    const anchor = set.has(today) ? today : addDays(today, -1);
    if (set.has(anchor)) {
      let cursor = anchor;
      while (set.has(cursor)) {
        current += 1;
        cursor = addDays(cursor, -1);
      }
    }
  }

  let longest = 0;
  let run = 0;
  let previous: DayKey | null = null;
  for (const day of unique) {
    run = previous !== null && diffDays(previous, day) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = day;
  }

  const month = today.slice(0, 7);
  const thisMonth = unique.filter((d) => d.startsWith(month)).length;

  const elapsed = Math.max(1, diffDays(startedOn, today) + 1);
  const consistency = Math.min(100, Math.round((totalDays / elapsed) * 100));

  const nextMilestone = MILESTONES.find((m) => m > current) ?? null;

  return {
    current,
    longest: Math.max(longest, current),
    totalDays,
    thisMonth,
    loggedToday: set.has(today),
    lastLoggedOn: unique.length ? unique[unique.length - 1] : null,
    consistency,
    nextMilestone,
    daysToNextMilestone: nextMilestone ? nextMilestone - current : null,
  };
}

export function milestoneReached(streak: number): Milestone | null {
  return (MILESTONES as readonly number[]).includes(streak)
    ? (streak as Milestone)
    : null;
}

/** Fraction of the way to the next milestone, for the dashboard ring. */
export function ringProgress(streak: number): number {
  const next = MILESTONES.find((m) => m > streak);
  if (!next) return 1;
  const previous = [...MILESTONES].reverse().find((m) => m <= streak) ?? 0;
  return (streak - previous) / (next - previous);
}
