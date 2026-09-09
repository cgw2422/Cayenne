import type { CardStats, ShareKind } from "@/lib/share/types";
import type { Tone } from "@/lib/share/voice";

/**
 * The share-line library.
 *
 * Two rules shaped every line here. First, it has to sound like a person typing
 * into a Facebook group — self-aware, a bit dry, occasionally daft — not like an
 * app congratulating someone. Second, a line may only appear when it is actually
 * true of the user's numbers: "haven't missed one" is gated on a perfect record,
 * "missed a few" on an imperfect one. A line that flatters inaccurately is worse
 * than a dull one.
 */
export type Line = {
  text: string;
  tone: Tone;
  /** Optional guard. When present, the line is only offered if this holds. */
  when?: (s: CardStats) => boolean;
};

const perfect = (s: CardStats) => s.daysLogged >= s.elapsedDays;
const imperfect = (s: CardStats) => s.daysLogged < s.elapsedDays;
const perfectMonth = (s: CardStats) =>
  s.monthDaysLogged !== null &&
  s.monthDaysTotal !== null &&
  s.monthDaysLogged >= s.monthDaysTotal;
const partialMonth = (s: CardStats) =>
  s.monthDaysLogged !== null &&
  s.monthDaysTotal !== null &&
  s.monthDaysLogged < s.monthDaysTotal;
const streakAtLeast = (n: number) => (s: CardStats) => s.currentStreak >= n;
const comebackish = (s: CardStats) =>
  s.longestStreak > s.currentStreak && s.currentStreak > 0;
const challengeNearlyDone = (s: CardStats) =>
  s.challengeDaysLogged !== null &&
  s.challengeDurationDays !== null &&
  s.challengeDaysLogged >= s.challengeDurationDays * 0.75;
const challengeEarly = (s: CardStats) =>
  s.challengeDaysLogged !== null &&
  s.challengeDurationDays !== null &&
  s.challengeDaysLogged < s.challengeDurationDays * 0.4;

/** Streak lines, keyed by the milestone band they belong to. */
const STREAK_BANDS: { min: number; lines: Line[] }[] = [
  {
    min: 365,
    lines: [
      { tone: "CLEAN", text: "A year of this. Every single day." },
      { tone: "CLEAN", text: "Three hundred and sixty-five days." },
      { tone: "MOTIVATIONAL", text: "A year built one ordinary day at a time." },
      { tone: "FUNNY", text: "One year. At this point it's a personality trait." },
      { tone: "FUNNY", text: "A year in. The cayenne knows my schedule now." },
      { tone: "MOTIVATIONAL", text: "A year of small choices, repeated." },
      { tone: "PROUD", text: "One year. I'm a different person. Slightly hotter." },
      { tone: "PROUD", text: "A full year without missing. Still can't quite believe it.", when: perfect },
    ],
  },
  {
    min: 180,
    lines: [
      { tone: "CLEAN", text: "Half a year, unbroken." },
      { tone: "CLEAN", text: "One hundred and eighty days." },
      { tone: "MOTIVATIONAL", text: "Half a year of turning up. It compounds." },
      { tone: "FUNNY", text: "Half a year. My spice rack has a favourite child." },
      { tone: "FUNNY", text: "Six months. I've started buying cayenne in bulk." },
      { tone: "MOTIVATIONAL", text: "Six months of choosing it again." },
      { tone: "PROUD", text: "Six months in. I've stopped explaining it to people." },
      { tone: "PROUD", text: "Half a year. Apparently I do have consistency. Who knew?" },
    ],
  },
  {
    min: 90,
    lines: [
      { tone: "CLEAN", text: "Ninety days, no gaps." },
      { tone: "CLEAN", text: "Three months, day after day." },
      { tone: "MOTIVATIONAL", text: "Ninety days of the same small decision." },
      { tone: "FUNNY", text: "Ninety days. Somebody check on me. (I'm great.)" },
      { tone: "FUNNY", text: "Three months of this. It's just Tuesday now." },
      { tone: "MOTIVATIONAL", text: "Ninety days. This is just who I am now." },
      { tone: "PROUD", text: "Ninety days. Definitely not a phase." },
      { tone: "PROUD", text: "Three months and counting. Quietly chuffed." },
    ],
  },
  {
    min: 60,
    lines: [
      { tone: "CLEAN", text: "Two months, every day." },
      { tone: "CLEAN", text: "Sixty days on the board." },
      { tone: "MOTIVATIONAL", text: "Two months of not negotiating with myself." },
      { tone: "FUNNY", text: "Two months. I don't even flinch anymore." },
      { tone: "FUNNY", text: "Sixty days. My tolerance is frankly showing off." },
      { tone: "MOTIVATIONAL", text: "Sixty days of showing up for myself." },
      { tone: "PROUD", text: "Two months in. Turns out I can commit to things." },
      { tone: "PROUD", text: "Sixty days. Past the point where it takes effort." },
    ],
  },
  {
    min: 30,
    lines: [
      { tone: "CLEAN", text: "One month, every single day." },
      { tone: "CLEAN", text: "Thirty days, back to back." },
      { tone: "MOTIVATIONAL", text: "A month of showing up. That's the whole trick." },
      { tone: "FUNNY", text: "A whole month. Who is she." },
      { tone: "FUNNY", text: "Thirty days. At this point the cayenne knows my schedule." },
      { tone: "MOTIVATIONAL", text: "Thirty days. Things are getting spicy." },
      { tone: "PROUD", text: "Thirty days. I actually did the thing." },
      { tone: "PROUD", text: "A month straight. Genuinely did not expect this of myself." },
    ],
  },
  {
    min: 21,
    lines: [
      { tone: "CLEAN", text: "Three weeks, unbroken." },
      { tone: "CLEAN", text: "Twenty-one days." },
      { tone: "MOTIVATIONAL", text: "Three weeks and it's starting to run itself." },
      { tone: "FUNNY", text: "Three weeks in and I'm weirdly proud of this." },
      { tone: "FUNNY", text: "Twenty-one days. It's a bit of a thing now." },
      { tone: "MOTIVATIONAL", text: "Three weeks. Long enough for it to stick." },
      { tone: "PROUD", text: "Three weeks and I haven't skipped one." , when: perfect },
      { tone: "PROUD", text: "Three weeks. Happy with that." },
    ],
  },
  {
    min: 14,
    lines: [
      { tone: "CLEAN", text: "Two weeks, unbroken." },
      { tone: "CLEAN", text: "Fourteen days on the trot." },
      { tone: "MOTIVATIONAL", text: "Fourteen days. The hard bit's behind me." },
      { tone: "FUNNY", text: "Two weeks in and I'm weirdly proud of this." },
      { tone: "FUNNY", text: "Fourteen days. My kitchen smells like commitment." },
      { tone: "MOTIVATIONAL", text: "Two weeks. The habit is doing the work now." },
      { tone: "PROUD", text: "Two weeks without missing one. I'll take that." },
      { tone: "PROUD", text: "Fortnight down. Small, but it counts." },
    ],
  },
  {
    min: 7,
    lines: [
      { tone: "CLEAN", text: "One week, every day." },
      { tone: "CLEAN", text: "Seven days, no gaps." },
      { tone: "MOTIVATIONAL", text: "One week down. This is how it starts." },
      { tone: "FUNNY", text: "A full week. Okay, I might be a pepper person now." },
      { tone: "FUNNY", text: "Seven days. Nobody warned me I'd enjoy this." },
      { tone: "MOTIVATIONAL", text: "A week of showing up. That's how it builds." },
      { tone: "PROUD", text: "Seven days straight. Quietly pleased with myself." },
      { tone: "PROUD", text: "One week in. Further than I usually get." },
    ],
  },
  {
    min: 3,
    lines: [
      { tone: "CLEAN", text: "Three days in a row." },
      { tone: "CLEAN", text: "Day three." },
      { tone: "MOTIVATIONAL", text: "Three days. Early, but real." },
      { tone: "FUNNY", text: "Three days. Basically an expert." },
      { tone: "FUNNY", text: "Day three and I haven't told anyone yet. Until now." },
      { tone: "MOTIVATIONAL", text: "Three days is a pattern forming." },
      { tone: "PROUD", text: "Three days and I haven't skipped one." },
      { tone: "PROUD", text: "Small start, but it's a start." },
    ],
  },
  {
    min: 0,
    lines: [
      { tone: "CLEAN", text: "Day one. The streak starts here." },
      { tone: "CLEAN", text: "Starting today." },
      { tone: "MOTIVATIONAL", text: "Day one counts as much as any of them." },
      { tone: "FUNNY", text: "Day one. Ask me again in a week." },
      { tone: "FUNNY", text: "Starting a cayenne habit. This is my Roman Empire now." },
      { tone: "MOTIVATIONAL", text: "Everything starts with one day." },
      { tone: "PROUD", text: "Started. That's the hard part done." },
      { tone: "PROUD", text: "Back at it. New streak, same goal.", when: comebackish },
    ],
  },
];

/**
 * Streak lines that hold at any length. Every band is thin on its own — six
 * lines split four ways is not something you can tap through — so these are
 * always in the pool alongside the matched band.
 */
const STREAK_ANY: Line[] = [
  { tone: "CLEAN", text: "The streak, as it stands." },
  { tone: "CLEAN", text: "No gaps in the current run." },
  { tone: "CLEAN", text: "Where the streak is at today." },
  { tone: "CLEAN", text: "Every day since day one.", when: perfect },
  { tone: "FUNNY", text: "The streak is now emotionally load-bearing.", when: streakAtLeast(7) },
  { tone: "FUNNY", text: "I check this number more than my bank balance." },
  { tone: "FUNNY", text: "Please do not talk to me about breaking this." },
  { tone: "FUNNY", text: "My one measurable personality trait." },
  { tone: "MOTIVATIONAL", text: "Kept the chain going again today." },
  { tone: "MOTIVATIONAL", text: "One day at a time is the only way this works." },
  { tone: "MOTIVATIONAL", text: "The streak isn't the point. It just proves the habit." },
  { tone: "MOTIVATIONAL", text: "Turned up again. That's the whole method." },
  { tone: "PROUD", text: "Haven't broken it yet." },
  { tone: "PROUD", text: "Longer than my last three good intentions." },
  { tone: "PROUD", text: "This one I'm keeping." },
  { tone: "PROUD", text: "Broke the last one. Building this one better.", when: comebackish },
];

/** Lines for the card types that aren't about the streak. */
const KIND_LINES: Record<Exclude<ShareKind, "HOT_STREAK">, Line[]> = {
  JOURNEY: [
    { tone: "CLEAN", text: "The whole run so far." },
    { tone: "CLEAN", text: "Start date to today." },
    { tone: "FUNNY", text: "I have a start date for this. That's the kind of person I am now." },
    { tone: "MOTIVATIONAL", text: "Every one of these days was optional. I did them anyway." },
    { tone: "MOTIVATIONAL", text: "This is what slow looks like when it works." },
    { tone: "PROUD", text: "Longer than I expected to last, if I'm honest." },
    { tone: "CLEAN", text: "Every day since I started." },
    { tone: "CLEAN", text: "Still going, all this time later." },
    { tone: "FUNNY", text: "Started as an experiment. Now it's just breakfast." },
    { tone: "FUNNY", text: "Began as a dare to myself. Nobody else was involved." },
    { tone: "FUNNY", text: "At this point the cayenne knows my schedule.", when: streakAtLeast(30) },
    { tone: "MOTIVATIONAL", text: "Somewhere in here it stopped being a challenge." },
    { tone: "MOTIVATIONAL", text: "None of these days felt big. Look at them together." },
    { tone: "PROUD", text: "Look how far that's come." },
    { tone: "PROUD", text: "Missed a few. Kept going anyway.", when: imperfect },
    { tone: "PROUD", text: "Haven't missed a single one.", when: perfect },
    { tone: "PROUD", text: "Not perfect. Still progress.", when: imperfect },
    { tone: "CLEAN", text: "A long, unremarkable, quite good habit." },
  ],
  ACHIEVEMENT: [
    { tone: "CLEAN", text: "Unlocked today." },
    { tone: "MOTIVATIONAL", text: "Nothing clever. Just repetition." },
    { tone: "MOTIVATIONAL", text: "Showed up enough times that it added up to this." },
    { tone: "PROUD", text: "Been eyeing this one for a while." },
    { tone: "FUNNY", text: "Collecting badges for a spice habit. This is my life." },
    { tone: "CLEAN", text: "Badge unlocked." },
    { tone: "CLEAN", text: "That one's earned." },
    { tone: "FUNNY", text: "Didn't set out to collect these. Here we are." },
    { tone: "FUNNY", text: "I have achievements for eating spice now." },
    { tone: "FUNNY", text: "My phone gave me a medal. I'll allow it." },
    { tone: "MOTIVATIONAL", text: "Turns out showing up is the whole trick." },
    { tone: "MOTIVATIONAL", text: "Earned the slow way, which is the only way." },
    { tone: "PROUD", text: "Earned this one." },
    { tone: "PROUD", text: "Took a while. Worth it." },
    { tone: "PROUD", text: "Been chasing this one for weeks." },
    { tone: "CLEAN", text: "One more off the list." },
    { tone: "FUNNY", text: "Achievement unlocked: mild spice-based smugness." },
  ],
  CHALLENGE: [
    { tone: "CLEAN", text: "Days done, days to go." },
    { tone: "MOTIVATIONAL", text: "Committed to a number and I'm walking it." },
    { tone: "MOTIVATIONAL", text: "One day closer than yesterday." },
    { tone: "PROUD", text: "Said I'd do it. Doing it." },
    { tone: "FUNNY", text: "Voluntarily signed up for this. Regret is minimal." },
    { tone: "CLEAN", text: "Partway through the challenge." },
    { tone: "CLEAN", text: "On track, so far." },
    { tone: "FUNNY", text: "Too far in to quietly give up now." },
    { tone: "FUNNY", text: "Past the point where I could pretend I never started." , when: challengeNearlyDone },
    { tone: "FUNNY", text: "Early days. Ask me if I'm still doing this next week.", when: challengeEarly },
    { tone: "MOTIVATIONAL", text: "Past the hard part. Finishing this one." },
    { tone: "MOTIVATIONAL", text: "The middle is the bit that counts." },
    { tone: "PROUD", text: "Further than I thought I'd get." },
    { tone: "PROUD", text: "Nearly there, and still going.", when: challengeNearlyDone },
    { tone: "PROUD", text: "Signed up on a whim. Actually doing it." },
    { tone: "CLEAN", text: "Halfway is still halfway." },
    { tone: "FUNNY", text: "I told people I was doing this, so now I have to." },
  ],
  PROGRESS: [
    { tone: "CLEAN", text: "Everything so far, in numbers." },
    { tone: "MOTIVATIONAL", text: "The boring version of progress, which is the one that works." },
    { tone: "MOTIVATIONAL", text: "Nothing dramatic. Just a lot of days." },
    { tone: "PROUD", text: "Happy enough with those numbers." },
    { tone: "FUNNY", text: "Numbers go up. Simple creature, me." },
    { tone: "CLEAN", text: "Where things stand." },
    { tone: "CLEAN", text: "The running total." },
    { tone: "FUNNY", text: "Doing the most, a quarter teaspoon at a time." },
    { tone: "FUNNY", text: "Apparently I do have consistency. Who knew?" },
    { tone: "FUNNY", text: "This is what my free time looks like now." },
    { tone: "MOTIVATIONAL", text: "None of these days felt like much. They add up." },
    { tone: "MOTIVATIONAL", text: "Small thing, done a lot of times." },
    { tone: "PROUD", text: "All of that, one day at a time." },
    { tone: "PROUD", text: "Missed a few. Kept going anyway.", when: imperfect },
    { tone: "PROUD", text: "Not one missed day in there.", when: perfect },
    { tone: "PROUD", text: "Not perfect. Still progress.", when: imperfect },
    { tone: "CLEAN", text: "Adding up quietly." },
  ],
  MONTHLY_RECAP: [
    { tone: "CLEAN", text: "The month, in numbers." },
    { tone: "MOTIVATIONAL", text: "One month of small decisions." },
    { tone: "MOTIVATIONAL", text: "Whatever else happened this month, this held." },
    { tone: "PROUD", text: "Pleased with how that one landed." },
    { tone: "FUNNY", text: "My month, summarised by a pepper." },
    { tone: "CLEAN", text: "How the month went." },
    { tone: "CLEAN", text: "A decent month.", when: partialMonth },
    { tone: "FUNNY", text: "Better attendance than I managed at school." },
    { tone: "FUNNY", text: "Missed a few. We move." , when: partialMonth },
    { tone: "FUNNY", text: "A clean sweep. I'm insufferable about it.", when: perfectMonth },
    { tone: "MOTIVATIONAL", text: "Not perfect. Kept going anyway.", when: partialMonth },
    { tone: "MOTIVATIONAL", text: "Every one of those days was a choice." },
    { tone: "PROUD", text: "Genuinely happy with that month." },
    { tone: "PROUD", text: "Every single day this month.", when: perfectMonth },
    { tone: "PROUD", text: "Not perfect. Still progress.", when: partialMonth },
    { tone: "CLEAN", text: "Another month on the board." },
    { tone: "FUNNY", text: "My calendar has never looked so spicy." },
  ],
  PEP_TALK: [
    { tone: "CLEAN", text: "Saving this one." },
    { tone: "CLEAN", text: "This one's staying up." },
    { tone: "FUNNY", text: "My habit tracker is out here doing therapy." },
    { tone: "FUNNY", text: "Read this. Ate the cayenne. Fine, then." },
    { tone: "MOTIVATIONAL", text: "Reading this one twice." },
    { tone: "MOTIVATIONAL", text: "Putting this somewhere I'll see it." },
    { tone: "PROUD", text: "This is the one that got me here." },
    { tone: "PROUD", text: "Been leaning on this all week." },
    { tone: "CLEAN", text: "Worth keeping." },
    { tone: "CLEAN", text: "Filing this one away." },
    { tone: "FUNNY", text: "Getting life advice from a pepper app. It's working." },
    { tone: "FUNNY", text: "Called out by my own habit tracker." },
    { tone: "MOTIVATIONAL", text: "Keeping this one close this week." },
    { tone: "MOTIVATIONAL", text: "Needed the reminder more than I'd admit." },
    { tone: "PROUD", text: "Needed to hear this today." },
    { tone: "PROUD", text: "Sticking this one on the fridge." },
  ],
};

/**
 * Every line that is both in the right voice and true of these numbers, in a
 * stable order so "next phrase" always walks the same list.
 */
export function linesFor(kind: ShareKind, tone: Tone, stats: CardStats): string[] {
  const pool =
    kind === "HOT_STREAK"
      ? [
          ...(STREAK_BANDS.find((band) => stats.currentStreak >= band.min)?.lines ?? []),
          ...STREAK_ANY,
        ]
      : KIND_LINES[kind];

  const inTone = pool.filter((l) => l.tone === tone && (!l.when || l.when(stats)));
  // Fall back to any true line rather than showing nothing.
  const usable = inTone.length
    ? inTone
    : pool.filter((l) => !l.when || l.when(stats));

  return usable.map((l) => l.text);
}

/** The line at `index`, wrapping around. Deterministic for a given index. */
export function lineAt(
  kind: ShareKind,
  tone: Tone,
  stats: CardStats,
  index: number,
): string {
  const lines = linesFor(kind, tone, stats);
  if (!lines.length) return "Small habit. Big fire.";
  return lines[((index % lines.length) + lines.length) % lines.length];
}

/** Total lines in the library, used by the test that guards the minimum. */
export function libraryStats() {
  const streak =
    STREAK_BANDS.reduce((n, band) => n + band.lines.length, 0) + STREAK_ANY.length;
  const kinds = Object.values(KIND_LINES).reduce((n, lines) => n + lines.length, 0);
  return { streak, kinds, total: streak + kinds };
}
