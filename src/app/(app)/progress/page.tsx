import Link from "next/link";

import { CalendarGrid } from "@/components/charts/CalendarGrid";
import { LineChart } from "@/components/charts/LineChart";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { Card, SectionTitle, StatTile, cx } from "@/components/ui/primitives";
import { Flame } from "@/components/ui/Flame";
import { METHOD_META } from "@/lib/brand";
import { addDays, startOfMonth } from "@/lib/date";
import { FEATURES } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { streakFor, userToday } from "@/server/habit";
import {
  RANGES,
  loggedDaySet,
  methodBreakdown,
  resolveRange,
  trends,
  type RangeKey,
} from "@/server/progress";

export const metadata = { title: "My progress" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "stats", label: "Stats" },
  { key: "calendar", label: "Calendar" },
] as const;

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const { tab: rawTab, range: rawRange } = await searchParams;
  const tab = (TABS.find((t) => t.key === rawTab)?.key ?? "overview") as
    | "overview"
    | "stats"
    | "calendar";

  const user = await requireUser();
  const today = userToday(user);
  const summary = await streakFor(user);
  const range = resolveRange(rawRange, user.entitlement);

  const windowDays = range.days ?? Math.max(30, summary.totalDays);
  const [series, breakdown, userGoals] = await Promise.all([
    trends(user.id, today, windowDays),
    methodBreakdown(user.id, addDays(today, -(windowDays - 1))),
    prisma.userGoal.findMany({
      where: { userId: user.id },
      include: { goal: true, entryGoals: { select: { id: true } } },
      orderBy: { goal: { sortOrder: "asc" } },
    }),
  ]);

  const [year, monthIndex] = [
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
  ];
  const calendarDays = await loggedDaySet(
    user.id,
    startOfMonth(today),
    today,
  );

  const totalMethods = breakdown.reduce((sum, b) => sum + b.count, 0);

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-6">
        <h1 className="text-2xl font-extrabold text-charcoal-900">My Progress</h1>
        <Link
          href="/share"
          className="fire-gradient shrink-0 rounded-full px-4 py-2.5 text-xs font-extrabold text-white shadow-lift"
        >
          Share my progress
        </Link>
      </header>

      <nav className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-4" aria-label="Progress views">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/progress?tab=${t.key}&range=${range.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
              tab === t.key
                ? "fire-gradient text-white shadow-soft"
                : "border border-cream-300 bg-white text-charcoal-700",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* ------------------------------------------------------- overview -- */}
      {tab === "overview" ? (
        <div className="flex flex-col gap-5 px-5 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Current streak"
              value={summary.current}
              icon={<Flame size={18} muted={summary.current === 0} />}
            />
            <StatTile label="Longest streak" value={summary.longest} />
            <StatTile label="Total days" value={summary.totalDays} />
            <StatTile label="This month" value={summary.thisMonth} />
          </div>

          <section>
            <SectionTitle>How you&apos;ve felt</SectionTitle>
            <Card>
              <LineChart
                points={series.mood}
                yMin={1}
                yMax={5}
                accent="#F15A24"
                format={{ kind: "mood" }}
                ariaLabel="Mood over time"
              />
              <p className="mt-2 text-xs text-charcoal-500">
                Your own ratings, on the days you recorded one.
              </p>
            </Card>
          </section>

          <section>
            <SectionTitle
              action={
                <Link
                  href="/more/goals"
                  className="text-xs font-extrabold text-cayenne-600 underline underline-offset-2"
                >
                  Edit
                </Link>
              }
            >
              Your goals
            </SectionTitle>
            {userGoals.length ? (
              <Card className="grid gap-3.5">
                {userGoals.map((ug) => {
                  const linked = ug.entryGoals.length;
                  const pct = Math.min(
                    100,
                    Math.round((linked / Math.max(1, summary.totalDays)) * 100),
                  );
                  return (
                    <div key={ug.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-extrabold text-charcoal-900">
                          <span>{ug.goal.icon}</span>
                          {ug.goal.label}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-charcoal-500">
                          {linked}/{summary.totalDays} days
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-cream-200"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${ug.goal.label} entries`}
                      >
                        <div
                          className="h-full rounded-full fire-gradient"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs leading-relaxed text-charcoal-500">
                  This counts the days you tagged an entry with each goal. How have you
                  felt since starting your routine? Write it down in your{" "}
                  <Link href="/more/journal" className="font-bold text-cayenne-600 underline">
                    journal
                  </Link>
                  .
                </p>
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-charcoal-500">
                  You haven&apos;t picked any goals yet.
                </p>
              </Card>
            )}
          </section>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- stats -- */}
      {tab === "stats" ? (
        <div className="flex flex-col gap-5 px-5 pb-6">
          <nav
            className="no-scrollbar flex gap-2 overflow-x-auto"
            aria-label="Date range"
          >
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <Link
                key={key}
                href={`/progress?tab=stats&range=${key}`}
                aria-current={range.key === key ? "page" : undefined}
                className={cx(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-colors",
                  range.key === key
                    ? "border-pepper-900 bg-pepper-900 text-cream-100"
                    : "border-cream-300 bg-white text-charcoal-700",
                )}
              >
                {RANGES[key].label}
              </Link>
            ))}
          </nav>

          {range.capped ? (
            <UpgradeNudge
              feature={FEATURES.ADVANCED_CHARTS}
              body="Free accounts see the last 7 days. Unlock everything once for $5.99 and keep the whole history."
            />
          ) : null}

          <section>
            <SectionTitle>Amount used</SectionTitle>
            <Card>
              <LineChart
                points={series.amount}
                accent="#D92D20"
                format={{ kind: "unit", unit: "tsp" }}
                ariaLabel="Cayenne amount per day"
              />
              <p className="mt-2 text-xs text-charcoal-500">
                Teaspoon entries only — capsules and milligram amounts aren&apos;t
                averaged in.
              </p>
            </Card>
          </section>

          <section>
            <SectionTitle>Consistency</SectionTitle>
            <Card>
              <LineChart
                points={series.consistency}
                yMin={0}
                yMax={100}
                accent="#12372A"
                format={{ kind: "percent" }}
                ariaLabel="Rolling seven day consistency"
              />
              <p className="mt-2 text-xs text-charcoal-500">
                Share of the last seven days you logged, day by day.
              </p>
            </Card>
          </section>

          <section>
            <SectionTitle>How you take it</SectionTitle>
            <Card className="grid gap-3">
              {totalMethods === 0 ? (
                <p className="text-sm text-charcoal-500">Nothing logged in this range.</p>
              ) : (
                breakdown.map((b) => {
                  const pct = Math.round((b.count / totalMethods) * 100);
                  return (
                    <div key={b.method}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-charcoal-900">
                          {METHOD_META[b.method].icon} {METHOD_META[b.method].label}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-charcoal-500">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-cream-200">
                        <div
                          className="h-full rounded-full bg-ember-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </section>
        </div>
      ) : null}

      {/* ------------------------------------------------------- calendar -- */}
      {tab === "calendar" ? (
        <div className="flex flex-col gap-5 px-5 pb-6">
          <Card>
            <CalendarGrid
              year={year}
              monthIndex={monthIndex}
              loggedDays={calendarDays}
              today={today}
            />
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-charcoal-500">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded fire-gradient" /> Logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-cream-200" /> Not logged
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Days this month" value={summary.thisMonth} />
            <StatTile label="Consistency" value={`${summary.consistency}%`} />
          </div>
        </div>
      ) : null}
    </>
  );
}
