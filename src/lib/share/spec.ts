import type { IconName } from "@/lib/share/icons";
import { voiceFor, type Tone } from "@/lib/share/voice";
import type { CardSpec, CardStats, ShareKind, ShareToggles } from "@/lib/share/types";

/**
 * Turns verified stats, the user's toggles and their chosen tone into a
 * layout-agnostic spec.
 *
 * Each card type gets a genuinely different shape — a streak card leads with a
 * number, a journey card with a rail between two dates, a pep talk with nothing
 * but the line. The theme then supplies palette and chrome, so seven shapes and
 * six themes stay independent instead of multiplying.
 *
 * Restraint is deliberate: at Facebook feed width these render at roughly 29%,
 * so anything secondary is either large or absent. Two stats is the ceiling.
 */
export function buildSpec(
  kind: ShareKind,
  stats: CardStats,
  toggles: ShareToggles,
  tone: Tone,
): CardSpec {
  const chip = (icon: IconName, label: string, value: string) => ({ icon, label, value });
  const quote = toggles.quote && stats.quote ? stats.quote : null;
  const voice = voiceFor(kind, stats.streak, tone);

  const base = {
    kind,
    eyebrow: null,
    heroValue: null,
    heroUnit: null,
    heroTitle: null,
    subline: null,
    voice,
    stats: [],
    rail: null,
    quote: null,
    ring: null,
    footnote: null,
  } satisfies CardSpec;

  switch (kind) {
    // The number is the whole card. One supporting stat at most.
    case "HOT_STREAK":
      return {
        ...base,
        heroValue: `${stats.streak}`,
        heroUnit: stats.streak === 1 ? "DAY HOT STREAK" : "DAY HOT STREAK",
        stats: toggles.totalDays
          ? [chip("pepper", "Days logged", `${stats.totalDays}`)]
          : [],
      };

    // A rail between two dates: the shape says "this went on a while".
    case "JOURNEY":
      return {
        ...base,
        eyebrow: "MY CAYENNE JOURNEY",
        heroValue: `${stats.daysSinceStart}`,
        heroUnit: "DAYS IN",
        rail:
          toggles.startDate && stats.startedOn
            ? { from: shortDate(stats.startedOn), to: shortDate(stats.todayLabel) }
            : null,
        stats: toggles.totalDays
          ? [chip("pepper", "Days logged", `${stats.totalDays}`)]
          : [],
      };

    // Mascot-led. The badge name is the headline, the threshold the number.
    case "ACHIEVEMENT": {
      const numeric = stats.achievementValue && stats.achievementValue > 1;
      return {
        ...base,
        eyebrow: "I DID IT.",
        heroValue: numeric ? `${stats.achievementValue}` : null,
        heroTitle: numeric ? null : (stats.achievementTitle ?? "Badge unlocked"),
        heroUnit: numeric ? (stats.achievementTitle ?? "").toUpperCase() : null,
      };
    }

    // The ring dominates; the number lives inside it.
    case "CHALLENGE": {
      const day = stats.challengeDay ?? 0;
      const total = stats.challengeTotal ?? 30;
      return {
        ...base,
        eyebrow: (stats.challengeTitle ?? "Cayenne Challenge").toUpperCase(),
        ring: {
          done: day,
          total,
          percent: total > 0 ? Math.round((day / total) * 100) : 0,
        },
        heroUnit: `DAY ${day} OF ${total}`,
      };
    }

    // The one card where stacked numbers are the point.
    case "PROGRESS": {
      const rows: CardSpec["stats"] = [];
      if (toggles.longestStreak) {
        rows.push(chip("flame", "Longest streak", `${stats.longestStreak}`));
      }
      if (toggles.consistency) {
        rows.push(chip("trend", "Consistency", `${stats.consistency}%`));
      }
      if (!rows.length && toggles.streak) {
        rows.push(chip("flame", "Current streak", `${stats.streak}`));
      }
      return {
        ...base,
        eyebrow: "MY PROGRESS",
        heroValue: `${stats.totalDays}`,
        heroUnit: stats.totalDays === 1 ? "DAY LOGGED" : "DAYS LOGGED",
        stats: rows.slice(0, 2),
      };
    }

    // The month name is the hero; the ratio sits under it.
    case "MONTHLY_RECAP":
      return {
        ...base,
        eyebrow: "CAYENNE RECAP",
        heroTitle: (stats.monthLabel ?? "This month").toUpperCase(),
        heroUnit: `${stats.monthDaysLogged ?? 0} OF ${stats.monthDaysTotal ?? 30} DAYS`,
        stats: toggles.longestStreak
          ? [chip("flame", "Longest streak", `${stats.longestStreak}`)]
          : [],
      };

    // No number at all. The line is the card.
    case "PEP_TALK":
      return {
        ...base,
        heroTitle: stats.quote ?? "Small habit. Big fire.",
        quote: null,
      };
  }

  // Unreachable: every ShareKind is handled above.
  return { ...base, quote };
}

/** "Sat, Jul 15, 2026" → "15 Jul 2026", which fits the rail at feed size. */
function shortDate(label: string): string {
  const parts = label.replace(/^[A-Za-z]{3},\s*/, "");
  const match = parts.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  return match ? `${match[2]} ${match[1]} ${match[3]}` : parts;
}
