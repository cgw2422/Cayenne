import Link from "next/link";

import { Badge, Empty, Metric, Panel, stamp } from "@/components/admin/shell";
import { FeedbackControls } from "@/components/admin/FeedbackRow";
import { cx } from "@/components/ui/primitives";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/server/admin/guard";
import { updateFeedback } from "./actions";
import type { FeedbackStatus, FeedbackType } from "@prisma/client";

export const metadata = { title: "Feedback · Admin" };
export const dynamic = "force-dynamic";

const STATUSES: FeedbackStatus[] = ["NEW", "REVIEWING", "PLANNED", "RESOLVED", "CLOSED"];

const TYPE_LABEL: Record<FeedbackType, string> = {
  BUG: "Bug",
  FEATURE: "Feature request",
  GENERAL: "General",
};

const TYPE_TONE: Record<FeedbackType, "bad" | "info" | "neutral"> = {
  BUG: "bad",
  FEATURE: "info",
  GENERAL: "neutral",
};

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;

  const status = STATUSES.includes(params.status as FeedbackStatus)
    ? (params.status as FeedbackStatus)
    : null;
  const type =
    params.type && params.type in TYPE_LABEL ? (params.type as FeedbackType) : null;

  const where = { ...(status ? { status } : {}), ...(type ? { type } : {}) };

  const [items, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        message: true,
        status: true,
        adminNote: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, email: true } },
      },
    }),
    prisma.feedback.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (value: FeedbackStatus) =>
    counts.find((c) => c.status === value)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Feedback</h1>
        <p className="text-xs text-slate-500">
          What people typed, and nothing else — no diagnostics or personal data is
          attached to a report.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUSES.map((value) => (
          <Metric
            key={value}
            label={value}
            value={countFor(value)}
            tone={value === "NEW" && countFor(value) > 0 ? "warn" : "neutral"}
          />
        ))}
      </div>

      <Panel>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Chip href="/admin/feedback" active={!status && !type}>
            All
          </Chip>
          {STATUSES.map((value) => (
            <Chip
              key={value}
              href={`/admin/feedback?status=${value}`}
              active={status === value}
            >
              {value}
            </Chip>
          ))}
          {(Object.keys(TYPE_LABEL) as FeedbackType[]).map((value) => (
            <Chip
              key={value}
              href={`/admin/feedback?type=${value}`}
              active={type === value}
            >
              {TYPE_LABEL[value]}
            </Chip>
          ))}
        </div>
      </Panel>

      <Panel title={`${items.length} shown`}>
        {items.length === 0 ? (
          <Empty>Nothing here.</Empty>
        ) : (
          <ul className="grid gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type]}</Badge>
                  <Badge tone={item.status === "NEW" ? "warn" : "neutral"}>
                    {item.status}
                  </Badge>
                  <span>{stamp(item.createdAt)}</span>
                  <span>·</span>
                  {item.user ? (
                    <Link
                      href={`/admin/users/${item.user.id}`}
                      className="text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {item.user.displayName} ({item.user.email})
                    </Link>
                  ) : (
                    <span>Account since deleted</span>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                  {item.message}
                </p>

                <FeedbackControls
                  id={item.id}
                  status={item.status}
                  adminNote={item.adminNote}
                  onUpdate={updateFeedback}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cx(
        "rounded-full px-2.5 py-1",
        active
          ? "bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
      )}
    >
      {children}
    </Link>
  );
}
