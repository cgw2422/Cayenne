
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

export const DEFAULT_TONE: Tone = "FUNNY";
