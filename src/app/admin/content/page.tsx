import Link from "next/link";

import { Panel } from "@/components/admin/shell";
import {
  AchievementsManager,
  ChallengesManager,
  QuotesManager,
} from "@/components/admin/ContentManager";
import { cx } from "@/components/ui/primitives";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/server/admin/guard";
import { saveAchievementWording, saveChallenge, saveQuote, setQuoteActive } from "./actions";

export const metadata = { title: "Content · Admin" };
export const dynamic = "force-dynamic";

const TABS = [
  ["quotes", "Quotes"],
  ["challenges", "Challenges"],
  ["achievements", "Achievements"],
] as const;

type Tab = (typeof TABS)[number][0];

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage();

  const raw = (await searchParams).tab;
  const tab: Tab = TABS.some(([key]) => key === raw) ? (raw as Tab) : "quotes";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Content</h1>
        <p className="text-xs text-slate-500">
          Copy changes take effect immediately — no deploy. Nothing here is ever
          deleted; retired items stop appearing but keep their history.
        </p>
      </div>

      <nav aria-label="Content sections" className="flex gap-1">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/content?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cx(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              tab === key
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "quotes" ? <Quotes /> : null}
      {tab === "challenges" ? <Challenges /> : null}
      {tab === "achievements" ? <Achievements /> : null}
    </div>
  );
}

async function Quotes() {
  const quotes = await prisma.quote.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { text: "asc" }],
    select: {
      id: true,
      text: true,
      category: true,
      tone: true,
      milestoneDays: true,
      isActive: true,
      _count: { select: { impressions: true } },
    },
  });

  return (
    <Panel title={`Quotes · ${quotes.length}`}>
      <QuotesManager
        quotes={quotes.map((q) => ({
          id: q.id,
          text: q.text,
          category: q.category,
          tone: q.tone,
          milestoneDays: q.milestoneDays,
          isActive: q.isActive,
          impressions: q._count.impressions,
        }))}
        onSave={saveQuote}
        onSetActive={setQuoteActive}
      />
    </Panel>
  );
}

async function Challenges() {
  const challenges = await prisma.challenge.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      durationDays: true,
      isPremium: true,
      isActive: true,
      _count: { select: { participants: true } },
    },
  });

  return (
    <Panel title={`Challenges · ${challenges.length}`}>
      <ChallengesManager
        challenges={challenges.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          durationDays: c.durationDays,
          isPremium: c.isPremium,
          isActive: c.isActive,
          participants: c._count.participants,
        }))}
        onSave={saveChallenge}
      />
    </Panel>
  );
}

async function Achievements() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { threshold: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      kind: true,
      threshold: true,
      _count: { select: { unlocks: true } },
    },
  });

  return (
    <Panel title={`Achievements · ${achievements.length}`}>
      <AchievementsManager
        achievements={achievements.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          description: a.description,
          kind: a.kind,
          threshold: a.threshold,
          unlocks: a._count.unlocks,
        }))}
        onSave={saveAchievementWording}
      />
    </Panel>
  );
}
