"use client";

import { Toggle } from "@/components/Onboarding";
import { cx } from "@/components/ui/primitives";
import { formatReminderTime, minutesToTimeInput, timeInputToMinutes } from "@/lib/date";
import { MAX_DOSES, hasDuplicateTimes, resizeSchedule, type Dose } from "@/lib/doses";

/**
 * Picks how many times a day the user takes cayenne and when to nudge them for
 * each one. Shared by onboarding and settings so the two can't drift apart.
 */
export function DoseScheduler({
  doses,
  onChange,
  remindersOn,
  onRemindersChange,
  compact,
}: {
  doses: Dose[];
  onChange: (doses: Dose[]) => void;
  remindersOn: boolean;
  onRemindersChange: (on: boolean) => void;
  compact?: boolean;
}) {
  const count = doses.length;
  const duplicates = hasDuplicateTimes(doses);

  function setTime(index: number, value: string) {
    const next = doses.map((dose, i) =>
      i === index ? { ...dose, minute: timeInputToMinutes(value) } : dose,
    );
    onChange(next);
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="mb-2.5 text-sm font-extrabold text-charcoal-700">
          How many times a day do you take cayenne?
        </p>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: MAX_DOSES }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              aria-label={`${n} ${n === 1 ? "time" : "times"} a day`}
              onClick={() => onChange(resizeSchedule(doses, n))}
              className={cx(
                "tap rounded-2xl border-2 py-2.5 text-base font-extrabold transition-all active:scale-[0.97]",
                count === n
                  ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                  : "border-cream-300 bg-white text-charcoal-700",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-charcoal-500">
          You can log more or fewer on any given day — this just sets your target
          and how many reminders you get.
        </p>
      </div>

      <div className={cx(compact ? "" : "border-t border-cream-200 pt-5")}>
        <label className="flex items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block font-extrabold text-charcoal-900">
              {count === 1 ? "Daily reminder" : `Remind me ${count}× a day`}
            </span>
            <span className="block text-xs text-charcoal-500">
              We won&apos;t nag. Turn this off any time.
            </span>
          </span>
          <Toggle on={remindersOn} onChange={onRemindersChange} label="Reminders" />
        </label>
      </div>

      {remindersOn ? (
        <ul className="grid gap-2.5">
          {doses.map((dose, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white px-3.5 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full fire-gradient text-xs font-extrabold text-white">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`dose-${i}`}
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-charcoal-500"
                >
                  {count === 1 ? "Reminder" : `Dose ${i + 1}`}
                </label>
                <input
                  id={`dose-${i}`}
                  type="time"
                  value={minutesToTimeInput(dose.minute)}
                  onChange={(e) => setTime(i, e.target.value)}
                  className="w-full bg-transparent text-lg font-extrabold text-charcoal-900 outline-none"
                />
              </div>

              <Toggle
                on={dose.enabled}
                onChange={(on) =>
                  onChange(doses.map((d, j) => (j === i ? { ...d, enabled: on } : d)))
                }
                label={`Reminder ${i + 1} at ${formatReminderTime(dose.minute)}`}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {duplicates ? (
        <p role="alert" className="text-sm font-bold text-cayenne-700">
          Two reminders are set to the same time. Nudge one of them.
        </p>
      ) : null}

    </div>
  );
}
