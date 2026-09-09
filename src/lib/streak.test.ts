import assert from "node:assert/strict";
import { test } from "node:test";

import { summarise, ringProgress, milestoneReached } from "./streak";

const START = "2026-01-01";

test("no entries means no streak", () => {
  const s = summarise([], "2026-01-10", START);
  assert.equal(s.current, 0);
  assert.equal(s.longest, 0);
  assert.equal(s.totalDays, 0);
  assert.equal(s.loggedToday, false);
  assert.equal(s.nextMilestone, 3);
});

test("counts a run ending today", () => {
  const s = summarise(["2026-01-08", "2026-01-09", "2026-01-10"], "2026-01-10", START);
  assert.equal(s.current, 3);
  assert.equal(s.longest, 3);
  assert.equal(s.loggedToday, true);
});

test("today is a grace period, not a break", () => {
  // Logged through yesterday, nothing yet today: the streak is still alive.
  const s = summarise(["2026-01-08", "2026-01-09"], "2026-01-10", START);
  assert.equal(s.current, 2);
  assert.equal(s.loggedToday, false);
});

test("a full missed day breaks the streak", () => {
  const s = summarise(["2026-01-07", "2026-01-08"], "2026-01-10", START);
  assert.equal(s.current, 0);
  assert.equal(s.longest, 2);
});

test("longest streak survives a later break", () => {
  const s = summarise(
    ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-09"],
    "2026-01-09",
    START,
  );
  assert.equal(s.current, 1);
  assert.equal(s.longest, 4);
  assert.equal(s.totalDays, 5);
});

test("duplicate days count once", () => {
  const s = summarise(
    ["2026-01-09", "2026-01-09", "2026-01-10", "2026-01-10"],
    "2026-01-10",
    START,
  );
  assert.equal(s.current, 2);
  assert.equal(s.totalDays, 2);
});

test("month and consistency are scoped correctly", () => {
  const s = summarise(
    ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"],
    "2026-01-02",
    "2025-12-30",
  );
  assert.equal(s.thisMonth, 2);
  assert.equal(s.totalDays, 4);
  assert.equal(s.consistency, 100);
});

test("consistency is capped at 100 and never divides by zero", () => {
  const s = summarise(["2026-01-01"], "2026-01-01", "2026-01-01");
  assert.equal(s.consistency, 100);
});

test("streak crosses a month boundary", () => {
  const s = summarise(["2026-01-30", "2026-01-31", "2026-02-01"], "2026-02-01", START);
  assert.equal(s.current, 3);
});

test("streak crosses a leap day", () => {
  const s = summarise(["2028-02-28", "2028-02-29", "2028-03-01"], "2028-03-01", "2028-02-28");
  assert.equal(s.current, 3);
});

test("next milestone advances with the streak", () => {
  assert.equal(summarise([], "2026-01-10", START).daysToNextMilestone, 3);
  const week = Array.from(
    { length: 7 },
    (_, i) => `2026-01-${String(i + 4).padStart(2, "0")}`,
  );
  const s = summarise(week, "2026-01-10", START);
  assert.equal(s.current, 7);
  assert.equal(s.nextMilestone, 14);
  assert.equal(s.daysToNextMilestone, 7);
});

test("ring progress fills between milestones", () => {
  assert.equal(ringProgress(0), 0);
  assert.equal(ringProgress(3), 0);
  assert.equal(ringProgress(365), 1);
  assert.ok(ringProgress(5) > 0 && ringProgress(5) < 1);
});

test("milestones are recognised exactly", () => {
  assert.equal(milestoneReached(30), 30);
  assert.equal(milestoneReached(31), null);
});
