import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pathPercent } from "@/lib/learner";

type Params = { params: Promise<{ slug: string }> };

type ProfessorRow = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar_config: unknown;
  sample_phrases: unknown;
};

export async function GET(_req: Request, { params }: Params) {
  const { user, response } = await requireUser();
  if (response || !user) return response!;

  const { slug } = await params;
  const admin = createAdminClient();

  const { data: course, error } = await admin
    .from("courses")
    .select(
      `
      id, slug, title, subtitle, description, color, icon, order_index, is_published, default_professor_id,
      lessons (
        id, legacy_key, title, order_index, is_published, professor_id,
        chapters (
          id, legacy_key, title, order_index, cards, is_published
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lessonsRaw = ([...(course.lessons ?? [])] as Array<{
    id: string;
    legacy_key: string | null;
    title: string;
    order_index: number;
    is_published: boolean;
    professor_id: string | null;
    chapters: Array<{
      id: string;
      legacy_key: string | null;
      title: string;
      order_index: number;
      cards: unknown;
      is_published: boolean;
    }>;
  }>)
    .filter((l) => l.is_published)
    .sort((a, b) => a.order_index - b.order_index)
    .map((l) => ({
      ...l,
      chapters: [...(l.chapters ?? [])]
        .filter((c) => c.is_published)
        .sort((a, b) => a.order_index - b.order_index),
    }));

  const professorIds = [
    ...new Set(
      [course.default_professor_id, ...lessonsRaw.map((l) => l.professor_id)].filter(
        Boolean,
      ) as string[],
    ),
  ];

  const professorMap = new Map<string, ProfessorRow>();
  if (professorIds.length) {
    const { data: professors } = await admin
      .from("professors")
      .select("id, name, tagline, bio, avatar_config, sample_phrases")
      .in("id", professorIds);
    for (const p of professors ?? []) professorMap.set(p.id, p);
  }

  const defaultProfessor = course.default_professor_id
    ? (professorMap.get(course.default_professor_id) ?? null)
    : null;

  const chapterIds = lessonsRaw.flatMap((l) => l.chapters.map((c) => c.id));
  const lessonIds = lessonsRaw.map((l) => l.id);

  type QRow = {
    id: string;
    owner_id: string | null;
    order_index: number | null;
    prompt: string | null;
    options: unknown;
    type: string | null;
  };

  const emptyQs: QRow[] = [];
  const emptyId = "00000000-0000-0000-0000-000000000000";

  const [{ data: chapterQs }, { data: lessonQs }, { data: chapterProg }, { data: lessonProg }] =
    await Promise.all([
      chapterIds.length
        ? admin
            .from("questions_for_learner")
            .select("id, owner_id, order_index, prompt, options, type")
            .eq("owner_type", "chapter")
            .in("owner_id", chapterIds)
            .order("order_index")
        : Promise.resolve({ data: emptyQs }),
      lessonIds.length
        ? admin
            .from("questions_for_learner")
            .select("id, owner_id, order_index, prompt, options, type")
            .eq("owner_type", "lesson")
            .in("owner_id", lessonIds)
            .order("order_index")
        : Promise.resolve({ data: emptyQs }),
      admin
        .from("user_chapter_progress")
        .select("chapter_id, best_score, xp_earned, completed_at")
        .eq("user_id", user.id)
        .in("chapter_id", chapterIds.length ? chapterIds : [emptyId]),
      admin
        .from("user_lesson_progress")
        .select("lesson_id, best_score, attempts, passed, passed_at")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds.length ? lessonIds : [emptyId]),
    ]);

  const chapterQuestions = new Map<string, QRow[]>();
  for (const q of chapterQs ?? []) {
    if (!q.owner_id) continue;
    const list = chapterQuestions.get(q.owner_id) ?? [];
    list.push(q);
    chapterQuestions.set(q.owner_id, list);
  }
  const lessonQuestions = new Map<string, QRow[]>();
  for (const q of lessonQs ?? []) {
    if (!q.owner_id) continue;
    const list = lessonQuestions.get(q.owner_id) ?? [];
    list.push(q);
    lessonQuestions.set(q.owner_id, list);
  }

  const chaptersProgress: Record<string, { best: number; xp_earned: number }> = {};
  for (const row of chapterProg ?? []) {
    chaptersProgress[row.chapter_id] = {
      best: row.best_score,
      xp_earned: row.xp_earned,
    };
  }
  const lessonsProgress: Record<
    string,
    { best: number; attempts: number; passed: boolean }
  > = {};
  for (const row of lessonProg ?? []) {
    lessonsProgress[row.lesson_id] = {
      best: row.best_score,
      attempts: row.attempts,
      passed: row.passed,
    };
  }

  const completedChapterIds = new Set(Object.keys(chaptersProgress));
  const passedLessonIds = new Set(
    Object.entries(lessonsProgress)
      .filter(([, v]) => v.passed)
      .map(([id]) => id),
  );

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      color: course.color,
      icon: course.icon,
      professor: defaultProfessor,
      progress_percent: pathPercent({
        chapterIds,
        lessonIds,
        completedChapterIds,
        passedLessonIds,
      }),
      lessons: lessonsRaw.map((lesson) => {
        const professor =
          (lesson.professor_id ? professorMap.get(lesson.professor_id) : null) ??
          defaultProfessor;
        return {
          id: lesson.id,
          legacy_key: lesson.legacy_key,
          title: lesson.title,
          order_index: lesson.order_index,
          professor,
          chapters: lesson.chapters.map((ch) => ({
            id: ch.id,
            legacy_key: ch.legacy_key,
            title: ch.title,
            order_index: ch.order_index,
            cards: ch.cards,
            quiz: (chapterQuestions.get(ch.id) ?? []).map((q) => ({
              id: q.id,
              prompt: q.prompt,
              options: q.options as string[],
            })),
          })),
          checkpoint: (lessonQuestions.get(lesson.id) ?? []).map((q) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options as string[],
          })),
        };
      }),
    },
    progress: {
      chapters: chaptersProgress,
      lessons: lessonsProgress,
    },
  });
}
