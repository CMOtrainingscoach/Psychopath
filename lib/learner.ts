export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function pathPercent(params: {
  chapterIds: string[];
  lessonIds: string[];
  completedChapterIds: Set<string>;
  passedLessonIds: Set<string>;
}) {
  const total = params.chapterIds.length + params.lessonIds.length;
  if (total === 0) return 0;
  let done = 0;
  for (const id of params.chapterIds) if (params.completedChapterIds.has(id)) done += 1;
  for (const id of params.lessonIds) if (params.passedLessonIds.has(id)) done += 1;
  return Math.round((done / total) * 100);
}
