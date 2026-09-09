"use client";

import { useOptimistic, useTransition } from "react";

import { cx } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

export function FavoriteButton({
  recipeId,
  initial,
  onToggle,
}: {
  recipeId: string;
  initial: boolean;
  onToggle: (id: string) => Promise<ActionState>;
}) {
  const [optimistic, setOptimistic] = useOptimistic(initial);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "Remove from favourites" : "Save to favourites"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await onToggle(recipeId);
        })
      }
      className={cx(
        "tap grid shrink-0 place-items-center rounded-full transition-colors",
        optimistic ? "text-cayenne-600" : "text-charcoal-500/50",
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={optimistic ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden="true"
      >
        <path d="M12 20.3s-7.5-4.6-7.5-9.8A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.2-7.5 9.8-7.5 9.8Z" />
      </svg>
    </button>
  );
}
