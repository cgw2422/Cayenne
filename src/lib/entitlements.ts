import type { Entitlement } from "@prisma/client";

/**
 * One central entitlement check. Payment providers (Stripe today, Apple/Google
 * IAP later) only ever have to set `User.entitlement` — no provider logic leaks
 * into feature code.
 */
export const FEATURES = {
  UNLIMITED_HISTORY: "unlimited_history",
  ADVANCED_CHARTS: "advanced_charts",
  MEASUREMENTS: "measurements",
  JOURNAL: "journal",
  ALL_CHALLENGES: "all_challenges",
  ACHIEVEMENTS: "achievements",
  FULL_RECIPES: "full_recipes",
  CUSTOM_RECIPES: "custom_recipes",
  ADVANCED_SHARE: "advanced_share",
  DATA_EXPORT: "data_export",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/** Everything a free account gets. The habit loop itself is always free. */
const FREE_FEATURES = new Set<Feature>([]);

export const FREE_HISTORY_DAYS = 7;
export const FREE_RECIPE_LIMIT = 6;

export const LIFETIME_PRICE_USD = 5.99;

export function can(entitlement: Entitlement, feature: Feature): boolean {
  if (entitlement === "LIFETIME") return true;
  return FREE_FEATURES.has(feature);
}

export const FEATURE_COPY: Record<Feature, { title: string; blurb: string }> = {
  [FEATURES.UNLIMITED_HISTORY]: {
    title: "Unlimited history",
    blurb: "Every day you've logged, all the way back to day one.",
  },
  [FEATURES.ADVANCED_CHARTS]: {
    title: "Advanced progress charts",
    blurb: "Amount, mood and consistency trends over any range.",
  },
  [FEATURES.MEASUREMENTS]: {
    title: "Measurements",
    blurb: "Private tracking for weight, waist and other numbers you choose.",
  },
  [FEATURES.JOURNAL]: {
    title: "Journal",
    blurb: "Write down what you notice, whenever you notice it.",
  },
  [FEATURES.ALL_CHALLENGES]: {
    title: "All challenges",
    blurb: "From the 7-Day Kickstart to the 90-Day Cayenne Challenge.",
  },
  [FEATURES.ACHIEVEMENTS]: {
    title: "Achievements",
    blurb: "Collect every badge from First Spark to Cayenne Legend.",
  },
  [FEATURES.FULL_RECIPES]: {
    title: "Full recipe library",
    blurb: "Every drink, meal, snack and quick mix.",
  },
  [FEATURES.CUSTOM_RECIPES]: {
    title: "Custom recipes",
    blurb: "Save your own ways of taking cayenne.",
  },
  [FEATURES.ADVANCED_SHARE]: {
    title: "Advanced share cards",
    blurb: "More card styles for your streak posts.",
  },
  [FEATURES.DATA_EXPORT]: {
    title: "Export my data",
    blurb: "Download everything you've logged, any time.",
  },
};
