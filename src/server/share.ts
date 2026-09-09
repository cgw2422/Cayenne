import "server-only";

import { randomBytes } from "node:crypto";
import type { ShareVariant } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { MILESTONE_TITLES, type Milestone } from "@/lib/streak";

export type ShareDraft = {
  variant: ShareVariant;
  headline: string;
  subline: string | null;
  streak: number;
  totalDays: number;
  quoteText: string | null;
  goalLabel: string | null;
};

/**
 * Builds the card options for a user's current state.
 *
 * Only ever reads streak counts, day totals and the user's own goal *label*.
 * Journal entries, notes, measurements and moods are deliberately unreachable
 * from here — a share card physically cannot leak them.
 */
export function draftsFor(input: {
  streak: number;
  totalDays: number;
  quote: string | null;
  goalLabel: string | null;
  challenge: { title: string; done: number; total: number } | null;
}): ShareDraft[] {
  const drafts: ShareDraft[] = [];
  const milestoneTitle = MILESTONE_TITLES[input.streak as Milestone];

  if (input.streak > 0) {
    drafts.push({
      variant: milestoneTitle ? "MILESTONE" : "STREAK",
      headline: `${input.streak} DAY HOT STREAK`,
      subline: milestoneTitle ?? "Small habit. Big fire.",
      streak: input.streak,
      totalDays: input.totalDays,
      quoteText: input.quote,
      goalLabel: input.goalLabel,
    });
  }

  if (input.totalDays > 0) {
    drafts.push({
      variant: "TOTAL",
      headline: `${input.totalDays} DAYS OF KEEPING IT SPICY`,
      subline: "Small habit. Big fire.",
      streak: input.streak,
      totalDays: input.totalDays,
      quoteText: input.quote,
      goalLabel: input.goalLabel,
    });
  }

  if (input.challenge) {
    drafts.push({
      variant: "CHALLENGE",
      headline: input.challenge.title.toUpperCase(),
      subline: `Day ${input.challenge.done} of ${input.challenge.total}`,
      streak: input.streak,
      totalDays: input.totalDays,
      quoteText: input.quote,
      goalLabel: input.goalLabel,
    });
  }

  if (!drafts.length) {
    drafts.push({
      variant: "STREAK",
      headline: "DAY ONE",
      subline: "Small habit. Big fire.",
      streak: 0,
      totalDays: 0,
      quoteText: input.quote,
      goalLabel: input.goalLabel,
    });
  }

  return drafts;
}

export async function createShareCard(userId: string, draft: ShareDraft) {
  return prisma.shareCard.create({
    data: {
      userId,
      token: randomBytes(9).toString("base64url"),
      variant: draft.variant,
      headline: draft.headline.slice(0, 80),
      subline: draft.subline?.slice(0, 120) ?? null,
      streak: draft.streak,
      totalDays: draft.totalDays,
      quoteText: draft.quoteText?.slice(0, 160) ?? null,
      goalLabel: draft.goalLabel?.slice(0, 60) ?? null,
    },
  });
}

export function shareUrl(token: string) {
  return `${siteUrl()}/s/${token}`;
}
