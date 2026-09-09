import Link from "next/link";

import { Metric, Panel } from "@/components/admin/shell";
import { TrendChart } from "@/components/admin/TrendChart";
import { cx } from "@/components/ui/primitives";
import { requireAdminPage } from "@/server/admin/guard";
import {
  RANGES,
  RANGE_LABEL,
  parseRange,
  totals,
  trends,
  type RangeId,
} from "@/server/admin/stats";

export const metadata = { title: "Dashboard · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminPage();

  const range = parseRange((await searchParams).range);
  const [counts, series] = await Promise.all([totals(), trends(range)]);

  const day = (value: string) => value.slice(5); // MM-DD reads better on an axis
  const points = (pick: (row: (typeof series.rows)[number]) => number) =>
    series.rows.map((row) => ({ day: day(row.day), value: pick(row) }));
  const sum = (pick: (row: (typeof series.rows)[number]) => number) =>
    series.rows.reduce((total, row) => total + pick(row), 0);
  // Summing daily actives would count the same person once per day they showed
  // up, which is a number that means nothing. An average is the honest headline.
  const average = (pick: (row: (typeof series.rows)[number]) => number) =>
    series.rows.length ? Math.round(sum(pick) / series.rows.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-slate-500">
            Every figure is a live query. Days are UTC.
          </p>
        </div>
        <RangePicker current={range} />
      </div>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          People
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Total users" value={counts.users} />
          <Metric label="New today" value={counts.newToday} />
          <Metric label="New this week" value={counts.newThisWeek} />
          <Metric label="New this month" value={counts.newThisMonth} />
          <Metric label="Active — 7 days" value={counts.active7} />
          <Metric label="Active — 30 days" value={counts.active30} />
          <Metric label="Free" value={counts.free} />
          <Metric
            label="Lifetime"
            value={counts.lifetime}
            hint={`${counts.paidLifetime} paid · ${counts.compedLifetime} comped`}
            tone="good"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Revenue &amp; usage
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Free → paid"
            value={`${counts.conversionPct}%`}
            hint="Paid only; comped excluded"
            tone={counts.conversionPct > 0 ? "good" : "neutral"}
          />
          <Metric label="Cayenne logs" value={counts.entries} />
          <Metric label="Logs today" value={counts.entriesToday} />
          <Metric label="Recipes created" value={counts.recipesCreated} />
          <Metric label="Share images" value={counts.shareCards} />
          <Metric label="Shares this month" value={counts.shareCardsThisMonth} />
          <Metric label="Challenges started" value={counts.challengesStarted} />
          <Metric
            label="Challenges completed"
            value={counts.challengesCompleted}
            hint={
              counts.challengesStarted
                ? `${Math.round((counts.challengesCompleted / counts.challengesStarted) * 100)}% finish rate`
                : undefined
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Trends · {RANGE_LABEL[range]} ({series.from} → {series.to})
        </h2>
        <div className="grid gap-3 xl:grid-cols-2">
          <TrendChart
            label="User signups"
            points={points((r) => r.signups)}
            total={sum((r) => r.signups)}
            accent="#0284c7"
          />
          <TrendChart
            label="Daily active users"
            points={points((r) => r.activeUsers)}
            total={average((r) => r.activeUsers)}
            summaryNote="avg/day"
            accent="#059669"
          />
          <TrendChart
            label="Cayenne logs"
            points={points((r) => r.entries)}
            total={sum((r) => r.entries)}
            accent="#d92d20"
          />
          <TrendChart
            label="Share images generated"
            points={points((r) => r.shareCards)}
            total={sum((r) => r.shareCards)}
            accent="#7c3aed"
          />
          <TrendChart
            label="Purchases"
            points={points((r) => r.purchases)}
            total={sum((r) => r.purchases)}
            accent="#ca8a04"
            className="xl:col-span-2"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Finished days are rolled up once into <code>DailyStat</code> and read back
          by key; only today is computed live. Daily active means an account that
          logged cayenne that day.
        </p>
      </section>

      {counts.openFeedback > 0 ? (
        <Panel title="Waiting on you">
          <Link
            href="/admin/feedback"
            className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
          >
            {counts.openFeedback} piece{counts.openFeedback === 1 ? "" : "s"} of
            feedback still open →
          </Link>
        </Panel>
      ) : null}
    </div>
  );
}

function RangePicker({ current }: { current: RangeId }) {
  return (
    <nav aria-label="Date range" className="flex gap-1">
      {RANGES.map((range) => (
        <Link
          key={range}
          href={`/admin?range=${range}`}
          aria-current={range === current ? "true" : undefined}
          className={cx(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            range === current
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
          )}
        >
          {RANGE_LABEL[range]}
        </Link>
      ))}
    </nav>
  );
}
