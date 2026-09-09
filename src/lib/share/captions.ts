import type { CardStats, ShareKind } from "@/lib/share/types";

export const CAPTION_STYLES = ["CASUAL", "MOTIVATIONAL", "FUNNY", "SHORT"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const CAPTION_STYLE_LABEL: Record<CaptionStyle, string> = {
  CASUAL: "Casual",
  MOTIVATIONAL: "Motivational",
  FUNNY: "Funny",
  SHORT: "Short",
};

/**
 * Captions the user can copy. They read like a person posting, not like an app
 * asking to be posted about — the graphic already carries the branding, so the
 * words never mention the app.
 */
export function captionsFor(
  kind: ShareKind,
  stats: CardStats,
): Record<CaptionStyle, string> {
  const streak = stats.currentStreak;
  const total = stats.daysLogged;
  const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

  const byKind: Partial<Record<ShareKind, Record<CaptionStyle, string>>> = {
    HOT_STREAK: {
      CASUAL: `Day ${streak} 🌶️ Didn't think I'd actually keep up with it this long, but here we are 😂`,
      MOTIVATIONAL: `${days(streak)} straight. Turns out the small stuff adds up 🔥`,
      FUNNY: `Apparently I'm officially on a hot streak 🌶️😂`,
      SHORT: `${days(streak)} straight 🔥`,
    },
    JOURNEY: {
      CASUAL: `Been tracking my cayenne routine for a while now. ${stats.elapsedDays} days in 🌶️`,
      MOTIVATIONAL: `${stats.elapsedDays} days since I started. ${total} of them logged. Still going 🔥`,
      FUNNY: `${stats.elapsedDays} days of putting cayenne in things. This is who I am now 🌶️😂`,
      SHORT: `${stats.elapsedDays} days in 🌶️`,
    },
    ACHIEVEMENT: {
      CASUAL: `Unlocked "${stats.achievementTitle ?? "a new badge"}" today 🏆 Small win but I'll take it`,
      MOTIVATIONAL: `${stats.achievementTitle ?? "Another badge"} 🏆 Kept showing up and it added up.`,
      FUNNY: `I have achievements for eating spice now. Life is good 🌶️🏆`,
      SHORT: `${stats.achievementTitle ?? "Badge unlocked"} 🏆`,
    },
    CHALLENGE: {
      CASUAL: `Day ${stats.challengeDaysLogged ?? 0} of the ${stats.challengeTitle ?? "challenge"} 🌶️ Going better than I expected`,
      MOTIVATIONAL: `Day ${stats.challengeDaysLogged ?? 0} of ${stats.challengeDurationDays ?? 30}. Not stopping now 🔥`,
      FUNNY: `Signed up for a ${stats.challengeDurationDays ?? 30}-day challenge. Past the point where I can quietly quit 😂`,
      SHORT: `Day ${stats.challengeDaysLogged ?? 0}/${stats.challengeDurationDays ?? 30} 🔥`,
    },
    PROGRESS: {
      CASUAL: `${total} days logged so far 🌶️ Kind of surprised at how it's stacked up`,
      MOTIVATIONAL: `${total} days in the books. Consistency does the heavy lifting 🔥`,
      FUNNY: `${total} days of cayenne. My spice rack has never been so respected 😂`,
      SHORT: `${total} days logged 🌶️`,
    },
    PEP_TALK: {
      CASUAL: `Needed to hear this today 🌶️`,
      MOTIVATIONAL: `Keeping this one close this week 🔥`,
      FUNNY: `Getting life advice from a pepper app. It's working though 😂`,
      SHORT: `Needed this 🌶️`,
    },
    MONTHLY_RECAP: {
      CASUAL: `${stats.monthLabel ?? "This month"} recap 🌶️ ${stats.monthDaysLogged ?? 0} out of ${stats.monthDaysTotal ?? 30} days. Happy with that`,
      MOTIVATIONAL: `${stats.monthDaysLogged ?? 0} days this ${stats.monthLabel ? stats.monthLabel : "month"}. Showing up beats being perfect 🔥`,
      FUNNY: `Monthly report card: ${stats.monthDaysLogged ?? 0}/${stats.monthDaysTotal ?? 30}. Better attendance than I had at school 😂`,
      SHORT: `${stats.monthDaysLogged ?? 0}/${stats.monthDaysTotal ?? 30} this month 🌶️`,
    },
  };

  return (
    byKind[kind] ?? {
      CASUAL: `${days(streak)} of keeping it spicy 🌶️`,
      MOTIVATIONAL: `Still going. ${days(streak)} straight 🔥`,
      FUNNY: `This is a cayenne update. You're welcome 😂🌶️`,
      SHORT: `${days(streak)} 🔥`,
    }
  );
}
