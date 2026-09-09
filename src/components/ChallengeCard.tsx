"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Card, cx } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

export function ChallengeCard({
  challenge,
  active,
  completed,
  onJoin,
  onLeave,
}: {
  challenge: {
    id: string;
    title: string;
    description: string;
    durationDays: number;
    locked: boolean;
  };
  active: { id: string; done: number; elapsed: number; left: number } | null;
  completed: boolean;
  onJoin: (id: string) => Promise<ActionState>;
  onLeave: (id: string) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const pct = active
    ? Math.round((active.done / challenge.durationDays) * 100)
    : 0;

  return (
    <Card className={cx(challenge.locked && !active && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-charcoal-900">{challenge.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-charcoal-500">
            {challenge.description}
          </p>
        </div>
        {completed ? (
          <span className="shrink-0 rounded-full bg-pepper-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cream-100">
            Done
          </span>
        ) : challenge.locked ? (
          <span className="shrink-0 text-lg" aria-label="Locked">
            🔒
          </span>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-sm font-extrabold text-charcoal-900">
              Day {active.done} of {challenge.durationDays}
            </p>
            <p className="text-xs font-bold text-charcoal-500">
              {active.left > 0 ? `${active.left} days to go` : "Final day"}
            </p>
          </div>
          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-cream-200"
            role="progressbar"
            aria-valuenow={active.done}
            aria-valuemin={0}
            aria-valuemax={challenge.durationDays}
            aria-label={`${challenge.title} progress`}
          >
            <div
              className="h-full rounded-full fire-gradient transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await onLeave(active.id);
                setMessage(r.message ?? null);
                router.refresh();
              })
            }
            className="mt-3 text-xs font-extrabold text-charcoal-500 underline underline-offset-2"
          >
            Leave this challenge
          </button>
        </>
      ) : (
        <Button
          className="mt-4"
          variant={challenge.locked ? "secondary" : "primary"}
          size="sm"
          full
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await onJoin(challenge.id);
              setMessage(r.message ?? null);
              router.refresh();
            })
          }
        >
          {pending
            ? "Starting…"
            : challenge.locked
              ? "Locked"
              : completed
                ? "Do it again"
                : `Start the ${challenge.durationDays}-day`}
        </Button>
      )}

      {message ? (
        <p role="status" className="mt-2 text-xs font-bold text-cayenne-700">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
