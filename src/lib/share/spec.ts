import type { IconName } from "@/lib/share/icons";
import { descriptorFor, voiceFor } from "@/lib/share/voice";
import type { CardSpec, CardStats, ShareKind, ShareToggles } from "@/lib/share/types";

/**
 * Turns verified stats plus the user's toggles into a layout-agnostic card spec.
 * Themes render this; they never touch the raw stats. Adding a card type means
 * adding a branch here, not touching any theme.
 */
export function buildSpec(
  kind: ShareKind,
  stats: CardStats,
  toggles: ShareToggles,
): CardSpec {
  const chip = (icon: IconName, label: string, value: string) => ({ icon, label, value });
  const quote = toggles.quote && stats.quote ? stats.quote : null;
  const voice = voiceFor(kind, stats.streak, stats.totalDays);
  const descriptor = descriptorFor(kind, {
    challengeTitle: stats.challengeTitle,
    achievementTitle: stats.achievementTitle,
  });

  switch (kind) {
    case "HOT_STREAK": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.longestStreak) {
        stats_.push(chip("flame", "Longest streak", `${stats.longestStreak}`));
      }
      if (toggles.totalDays) {
        stats_.push(chip("pepper", "Total cayenne days", `${stats.totalDays}`));
      }
      return {
        kind,
        eyebrow: null,
        heroValue: `${stats.streak}`,
        heroUnit: "DAY HOT STREAK",
        heroTitle: null,
        subline: null,
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: null,
        footnote: null,
      };
    }

    case "JOURNEY": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.totalDays) stats_.push(chip("pepper", "Days logged", `${stats.totalDays}`));
      if (toggles.longestStreak) {
        stats_.push(chip("flame", "Longest streak", `${stats.longestStreak}`));
      }
      if (toggles.consistency) {
        stats_.push(chip("trend", "Consistency", `${stats.consistency}%`));
      }
      return {
        kind,
        eyebrow: "MY CAYENNE JOURNEY",
        heroValue: `${stats.daysSinceStart}`,
        heroUnit: "DAYS",
        heroTitle: null,
        subline: null,
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: null,
        footnote:
          toggles.startDate && stats.startedOn
            ? `Started ${stats.startedOn}  ·  Still going ${stats.todayLabel}`
            : null,
      };
    }

    case "ACHIEVEMENT": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.streak) chipPush(stats_, chip("flame", "Day streak", `${stats.streak}`));
      if (toggles.totalDays) {
        chipPush(stats_, chip("pepper", "Total days", `${stats.totalDays}`));
      }
      // Lead with the number when there is one: "30 / RED HOT" reads as a
      // milestone, where the badge name alone reads as a notification.
      const numeric = stats.achievementValue && stats.achievementValue > 1;
      return {
        kind,
        eyebrow: "I DID IT.",
        heroValue: numeric ? `${stats.achievementValue}` : null,
        heroUnit: numeric ? (stats.achievementTitle ?? "").toUpperCase() : null,
        heroTitle: numeric ? null : (stats.achievementTitle ?? "Achievement unlocked"),
        subline: stats.achievementDescription ?? "Another badge in the collection.",
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: null,
        footnote: null,
      };
    }

    case "CHALLENGE": {
      const day = stats.challengeDay ?? 0;
      const total = stats.challengeTotal ?? 30;
      const percent = total > 0 ? Math.round((day / total) * 100) : 0;
      const left = Math.max(0, total - day);
      const stats_: CardSpec["stats"] = [];
      if (toggles.streak) stats_.push(chip("flame", "Day streak", `${stats.streak}`));
      if (toggles.totalDays) stats_.push(chip("pepper", "Total days", `${stats.totalDays}`));
      return {
        kind,
        eyebrow: (stats.challengeTitle ?? "Cayenne Challenge").toUpperCase(),
        heroValue: `DAY ${day} / ${total}`,
        heroUnit: null,
        heroTitle: null,
        subline: left > 0 ? `${left} ${left === 1 ? "day" : "days"} to go` : "Complete.",
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: { done: day, total, percent },
        footnote: null,
      };
    }

    case "PROGRESS": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.streak) stats_.push(chip("flame", "Current streak", `${stats.streak}`));
      if (toggles.longestStreak) {
        stats_.push(chip("trophy", "Longest streak", `${stats.longestStreak}`));
      }
      if (toggles.totalDays) stats_.push(chip("pepper", "Days logged", `${stats.totalDays}`));
      if (toggles.consistency) {
        stats_.push(chip("trend", "Consistency", `${stats.consistency}%`));
      }
      if (toggles.amount && stats.amountLabel) {
        stats_.push(chip("spoon", "Usual amount", stats.amountLabel));
      }
      if (toggles.method && stats.methodLabel) {
        stats_.push(chip(stats.methodIcon ?? "glass", "Favourite method", stats.methodLabel));
      }
      return {
        kind,
        eyebrow: "MY PROGRESS",
        heroValue: `${stats.totalDays}`,
        heroUnit: stats.totalDays === 1 ? "DAY LOGGED" : "DAYS LOGGED",
        heroTitle: null,
        subline: null,
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: null,
        footnote: null,
      };
    }

    case "PEP_TALK": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.streak && stats.streak > 0) {
        stats_.push(chip("flame", "Day streak", `${stats.streak}`));
      }
      if (toggles.totalDays) stats_.push(chip("pepper", "Days logged", `${stats.totalDays}`));
      return {
        kind,
        eyebrow: null,
        heroValue: null,
        heroUnit: null,
        heroTitle: stats.quote ?? "Small habit. Big fire.",
        subline: null,
        voice,
        descriptor,
        stats: stats_,
        quote: null,
        ring: null,
        footnote: null,
      };
    }

    case "MONTHLY_RECAP": {
      const stats_: CardSpec["stats"] = [];
      if (toggles.longestStreak) {
        stats_.push(chip("flame", "Longest streak", `${stats.longestStreak}`));
      }
      if (toggles.amount && stats.amountLabel) {
        stats_.push(chip("pepper", "Most common", stats.amountLabel));
      }
      if (toggles.method && stats.methodLabel) {
        stats_.push(chip(stats.methodIcon ?? "glass", "Favourite method", stats.methodLabel));
      }
      if (toggles.achievement && stats.monthAchievements) {
        stats_.push(chip("trophy", "Achievements", `${stats.monthAchievements}`));
      }
      return {
        kind,
        eyebrow: `MY ${(stats.monthLabel ?? "MONTH").toUpperCase()} CAYENNE RECAP`,
        heroValue: `${stats.monthDaysLogged ?? 0} / ${stats.monthDaysTotal ?? 30}`,
        heroUnit: "DAYS LOGGED",
        heroTitle: null,
        subline: "Keeping it spicy.",
        voice,
        descriptor,
        stats: stats_,
        quote,
        ring: null,
        footnote: null,
      };
    }
  }
}

/** Caps a stat row at three chips — four wraps badly at every export size. */
function chipPush(list: CardSpec["stats"], value: CardSpec["stats"][number]) {
  if (list.length < 3) list.push(value);
}
