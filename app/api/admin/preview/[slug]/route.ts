import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ slug: string }> };

/** Full course tree for admin preview — includes unpublished content + answer keys. */
export async function GET(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: course, error } = await admin
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: lessons } = await admin
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index");

  const lessonIds = (lessons ?? []).map((l) => l.id);
  type QRow = {
    id: string;
    owner_id: string;
    order_index: number;
    prompt: string;
    options: unknown;
    answer_index: number;
    explanation: string;
    type: string;
  };
  type ChRow = {
    id: string;
    lesson_id: string;
    title: string;
    order_index: number;
    cards: unknown;
    is_published: boolean;
    legacy_key: string | null;
  };

  const { data: chapters } = lessonIds.length
    ? await admin.from("chapters").select("*").in("lesson_id", lessonIds).order("order_index")
    : { data: [] as ChRow[] };

  const chapterIds = (chapters ?? []).map((c) => c.id);
  const emptyQ: QRow[] = [];
  const [{ data: chapterQs }, { data: lessonQs }, { data: professors }] = await Promise.all([
    chapterIds.length
      ? admin
          .from("questions")
          .select("*")
          .eq("owner_type", "chapter")
          .in("owner_id", chapterIds)
          .order("order_index")
      : Promise.resolve({ data: emptyQ }),
    lessonIds.length
      ? admin
          .from("questions")
          .select("*")
          .eq("owner_type", "lesson")
          .in("owner_id", lessonIds)
          .order("order_index")
      : Promise.resolve({ data: emptyQ }),
    admin.from("professors").select("id, name, tagline, bio, avatar_config, sample_phrases"),
  ]);

  const profMap = new Map((professors ?? []).map((p) => [p.id, p]));
  const chByLesson = new Map<string, ChRow[]>();
  for (const ch of chapters ?? []) {
    const list = chByLesson.get(ch.lesson_id) ?? [];
    list.push(ch);
    chByLesson.set(ch.lesson_id, list);
  }
  const qByChapter = new Map<string, QRow[]>();
  for (const q of (chapterQs ?? []) as QRow[]) {
    const list = qByChapter.get(q.owner_id) ?? [];
    list.push(q);
    qByChapter.set(q.owner_id, list);
  }
  const qByLesson = new Map<string, QRow[]>();
  for (const q of (lessonQs ?? []) as QRow[]) {
    const list = qByLesson.get(q.owner_id) ?? [];
    list.push(q);
    qByLesson.set(q.owner_id, list);
  }

  return NextResponse.json({
    course: {
      ...course,
      professor: course.default_professor_id
        ? profMap.get(course.default_professor_id) ?? null
        : null,
      lessons: (lessons ?? []).map((lesson) => ({
        ...lesson,
        professor: lesson.professor_id
          ? profMap.get(lesson.professor_id) ?? null
          : course.default_professor_id
            ? profMap.get(course.default_professor_id) ?? null
            : null,
        chapters: (chByLesson.get(lesson.id) ?? []).map((ch) => ({
          ...ch,
          quiz: qByChapter.get(ch.id) ?? [],
        })),
        checkpoint: qByLesson.get(lesson.id) ?? [],
      })),
    },
  });
}
