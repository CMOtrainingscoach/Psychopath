import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  chapterXp,
  checkpointXp,
  levelFromXP,
  nextStreak,
  PASS_RATIO,
} from "@/lib/gamification";
import { todayStr } from "@/lib/learner";
import { gradeQuizSchema } from "@/lib/schemas/quiz";

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response || !user) return response!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = gradeQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ownerType, ownerId, answers } = parsed.data;
  const admin = createAdminClient();

  const { data: questions, error: qErr } = await admin
    .from("questions")
    .select("id, order_index, answer_index, explanation, prompt, options")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("order_index");

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!questions?.length) {
    return NextResponse.json({ error: "No questions found" }, { status: 404 });
  }

  const total = questions.length;
  const isComplete = answers.length === total;
  if (answers.length > total) {
    return NextResponse.json({ error: "Too many answers" }, { status: 400 });
  }

  const results = questions.slice(0, answers.length).map((q, i) => {
    const picked = answers[i]!;
    const correct = picked === q.answer_index;
    return {
      question_id: q.id,
      order_index: q.order_index,
      picked,
      correct,
      answer_index: q.answer_index,
      explanation: q.explanation,
      prompt: q.prompt,
      options: q.options,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;

  // Partial check — return feedback only (MVP per-question reveal)
  if (!isComplete) {
    const latest = results[results.length - 1]!;
    return NextResponse.json({
      complete: false,
      total,
      answered: answers.length,
      correct_so_far: correctCount,
      latest,
      results,
    });
  }

  const passed =
    ownerType === "chapter" ? true : correctCount / total >= PASS_RATIO;

  let earned = 0;

  if (ownerType === "chapter") {
    const { data: prev } = await admin
      .from("user_chapter_progress")
      .select("best_score, xp_earned, completed_at")
      .eq("user_id", user.id)
      .eq("chapter_id", ownerId)
      .maybeSingle();

    const first = !prev;
    earned = chapterXp(correctCount, first);
    const best = Math.max(prev?.best_score ?? 0, correctCount);

    const { error: upErr } = await admin.from("user_chapter_progress").upsert({
      user_id: user.id,
      chapter_id: ownerId,
      best_score: best,
      xp_earned: (prev?.xp_earned ?? 0) + earned,
      completed_at: prev?.completed_at ?? new Date().toISOString(),
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  } else {
    const { data: prev } = await admin
      .from("user_lesson_progress")
      .select("best_score, attempts, passed, passed_at")
      .eq("user_id", user.id)
      .eq("lesson_id", ownerId)
      .maybeSingle();

    const firstPass = passed && !prev?.passed;
    earned = checkpointXp(correctCount, firstPass);
    // Small re-pass reward matching MVP
    if (passed && prev?.passed) earned = 5;

    const { error: upErr } = await admin.from("user_lesson_progress").upsert({
      user_id: user.id,
      lesson_id: ownerId,
      best_score: Math.max(prev?.best_score ?? 0, correctCount),
      attempts: (prev?.attempts ?? 0) + 1,
      passed: Boolean(prev?.passed) || passed,
      passed_at:
        firstPass || (passed && !prev?.passed)
          ? new Date().toISOString()
          : (prev?.passed_at ?? null),
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  const { data: stats } = await admin
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const today = todayStr();
  const totalXp = (stats?.total_xp ?? 0) + earned;
  const streak = nextStreak(stats?.last_active ?? null, today, stats?.streak ?? 0);
  const level = levelFromXP(totalXp).level;

  await admin.from("user_stats").upsert({
    user_id: user.id,
    total_xp: totalXp,
    streak,
    last_active: today,
    level,
  });

  return NextResponse.json({
    complete: true,
    total,
    correct: correctCount,
    passed,
    earned,
    results,
    stats: { total_xp: totalXp, streak, level },
  });
}
