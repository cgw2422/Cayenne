"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, FieldError, cx } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

const CATEGORIES = [
  { key: "DRINKS", label: "Drinks" },
  { key: "MEALS", label: "Meals" },
  { key: "SNACKS", label: "Snacks" },
  { key: "QUICK_MIXES", label: "Quick Mixes" },
];

export function RecipeForm({
  onSave,
}: {
  onSave: (input: {
    title: string;
    summary: string;
    category: string;
    cayenneAmount: string;
    minutes: number;
    ingredients: string[];
    steps: string[];
  }) => Promise<ActionState & { slug?: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("DRINKS");
  const [cayenneAmount, setCayenneAmount] = useState("1/8 tsp");
  const [minutes, setMinutes] = useState(5);
  const [ingredients, setIngredients] = useState<string[]>(["", ""]);
  const [steps, setSteps] = useState<string[]>([""]);

  function submit() {
    setErrors({});
    startTransition(async () => {
      const result = await onSave({
        title,
        summary,
        category,
        cayenneAmount,
        minutes,
        ingredients: ingredients.map((i) => i.trim()).filter(Boolean),
        steps: steps.map((s) => s.trim()).filter(Boolean),
      });
      if (!result.ok) {
        setErrors(result.errors ?? { form: result.message ?? "Something went wrong." });
        return;
      }
      router.push(result.slug ? `/recipes/${result.slug}` : "/recipes");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      {errors.form ? (
        <p role="alert" className="rounded-2xl bg-cayenne-50 px-4 py-3 text-sm font-bold text-cayenne-800">
          {errors.form}
        </p>
      ) : null}

      <Field label="Name" value={title} onChange={setTitle} error={errors.title} placeholder="Morning tonic" />
      <Field
        label="One-line description"
        value={summary}
        onChange={setSummary}
        error={errors.summary}
        placeholder="What makes it worth making"
      />

      <div>
        <p className="mb-2 text-sm font-extrabold text-charcoal-700">Category</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={category === c.key}
              onClick={() => setCategory(c.key)}
              className={cx(
                "tap rounded-2xl border-2 py-3 text-sm font-extrabold transition-all",
                category === c.key
                  ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                  : "border-cream-300 bg-white text-charcoal-700",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Cayenne amount"
          value={cayenneAmount}
          onChange={setCayenneAmount}
          error={errors.cayenneAmount}
          placeholder="1/4 tsp"
        />
        <div>
          <label htmlFor="minutes" className="mb-1.5 block text-sm font-extrabold text-charcoal-700">
            Minutes
          </label>
          <input
            id="minutes"
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 1)}
            className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 text-base outline-none focus:border-ember-400"
          />
        </div>
      </div>

      <ListEditor
        label="Ingredients"
        items={ingredients}
        setItems={setIngredients}
        placeholder="1 cup warm water"
        error={errors.ingredients}
      />
      <ListEditor
        label="Steps"
        items={steps}
        setItems={setSteps}
        placeholder="Stir everything together."
        error={errors.steps}
        multiline
      />

      <Button size="lg" full onClick={submit} disabled={pending}>
        {pending ? "Saving…" : "Save recipe"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-charcoal-700">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 text-base outline-none placeholder:text-charcoal-500/60 focus:border-ember-400"
      />
      <FieldError message={error} />
    </div>
  );
}

function ListEditor({
  label,
  items,
  setItems,
  placeholder,
  error,
  multiline,
}: {
  label: string;
  items: string[];
  setItems: (items: string[]) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-extrabold text-charcoal-700">{label}</p>
        <button
          type="button"
          onClick={() => setItems([...items, ""])}
          className="text-sm font-extrabold text-cayenne-600 underline underline-offset-2"
        >
          Add
        </button>
      </div>
      <ul className="grid gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                rows={2}
                value={item}
                placeholder={placeholder}
                aria-label={`${label} ${i + 1}`}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setItems(next);
                }}
                className="flex-1 resize-none rounded-xl border border-cream-300 px-3 py-2.5 text-[15px] outline-none focus:border-ember-400"
              />
            ) : (
              <input
                value={item}
                placeholder={placeholder}
                aria-label={`${label} ${i + 1}`}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setItems(next);
                }}
                className="h-11 flex-1 rounded-xl border border-cream-300 px-3 text-[15px] outline-none focus:border-ember-400"
              />
            )}
            {items.length > 1 ? (
              <button
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="tap grid shrink-0 place-items-center rounded-xl text-charcoal-500"
              >
                ✕
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <FieldError message={error} />
    </Card>
  );
}
