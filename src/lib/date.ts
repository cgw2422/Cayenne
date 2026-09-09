/**
 * All streak/calendar logic works on *local calendar days*, stored as UTC-midnight
 * `Date` values (Prisma `@db.Date`). Keeping one helper file means the app never
 * accidentally mixes an instant with a day.
 */

export type DayKey = string; // "YYYY-MM-DD"

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A `@db.Date` column round-trips as UTC midnight; read it back without shifting. */
export function dayKeyFromDateColumn(value: Date): DayKey {
  return value.toISOString().slice(0, 10);
}

export function dateColumnFromDayKey(key: DayKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(key: DayKey, delta: number): DayKey {
  const d = dateColumnFromDayKey(key);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function diffDays(from: DayKey, to: DayKey): number {
  const a = dateColumnFromDayKey(from).getTime();
  const b = dateColumnFromDayKey(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Today in the user's timezone, as a day key. Falls back to UTC on bad input. */
export function todayInZone(timezone: string): DayKey {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function monthKey(key: DayKey): string {
  return key.slice(0, 7);
}

export function startOfMonth(key: DayKey): DayKey {
  return `${key.slice(0, 7)}-01`;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDayLong(key: DayKey): string {
  return LONG_DATE.format(dateColumnFromDayKey(key));
}

export function formatDayShort(key: DayKey): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateColumnFromDayKey(key));
}

export function relativeDay(key: DayKey, today: DayKey): string {
  const delta = diffDays(key, today);
  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";
  if (delta < 7) return `${delta} days ago`;
  return formatDayShort(key);
}

export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 480;
  return Math.min(24 * 60 - 1, Math.max(0, h * 60 + m));
}

export function formatReminderTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
