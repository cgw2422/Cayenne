import type { IconName } from "@/lib/share/icons";

/** The seven things a user can share. */
export const SHARE_KINDS = [
  "HOT_STREAK",
  "JOURNEY",
  "ACHIEVEMENT",
  "CHALLENGE",
  "PROGRESS",
  "PEP_TALK",
  "MONTHLY_RECAP",
] as const;

export type ShareKind = (typeof SHARE_KINDS)[number];

export const KIND_META: Record<
  ShareKind,
  { icon: string; label: string; blurb: string }
> = {
  HOT_STREAK: { icon: "🔥", label: "My Hot Streak", blurb: "The number, big and loud." },
  JOURNEY: { icon: "🌶️", label: "My Cayenne Journey", blurb: "The whole story so far." },
  ACHIEVEMENT: { icon: "🏆", label: "An Achievement", blurb: "A badge you've earned." },
  CHALLENGE: { icon: "🎯", label: "Challenge Progress", blurb: "How far into the challenge." },
  PROGRESS: { icon: "📈", label: "My Progress", blurb: "Days, consistency, streaks." },
  PEP_TALK: { icon: "💬", label: "Today's Pep Talk", blurb: "Just the line that landed." },
  MONTHLY_RECAP: { icon: "📅", label: "Monthly Recap", blurb: "A month, summed up." },
};

/** Six designed themes. Users swipe between them before exporting. */
export const THEME_IDS = [
  "SIGNATURE",
  "ON_FIRE",
  "FRESH_CAYENNE",
  "MASCOT",
  "MINIMAL",
  "FACEBOOK",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_LABEL: Record<ThemeId, string> = {
  SIGNATURE: "Signature",
  ON_FIRE: "On Fire",
  FRESH_CAYENNE: "Fresh Cayenne",
  MASCOT: "Mascot",
  MINIMAL: "Minimal",
  FACEBOOK: "Facebook",
};

/** Export sizes. Facebook is the default — it's the distribution channel. */
export const SIZES = {
  FACEBOOK: { width: 1200, height: 1500, label: "Facebook post", short: "FB" },
  INSTAGRAM: { width: 1080, height: 1350, label: "Instagram post", short: "IG" },
  STORY: { width: 1080, height: 1920, label: "Story", short: "Story" },
  SQUARE: { width: 1080, height: 1080, label: "Square", short: "Square" },
} as const;

export type SizeId = keyof typeof SIZES;

/**
 * What the user has chosen to put on the card.
 *
 * Everything here is public-safe by construction: there is no toggle for weight,
 * blood pressure, glucose, measurements or journal notes, and the renderer has
 * no access to them. Private data cannot reach a card even by mistake.
 */
export type ShareToggles = {
  streak: boolean;
  totalDays: boolean;
  longestStreak: boolean;
  consistency: boolean;
  challenge: boolean;
  amount: boolean;
  method: boolean;
  startDate: boolean;
  achievement: boolean;
  quote: boolean;
};

export const DEFAULT_TOGGLES: ShareToggles = {
  streak: true,
  totalDays: true,
  longestStreak: true,
  consistency: false,
  challenge: false,
  amount: false,
  method: false,
  startDate: false,
  achievement: false,
  quote: true,
};

export const TOGGLE_LABEL: Record<keyof ShareToggles, string> = {
  streak: "Current streak",
  totalDays: "Total days",
  longestStreak: "Longest streak",
  consistency: "Consistency",
  challenge: "Challenge",
  amount: "Usual amount",
  method: "Favourite method",
  startDate: "Start date",
  achievement: "Achievement",
  quote: "Quote",
};

/** Which toggles are meaningful for each card type. */
export const KIND_TOGGLES: Record<ShareKind, (keyof ShareToggles)[]> = {
  HOT_STREAK: ["longestStreak", "totalDays", "quote"],
  JOURNEY: ["totalDays", "longestStreak", "consistency", "startDate", "quote"],
  ACHIEVEMENT: ["streak", "totalDays", "quote"],
  CHALLENGE: ["streak", "totalDays", "quote"],
  PROGRESS: ["streak", "totalDays", "longestStreak", "consistency", "amount", "method", "quote"],
  PEP_TALK: ["streak", "totalDays"],
  MONTHLY_RECAP: ["longestStreak", "amount", "method", "achievement", "quote"],
};

/**
 * The verified, server-derived numbers a card can draw from. Built only from the
 * user's own habit data — never from anything the client sends.
 */
export type CardStats = {
  displayName: string;
  streak: number;
  longestStreak: number;
  totalDays: number;
  consistency: number;
  daysSinceStart: number;
  startedOn: string | null;
  todayLabel: string;
  amountLabel: string | null;
  methodLabel: string | null;
  methodIcon: IconName | null;
  achievementTitle: string | null;
  achievementDescription: string | null;
  achievementValue: number | null;
  challengeTitle: string | null;
  challengeDay: number | null;
  challengeTotal: number | null;
  monthLabel: string | null;
  monthDaysLogged: number | null;
  monthDaysTotal: number | null;
  monthAchievements: number | null;
  quote: string | null;
};

/** A layout-agnostic description of one card. Themes decide how it looks. */
export type CardSpec = {
  kind: ShareKind;
  eyebrow: string | null;
  heroValue: string | null;
  heroUnit: string | null;
  heroTitle: string | null;
  subline: string | null;
  stats: { icon: IconName; label: string; value: string }[];
  /** The line with personality. This is the scroll-stopper, not a stat. */
  voice: string;
  /** Quiet descriptor under the voice line, e.g. "30 Day Hot Streak". */
  descriptor: string | null;
  quote: string | null;
  ring: { done: number; total: number; percent: number } | null;
  footnote: string | null;
};
