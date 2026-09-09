import "server-only";

import type { ShareCard } from "@prisma/client";

import { buildSpec } from "@/lib/share/spec";
import type { IconName } from "@/lib/share/icons";
import type { CardStats, ShareToggles } from "@/lib/share/types";

/** Rebuilds the stats and toggles a published card was created with. */
export function statsFromCard(card: ShareCard): CardStats {
  return {
    displayName: "",
    currentStreak: card.streak,
    longestStreak: card.longestStreak,
    daysLogged: card.totalDays,
    consistencyPct: card.consistency,
    elapsedDays: card.daysSinceStart,
    startedOn: card.startedOnLabel,
    todayLabel: card.todayLabel ?? "",
    amountLabel: card.amountLabel,
    methodLabel: card.methodLabel,
    methodIcon: (card.methodIcon as IconName | null) ?? null,
    achievementTitle: card.achievementTitle,
    achievementDescription: card.achievementBlurb,
    achievementValue: card.achievementValue,
    challengeTitle: card.challengeTitle,
    challengeDaysLogged: card.challengeDay,
    challengeDurationDays: card.challengeTotal,
    monthLabel: card.monthLabel,
    monthDaysLogged: card.monthDaysLogged,
    monthDaysTotal: card.monthDaysTotal,
    monthAchievements: card.monthAchievements,
    quote: card.quoteText,
  };
}

export function togglesFromCard(card: ShareCard): ShareToggles {
  return {
    streak: card.showStreak,
    totalDays: card.showTotalDays,
    longestStreak: card.showLongestStreak,
    consistency: card.showConsistency,
    challenge: card.showChallenge,
    amount: card.showAmount,
    method: card.showMethod,
    startDate: card.showStartDate,
    achievement: card.showAchievement,
    quote: card.showQuote,
  };
}

export function specFromCard(card: ShareCard) {
  const line = card.customLine
    ? { custom: card.customLine }
    : { index: card.lineIndex ?? 0 };
  return buildSpec(card.kind, statsFromCard(card), togglesFromCard(card), card.tone, line);
}

/** Maps stats + toggles onto the snapshot columns a card stores. */
export function cardColumnsFrom(stats: CardStats, toggles: ShareToggles) {
  return {
    streak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalDays: stats.daysLogged,
    consistency: stats.consistencyPct,
    daysSinceStart: stats.elapsedDays,
    startedOnLabel: stats.startedOn,
    todayLabel: stats.todayLabel,
    amountLabel: stats.amountLabel,
    methodLabel: stats.methodLabel,
    methodIcon: stats.methodIcon,
    achievementTitle: stats.achievementTitle,
    achievementBlurb: stats.achievementDescription,
    achievementValue: stats.achievementValue,
    challengeTitle: stats.challengeTitle,
    challengeDay: stats.challengeDaysLogged,
    challengeTotal: stats.challengeDurationDays,
    monthLabel: stats.monthLabel,
    monthDaysLogged: stats.monthDaysLogged,
    monthDaysTotal: stats.monthDaysTotal,
    monthAchievements: stats.monthAchievements,
    quoteText: stats.quote?.slice(0, 240) ?? null,
    showStreak: toggles.streak,
    showTotalDays: toggles.totalDays,
    showLongestStreak: toggles.longestStreak,
    showConsistency: toggles.consistency,
    showChallenge: toggles.challenge,
    showAmount: toggles.amount,
    showMethod: toggles.method,
    showStartDate: toggles.startDate,
    showAchievement: toggles.achievement,
    showQuote: toggles.quote,
  };
}
