import Link from "next/link";

import { ShareStudio } from "@/components/ShareStudio";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { streakFor, userToday } from "@/server/habit";
import { MILESTONE_TITLES, type Milestone } from "@/lib/streak";
import { publishShareCard } from "./actions";

export const metadata = { title: "Share your progress" };
export const dynamic = "force-dynamic";

export default async function SharePage() {
  const user = await requireUser();
  const today = userToday(user);
  const summary = await streakFor(user);

  const [impression, goal, challenge] = await Promise.all([
    prisma.quoteImpression.findFirst({
      where: { userId: user.id },
      orderBy: { shownOn: "desc" },
      include: { quote: true },
    }),
    prisma.userGoal.findFirst({
      where: { userId: user.id },
      include: { goal: true },
      orderBy: { goal: { sortOrder: "asc" } },
    }),
    prisma.userChallenge.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { challenge: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const milestoneTitle = MILESTONE_TITLES[summary.current as Milestone];

  const options = [
    {
      key: "STREAK",
      label: "Streak",
      headline: `${summary.current} DAY HOT STREAK`,
      subline: milestoneTitle ?? "Small habit. Big fire.",
      available: true,
    },
    {
      key: "TOTAL",
      label: "Total days",
      headline: `${summary.totalDays} DAYS OF KEEPING IT SPICY`,
      subline: "Small habit. Big fire.",
      available: summary.totalDays > 0,
    },
    {
      key: "CHALLENGE",
      label: "Challenge",
      headline: (challenge?.challenge.title ?? "CHALLENGE").toUpperCase(),
      subline: challenge
        ? `Day ${Math.min(summary.totalDays, challenge.challenge.durationDays)} of ${
            challenge.challenge.durationDays
          }`
        : "Start one first",
      available: Boolean(challenge),
    },
  ];

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Link
          href="/home"
          aria-label="Back to home"
          className="tap grid place-items-center rounded-full text-charcoal-700"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m14.5 5-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-xl font-extrabold text-charcoal-900">Share your progress</h1>
      </header>

      <ShareStudio
        options={options}
        streak={summary.current}
        totalDays={summary.totalDays}
        quote={
          impression && impression.shownOn.toISOString().slice(0, 10) === today
            ? impression.quote.text
            : (impression?.quote.text ?? null)
        }
        goalLabel={goal?.goal.label ?? null}
        onPublish={publishShareCard}
      />
    </>
  );
}
