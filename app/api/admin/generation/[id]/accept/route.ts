import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generatedContentSchema,
  generatedProfessorSchema,
} from "@/lib/schemas/generation";

type Params = { params: Promise<{ id: string }> };

const acceptBodySchema = z.object({
  // Optional edits applied on top of draft before materializing
  overrides: z.record(z.string(), z.unknown()).optional(),
  course_id: z.string().uuid().optional(),
  name: z.string().optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { user, response } = await requireAdmin();
  if (response || !user) return response!;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsedBody = acceptBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("generation_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "succeeded") {
    return NextResponse.json(
      { error: "Only succeeded drafts can be accepted" },
      { status: 400 },
    );
  }

  const merged = {
    ...((job.output as Record<string, unknown>) ?? {}),
    ...(parsedBody.data.overrides ?? {}),
  };
  // Drop bookkeeping keys before Zod parse
  const {
    _meta: _dropMeta,
    professor_id: _dropProf,
    course_id: _dropCourse,
    ...output
  } = merged;

  try {
    if (job.type === "professor") {
      const draft = generatedProfessorSchema.parse(output);
      const input = job.input as { name?: string };
      const name = parsedBody.data.name || input.name || "New Professor";

      const { data: professor, error: insErr } = await admin
        .from("professors")
        .insert({
          name,
          tagline: draft.tagline,
          bio: draft.bio,
          voice_prompt: draft.voice_prompt,
          sample_phrases: draft.sample_phrases,
          avatar_config: draft.suggested_avatar_config,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }

      await admin.from("generation_jobs").update({ status: "accepted" }).eq("id", id);
      return NextResponse.json({ ok: true, professor });
    }

    if (job.type === "content") {
      const draft = generatedContentSchema.parse(output);
      const courseId =
        parsedBody.data.course_id ||
        (typeof merged.course_id === "string" ? merged.course_id : null) ||
        (typeof (job.input as { course_id?: string }).course_id === "string"
          ? (job.input as { course_id?: string }).course_id
          : null);
      const professorId =
        (typeof merged.professor_id === "string" ? merged.professor_id : null) ||
        (job.input as { professor_id?: string }).professor_id;

      if (!courseId) {
        return NextResponse.json(
          { error: "course_id is required to accept content into a course" },
          { status: 400 },
        );
      }
      if (!professorId) {
        return NextResponse.json({ error: "professor_id missing on draft" }, { status: 400 });
      }

      const { data: last } = await admin
        .from("lessons")
        .select("order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lesson, error: lessonErr } = await admin
        .from("lessons")
        .insert({
          course_id: courseId,
          title: draft.lesson_title,
          order_index: (last?.order_index ?? -1) + 1,
          professor_id: professorId,
          is_published: false,
        })
        .select("*")
        .single();

      if (lessonErr || !lesson) {
        return NextResponse.json(
          { error: lessonErr?.message ?? "Lesson insert failed" },
          { status: 500 },
        );
      }

      for (let i = 0; i < draft.chapters.length; i++) {
        const ch = draft.chapters[i]!;
        const { data: chapter, error: chErr } = await admin
          .from("chapters")
          .insert({
            lesson_id: lesson.id,
            title: ch.title,
            order_index: i,
            cards: ch.cards,
            is_published: false,
          })
          .select("*")
          .single();
        if (chErr || !chapter) {
          return NextResponse.json(
            { error: chErr?.message ?? "Chapter insert failed" },
            { status: 500 },
          );
        }
        const quizRows = ch.quiz.map((q, qi) => ({
          owner_type: "chapter" as const,
          owner_id: chapter.id,
          order_index: qi,
          prompt: q.prompt,
          options: q.options,
          answer_index: q.answer_index,
          explanation: q.explanation,
          type: "mcq" as const,
        }));
        const { error: qErr } = await admin.from("questions").insert(quizRows);
        if (qErr) {
          return NextResponse.json({ error: qErr.message }, { status: 500 });
        }
      }

      const checkpointRows = draft.checkpoint.map((q, qi) => ({
        owner_type: "lesson" as const,
        owner_id: lesson.id,
        order_index: qi,
        prompt: q.prompt,
        options: q.options,
        answer_index: q.answer_index,
        explanation: q.explanation,
        type: "mcq" as const,
      }));
      const { error: cpErr } = await admin.from("questions").insert(checkpointRows);
      if (cpErr) {
        return NextResponse.json({ error: cpErr.message }, { status: 500 });
      }

      await admin.from("generation_jobs").update({ status: "accepted" }).eq("id", id);
      return NextResponse.json({ ok: true, lesson });
    }

    return NextResponse.json({ error: `Unknown job type: ${job.type}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accept failed" },
      { status: 400 },
    );
  }
}
