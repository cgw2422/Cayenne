import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/components/ui/primitives";

/**
 * The admin design system.
 *
 * Deliberately not the consumer app: dense, neutral, desktop-first, square-ish
 * corners, tabular numbers. Someone looking at this screen should never be in
 * doubt about which of the two applications they are in — that ambiguity is how
 * people run destructive actions thinking they are somewhere safe.
 */

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={cx(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "neutral" && "text-slate-900 dark:text-slate-100",
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold",
        tone === "neutral" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        tone === "good" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        tone === "warn" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        tone === "bad" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        tone === "info" && "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
      )}
    >
      {children}
    </span>
  );
}

/** A horizontally scrolling table wrapper — the mobile answer to dense data. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[42rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  numeric,
  href,
  active,
}: {
  children: ReactNode;
  numeric?: boolean;
  href?: string;
  active?: boolean;
}) {
  const inner = href ? (
    <Link
      href={href}
      className={cx("hover:underline", active && "text-slate-900 dark:text-slate-100")}
    >
      {children}
      {active ? " ↓" : ""}
    </Link>
  ) : (
    children
  );
  return (
    <th
      scope="col"
      className={cx(
        "whitespace-nowrap border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800",
        numeric ? "text-right" : "text-left",
      )}
    >
      {inner}
    </th>
  );
}

export function Td({
  children,
  numeric,
  muted,
}: {
  children: ReactNode;
  numeric?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={cx(
        "border-b border-slate-100 px-3 py-2 dark:border-slate-800/70",
        numeric && "text-right tabular-nums",
        muted ? "text-slate-500" : "text-slate-800 dark:text-slate-200",
      )}
    >
      {children}
    </td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-slate-500">{children}</p>
  );
}

/** Dates in the admin are absolute and unambiguous — no "3 days ago". */
export function stamp(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function shortDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
