import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { levelFromXP } from "@/lib/gamification";
import { pathPercent, todayStr } from "@/lib/learner";
import { nextStreak } from "@/lib/gamification";

export async function GET() {
  const { user, response } = await requireUser();
  if (response || !user) return response!;

  const admin = createAdminClient();

  let { data: stats } = await admin
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!stats) {
    const { data: inserted } = await admin
      .from("user_stats")
      .upsert({ user_id: user.id })
      .select("*")
      .single();
    stats = inserted;
  }

  // Touch streak for "active today" when opening the app
  const today = todayStr();
  if (stats && stats.last_active !== today) {
    const streak = nextStreak(stats.last_active, today, stats.streak);
    const { data: updated } = await admin
      .from("user_stats")
      .update({ streak, last_active: today, level: levelFromXP(stats.total_xp).level })
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (updated) stats = updated;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data: courses }, { data: chapterProg }, { data: lessonProg }] = await Promise.all([
    admin
      .from("courses")
      .select("id, slug, title, color, icon, lessons(id, chapters(id))")
      .eq("is_published", true)
      .order("order_index"),
    admin.from("user_chapter_progress").select("chapter_id").eq("user_id", user.id),
    admin
      .from("user_lesson_progress")
      .select("lesson_id, passed")
      .eq("user_id", user.id),
  ]);

  const completedChapters = new Set((chapterProg ?? []).map((r) => r.chapter_id));
  const passedLessons = new Set(
    (lessonProg ?? []).filter((r) => r.passed).map((r) => r.lesson_id),
  );

  const courseProgress = (courses ?? []).map((course) => {
    const lessons = (course.lessons ?? []) as { id: string; chapters: { id: string }[] }[];
    const chapterIds = lessons.flatMap((l) => (l.chapters ?? []).map((c) => c.id));
    const lessonIds = lessons.map((l) => l.id);
    return {
      slug: course.slug,
      title: course.title,
      color: course.color,
      icon: course.icon,
      percent: pathPercent({
        chapterIds,
        lessonIds,
        completedChapterIds: completedChapters,
        passedLessonIds: passedLessons,
      }),
    };
  });

  const lv = levelFromXP(stats?.total_xp ?? 0);

  return NextResponse.json({
    profile: {
      display_name: profile?.display_name ?? user.email?.split("@")[0] ?? "Learner",
      role: profile?.role ?? "learner",
      avatar_url: profile?.avatar_url ?? null,
      email: user.email,
    },
    stats: {
      total_xp: stats?.total_xp ?? 0,
      streak: stats?.streak ?? 0,
      last_active: stats?.last_active ?? null,
      level: lv.level,
      level_into: lv.into,
      level_span: lv.span,
    },
    chapters_completed: completedChapters.size,
    checkpoints_passed: passedLessons.size,
    courses: courseProgress,
  });
}
