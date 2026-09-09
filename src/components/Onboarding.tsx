"use client";

import { useMemo, useState, useTransition } from "react";

import { Button, cx } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { Flame } from "@/components/ui/Flame";
import { AMOUNT_PRESETS, BRAND, METHOD_META } from "@/lib/brand";
import { formatReminderTime, minutesToTimeInput, timeInputToMinutes } from "@/lib/date";
import type { ActionState } from "@/lib/validation";

type Goal = { id: string; slug: string; label: string; icon: string };

const METHOD_OPTIONS = [
  ...(Object.keys(METHOD_META) as Array<keyof typeof METHOD_META>).map((key) => ({
    key,
    ...METHOD_META[key],
  })),
];

const TOTAL_STEPS = 6;

export function Onboarding({
  goals,
  displayName,
  onComplete,
}: {
  goals: Goal[];
  displayName: string;
  onComplete: (payload: {
    goalSlugs: string[];
    method: string | null;
    amount: number | null;
    unit: string;
    reminderEnabled: boolean;
    reminderMinute: number;
    timezone: string;
  }) => Promise<ActionState>;
}) {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [method, setMethod] = useState<string | null>(null);
  const [justStarting, setJustStarting] = useState(false);
  const [amount, setAmount] = useState<number | null>(0.25);
  const [unit, setUnit] = useState("TSP");
  const [customAmount, setCustomAmount] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinute, setReminderMinute] = useState(480);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const canAdvance = step !== 1 || selectedGoals.length > 0;

  function next() {
    setError(null);
    if (step === 1 && selectedGoals.length === 0) {
      setError("Pick at least one, or choose Other.");
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }

  function finish() {
    startTransition(async () => {
      const result = await onComplete({
        goalSlugs: selectedGoals,
        method: justStarting ? null : method,
        amount,
        unit,
        reminderEnabled,
        reminderMinute,
        timezone,
      });
      if (result && !result.ok) setError(result.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-10 pt-8">
      <Progress step={step} />

      <div key={step} className="flex flex-1 animate-rise flex-col pt-8">
        {step === 0 && (
          <Centered>
            <Mascot size={140} className="animate-pop" />
            <h1 className="mt-5 text-[34px] font-extrabold leading-tight tracking-tight text-charcoal-900">
              Welcome to
              <span className="block text-fire-gradient">Cayenne Do It</span>
            </h1>
            <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.2em] text-charcoal-500">
              {BRAND.tagline}
            </p>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-charcoal-700">
              {BRAND.description}
            </p>
          </Centered>
        )}

        {step === 1 && (
          <>
            <StepHeading
              title="What brings you here?"
              body="Pick everything that fits. These are your goals — we'll just help you keep track of them."
            />
            <div className="grid gap-2.5">
              {goals.map((goal) => {
                const on = selectedGoals.includes(goal.slug);
                return (
                  <button
                    key={goal.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setSelectedGoals((prev) =>
                        prev.includes(goal.slug)
                          ? prev.filter((s) => s !== goal.slug)
                          : [...prev, goal.slug],
                      )
                    }
                    className={cx(
                      "tap flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                      on
                        ? "border-cayenne-600 bg-cayenne-50 shadow-soft"
                        : "border-cream-300 bg-white",
                    )}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <span className="flex-1 font-bold text-charcoal-900">
                      {goal.label}
                    </span>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading
              title="How do you usually take your cayenne?"
              body="You can change this any time, and log it differently on any given day."
            />
            <div className="grid grid-cols-3 gap-2.5">
              {METHOD_OPTIONS.map((option) => {
                const on = !justStarting && method === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setJustStarting(false);
                      setMethod(option.key);
                    }}
                    className={cx(
                      "tap flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-4 transition-all active:scale-[0.98]",
                      on
                        ? "border-cayenne-600 bg-cayenne-50 shadow-soft"
                        : "border-cream-300 bg-white",
                    )}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs font-extrabold text-charcoal-700">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={justStarting}
              onClick={() => {
                setJustStarting(true);
                setMethod(null);
              }}
              className={cx(
                "tap mt-3 rounded-2xl border-2 px-4 py-3.5 font-bold transition-all",
                justStarting
                  ? "border-cayenne-600 bg-cayenne-50 text-charcoal-900"
                  : "border-cream-300 bg-white text-charcoal-700",
              )}
            >
              I&apos;m just getting started
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeading
              title="What's your starting amount?"
              body="Start wherever is comfortable. Small and repeatable beats ambitious and abandoned."
            />
            <div className="grid grid-cols-2 gap-2.5">
              {AMOUNT_PRESETS.map((preset) => {
                const on = unit === "TSP" && amount === preset.amount;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setAmount(preset.amount);
                      setUnit("TSP");
                      setCustomAmount("");
                    }}
                    className={cx(
                      "tap rounded-2xl border-2 py-4 text-lg font-extrabold transition-all active:scale-[0.98]",
                      on
                        ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700 shadow-soft"
                        : "border-cream-300 bg-white text-charcoal-700",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="card mt-4 p-4">
              <p className="mb-2.5 text-sm font-extrabold text-charcoal-700">
                Or set your own
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={customAmount}
                  placeholder="Amount"
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    const n = Number.parseFloat(e.target.value);
                    setAmount(Number.isFinite(n) && n > 0 ? n : null);
                  }}
                  aria-label="Custom amount"
                  className="h-12 flex-1 rounded-xl border border-cream-300 px-3 text-base outline-none focus:border-ember-400"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  aria-label="Unit"
                  className="h-12 rounded-xl border border-cream-300 bg-white px-3 font-bold outline-none focus:border-ember-400"
                >
                  <option value="TSP">tsp</option>
                  <option value="MG">mg</option>
                  <option value="G">g</option>
                  <option value="CAPSULE">capsules</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <StepHeading
              title="What time should we give you a little kick?"
              body="One gentle nudge a day. You can turn this off now or later — we won't nag."
            />
            <div className="card p-5">
              <label className="flex items-center justify-between gap-4">
                <span className="font-extrabold text-charcoal-900">Daily reminder</span>
                <Toggle on={reminderEnabled} onChange={setReminderEnabled} label="Daily reminder" />
              </label>

              {reminderEnabled ? (
                <div className="mt-5 border-t border-cream-200 pt-5">
                  <label
                    htmlFor="reminder-time"
                    className="mb-2 block text-sm font-extrabold text-charcoal-700"
                  >
                    Remind me at
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={minutesToTimeInput(reminderMinute)}
                    onChange={(e) => setReminderMinute(timeInputToMinutes(e.target.value))}
                    className="h-13 w-full rounded-xl border border-cream-300 px-4 text-lg font-bold outline-none focus:border-ember-400"
                  />
                  <p className="mt-2 text-sm text-charcoal-500">
                    We&apos;ll check in around {formatReminderTime(reminderMinute)}.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}

        {step === 5 && (
          <Centered>
            <Mascot pose="cheer" size={140} className="animate-pop" />
            <h2 className="mt-5 text-[32px] font-extrabold leading-tight text-charcoal-900">
              Alright, {displayName.split(" ")[0]}.
            </h2>
            <p className="mt-2 text-lg font-bold text-cayenne-600">
              Let&apos;s start the journey.
            </p>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-charcoal-700">
              Day one is the whole game. Log today, and tomorrow you&apos;ll have a
              streak worth protecting.
            </p>
          </Centered>
        )}
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-center text-sm font-bold text-cayenne-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-6">
        {step > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        ) : null}

        {step < TOTAL_STEPS - 1 ? (
          <Button type="button" size="lg" full onClick={next} disabled={!canAdvance}>
            {step === 0 ? "Let's go" : "Continue"}
          </Button>
        ) : (
          <Button type="button" size="lg" full onClick={finish} disabled={pending}>
            {pending ? (
              "Lighting the match…"
            ) : (
              <>
                <Flame size={20} /> I Cayenne Do It
              </>
            )}
          </Button>
        )}
      </div>

      {step === 4 ? (
        <button
          type="button"
          onClick={() => {
            setReminderEnabled(false);
            next();
          }}
          className="mt-3 text-sm font-bold text-charcoal-500 underline underline-offset-2"
        >
          Skip reminders
        </button>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {children}
    </div>
  );
}

function StepHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-charcoal-900">
        {title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-charcoal-500">{body}</p>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1.5 flex-1 rounded-full transition-all duration-500",
            i <= step ? "fire-gradient" : "bg-cream-300",
          )}
        />
      ))}
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
        on ? "border-cayenne-600 bg-cayenne-600 text-white" : "border-cream-300",
      )}
    >
      {on ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="m3 7.4 2.6 2.6L11 4.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-8 w-14 shrink-0 rounded-full transition-colors",
        on ? "fire-gradient" : "bg-cream-300",
      )}
    >
      <span
        className={cx(
          "absolute top-1 size-6 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}
