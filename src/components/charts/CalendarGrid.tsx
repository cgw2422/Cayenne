import { cx } from "@/components/ui/primitives";
import { daysInMonth, type DayKey } from "@/lib/date";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Month grid with every logged day marked. Read-only and cheap to render. */
export function CalendarGrid({
  year,
  monthIndex,
  loggedDays,
  today,
}: {
  year: number;
  monthIndex: number;
  loggedDays: Set<DayKey>;
  today: DayKey;
}) {
  const total = daysInMonth(year, monthIndex);
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));

  const cells: (DayKey | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: total },
      (_, i) =>
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` as DayKey,
    ),
  ];

  return (
    <div>
      <p className="mb-3 text-center text-sm font-extrabold text-charcoal-900">
        {monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={monthLabel}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="pb-1 text-center text-[10px] font-extrabold uppercase text-charcoal-500"
            aria-hidden="true"
          >
            {d}
          </div>
        ))}
        {cells.map((key, i) => {
          if (!key) return <div key={`pad-${i}`} aria-hidden="true" />;
          const logged = loggedDays.has(key);
          const isToday = key === today;
          const day = Number(key.slice(8));
          return (
            <div
              key={key}
              role="gridcell"
              aria-label={`${key}${logged ? ", logged" : ""}`}
              className={cx(
                "grid aspect-square place-items-center rounded-xl text-xs font-extrabold transition-colors",
                logged
                  ? "fire-gradient text-white shadow-soft"
                  : "bg-cream-100 text-charcoal-500",
                isToday && !logged && "ring-2 ring-inset ring-cayenne-600",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
