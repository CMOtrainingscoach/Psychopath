import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pathPercent } from "@/lib/learner";

export async function GET() {
  const { user, response } = await requireUser();
  if (response || !user) return response!;

  const admin = createAdminClient();

  const [{ data: courses, error: coursesErr }, { data: chapterProg }, { data: lessonProg }] =
    await Promise.all([
      admin
        .from("courses")
        .select(
          "id, slug, title, subtitle, color, icon, order_index, default_professor_id, lessons(id, chapters(id))",
        )
        .eq("is_published", true)
        .order("order_index"),
      admin.from("user_chapter_progress").select("chapter_id").eq("user_id", user.id),
      admin
        .from("user_lesson_progress")
        .select("lesson_id, passed")
        .eq("user_id", user.id)
        .eq("passed", true),
    ]);

  if (coursesErr) {
    return NextResponse.json({ error: coursesErr.message }, { status: 500 });
  }

  const completedChapters = new Set((chapterProg ?? []).map((r) => r.chapter_id));
  const passedLessons = new Set((lessonProg ?? []).map((r) => r.lesson_id));

  const payload = (courses ?? []).map((course) => {
    const lessons = (course.lessons ?? []) as { id: string; chapters: { id: string }[] }[];
    const chapterIds = lessons.flatMap((l) => (l.chapters ?? []).map((c) => c.id));
    const lessonIds = lessons.map((l) => l.id);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      color: course.color,
      icon: course.icon,
      order_index: course.order_index,
      progress_percent: pathPercent({
        chapterIds,
        lessonIds,
        completedChapterIds: completedChapters,
        passedLessonIds: passedLessons,
      }),
    };
  });

  return NextResponse.json({ courses: payload });
}
