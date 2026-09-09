import assert from "node:assert/strict";
import { test } from "node:test";

import { buildSpec } from "./spec";
import { DEFAULT_TOGGLES, type CardStats, type ShareToggles } from "./types";

/**
 * Every metric has a deliberately different value, so any card that reaches for
 * the wrong one produces an obviously wrong number rather than a plausible one.
 * This is the whole point of the fixture: 7 ≠ 21 ≠ 47 ≠ 56 ≠ 12 ≠ 27.
 */
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

const ALL: ShareToggles = {
  ...DEFAULT_TOGGLES,
  streak: true,
  totalDays: true,
  longestStreak: true,
  consistency: true,
  startDate: true,
};

test("a streak card shows the current streak, not any other day count", () => {
  const spec = buildSpec("HOT_STREAK", STATS, ALL, "CLEAN");
  assert.equal(spec.heroValue, "7");
  assert.match(spec.heroUnit ?? "", /HOT STREAK/);
});

test("a journey card shows elapsed days, not days logged", () => {
  const spec = buildSpec("JOURNEY", STATS, ALL, "CLEAN");
  assert.equal(spec.heroValue, "56");
  assert.equal(spec.heroUnit, "DAYS IN");
  // Days logged is the supporting stat, and must not be the hero.
  assert.equal(spec.stats[0]?.value, "47");
});

test("a progress card shows days logged as its hero", () => {
  const spec = buildSpec("PROGRESS", STATS, ALL, "CLEAN");
  assert.equal(spec.heroValue, "47");
  assert.equal(spec.heroUnit, "DAYS LOGGED");
});

test("a progress card's supporting stat is the longest streak, not the current one", () => {
  const spec = buildSpec("PROGRESS", STATS, ALL, "CLEAN");
  const longest = spec.stats.find((s) => /longest/i.test(s.label));
  assert.equal(longest?.value, "21");
});

test("a challenge card counts challenge days, not the streak or total", () => {
  const spec = buildSpec("CHALLENGE", STATS, ALL, "CLEAN");
  assert.equal(spec.ring?.done, 12);
  assert.equal(spec.ring?.total, 30);
  assert.equal(spec.ring?.percent, 40);
  assert.equal(spec.heroUnit, "DAY 12 OF 30");
});

test("a monthly recap counts days in that month, not overall", () => {
  const spec = buildSpec("MONTHLY_RECAP", STATS, ALL, "CLEAN");
  assert.equal(spec.heroTitle, "AUGUST");
  assert.equal(spec.heroUnit, "27 OF 31 DAYS");
});

test("an achievement shows its own threshold, not the user's streak", () => {
  const spec = buildSpec("ACHIEVEMENT", STATS, ALL, "CLEAN");
  assert.equal(spec.heroValue, "30");
  assert.equal(spec.heroUnit, "RED HOT");
});

test("a pep talk carries no numbers at all", () => {
  const spec = buildSpec("PEP_TALK", STATS, ALL, "CLEAN");
  assert.equal(spec.heroValue, null);
  assert.equal(spec.stats.length, 0);
  assert.equal(spec.ring, null);
});

test("no card ever exceeds two supporting stats", () => {
  for (const kind of [
    "HOT_STREAK",
    "JOURNEY",
    "ACHIEVEMENT",
    "CHALLENGE",
    "PROGRESS",
    "MONTHLY_RECAP",
    "PEP_TALK",
  ] as const) {
    assert.ok(
      buildSpec(kind, STATS, ALL, "CLEAN").stats.length <= 2,
      `${kind} rendered more than two stats`,
    );
  }
});

test("the journey rail runs from the start date to today", () => {
  const spec = buildSpec("JOURNEY", STATS, ALL, "CLEAN");
  assert.equal(spec.rail?.from, "15 Jul 2026");
  assert.equal(spec.rail?.to, "9 Sep 2026");
});

test("turning a toggle off removes that stat entirely", () => {
  const spec = buildSpec("HOT_STREAK", STATS, { ...ALL, totalDays: false }, "CLEAN");
  assert.equal(spec.stats.length, 0);
});
