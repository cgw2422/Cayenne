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
  STANDARD_THEME_IDS,
  type CardStats,
  type ShareKind,
  type SizeId,
  type ThemeId,
} from "@/lib/share/types";

const OUT = process.argv[2] ?? path.join(process.cwd(), "tmp", "cards");

/** A representative user: mid-journey, mid-challenge, real numbers. */
const STATS: CardStats = {
  displayName: "Chris",
  currentStreak: 7,
  longestStreak: 21,
  daysLogged: 47,
  consistencyPct: 84,
  elapsedDays: 56,
  startedOn: "Sat, Jul 15, 2026",
  todayLabel: "Tue, Sep 9, 2026",
  amountLabel: "1/4 tsp",
  methodLabel: "Water",
  methodIcon: "glass",
  achievementTitle: "Red Hot",
  achievementDescription: "Reach a 30-day streak.",
  achievementValue: 30,
  challengeTitle: "30-Day Hot Streak",
  challengeDaysLogged: 12,
  challengeDurationDays: 30,
  monthLabel: "August",
  monthDaysLogged: 27,
  monthDaysTotal: 31,
  monthAchievements: 3,
  quote: "Consistency is hotter than motivation.",
};

/**
 * Stands in for a user's photo when rendering samples. Deliberately busy and
 * mid-toned: the scrim has to hold white text over an image like this, and a
 * flat colour would not prove that.
 */
const STAND_IN_PHOTO = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500">
     <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0%" stop-color="#C9A27A"/><stop offset="52%" stop-color="#8A6B4F"/>
       <stop offset="100%" stop-color="#4A3626"/></linearGradient></defs>
     <rect width="1200" height="1500" fill="url(#g)"/>
     <circle cx="820" cy="430" r="300" fill="#E8C79A" opacity="0.55"/>
     <circle cx="300" cy="980" r="380" fill="#6B4A2E" opacity="0.5"/>
     <rect x="120" y="620" width="520" height="520" rx="60" fill="#D9502A" opacity="0.62"/>
   </svg>`,
).toString("base64")}`;

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
    photo: string | null = null,
  ) {
    const width = Math.round(SIZES[size].width * scale);
    const height = Math.round(SIZES[size].height * scale);
    const image = new ImageResponse(
      renderCard(buildSpec(kind, STATS, toggles, DEFAULT_TONE), theme, { width, height }, photo),
      { width, height, fonts },
    );
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(await image.arrayBuffer()));
  }

  const jobs: Promise<void>[] = [];

  // Every theme, same card, so they can be compared directly.
  for (const theme of STANDARD_THEME_IDS) {
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

  // The photo template, with a stand-in for a user's own photo.
  jobs.push(write("photo-JOURNEY", "JOURNEY", "PHOTO", "FACEBOOK",
    { ...DEFAULT_TOGGLES, consistency: true, startDate: true }, 1, STAND_IN_PHOTO));
  jobs.push(write("thumb-PHOTO", "JOURNEY", "PHOTO", "FACEBOOK",
    { ...DEFAULT_TOGGLES, consistency: true, startDate: true }, 350 / 1200, STAND_IN_PHOTO));

  // Thumbnails at Facebook feed width. Any text that fails to read here fails
  // in the feed, which is the only place these actually get seen.
  const THUMB = 350 / 1200;
  for (const theme of STANDARD_THEME_IDS) {
    jobs.push(write(`thumb-${theme}`, "HOT_STREAK", theme, "FACEBOOK", DEFAULT_TOGGLES, THUMB));
  }

  await Promise.all(jobs);
  console.log(`Rendered ${jobs.length} sample cards to ${OUT}`);
}

main();
