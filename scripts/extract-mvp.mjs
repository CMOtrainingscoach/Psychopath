/**
 * Extracts PATHS + T from reference/PsychPath.jsx and writes
 * scripts/data/mvp-curriculum.json (source of truth for seed).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcPath = path.join(root, "reference", "PsychPath.jsx");
const outPath = path.join(root, "scripts", "data", "mvp-curriculum.json");

const src = fs.readFileSync(srcPath, "utf8");

function extractConst(name) {
  const re = new RegExp(`const ${name} = ([\\s\\S]*?);\\n\\n`);
  const m = src.match(re);
  if (!m) throw new Error(`Could not extract const ${name}`);
  // Evaluate extracted object/array literal from the MVP source.
  return new Function(`return (${m[1]})`)();
}

const T = extractConst("T");
const PATHS = extractConst("PATHS");

const professors = Object.entries(T).map(([key, t]) => ({
  legacy_key: key,
  name: t.name,
  tagline: t.tag,
  bio: `${t.name} — ${t.tag}.`,
  avatar_config: t.cfg,
  voice_prompt: `You are ${t.name}, known for ${t.tag}. Explain psychology clearly, warmly, and with memorable examples. Keep sentences short. Encourage the learner.`,
  sample_phrases: [
    `Let's look at this together — ${t.tag.toLowerCase()} has a lot to teach us.`,
    "Nice work. Ready for the next idea?",
    "Take a breath — this concept clicks with a good example.",
  ],
}));

const courses = PATHS.map((pathItem, pathIndex) => ({
  slug: pathItem.id,
  title: pathItem.title,
  subtitle: pathItem.subtitle,
  description: pathItem.subtitle,
  color: pathItem.color,
  icon: pathItem.icon,
  order_index: pathIndex,
  default_professor_key: pathItem.teacher,
  lessons: pathItem.lessons.map((lesson, lessonIndex) => ({
    legacy_key: lesson.id,
    title: lesson.title,
    order_index: lessonIndex,
    professor_key: lesson.teacher,
    chapters: lesson.chapters.map((chapter, chapterIndex) => ({
      legacy_key: chapter.id,
      title: chapter.title,
      order_index: chapterIndex,
      cards: chapter.cards.map((c) => ({
        type: c.t,
        heading: c.h,
        body: c.b,
      })),
      quiz: chapter.quiz.map((q) => ({
        prompt: q.q,
        options: q.o,
        answer_index: q.a,
        explanation: q.e,
        type: "mcq",
      })),
    })),
    checkpoint: lesson.test.map((q) => ({
      prompt: q.q,
      options: q.o,
      answer_index: q.a,
      explanation: q.e,
      type: "mcq",
    })),
  })),
}));

const payload = {
  generated_from: "reference/PsychPath.jsx",
  professors,
  courses,
  counts: {
    professors: professors.length,
    courses: courses.length,
    lessons: courses.reduce((n, c) => n + c.lessons.length, 0),
    chapters: courses.reduce(
      (n, c) => n + c.lessons.reduce((m, l) => m + l.chapters.length, 0),
      0,
    ),
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log("Wrote", outPath);
console.log("Counts:", payload.counts);
