"use client";

import { useState, useTransition } from "react";

import { cx } from "@/components/ui/primitives";
import type { AdminResult } from "@/app/admin/feedback/actions";

const STATUSES = ["NEW", "REVIEWING", "PLANNED", "RESOLVED", "CLOSED"] as const;

/** Triage controls for one piece of feedback: a status, and a private note. */
export function FeedbackControls({
  id,
  status,
  adminNote,
  onUpdate,
}: {
  id: string;
  status: string;
  adminNote: string | null;
  onUpdate: (input: {
    id: string;
    status: string;
    adminNote?: string;
  }) => Promise<AdminResult>;
}) {
  const [next, setNext] = useState(status);
  const [note, setNote] = useState(adminNote ?? "");
  const [result, setResult] = useState<AdminResult | null>(null);
  const [busy, startTransition] = useTransition();

  const dirty = next !== status || note !== (adminNote ?? "");

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
      <select
        value={next}
        onChange={(e) => setNext(e.target.value)}
        aria-label="Status"
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder="Private note"
        aria-label="Admin note"
        className="min-w-[10rem] flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
      />

      <button
        type="button"
        disabled={busy || !dirty}
        onClick={() =>
          startTransition(async () =>
            setResult(await onUpdate({ id, status: next, adminNote: note })),
          )
        }
        className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
      >
        {busy ? "Saving…" : "Save"}
      </button>

      {result ? (
        <span
          role="status"
          className={cx(
            "text-xs font-medium",
            result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
          )}
        >
          {result.message}
        </span>
      ) : null}
    </div>
  );
}
