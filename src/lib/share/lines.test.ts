import assert from "node:assert/strict";
import { test } from "node:test";

import { libraryStats, lineAt, linesFor } from "./lines";
import { TONES } from "./voice";
import type { CardStats, ShareKind } from "./types";

const KINDS: ShareKind[] = [
  "HOT_STREAK",
  "JOURNEY",
  "ACHIEVEMENT",
  "CHALLENGE",
  "PROGRESS",
  "MONTHLY_RECAP",
  "PEP_TALK",
];

function stats(over: Partial<CardStats> = {}): CardStats {
  return {
    displayName: "C",
    currentStreak: 21,
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
    achievementDescription: "",
    achievementValue: 30,
    challengeTitle: "30-Day Hot Streak",
    challengeDaysLogged: 12,
    challengeDurationDays: 30,
    monthLabel: "August",
    monthDaysLogged: 27,
    monthDaysTotal: 31,
    monthAchievements: 3,
    quote: "Consistency is hotter than motivation.",
    ...over,
  };
}

test("the library holds at least 100 lines", () => {
  assert.ok(libraryStats().total >= 100, `only ${libraryStats().total} lines`);
});

test("every card type offers lines in every tone", () => {
  for (const kind of KINDS) {
    for (const tone of TONES) {
      assert.ok(
        linesFor(kind, tone, stats()).length > 0,
        `${kind}/${tone} had nothing to say`,
      );
    }
  }
});

// "Tap for another" is the whole wording control. A pool two lines deep makes
// it a toggle, so every voice has to have somewhere to go, at every stage of a
// user's history — day one included, which is when most people first share.
test("every voice has at least three lines, in every scenario", () => {
  const scenarios: [string, Partial<CardStats>][] = [
    ["day one", { currentStreak: 1, longestStreak: 1, daysLogged: 1, elapsedDays: 1,
      challengeDaysLogged: 1, challengeDurationDays: 7, monthDaysLogged: 1 }],
    ["a perfect first week", { currentStreak: 7, longestStreak: 7, daysLogged: 7,
      elapsedDays: 7, challengeDaysLogged: 7, monthDaysLogged: 7, monthDaysTotal: 7 }],
    ["a gappy three weeks", { currentStreak: 9, longestStreak: 14, daysLogged: 18,
      elapsedDays: 21, challengeDaysLogged: 6 }],
    ["a spotless hundred days", { currentStreak: 100, longestStreak: 100, daysLogged: 100,
      elapsedDays: 100, challengeDaysLogged: 28, monthDaysLogged: 31 }],
  ];

  for (const [name, over] of scenarios) {
    for (const kind of KINDS) {
      for (const tone of TONES) {
        const count = linesFor(kind, tone, stats(over)).length;
        assert.ok(count >= 3, `${kind}/${tone} on ${name} offered only ${count}`);
      }
    }
  }
});

test("no line is offered twice in the same pool", () => {
  for (const kind of KINDS) {
    for (const tone of TONES) {
      const lines = linesFor(kind, tone, stats());
      assert.equal(new Set(lines).size, lines.length, `${kind}/${tone} repeats a line`);
    }
  }
});

test("an imperfect month is never called perfect", () => {
  const partial = stats({ monthDaysLogged: 27, monthDaysTotal: 31 });
  for (const tone of TONES) {
    for (const line of linesFor("MONTHLY_RECAP", tone, partial)) {
      assert.doesNotMatch(line, /every single day|clean sweep/i, `wrong for 27/31: "${line}"`);
    }
  }
});

test("a perfect month can be called perfect", () => {
  const full = stats({ monthDaysLogged: 31, monthDaysTotal: 31 });
  const all = TONES.flatMap((t) => linesFor("MONTHLY_RECAP", t, full));
  assert.ok(all.some((l) => /every single day|clean sweep/i.test(l)));
});

test("a record with gaps never claims an unbroken run", () => {
  const gappy = stats({ daysLogged: 40, elapsedDays: 56 });
  for (const kind of ["JOURNEY", "PROGRESS"] as ShareKind[]) {
    for (const tone of TONES) {
      for (const line of linesFor(kind, tone, gappy)) {
        assert.doesNotMatch(line, /haven't missed|not one missed/i, `wrong for 40/56: "${line}"`);
      }
    }
  }
});

test("a spotless record is never told it missed days", () => {
  const spotless = stats({ daysLogged: 56, elapsedDays: 56 });
  for (const kind of ["JOURNEY", "PROGRESS"] as ShareKind[]) {
    for (const tone of TONES) {
      for (const line of linesFor(kind, tone, spotless)) {
        assert.doesNotMatch(line, /missed a few/i, `wrong for 56/56: "${line}"`);
      }
    }
  }
});

test("an early challenge is never told it's nearly done", () => {
  const early = stats({ challengeDaysLogged: 3, challengeDurationDays: 30 });
  for (const tone of TONES) {
    for (const line of linesFor("CHALLENGE", tone, early)) {
      assert.doesNotMatch(line, /nearly there|could pretend/i, `wrong at 3/30: "${line}"`);
    }
  }
});

test("cycling walks the list and wraps rather than repeating or running out", () => {
  const s = stats();
  const seen = linesFor("JOURNEY", "PROUD", s);
  const walked = seen.map((_, i) => lineAt("JOURNEY", "PROUD", s, i));
  assert.deepEqual(walked, seen);
  assert.equal(lineAt("JOURNEY", "PROUD", s, seen.length), seen[0]);
  assert.equal(lineAt("JOURNEY", "PROUD", s, -1), seen[seen.length - 1]);
});

test("streak lines match the band the user is actually in", () => {
  assert.ok(linesFor("HOT_STREAK", "FUNNY", stats({ currentStreak: 1 })).some((l) => /day one/i.test(l)));
  assert.ok(linesFor("HOT_STREAK", "FUNNY", stats({ currentStreak: 400 })).some((l) => /year/i.test(l)));
  for (const line of linesFor("HOT_STREAK", "FUNNY", stats({ currentStreak: 3 }))) {
    assert.doesNotMatch(line, /month|year/i, `a 3-day streak shouldn't say: "${line}"`);
  }
});

test("no line makes a health claim", () => {
  const banned = /\b(cure[sd]?|treats?|heals?|prevents?|diagnos|remed(y|ies)|medicin)/i;
  for (const kind of KINDS) {
    for (const tone of TONES) {
      for (const line of linesFor(kind, tone, stats())) {
        assert.doesNotMatch(line, banned, `health claim in "${line}"`);
      }
    }
  }
});
