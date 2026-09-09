import type { ShareKind } from "@/lib/share/types";

/**
 * The line that makes a card sound like a person rather than an app.
 *
 * "21 days of showing up." is accurate and forgettable. "Two weeks in and I'm
 * weirdly proud of this." is what somebody stops to read — and, crucially, what
 * the person posting would actually have typed themselves.
 *
 * Tone changes the words only. Every number on the card is unchanged.
 */
export const TONES = ["CLEAN", "FUNNY", "MOTIVATIONAL", "PROUD"] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABEL: Record<Tone, string> = {
  CLEAN: "Clean",
  FUNNY: "Funny",
  MOTIVATIONAL: "Motivational",
  PROUD: "Proud",
};

export const TONE_BLURB: Record<Tone, string> = {
  CLEAN: "Just the facts, well said.",
  FUNNY: "Self-deprecating, a bit daft.",
  MOTIVATIONAL: "Warm, encouraging, not preachy.",
  PROUD: "Quietly pleased with yourself.",
};

type ToneLines = Record<Tone, string>;

/** Streak milestones, from the top down. First match wins. */
const STREAK_BANDS: { min: number; lines: ToneLines }[] = [
  {
    min: 365,
    lines: {
      CLEAN: "One year. Every single day.",
      FUNNY: "One year. At this point it's a personality trait.",
      MOTIVATIONAL: "A year of small choices, repeated.",
      PROUD: "One year. I'm a different person. Slightly hotter.",
    },
  },
  {
    min: 180,
    lines: {
      CLEAN: "Half a year, unbroken.",
      FUNNY: "Half a year. My spice rack has a favourite child.",
      MOTIVATIONAL: "Six months of choosing it again.",
      PROUD: "Six months in. I've stopped explaining it to people.",
    },
  },
  {
    min: 90,
    lines: {
      CLEAN: "Ninety days, no gaps.",
      FUNNY: "Ninety days. Somebody check on me. (I'm great.)",
      MOTIVATIONAL: "Ninety days. This is just who I am now.",
      PROUD: "Ninety days. Definitely not a phase.",
    },
  },
  {
    min: 60,
    lines: {
      CLEAN: "Two months, every day.",
      FUNNY: "Two months. I don't even flinch anymore.",
      MOTIVATIONAL: "Sixty days of showing up for myself.",
      PROUD: "Two months in. Turns out I can commit to things.",
    },
  },
  {
    min: 30,
    lines: {
      CLEAN: "One month, every single day.",
      FUNNY: "A whole month. Who is she.",
      MOTIVATIONAL: "Thirty days. Things are getting spicy.",
      PROUD: "Thirty days. I actually did the thing.",
    },
  },
  {
    min: 14,
    lines: {
      CLEAN: "Two weeks, unbroken.",
      FUNNY: "Two weeks in and I'm weirdly proud of this.",
      MOTIVATIONAL: "Two weeks. The habit is doing the work now.",
      PROUD: "Two weeks without missing one. I'll take that.",
    },
  },
  {
    min: 7,
    lines: {
      CLEAN: "One week, every day.",
      FUNNY: "A full week. Okay, I might be a pepper person now.",
      MOTIVATIONAL: "A week of showing up. That's how it builds.",
      PROUD: "Seven days straight. Quietly pleased with myself.",
    },
  },
  {
    min: 3,
    lines: {
      CLEAN: "Three days in a row.",
      FUNNY: "Three days. Basically an expert.",
      MOTIVATIONAL: "Three days is a pattern forming.",
      PROUD: "Three days and I haven't skipped one.",
    },
  },
  {
    min: 0,
    lines: {
      CLEAN: "Day one. The streak starts here.",
      FUNNY: "Day one. Ask me again in a week.",
      MOTIVATIONAL: "Everything starts with one day.",
      PROUD: "Started. That's the hard part done.",
    },
  },
];

/** Card types whose line shouldn't be about the streak. */
const KIND_LINES: Partial<Record<ShareKind, ToneLines>> = {
  JOURNEY: {
    CLEAN: "Every day since I started.",
    FUNNY: "Started as an experiment. Now it's just breakfast.",
    MOTIVATIONAL: "Somewhere in here it stopped being a challenge.",
    PROUD: "Look how far that's come.",
  },
  ACHIEVEMENT: {
    CLEAN: "Badge unlocked.",
    FUNNY: "I have achievements for eating spice now.",
    MOTIVATIONAL: "Turns out showing up is the whole trick.",
    PROUD: "Earned this one.",
  },
  CHALLENGE: {
    CLEAN: "Partway through the challenge.",
    FUNNY: "Too far in to quietly give up now.",
    MOTIVATIONAL: "Past the hard part. Finishing this one.",
    PROUD: "Further than I thought I'd get.",
  },
  PROGRESS: {
    CLEAN: "Where things stand.",
    FUNNY: "Doing the most, a quarter teaspoon at a time.",
    MOTIVATIONAL: "None of these days felt like much. They add up.",
    PROUD: "All of that, one day at a time.",
  },
  MONTHLY_RECAP: {
    CLEAN: "How the month went.",
    FUNNY: "Better attendance than I managed at school.",
    MOTIVATIONAL: "Not perfect. Kept going anyway.",
    PROUD: "Genuinely happy with that month.",
  },
  PEP_TALK: {
    CLEAN: "Worth keeping.",
    FUNNY: "Getting life advice from a pepper app. It's working.",
    MOTIVATIONAL: "Keeping this one close this week.",
    PROUD: "Needed to hear this today.",
  },
};

export const DEFAULT_TONE: Tone = "FUNNY";

/** The card's headline voice. Deterministic: preview and export always agree. */
export function voiceFor(kind: ShareKind, streak: number, tone: Tone): string {
  const lines =
    KIND_LINES[kind] ??
    STREAK_BANDS.find((band) => streak >= band.min)?.lines ??
    STREAK_BANDS[STREAK_BANDS.length - 1].lines;
  return lines[tone] ?? lines.CLEAN;
}
