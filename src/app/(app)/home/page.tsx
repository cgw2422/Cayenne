import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { StreakRing } from "@/components/ui/StreakRing";
import { Flame } from "@/components/ui/Flame";
import { Mascot } from "@/components/ui/Mascot";
import { ButtonLink, Card, SectionTitle, StatTile, cx } from "@/components/ui/primitives";
import { WelcomeToast } from "@/components/WelcomeToast";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { formatAmount, METHOD_META, STREAK_BROKEN_COPY } from "@/lib/brand";
import { dayKeyFromDateColumn, diffDays } from "@/lib/date";
import { MILESTONE_TITLES, type Milestone } from "@/lib/streak";
import { dosesToday, streakFor, userToday } from "@/server/habit";
import { categoriesForState, quoteOfTheDay } from "@/server/quotes";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const user = await requireUser();
  const today = userToday(user);
  const summary = await streakFor(user);

  // "Cooled off" = they had a run going and it lapsed, so we can offer a comeback line.
  const brokeStreak =
    summary.current === 0 &&
    summary.longest >= 3 &&
    summary.lastLoggedOn !== null &&
    diffDays(summary.lastLoggedOn, today) > 1;

  const [doses, quote, activeChallenge, todaysEntries, unseen] = await Promise.all([
    dosesToday(user),
    quoteOfTheDay(user.id, today, categoriesForState(summary.current, brokeStreak)),
    prisma.userChallenge.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { challenge: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cayenneEntry.findMany({
      where: { userId: user.id },
      orderBy: { takenAt: "desc" },
      take: 3,
    }),
    prisma.userAchievement.count({ where: { userId: user.id, seenAt: null } }),
  ]);

  const milestoneTitle = MILESTONE_TITLES[summary.current as Milestone] as
    | string
    | undefined;

  let challengeProgress: { done: number; total: number; left: number } | null = null;
  if (activeChallenge) {
    const startKey = dayKeyFromDateColumn(activeChallenge.startedOn);
    const done = await prisma.cayenneEntry
      .findMany({
        where: {
          userId: user.id,
          takenOn: { gte: activeChallenge.startedOn },
        },
        distinct: ["takenOn"],
        select: { takenOn: true },
      })
      .then((rows) => rows.length);
    const elapsed = Math.max(0, diffDays(startKey, today) + 1);
    challengeProgress = {
      done: Math.min(done, activeChallenge.challenge.durationDays),
      total: activeChallenge.challenge.durationDays,
      left: Math.max(0, activeChallenge.challenge.durationDays - elapsed + 1),
    };
  }

  return (
    <>
      {welcome ? <WelcomeToast /> : null}
      <AppHeader displayName={user.displayName} unseenCount={unseen} />

      {/* ------------------------------------------------------ hero ring -- */}
      <section className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-cream-50 to-cream-200/70 px-5 pb-6 pt-7 shadow-soft">
          <p className="text-center text-sm font-extrabold uppercase tracking-[0.2em] text-charcoal-500">
            {doses.complete ? "Today's done" : "Your streak"}
          </p>

          <div className="mt-3">
            <StreakRing
              streak={summary.current}
              loggedToday={summary.loggedToday}
              nextMilestone={summary.nextMilestone}
              dosesLogged={doses.logged}
              dosesTarget={doses.target}
            />
          </div>

          <p className="mt-4 text-center text-lg font-extrabold text-charcoal-900">
            {summary.current === 0
              ? brokeStreak
                ? STREAK_BROKEN_COPY
                : "Let's light this thing up."
              : doses.target > 1 && !doses.complete
                ? `${doses.remaining} more ${doses.remaining === 1 ? "dose" : "doses"} today.`
                : milestoneTitle
                  ? `${milestoneTitle}!`
                  : "Keep the fire going."}
          </p>

          <div className="mt-5 grid gap-2.5">
            {doses.complete ? (
              <ButtonLink href="/share" variant="secondary" size="lg" full>
                Share my progress
              </ButtonLink>
            ) : (
              <ButtonLink href="/log" size="lg" full>
                <Flame size={20} />
                {doses.target > 1
                  ? `Log dose ${doses.logged + 1} of ${doses.target}`
                  : summary.current > 0
                    ? "I Cayenne Today"
                    : "Log today's cayenne"}
              </ButtonLink>
            )}

            {!doses.complete && summary.totalDays > 0 ? (
              <ButtonLink href="/share" variant="ghost" size="md" full>
                Share my progress
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- quick stats -- */}
      <section className="grid grid-cols-2 gap-3 px-5 pt-4">
        <StatTile label="Total days" value={summary.totalDays} />
        <StatTile label="This month" value={summary.thisMonth} />
        <StatTile
          label="Longest streak"
          value={summary.longest}
          icon={<Flame size={18} muted={summary.longest === 0} />}
        />
        <StatTile label="Consistency" value={`${summary.consistency}%`} />
      </section>

      {/* ------------------------------------------------------- pep talk -- */}
      {quote ? (
        <section className="px-5 pt-5">
          <SectionTitle>Today&apos;s pep talk</SectionTitle>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-pepper-900 px-5 py-6">
            <Mascot
              pose="wave"
              size={72}
              className="absolute -bottom-2 -right-1 opacity-25"
            />
            <p className="relative max-w-[85%] text-xl font-extrabold leading-snug text-cream-100">
              &ldquo;{quote.text}&rdquo;
            </p>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------ challenge -- */}
      <section className="px-5 pt-5">
        <SectionTitle
          action={
            <Link
              href="/more/challenges"
              className="text-xs font-extrabold text-cayenne-600 underline underline-offset-2"
            >
              {activeChallenge ? "All challenges" : "Browse"}
            </Link>
          }
        >
          Current challenge
        </SectionTitle>

        {activeChallenge && challengeProgress ? (
          <Card>
            <p className="text-lg font-extrabold text-charcoal-900">
              {activeChallenge.challenge.title}
            </p>
            <p className="mt-0.5 text-sm font-bold text-charcoal-500">
              Day {challengeProgress.done} of {challengeProgress.total}
            </p>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-cream-200"
              role="progressbar"
              aria-valuenow={challengeProgress.done}
              aria-valuemin={0}
              aria-valuemax={challengeProgress.total}
              aria-label={`${activeChallenge.challenge.title} progress`}
            >
              <div
                className="h-full rounded-full fire-gradient transition-all duration-700"
                style={{
                  width: `${Math.round(
                    (challengeProgress.done / challengeProgress.total) * 100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-charcoal-500">
              {challengeProgress.left > 0
                ? `${challengeProgress.left} days to go`
                : "Final stretch."}
            </p>
          </Card>
        ) : (
          <Card className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
              🎯
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-charcoal-900">No challenge yet</p>
              <p className="text-sm text-charcoal-500">
                Pick one and give the streak a finish line.
              </p>
            </div>
            <Link
              href="/more/challenges"
              className="shrink-0 text-sm font-extrabold text-cayenne-600 underline underline-offset-2"
            >
              Start
            </Link>
          </Card>
        )}
      </section>

      {/* -------------------------------------------------------- recents -- */}
      {todaysEntries.length ? (
        <section className="px-5 pb-4 pt-5">
          <SectionTitle
            action={
              <Link
                href="/progress"
                className="text-xs font-extrabold text-cayenne-600 underline underline-offset-2"
              >
                See all
              </Link>
            }
          >
            Recent entries
          </SectionTitle>
          <ul className="grid gap-2">
            {todaysEntries.map((entry) => (
              <Card as="li" key={entry.id} className="flex items-center gap-3 py-3">
                <span className="text-xl">{METHOD_META[entry.method].icon}</span>
                <p className="flex-1 truncate font-bold text-charcoal-900">
                  {formatAmount(Number(entry.amount), entry.unit)}
                  <span className="font-semibold text-charcoal-500">
                    {" "}
                    · {METHOD_META[entry.method].label}
                  </span>
                </p>
                <time
                  dateTime={entry.takenAt.toISOString()}
                  className={cx("text-xs font-bold text-charcoal-500")}
                >
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(entry.takenAt)}
                </time>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
