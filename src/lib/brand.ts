/** Brand constants — one source of truth for copy, colours and vocabulary. */

export const BRAND = {
  name: "Cayenne Do It",
  tagline: "Small habit. Big fire.",
  description:
    "Build your cayenne habit, track your journey, and see your progress over time.",
} as const;

export const BRAND_COLORS = {
  cayenne: "#D92D20",
  ember: "#F15A24",
  pepper: "#12372A",
  cream: "#FFF7E8",
  charcoal: "#202020",
  white: "#FFFFFF",
} as const;

/** Rotating secondary phrases. Kept short so they never wrap on a phone. */
export const PHRASES = [
  "Yes, Cayenne.",
  "You Cayenne Do It.",
  "Keep it spicy.",
  "Keep the fire going.",
  "A little heat today.",
  "Stay spicy.",
  "You're on a hot streak.",
  "Pepperformance unlocked.",
] as const;

export const STREAK_BROKEN_COPY = "The streak cooled off. Light it back up.";

export const METHOD_META = {
  WATER: { label: "Water", icon: "🥤" },
  TEA: { label: "Tea", icon: "☕" },
  FOOD: { label: "Food", icon: "🍽️" },
  SHOT: { label: "Shot", icon: "🥃" },
  CAPSULE: { label: "Capsule", icon: "💊" },
  OTHER: { label: "Other", icon: "•••" },
} as const;

export const MOOD_META = [
  { value: 1, label: "Terrible", icon: "😖" },
  { value: 2, label: "Not great", icon: "😕" },
  { value: 3, label: "Okay", icon: "🙂" },
  { value: 4, label: "Good", icon: "😄" },
  { value: 5, label: "Great", icon: "🤩" },
] as const;

export const AMOUNT_PRESETS = [
  { label: "1/8 tsp", amount: 0.125, unit: "TSP" as const },
  { label: "1/4 tsp", amount: 0.25, unit: "TSP" as const },
  { label: "1/2 tsp", amount: 0.5, unit: "TSP" as const },
  { label: "1 tsp", amount: 1, unit: "TSP" as const },
];

export const UNIT_LABEL = {
  TSP: "tsp",
  MG: "mg",
  G: "g",
  CAPSULE: "capsule",
} as const;

/** Renders 0.25 as "1/4" so amounts read the way people say them. */
export function formatAmount(amount: number, unit: keyof typeof UNIT_LABEL): string {
  const suffix = UNIT_LABEL[unit];
  if (unit !== "TSP") {
    const n = Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
    return `${n} ${suffix}${unit === "CAPSULE" && n !== 1 ? "s" : ""}`;
  }
  const fractions: Record<string, string> = {
    "0.125": "1/8",
    "0.25": "1/4",
    "0.333": "1/3",
    "0.5": "1/2",
    "0.75": "3/4",
  };
  const whole = Math.floor(amount);
  const rest = Number((amount - whole).toFixed(3));
  const fraction = fractions[String(rest)];
  if (rest === 0) return `${whole} ${suffix}`;
  if (fraction) return `${whole > 0 ? `${whole} ` : ""}${fraction} ${suffix}`;
  return `${Number(amount.toFixed(3))} ${suffix}`;
}
