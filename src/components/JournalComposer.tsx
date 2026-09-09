"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, FieldError, cx } from "@/components/ui/primitives";
import { MOOD_META } from "@/lib/brand";
import type { ActionState } from "@/lib/validation";

export function JournalComposer({
  prompt,
  onSave,
}: {
  prompt: string;
  onSave: (input: {
    prompt: string | null;
    body: string;
    mood: number | null;
  }) => Promise<ActionState>;
  onDelete?: (id: string) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <p className="mb-2.5 text-sm font-extrabold text-cayenne-600">{prompt}</p>
      <label htmlFor="journal-body" className="sr-only">
        Journal entry
      </label>
      <textarea
        id="journal-body"
        rows={4}
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="However it's going."
        className="w-full resize-none rounded-2xl border border-cream-300 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-charcoal-500/60 focus:border-ember-400"
      />

      <div className="mt-3 flex items-center gap-1.5">
        {MOOD_META.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mood === m.value}
            aria-label={m.label}
            onClick={() => setMood(mood === m.value ? null : m.value)}
            className={cx(
              "grid size-10 place-items-center rounded-xl border-2 text-lg transition-all",
              mood === m.value
                ? "border-ember-500 bg-ember-500/10"
                : "border-cream-300 bg-white",
            )}
          >
            {m.icon}
          </button>
        ))}
      </div>

      <FieldError message={error} />

      <Button
        className="mt-3"
        full
        disabled={pending || !body.trim()}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await onSave({ prompt, body, mood });
            if (!result.ok) {
              setError(result.errors?.body ?? result.message ?? "Couldn't save that.");
              return;
            }
            setBody("");
            setMood(null);
            router.refresh();
          })
        }
      >
        {pending ? "Saving…" : "Save entry"}
      </Button>
    </Card>
  );
}
