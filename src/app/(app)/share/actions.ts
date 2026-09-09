"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { createShareCard, shareUrl, type ShareDraft } from "@/server/share";
import { streakFor } from "@/server/habit";

export type PublishResult =
  | { ok: true; token: string; url: string; imageUrl: string }
  | { ok: false; message: string };

/**
 * Publishes a card. Every value is re-derived server-side from the user's own
 * record, so a tampered client can't inflate a streak or attach someone's data.
 */
export async function publishShareCard(input: {
  variant: string;
  includeQuote: boolean;
  includeGoal: boolean;
}): Promise<PublishResult> {
  const user = await requireUser();
  const summary = await streakFor(user);

  const variant = ["STREAK", "MILESTONE", "CHALLENGE", "TOTAL"].includes(input.variant)
    ? (input.variant as ShareDraft["variant"])
    : "STREAK";

  const [quote, goal, challenge] = await Promise.all([
    input.includeQuote
      ? prisma.quoteImpression.findFirst({
          where: { userId: user.id },
          orderBy: { shownOn: "desc" },
          include: { quote: true },
        })
      : null,
    input.includeGoal
      ? prisma.userGoal.findFirst({
          where: { userId: user.id },
          include: { goal: true },
          orderBy: { goal: { sortOrder: "asc" } },
        })
      : null,
    variant === "CHALLENGE"
      ? prisma.userChallenge.findFirst({
          where: { userId: user.id, status: "ACTIVE" },
          include: { challenge: true },
          orderBy: { createdAt: "desc" },
        })
      : null,
  ]);

  let headline: string;
  let subline: string | null;

  if (variant === "CHALLENGE" && challenge) {
    headline = challenge.challenge.title.toUpperCase();
    subline = `Day ${Math.min(summary.totalDays, challenge.challenge.durationDays)} of ${
      challenge.challenge.durationDays
    }`;
  } else if (variant === "TOTAL") {
    headline = `${summary.totalDays} DAYS OF KEEPING IT SPICY`;
    subline = "Small habit. Big fire.";
  } else {
    headline = `${summary.current} DAY HOT STREAK`;
    subline = summary.current > 0 ? "Small habit. Big fire." : "Starting today.";
  }

  const card = await createShareCard(user.id, {
    variant,
    headline,
    subline,
    streak: summary.current,
    totalDays: summary.totalDays,
    quoteText: quote?.quote.text ?? null,
    goalLabel: goal?.goal.label ?? null,
  });

  const url = shareUrl(card.token);
  return {
    ok: true,
    token: card.token,
    url,
    imageUrl: `/api/share/${card.token}/image?format=square`,
  };
}
