export const XP_CHAPTER_BASE = 15;
export const XP_PER_CORRECT = 5;
export const XP_TEST_BONUS = 30;
export const PASS_RATIO = 0.7;

export function levelFromXP(xp: number) {
  let lvl = 1;
  let need = 100;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    lvl += 1;
    need = Math.round(need * 1.15);
  }
  return { level: lvl, into: xp - acc, span: need, floor: acc };
}

export function chapterXp(correct: number, firstCompletion: boolean) {
  if (!firstCompletion) return 0;
  return XP_CHAPTER_BASE + correct * XP_PER_CORRECT;
}

export function checkpointXp(correct: number, firstPass: boolean) {
  if (!firstPass) return 0;
  return correct * XP_PER_CORRECT + XP_TEST_BONUS;
}

export function daysBetween(a: string, b: string) {
  const d1 = new Date(`${a}T00:00:00`);
  const d2 = new Date(`${b}T00:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function nextStreak(lastActive: string | null, today: string, current: number) {
  if (!lastActive) return 1;
  const gap = daysBetween(lastActive, today);
  if (gap === 0) return Math.max(current, 1);
  if (gap === 1) return (current || 0) + 1;
  return 1;
}
