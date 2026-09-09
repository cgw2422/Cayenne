"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { cx } from "@/components/ui/primitives";

export type ConfirmField =
  | { kind: "note"; label: string; placeholder?: string; required?: boolean }
  | { kind: "choice"; label: string; name: string; options: [string, string][] };

/**
 * The confirmation gate in front of every entitlement change and every
 * destructive action.
 *
 * A real `<dialog>` rather than a styled div, so focus is trapped, Escape
 * closes it and the page behind is inert — the browser does that correctly and
 * a hand-rolled overlay usually does not. Nothing is submitted until the second
 * click, and the button says what will happen rather than "OK".
 */
export function ConfirmAction({
  label,
  title,
  body,
  confirmLabel,
  tone = "neutral",
  fields = [],
  onConfirm,
}: {
  label: string;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "neutral" | "danger" | "good";
  fields?: ConfirmField[];
  onConfirm: (values: Record<string, string>) => Promise<{ ok: boolean; message: string }>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) =>
        field.kind === "choice" ? [field.name, field.options[0][0]] : ["note", ""],
      ),
    ),
  );
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    if (!result?.ok) return;
    const timer = setTimeout(() => setResult(null), 4000);
    return () => clearTimeout(timer);
  }, [result]);

  const noteField = fields.find((f) => f.kind === "note");
  const missingNote =
    noteField?.kind === "note" && noteField.required && !values.note?.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setResult(null);
          dialog.current?.showModal();
        }}
        className={cx(
          "rounded-md px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
          tone === "danger"
            ? "bg-white text-red-700 ring-red-300 hover:bg-red-50 dark:bg-slate-900 dark:text-red-400 dark:ring-red-900"
            : tone === "good"
              ? "bg-white text-emerald-700 ring-emerald-300 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 dark:ring-emerald-900"
              : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
        )}
      >
        {label}
      </button>

      {result ? (
        <p
          role="status"
          className={cx(
            "mt-1 text-xs font-medium",
            result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
          )}
        >
          {result.message}
        </p>
      ) : null}

      <dialog
        ref={dialog}
        className="m-auto w-[min(28rem,92vw)] rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            // The confirm button submits through the handler below instead.
            if ((event.nativeEvent as SubmitEvent).submitter?.dataset.role === "confirm") {
              event.preventDefault();
            }
          }}
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>

          <div className="grid gap-3 px-4 py-4">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {body}
            </p>

            {fields.map((field) =>
              field.kind === "choice" ? (
                <label key={field.name} className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {field.label}
                  </span>
                  <select
                    value={values[field.name] ?? field.options[0][0]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {field.options.map(([key, text]) => (
                      <option key={key} value={key}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label key="note" className="grid gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {field.label}
                    {field.required ? "" : " (optional)"}
                  </span>
                  <input
                    type="text"
                    maxLength={200}
                    value={values.note ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              ),
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <button
              type="submit"
              value="cancel"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-role="confirm"
              disabled={busy || missingNote}
              onClick={() =>
                startTransition(async () => {
                  const outcome = await onConfirm(values);
                  setResult(outcome);
                  if (outcome.ok) dialog.current?.close();
                })
              }
              className={cx(
                "rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50",
                tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900",
              )}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
