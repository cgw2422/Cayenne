import { formatReminderTime } from "@/lib/date";

export const MAX_DOSES = 6;

export type Dose = { minute: number; enabled: boolean };

/**
 * Sensible default times for a given number of doses a day — spread across
 * waking hours rather than bunched together, so the suggestion is usable as-is.
 */
const DEFAULT_SCHEDULES: Record<number, number[]> = {
  1: [8 * 60],
  2: [8 * 60, 18 * 60],
  3: [8 * 60, 13 * 60, 18 * 60],
  4: [8 * 60, 12 * 60, 16 * 60, 20 * 60],
  5: [7 * 60, 10 * 60, 13 * 60, 16 * 60, 20 * 60],
  6: [7 * 60, 10 * 60, 12 * 60, 14 * 60, 17 * 60, 20 * 60],
};

export function defaultSchedule(count: number): number[] {
  const clamped = Math.min(MAX_DOSES, Math.max(1, count));
  return DEFAULT_SCHEDULES[clamped] ?? DEFAULT_SCHEDULES[1];
}

/**
 * Resizes a schedule to `count` doses, keeping the times the user already
 * chose and only inventing the new ones.
 */
export function resizeSchedule(current: Dose[], count: number): Dose[] {
  const target = Math.min(MAX_DOSES, Math.max(1, count));
  if (current.length === target) return current;
  if (current.length > target) return current.slice(0, target);

  const suggested = defaultSchedule(target);
  const next = [...current];
  for (const minute of suggested) {
    if (next.length >= target) break;
    if (next.some((d) => d.minute === minute)) continue;
    next.push({ minute, enabled: true });
  }
  // Fall back to hourly gaps if the defaults collided with existing picks.
  let candidate = (next[next.length - 1]?.minute ?? 480) + 60;
  while (next.length < target) {
    const minute = candidate % (24 * 60);
    if (!next.some((d) => d.minute === minute)) next.push({ minute, enabled: true });
    candidate += 60;
  }
  return sortSchedule(next);
}

export function sortSchedule(doses: Dose[]): Dose[] {
  return [...doses].sort((a, b) => a.minute - b.minute);
}

/** Times must be distinct — the database enforces it, so the UI should too. */
export function hasDuplicateTimes(doses: Dose[]): boolean {
  return new Set(doses.map((d) => d.minute)).size !== doses.length;
}

export function describeSchedule(doses: Dose[]): string {
  const active = sortSchedule(doses.filter((d) => d.enabled));
  if (!active.length) return "No reminders set";
  return active.map((d) => formatReminderTime(d.minute)).join(" · ");
}

export function doseLabel(index: number, total: number): string {
  if (total === 1) return "Daily reminder";
  return `Dose ${index + 1} of ${total}`;
}
