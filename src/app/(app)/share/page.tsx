import Link from "next/link";

import { ShareStudio } from "@/components/share/ShareStudio";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { buildCardStats } from "@/server/share/stats";
import { defaultThemeFor } from "@/lib/share/themes";
import { SHARE_KINDS, type ShareKind } from "@/lib/share/types";
import {
  forgetLine,
  lineOptions,
  publishShareCard,
  quoteChoices,
  saveLine,
  trackShareEvent,
  uploadSharePhoto,
} from "./actions";

export const metadata = { title: "Share Studio" };
export const dynamic = "force-dynamic";

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; achievement?: string }>;
}) {
  const { kind: rawKind, achievement } = await searchParams;
  const user = await requireUser();

  const initialKind = (SHARE_KINDS as readonly string[]).includes(rawKind ?? "")
    ? (rawKind as ShareKind)
    : null;

  const [stats, quotes, hasChallenge, achievementCount] = await Promise.all([
    buildCardStats(user, { achievementId: achievement }),
    quoteChoices(),
    prisma.userChallenge.count({ where: { userId: user.id, status: "ACTIVE" } }),
    prisma.userAchievement.count({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-2 pt-5">
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
        <h1 className="text-xl font-extrabold text-charcoal-900">Share Studio</h1>
      </header>

      <ShareStudio
        initialKind={initialKind}
        initialTheme={defaultThemeFor(initialKind ?? "HOT_STREAK")}
        achievementId={achievement ?? null}
        todaysQuote={stats.quote}
        quotes={quotes}
        available={{
          challenge: hasChallenge > 0,
          achievement: achievementCount > 0,
          quote: Boolean(stats.quote),
          amount: Boolean(stats.amountLabel),
          method: Boolean(stats.methodLabel),
        }}
        onPublish={publishShareCard}
        onTrack={trackShareEvent}
        onLineOptions={lineOptions}
        onSaveLine={saveLine}
        onForgetLine={forgetLine}
        onUploadPhoto={uploadSharePhoto}
      />
    </>
  );
}
