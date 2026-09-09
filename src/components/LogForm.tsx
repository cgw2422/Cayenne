"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, FieldError, cx } from "@/components/ui/primitives";
import { Celebration, type CelebrationPayload } from "@/components/Celebration";
import { AMOUNT_PRESETS, METHOD_META, MOOD_META } from "@/lib/brand";
import type { SaveEntryResult } from "@/app/(app)/log/actions";

type UserGoal = { id: string; label: string; icon: string };

const METHODS = (Object.keys(METHOD_META) as Array<keyof typeof METHOD_META>).map(
  (key) => ({ key, ...METHOD_META[key] }),
);

const SLIDER_STOPS = [0.125, 0.25, 0.5, 1, 1.5];

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function LogForm({
  goals,
  defaults,
  entry,
  onSave,
}: {
  goals: UserGoal[];
  defaults: { method: string | null; amount: number | null; unit: string };
  entry?: {
    id: string;
    takenAt: string;
    method: string;
    amount: number;
    unit: string;
    mood: number | null;
    notes: string | null;
    goalIds: string[];
  };
  onSave: (input: {
    takenAt: string;
    method: string;
    amount: number;
    unit: string;
    mood: number | null;
    notes: string | null;
    userGoalIds: string[];
    entryId?: string;
  }) => Promise<SaveEntryResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [takenAt, setTakenAt] = useState(
    entry?.takenAt ?? localInputValue(new Date()),
  );
  const [method, setMethod] = useState(entry?.method ?? defaults.method ?? "WATER");
  const [unit, setUnit] = useState(entry?.unit ?? defaults.unit ?? "TSP");
  const [amount, setAmount] = useState<number>(
    entry?.amount ?? defaults.amount ?? 0.25,
  );
  const [customMode, setCustomMode] = useState(
    (entry?.unit ?? defaults.unit) !== "TSP",
  );
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [goalIds, setGoalIds] = useState<string[]>(entry?.goalIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);

  const sliderIndex = Math.max(
    0,
    SLIDER_STOPS.findIndex((s) => s >= amount),
  );

  function submit() {
    setErrors({});
    startTransition(async () => {
      const result = await onSave({
        takenAt: new Date(takenAt).toISOString(),
        method,
        amount,
        unit,
        mood,
        notes: notes.trim() || null,
        userGoalIds: goalIds,
        entryId: entry?.id,
      });

      if (!result.ok) {
        setErrors(result.errors ?? { form: result.message ?? "Something went wrong." });
        return;
      }

      const large = Boolean(result.milestone) || Boolean(result.badges?.length);
      setCelebration({
        size: large ? "large" : "small",
        headline: result.headline ?? "Logged.",
        subline: result.subline ?? "Keep the heat going.",
        badges: result.badges,
        shareHref: large ? "/share" : undefined,
      });

      if (!large) {
        setTimeout(() => router.push("/home"), 1000);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-6">
      {errors.form ? (
        <p role="alert" className="rounded-2xl bg-cayenne-50 px-4 py-3 text-sm font-bold text-cayenne-800">
          {errors.form}
        </p>
      ) : null}

      {/* ---------------------------------------------------------- when -- */}
      <Card className="py-3.5">
        <label htmlFor="takenAt" className="sr-only">
          Date and time
        </label>
        <input
          id="takenAt"
          type="datetime-local"
          value={takenAt}
          max={localInputValue(new Date())}
          onChange={(e) => setTakenAt(e.target.value)}
          className="w-full bg-transparent text-center text-[15px] font-extrabold text-charcoal-900 outline-none"
        />
        <FieldError message={errors.takenAt} />
      </Card>

      {/* -------------------------------------------------------- method -- */}
      <section aria-labelledby="method-label">
        <h2
          id="method-label"
          className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500"
        >
          How did you take it?
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={on}
                onClick={() => setMethod(m.key)}
                className={cx(
                  "tap flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 transition-all active:scale-[0.97]",
                  on
                    ? "border-cayenne-600 bg-cayenne-50 shadow-soft"
                    : "border-cream-300 bg-white",
                )}
              >
                <span className={cx("text-2xl", on && "animate-pop")}>{m.icon}</span>
                <span
                  className={cx(
                    "text-xs font-extrabold",
                    on ? "text-cayenne-700" : "text-charcoal-700",
                  )}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------- amount -- */}
      <section aria-labelledby="amount-label">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2
            id="amount-label"
            className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500"
          >
            Amount
          </h2>
          <button
            type="button"
            onClick={() => setCustomMode((v) => !v)}
            className="text-xs font-extrabold text-cayenne-600 underline underline-offset-2"
          >
            {customMode ? "Use presets" : "Custom"}
          </button>
        </div>

        {customMode ? (
          <Card className="flex gap-2 p-3.5">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              aria-label="Amount"
              onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
              className="h-12 flex-1 rounded-xl border border-cream-300 px-3 text-base font-bold outline-none focus:border-ember-400"
            />
            <select
              value={unit}
              aria-label="Unit"
              onChange={(e) => setUnit(e.target.value)}
              className="h-12 rounded-xl border border-cream-300 bg-white px-3 font-bold outline-none focus:border-ember-400"
            >
              <option value="TSP">tsp</option>
              <option value="MG">mg</option>
              <option value="G">g</option>
              <option value="CAPSULE">capsules</option>
            </select>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="grid grid-cols-4 gap-2">
              {AMOUNT_PRESETS.map((p) => {
                const on = unit === "TSP" && amount === p.amount;
                return (
                  <button
                    key={p.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setAmount(p.amount);
                      setUnit("TSP");
                    }}
                    className={cx(
                      "tap rounded-xl border-2 py-2.5 text-sm font-extrabold transition-all active:scale-[0.97]",
                      on
                        ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                        : "border-cream-300 bg-white text-charcoal-700",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={SLIDER_STOPS.length - 1}
              step={1}
              value={sliderIndex < 0 ? 1 : sliderIndex}
              aria-label="Amount slider"
              onChange={(e) => {
                setAmount(SLIDER_STOPS[Number(e.target.value)]);
                setUnit("TSP");
              }}
              className="mt-4 h-2 w-full accent-cayenne-600"
            />
          </Card>
        )}
        <FieldError message={errors.amount} />
      </section>

      {/* --------------------------------------------------------- goals -- */}
      {goals.length ? (
        <section aria-labelledby="why-label">
          <h2
            id="why-label"
            className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500"
          >
            Why are you using cayenne? <span className="normal-case tracking-normal text-charcoal-500/70">(optional)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {goals.map((goal) => {
              const on = goalIds.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setGoalIds((prev) =>
                      prev.includes(goal.id)
                        ? prev.filter((g) => g !== goal.id)
                        : [...prev, goal.id],
                    )
                  }
                  className={cx(
                    "flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-bold transition-all",
                    on
                      ? "border-pepper-900 bg-pepper-900 text-cream-100"
                      : "border-cream-300 bg-white text-charcoal-700",
                  )}
                >
                  <span>{goal.icon}</span>
                  {goal.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- mood -- */}
      <section aria-labelledby="mood-label">
        <h2
          id="mood-label"
          className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500"
        >
          How do you feel today? <span className="normal-case tracking-normal text-charcoal-500/70">(optional)</span>
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_META.map((m) => {
            const on = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={on}
                aria-label={m.label}
                onClick={() => setMood(on ? null : m.value)}
                className={cx(
                  "tap flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 transition-all active:scale-[0.97]",
                  on
                    ? "border-ember-500 bg-ember-500/10 shadow-soft"
                    : "border-cream-300 bg-white",
                )}
              >
                <span className={cx("text-xl", on && "animate-pop")}>{m.icon}</span>
                <span className="text-[10px] font-bold text-charcoal-500">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------- notes -- */}
      <div>
        <label htmlFor="notes" className="sr-only">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          maxLength={2000}
          value={notes}
          placeholder="Notes (optional)"
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-2xl border border-cream-300 bg-white px-4 py-3 text-[15px] outline-none placeholder:text-charcoal-500/60 focus:border-ember-400"
        />
      </div>

      <Button size="lg" full onClick={submit} disabled={pending}>
        {pending ? "Saving…" : entry ? "Update entry" : "Save entry"}
      </Button>

      {celebration ? (
        <Celebration
          payload={celebration}
          onDismiss={() => {
            setCelebration(null);
            router.push("/home");
          }}
        />
      ) : null}
    </div>
  );
}
