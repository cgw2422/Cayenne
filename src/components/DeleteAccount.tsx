"use client";

import { useState, useTransition } from "react";

import { Button, Card } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

export function DeleteAccount({
  onDelete,
}: {
  onDelete: (password: string) => Promise<ActionState>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="danger" full onClick={() => setConfirming(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <Card className="border-cayenne-200 bg-cayenne-50">
      <p className="font-extrabold text-cayenne-800">This can&apos;t be undone.</p>
      <p className="mt-1 text-sm leading-relaxed text-charcoal-700">
        Every entry, journal note, measurement, badge and share card is permanently
        deleted. Consider exporting your data first.
      </p>

      <label htmlFor="confirm-password" className="mt-4 mb-1.5 block text-sm font-extrabold text-charcoal-700">
        Confirm your password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12 w-full rounded-2xl border border-cayenne-200 bg-white px-4 outline-none focus:border-cayenne-600"
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm font-bold text-cayenne-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          variant="danger"
          disabled={pending || !password}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await onDelete(password);
              if (!result.ok) setError(result.message ?? "Couldn't delete the account.");
            })
          }
        >
          {pending ? "Deleting…" : "Permanently delete"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setConfirming(false);
            setPassword("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
