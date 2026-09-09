"use client";

import { useState, useTransition } from "react";

import { Button, Card, cx } from "@/components/ui/primitives";
import type { FeedbackResult } from "@/app/(app)/more/feedback/actions";

const TYPES = [
  { id: "BUG", icon: "🐞", label: "Something's broken", blurb: "It did the wrong thing." },
  { id: "FEATURE", icon: "💡", label: "An idea", blurb: "Something you wish it did." },
  { id: "GENERAL", icon: "💬", label: "Anything else", blurb: "Say what you like." },
] as const;

export function FeedbackForm({
  onSend,
}: {
  onSend: (input: { type: string; message: string }) => Promise<FeedbackResult>;
}) {
  const [type, setType] = useState<string>("GENERAL");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [busy, startTransition] = useTransition();

  if (result?.ok) {
    return (
      <Card className="grid gap-3 text-center">
        <p className="text-4xl" aria-hidden="true">
          🌶️
        </p>
        <p className="text-lg font-extrabold text-charcoal-900">{result.message}</p>
        <Button
          variant="secondary"
          onClick={() => {
            setResult(null);
            setMessage("");
          }}
        >
          Send something else
        </Button>
      </Card>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => setResult(await onSend({ type, message })));
      }}
    >
      <p className="text-[15px] leading-relaxed text-charcoal-500">
        This goes straight to the person who builds Cayenne Do It. Only what you
        type is sent — nothing is attached from your logs, measurements or journal.
      </p>

      <fieldset className="grid gap-2.5">
        <legend className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          What kind of thing?
        </legend>
        {TYPES.map((option) => (
          <label
            key={option.id}
            className={cx(
              "tap flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3 transition-all",
              type === option.id
                ? "border-cayenne-600 bg-cayenne-50"
                : "border-cream-300 bg-white",
            )}
          >
            <input
              type="radio"
              name="type"
              value={option.id}
              checked={type === option.id}
              onChange={() => setType(option.id)}
              className="sr-only"
            />
            <span aria-hidden="true" className="text-xl">
              {option.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold text-charcoal-900">{option.label}</span>
              <span className="block text-sm text-charcoal-500">{option.blurb}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          Your message
        </span>
        <textarea
          rows={6}
          maxLength={2000}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What happened, or what you'd like to see."
          className="w-full resize-none rounded-2xl border border-cream-300 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-ember-400"
        />
        <span className="text-xs text-charcoal-500">{message.length}/2000</span>
      </label>

      {result && !result.ok ? (
        <p className="text-sm font-bold text-cayenne-700">{result.message}</p>
      ) : null}

      <Button type="submit" size="lg" full disabled={busy || message.trim().length < 4}>
        {busy ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
