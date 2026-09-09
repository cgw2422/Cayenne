"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/primitives";
import type { ChangeResult } from "@/app/change-password/actions";

export function ChangePasswordForm({
  onSubmit,
}: {
  onSubmit: (input: { current: string; next: string }) => Promise<ChangeResult>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await onSubmit({ current, next });
          if (!result.ok) setError(result.message);
        });
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-sm font-bold text-charcoal-900">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="h-12 rounded-2xl border border-cream-300 px-4 text-[15px] outline-none focus:border-ember-400"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-bold text-charcoal-900">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-12 rounded-2xl border border-cream-300 px-4 text-[15px] outline-none focus:border-ember-400"
        />
        <span className="text-xs text-charcoal-500">At least 10 characters.</span>
      </label>

      {error ? <p className="text-sm font-bold text-cayenne-700">{error}</p> : null}

      <Button type="submit" size="lg" full disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
