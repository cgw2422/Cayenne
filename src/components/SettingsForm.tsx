"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, FieldError, SectionTitle, cx } from "@/components/ui/primitives";
import { Toggle } from "@/components/Onboarding";
import { NotificationSetup } from "@/components/NotificationSetup";
import { METHOD_META } from "@/lib/brand";
import { formatReminderTime, minutesToTimeInput, timeInputToMinutes } from "@/lib/date";
import type { ActionState } from "@/lib/validation";

type Initial = {
  displayName: string;
  email: string;
  defaultMethod: string | null;
  defaultAmount: number | null;
  defaultUnit: string;
  unitSystem: string;
  timezone: string;
  dailyReminder: boolean;
  reminderMinute: number;
  streakWarning: boolean;
  milestoneAlert: boolean;
};

const METHODS = (Object.keys(METHOD_META) as Array<keyof typeof METHOD_META>).map(
  (key) => ({ key, ...METHOD_META[key] }),
);

export function SettingsForm({
  initial,
  onSave,
}: {
  initial: Initial;
  onSave: (input: Omit<Initial, "email">) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setMessage(null);
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-8">
      <section>
        <SectionTitle>Profile</SectionTitle>
        <Card className="grid gap-3.5">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-extrabold text-charcoal-700"
            >
              Name
            </label>
            <input
              id="displayName"
              value={state.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              className="h-12 w-full rounded-2xl border border-cream-300 px-4 text-base outline-none focus:border-ember-400"
            />
            <FieldError message={errors.displayName} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-extrabold text-charcoal-700">Email</p>
            <p className="rounded-2xl bg-cream-100 px-4 py-3 text-[15px] text-charcoal-500">
              {initial.email}
            </p>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Your usual</SectionTitle>
        <Card className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-extrabold text-charcoal-700">
              Preferred method
            </p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={state.defaultMethod === m.key}
                  onClick={() =>
                    set("defaultMethod", state.defaultMethod === m.key ? null : m.key)
                  }
                  className={cx(
                    "tap flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-[11px] font-extrabold transition-all",
                    state.defaultMethod === m.key
                      ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                      : "border-cream-300 bg-white text-charcoal-700",
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-extrabold text-charcoal-700">
              Default amount
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={state.defaultAmount ?? ""}
                aria-label="Default amount"
                onChange={(e) =>
                  set(
                    "defaultAmount",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="h-12 flex-1 rounded-2xl border border-cream-300 px-4 text-base outline-none focus:border-ember-400"
              />
              <select
                value={state.defaultUnit}
                aria-label="Default unit"
                onChange={(e) => set("defaultUnit", e.target.value)}
                className="h-12 rounded-2xl border border-cream-300 bg-white px-3 font-bold outline-none focus:border-ember-400"
              >
                <option value="TSP">tsp</option>
                <option value="MG">mg</option>
                <option value="G">g</option>
                <option value="CAPSULE">capsules</option>
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-extrabold text-charcoal-700">Units</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "IMPERIAL", label: "lb / in" },
                { key: "METRIC", label: "kg / cm" },
              ].map((u) => (
                <button
                  key={u.key}
                  type="button"
                  aria-pressed={state.unitSystem === u.key}
                  onClick={() => set("unitSystem", u.key)}
                  className={cx(
                    "tap rounded-2xl border-2 py-3 text-sm font-extrabold transition-all",
                    state.unitSystem === u.key
                      ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                      : "border-cream-300 bg-white text-charcoal-700",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="mb-1.5 block text-sm font-extrabold text-charcoal-700"
            >
              Time zone
            </label>
            <div className="flex gap-2">
              <input
                id="timezone"
                value={state.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                className="h-12 flex-1 rounded-2xl border border-cream-300 px-4 text-[15px] outline-none focus:border-ember-400"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  set(
                    "timezone",
                    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                  )
                }
              >
                Detect
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-charcoal-500">
              Your streak rolls over at midnight here.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Reminders</SectionTitle>
        <Card className="grid gap-4">
          <Row
            label="Daily reminder"
            hint="One nudge a day, at the time you pick."
            on={state.dailyReminder}
            onChange={(v) => set("dailyReminder", v)}
          />
          {state.dailyReminder ? (
            <div>
              <label
                htmlFor="reminder"
                className="mb-1.5 block text-sm font-extrabold text-charcoal-700"
              >
                Remind me at
              </label>
              <input
                id="reminder"
                type="time"
                value={minutesToTimeInput(state.reminderMinute)}
                onChange={(e) => set("reminderMinute", timeInputToMinutes(e.target.value))}
                className="h-12 w-full rounded-2xl border border-cream-300 px-4 text-lg font-bold outline-none focus:border-ember-400"
              />
              <p className="mt-1.5 text-xs text-charcoal-500">
                Around {formatReminderTime(state.reminderMinute)}.
              </p>
            </div>
          ) : null}
          <Row
            label="Streak warning"
            hint="A heads-up if the day's nearly over."
            on={state.streakWarning}
            onChange={(v) => set("streakWarning", v)}
          />
          <Row
            label="Milestone alerts"
            hint="When you hit 7, 30, 90 days and beyond."
            on={state.milestoneAlert}
            onChange={(v) => set("milestoneAlert", v)}
          />
          <div className="border-t border-cream-200 pt-4">
            <NotificationSetup enabled={state.dailyReminder} />
          </div>
        </Card>
      </section>

      {message ? (
        <p role="status" className="text-center text-sm font-extrabold text-pepper-600">
          {message}
        </p>
      ) : null}

      <Button
        size="lg"
        full
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErrors({});
            const { email: _email, ...payload } = { ...state };
            void _email;
            const result = await onSave(payload);
            if (!result.ok) {
              setErrors(result.errors ?? {});
              setMessage(result.message ?? null);
              return;
            }
            setMessage(result.message ?? "Saved.");
            router.refresh();
          })
        }
      >
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

function Row({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-extrabold text-charcoal-900">{label}</p>
        <p className="text-xs text-charcoal-500">{hint}</p>
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}
