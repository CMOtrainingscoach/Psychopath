import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateValidatedJson, OPENAI_MODEL } from "@/lib/ai/openai";
import { assertGenerationRateLimit } from "@/lib/ai/rate-limit";
import {
  generateContentInputSchema,
  generatedContentSchema,
} from "@/lib/schemas/generation";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();
  if (response || !user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = generateContentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    await assertGenerationRateLimit(user.id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rate limit" },
      { status: 429 },
    );
  }

  const { data: professor, error: pErr } = await admin
    .from("professors")
    .select("id, name, tagline, voice_prompt")
    .eq("id", parsed.data.professor_id)
    .maybeSingle();

  if (pErr || !professor) {
    return NextResponse.json({ error: "Professor not found" }, { status: 404 });
  }

  const { data: job, error: jobErr } = await admin
    .from("generation_jobs")
    .insert({
      type: "content",
      status: "running",
      input: parsed.data,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? "Job create failed" }, { status: 500 });
  }

  try {
    const { data, usage } = await generateValidatedJson({
      system: `You write master's-prep psychology lesson drafts for a gamified app.
Write in this professor's voice at all times:
${professor.voice_prompt}

Rules:
- Prefer established, mainstream psychology (textbook-accurate).
- Card types must be one of: idea, eg, tip, name.
- Each quiz option list must include exactly one correct answer; answer_index is 0-based.
- Explanations must teach, not just say "correct".
- Content is a DRAFT for human review before publishing.`,
      user: `Draft one lesson.
Professor: ${professor.name} (${professor.tagline})
Topic: ${parsed.data.topic}
Course context: ${parsed.data.course_title || "n/a"}
Learning objectives:
${parsed.data.learning_objectives}

Produce ${parsed.data.num_chapters} chapters.
Each chapter: 3 teaching cards + ${parsed.data.questions_per_chapter} MCQ quiz questions.
Also a lesson checkpoint with ${parsed.data.checkpoint_questions} MCQs.

JSON shape:
{
  "lesson_title": string,
  "encouragement": string,
  "chapters": [
    {
      "title": string,
      "cards": [{ "type": "idea"|"eg"|"tip"|"name", "heading": string, "body": string }],
      "quiz": [{ "prompt": string, "options": string[], "answer_index": number, "explanation": string }]
    }
  ],
  "checkpoint": [{ "prompt": string, "options": string[], "answer_index": number, "explanation": string }]
}`,
      schema: generatedContentSchema,
      maxTokens: 8000,
    });

    // Soft-check answer indices in range
    for (const ch of data.chapters) {
      for (const q of ch.quiz) {
        if (q.answer_index >= q.options.length) {
          throw new Error("Generated quiz answer_index out of range");
        }
      }
    }
    for (const q of data.checkpoint) {
      if (q.answer_index >= q.options.length) {
        throw new Error("Generated checkpoint answer_index out of range");
      }
    }

    const { data: updated, error: upErr } = await admin
      .from("generation_jobs")
      .update({
        status: "succeeded",
        output: {
          ...data,
          professor_id: professor.id,
          course_id: parsed.data.course_id ?? null,
          _meta: { usage, model: OPENAI_MODEL },
        },
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    console.info("[ai] content generation ok", usage);
    return NextResponse.json({ job: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await admin
      .from("generation_jobs")
      .update({ status: "failed", output: { error: message } })
      .eq("id", job.id);
    console.error("[ai] content generation failed", message);
    return NextResponse.json({ error: message, job_id: job.id }, { status: 502 });
  }
}
