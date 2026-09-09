"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, cx } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

export function GoalPicker({
  goals,
  selected,
  onSave,
}: {
  goals: { slug: string; label: string; icon: string }[];
  selected: string[];
  onSave: (slugs: string[]) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState(selected);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2.5">
      {goals.map((goal) => {
        const on = picked.includes(goal.slug);
        return (
          <button
            key={goal.slug}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setMessage(null);
              setPicked((prev) =>
                prev.includes(goal.slug)
                  ? prev.filter((s) => s !== goal.slug)
                  : [...prev, goal.slug],
              );
            }}
            className={cx(
              "tap flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all",
              on ? "border-cayenne-600 bg-cayenne-50" : "border-cream-300 bg-white",
            )}
          >
            <span className="text-xl">{goal.icon}</span>
            <span className="flex-1 font-bold text-charcoal-900">{goal.label}</span>
            <span
              aria-hidden="true"
              className={cx(
                "grid size-6 place-items-center rounded-full border-2 text-xs font-black",
                on
                  ? "border-cayenne-600 bg-cayenne-600 text-white"
                  : "border-cream-300 text-transparent",
              )}
            >
              ✓
            </span>
          </button>
        );
      })}

      {message ? (
        <p role="status" className="text-center text-sm font-extrabold text-pepper-600">
          {message}
        </p>
      ) : null}

      <Button
        size="lg"
        full
        className="mt-2"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await onSave(picked);
            setMessage(result.message ?? null);
            router.refresh();
          })
        }
      >
        {pending ? "Saving…" : "Save goals"}
      </Button>
    </div>
  );
}
