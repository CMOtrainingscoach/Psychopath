/**
 * Gamification / XP smoke tests (no DB required).
 * Run: npm run test:gamification
 */
import assert from "node:assert/strict";
import {
  PASS_RATIO,
  chapterXp,
  checkpointXp,
  levelFromXP,
  nextStreak,
} from "../lib/gamification.ts";

// Chapter: 15 + 5×correct, first completion only
assert.equal(chapterXp(3, true), 15 + 5 * 3);
assert.equal(chapterXp(3, false), 0);

// Checkpoint: 5×correct + 30 first pass
assert.equal(checkpointXp(5, true), 5 * 5 + 30);
assert.equal(checkpointXp(5, false), 0);

// Pass ratio from MVP
assert.equal(PASS_RATIO, 0.7);

// Level curve: level 1 needs 100 XP, each level ×1.15
const l0 = levelFromXP(0);
assert.equal(l0.level, 1);
assert.equal(l0.into, 0);
assert.equal(l0.span, 100);

const l1 = levelFromXP(100);
assert.equal(l1.level, 2);

// Streak rules
assert.equal(nextStreak(null, "2026-08-28", 0), 1);
assert.equal(nextStreak("2026-08-28", "2026-08-28", 3), 3);
assert.equal(nextStreak("2026-08-27", "2026-08-28", 3), 4);
assert.equal(nextStreak("2026-08-25", "2026-08-28", 3), 1);

console.log("test-gamification: ok");
