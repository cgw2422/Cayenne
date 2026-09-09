"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, FieldError, cx } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

const KINDS = [
  { key: "WEIGHT", label: "Weight", unit: "lb", icon: "⚖️" },
  { key: "WAIST", label: "Waist", unit: "in", icon: "📏" },
  { key: "BLOOD_PRESSURE", label: "Blood pressure", unit: "mmHg", icon: "🩺" },
  { key: "BLOOD_GLUCOSE", label: "Blood glucose", unit: "mg/dL", icon: "🩸" },
  { key: "CUSTOM", label: "Custom", unit: "", icon: "✏️" },
];

export function MeasurementForm({
  today,
  onSave,
}: {
  today: string;
  onSave: (input: {
    kind: string;
    customLabel: string | null;
    value: number;
    secondary: number | null;
    unit: string;
    recordedOn: string;
    note: string | null;
  }) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("WEIGHT");
  const [customLabel, setCustomLabel] = useState("");
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [unit, setUnit] = useState("lb");
  const [recordedOn, setRecordedOn] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = KINDS.find((k) => k.key === kind);

  if (!open) {
    return (
      <Button size="lg" full onClick={() => setOpen(true)}>
        Record a measurement
      </Button>
    );
  }

  return (
    <Card className="grid gap-3.5">
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={kind === k.key}
            onClick={() => {
              setKind(k.key);
              if (k.unit) setUnit(k.unit);
            }}
            className={cx(
              "tap flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-[11px] font-extrabold transition-all",
              kind === k.key
                ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                : "border-cream-300 bg-white text-charcoal-700",
            )}
          >
            <span className="text-lg">{k.icon}</span>
            {k.label}
          </button>
        ))}
      </div>

      {kind === "CUSTOM" ? (
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="What are you tracking?"
          aria-label="Custom measurement name"
          className="h-12 rounded-2xl border border-cream-300 px-4 outline-none focus:border-ember-400"
        />
      ) : null}

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={kind === "BLOOD_PRESSURE" ? "Systolic" : "Value"}
          aria-label="Value"
          className="h-12 flex-1 rounded-2xl border border-cream-300 px-4 text-base outline-none focus:border-ember-400"
        />
        {kind === "BLOOD_PRESSURE" ? (
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder="Diastolic"
            aria-label="Diastolic"
            className="h-12 flex-1 rounded-2xl border border-cream-300 px-4 text-base outline-none focus:border-ember-400"
          />
        ) : null}
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit"
          aria-label="Unit"
          className="h-12 w-24 rounded-2xl border border-cream-300 px-3 text-base outline-none focus:border-ember-400"
        />
      </div>

      <input
        type="date"
        value={recordedOn}
        max={today}
        onChange={(e) => setRecordedOn(e.target.value)}
        aria-label="Date"
        className="h-12 rounded-2xl border border-cream-300 px-4 text-base outline-none focus:border-ember-400"
      />

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        aria-label="Note"
        maxLength={500}
        className="h-12 rounded-2xl border border-cream-300 px-4 outline-none focus:border-ember-400"
      />

      <FieldError message={error} />

      <div className="flex gap-2">
        <Button
          full
          disabled={pending || !value}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await onSave({
                kind,
                customLabel: customLabel.trim() || null,
                value: Number(value),
                secondary: secondary ? Number(secondary) : null,
                unit: unit.trim() || (selected?.unit ?? "unit"),
                recordedOn,
                note: note.trim() || null,
              });
              if (!result.ok) {
                setError(result.message ?? Object.values(result.errors ?? {})[0] ?? "Couldn't save.");
                return;
              }
              setValue("");
              setSecondary("");
              setNote("");
              setOpen(false);
              router.refresh();
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
