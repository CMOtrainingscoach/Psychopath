/**
 * Idempotent seed of MVP curriculum into Supabase (service role).
 * Run: npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const dataPath = path.join(root, "scripts", "data", "mvp-curriculum.json");
if (!fs.existsSync(dataPath)) {
  console.error("Missing mvp-curriculum.json — run: npm run extract-mvp");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function assertOk(label, error) {
  if (error) {
    console.error(`FAIL ${label}:`, error.message);
    process.exit(1);
  }
}

async function upsertQuestions(ownerType, ownerId, questions) {
  const { error: delErr } = await supabase
    .from("questions")
    .delete()
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  assertOk(`delete questions ${ownerType}/${ownerId}`, delErr);

  if (!questions.length) return;

  const rows = questions.map((q, i) => ({
    owner_type: ownerType,
    owner_id: ownerId,
    order_index: i,
    prompt: q.prompt,
    options: q.options,
    answer_index: q.answer_index,
    explanation: q.explanation,
    type: q.type ?? "mcq",
  }));

  const { error } = await supabase.from("questions").insert(rows);
  assertOk(`insert questions ${ownerType}/${ownerId}`, error);
}

async function main() {
  console.log("Seeding PsychPath MVP curriculum…");
  console.log("Expected counts:", data.counts);

  const professorIds = new Map();

  for (const p of data.professors) {
    const { data: row, error } = await supabase
      .from("professors")
      .upsert(
        {
          legacy_key: p.legacy_key,
          name: p.name,
          tagline: p.tagline,
          bio: p.bio,
          avatar_config: p.avatar_config,
          voice_prompt: p.voice_prompt,
          sample_phrases: p.sample_phrases,
        },
        { onConflict: "legacy_key" },
      )
      .select("id, legacy_key")
      .single();
    assertOk(`professor ${p.legacy_key}`, error);
    professorIds.set(row.legacy_key, row.id);
  }

  for (const course of data.courses) {
    const defaultProfessorId = professorIds.get(course.default_professor_key);
    const { data: courseRow, error: courseErr } = await supabase
      .from("courses")
      .upsert(
        {
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          color: course.color,
          icon: course.icon,
          order_index: course.order_index,
          is_published: true,
          default_professor_id: defaultProfessorId ?? null,
        },
        { onConflict: "slug" },
      )
      .select("id, slug")
      .single();
    assertOk(`course ${course.slug}`, courseErr);

    for (const lesson of course.lessons) {
      const professorId = professorIds.get(lesson.professor_key) ?? defaultProfessorId;
      const { data: lessonRow, error: lessonErr } = await supabase
        .from("lessons")
        .upsert(
          {
            course_id: courseRow.id,
            legacy_key: lesson.legacy_key,
            title: lesson.title,
            order_index: lesson.order_index,
            professor_id: professorId ?? null,
            is_published: true,
          },
          { onConflict: "legacy_key" },
        )
        .select("id, legacy_key")
        .single();
      assertOk(`lesson ${lesson.legacy_key}`, lessonErr);

      for (const chapter of lesson.chapters) {
        const { data: chapterRow, error: chapterErr } = await supabase
          .from("chapters")
          .upsert(
            {
              lesson_id: lessonRow.id,
              legacy_key: chapter.legacy_key,
              title: chapter.title,
              order_index: chapter.order_index,
              cards: chapter.cards,
              is_published: true,
            },
            { onConflict: "legacy_key" },
          )
          .select("id, legacy_key")
          .single();
        assertOk(`chapter ${chapter.legacy_key}`, chapterErr);

        await upsertQuestions("chapter", chapterRow.id, chapter.quiz);
      }

      await upsertQuestions("lesson", lessonRow.id, lesson.checkpoint);
    }
  }

  const counts = {};
  for (const table of ["professors", "courses", "lessons", "chapters", "questions"]) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    assertOk(`count ${table}`, error);
    counts[table] = count;
  }

  console.log("Seeded counts:", counts);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
