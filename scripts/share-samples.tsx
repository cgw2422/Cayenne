/**
 * Renders sample share cards to disk, straight through the production renderer.
 *
 *   npm run share:samples [outDir]
 *
 * Use it when working on templates: what lands on disk is byte-identical to what
 * the app serves, so designs can be judged at real export size without clicking
 * through the studio.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { buildSpec } from "@/lib/share/spec";
import { DEFAULT_TONE } from "@/lib/share/voice";
import { renderCard } from "@/server/share/render";
import {
  DEFAULT_TOGGLES,
  SIZES,
  THEME_IDS,
  type CardStats,
  type ShareKind,
  type SizeId,
  type ThemeId,
} from "@/lib/share/types";

const OUT = process.argv[2] ?? path.join(process.cwd(), "tmp", "cards");

/** A representative user: mid-journey, mid-challenge, real numbers. */
const STATS: CardStats = {
  displayName: "Chris",
  streak: 21,
  longestStreak: 21,
  totalDays: 47,
  consistency: 84,
  daysSinceStart: 56,
  startedOn: "Sat, Jul 15, 2026",
  todayLabel: "Tue, Sep 9, 2026",
  amountLabel: "1/4 tsp",
  methodLabel: "Water",
  methodIcon: "glass",
  achievementTitle: "Red Hot",
  achievementDescription: "Reach a 30-day streak.",
  achievementValue: 30,
  challengeTitle: "30-Day Hot Streak",
  challengeDay: 21,
  challengeTotal: 30,
  monthLabel: "August",
  monthDaysLogged: 27,
  monthDaysTotal: 31,
  monthAchievements: 3,
  quote: "Consistency is hotter than motivation.",
};

async function main() {
  mkdirSync(OUT, { recursive: true });

  const fontDir = path.join(process.cwd(), "assets", "fonts");
  const fonts = await Promise.all(
    ([700, 800, 900] as const).map(async (weight) => ({
      name: "Nunito",
      data: (await readFile(path.join(fontDir, `Nunito-${weight}.ttf`))) as unknown as ArrayBuffer,
      weight,
      style: "normal" as const,
    })),
  );

  async function write(
    name: string,
    kind: ShareKind,
    theme: ThemeId,
    size: SizeId,
    toggles = DEFAULT_TOGGLES,
    scale = 1,
  ) {
    const width = Math.round(SIZES[size].width * scale);
    const height = Math.round(SIZES[size].height * scale);
    const image = new ImageResponse(
      renderCard(buildSpec(kind, STATS, toggles, DEFAULT_TONE), theme, { width, height }),
      { width, height, fonts },
    );
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(await image.arrayBuffer()));
  }

  const jobs: Promise<void>[] = [];

  // Every theme, same card, so they can be compared directly.
  for (const theme of THEME_IDS) {
    jobs.push(write(`streak-${theme}`, "HOT_STREAK", theme, "FACEBOOK"));
  }

  // Each card type on the theme it defaults to.
  const kinds: [ShareKind, ThemeId, typeof DEFAULT_TOGGLES][] = [
    ["JOURNEY", "SIGNATURE", { ...DEFAULT_TOGGLES, consistency: true, startDate: true }],
    ["CHALLENGE", "ON_FIRE", { ...DEFAULT_TOGGLES, streak: true }],
    ["ACHIEVEMENT", "MASCOT", DEFAULT_TOGGLES],
    [
      "MONTHLY_RECAP",
      "FRESH_CAYENNE",
      { ...DEFAULT_TOGGLES, amount: true, method: true, achievement: true },
    ],
    ["PROGRESS", "FACEBOOK", { ...DEFAULT_TOGGLES, consistency: true, method: true }],
    ["PEP_TALK", "MINIMAL", DEFAULT_TOGGLES],
  ];
  for (const [kind, theme, toggles] of kinds) {
    jobs.push(write(`kind-${kind}-${theme}`, kind, theme, "FACEBOOK", toggles));
  }

  // Every export size, so nothing overflows on the tall ones.
  for (const size of Object.keys(SIZES) as SizeId[]) {
    jobs.push(write(`size-${size}`, "HOT_STREAK", "FACEBOOK", size));
  }

  // Thumbnails at Facebook feed width. Any text that fails to read here fails
  // in the feed, which is the only place these actually get seen.
  const THUMB = 350 / 1200;
  for (const theme of THEME_IDS) {
    jobs.push(write(`thumb-${theme}`, "HOT_STREAK", theme, "FACEBOOK", DEFAULT_TOGGLES, THUMB));
  }

  await Promise.all(jobs);
  console.log(`Rendered ${jobs.length} sample cards to ${OUT}`);
}

main();
