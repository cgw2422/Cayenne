import type { ShareKind } from "@/lib/share/types";

/**
 * The line that makes a card read like a person posting rather than an app
 * reporting. "21 days of showing up." is accurate and boring; "Okay… I might
 * actually be a pepper person now." is the thing someone stops to read.
 *
 * Selection is deterministic on the numbers, never random: the studio preview
 * and the published card must produce the same line, or the export won't match
 * what the user approved.
 */

const STREAK_VOICE: { min: number; lines: string[] }[] = [
  { min: 365, lines: [
    "One year of this. I'm a different person. Slightly hotter.",
    "365 days. At this point cayenne is a personality trait.",
  ] },
  { min: 180, lines: [
    "Half a year. My spice rack has a favourite child.",
    "180 days. I've stopped explaining it to people.",
  ] },
  { min: 90, lines: [
    "Ninety days. This isn't a phase, it's just who I am now.",
    "90 days in. Somebody check on me. (I'm great.)",
  ] },
  { min: 60, lines: [
    "Two months. I don't even flinch anymore.",
    "60 days. Turns out I can commit to things.",
  ] },
  { min: 30, lines: [
    "Things are officially getting spicy.",
    "A whole month. Who is she.",
  ] },
  { min: 14, lines: [
    "Two weeks in and I'm weirdly proud of this.",
    "Fourteen days. It's a habit now, apparently.",
  ] },
  { min: 7, lines: [
    "A full week. Okay, I might actually be a pepper person now.",
    "Seven days straight. Didn't see that coming.",
  ] },
  { min: 3, lines: [
    "Three days in and still going. Small win, but I'll take it.",
    "Day three. The streak is real.",
  ] },
  { min: 1, lines: [
    "Started. That's the hard part done.",
    "Day one. Here we go.",
  ] },
];

const KIND_VOICE: Partial<Record<ShareKind, string[]>> = {
  JOURNEY: [
    "Started as an experiment. Now it's just breakfast.",
    "Somewhere in here it stopped being a challenge and became a routine.",
  ],
  ACHIEVEMENT: [
    "Turns out showing up is the whole trick.",
    "Didn't set out to collect these. Here we are.",
  ],
  CHALLENGE: [
    "Past the point where I could quietly give up.",
    "Too far in to stop now, honestly.",
  ],
  PROGRESS: [
    "Small thing, done a lot of times.",
    "None of these days felt like much. Together they add up.",
  ],
  MONTHLY_RECAP: [
    "Better attendance than I managed at school.",
    "Not perfect. Kept going anyway.",
  ],
};

/**
 * Picks a line deterministically. Two people on day 30 may see different lines;
 * the same person on day 30 always sees the same one.
 */
export function voiceFor(kind: ShareKind, streak: number, totalDays: number): string {
  const pool =
    KIND_VOICE[kind] ??
    STREAK_VOICE.find((band) => streak >= band.min)?.lines ??
    STREAK_VOICE[STREAK_VOICE.length - 1].lines;

  // A cheap stable hash of the numbers, so the choice never moves under a user.
  const seed = (streak * 31 + totalDays * 17 + kind.length * 7) >>> 0;
  return pool[seed % pool.length];
}

/**
 * A quiet line above the lockup. Only used where it adds something the hero
 * doesn't already say — on a streak card the unit already reads "DAY HOT
 * STREAK", so repeating it there is noise.
 */
export function descriptorFor(
  kind: ShareKind,
  context: { challengeTitle?: string | null; achievementTitle?: string | null },
): string | null {
  if (kind === "CHALLENGE" && context.challengeTitle) return context.challengeTitle;
  if (kind === "ACHIEVEMENT" && context.achievementTitle) return context.achievementTitle;
  return null;
}
