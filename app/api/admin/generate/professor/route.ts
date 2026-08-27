import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateValidatedJson, OPENAI_MODEL } from "@/lib/ai/openai";
import { assertGenerationRateLimit } from "@/lib/ai/rate-limit";
import {
  generateProfessorInputSchema,
  generatedProfessorSchema,
} from "@/lib/schemas/generation";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();
  if (response || !user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = generateProfessorInputSchema.safeParse(body);
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

  const { data: job, error: jobErr } = await admin
    .from("generation_jobs")
    .insert({
      type: "professor",
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
      system: `You create cartoon psychology professor personas for a Duolingo-style learning app.
Return accurate, warm, memorable teaching personas. avatar_config must use only:
hair: short|sides|bald|long|curly; accessory: none|cigar|bowtie; optional beard/mustache/glasses booleans; bg and hairColor as hex colors.`,
      user: `Create a professor persona.
Name: ${parsed.data.name}
Focus/era: ${parsed.data.focus}
Personality notes: ${parsed.data.personality_notes || "(none)"}

JSON shape:
{
  "tagline": string,
  "bio": string,
  "voice_prompt": string (reusable teaching persona: register, humor, metaphors, quirks),
  "sample_phrases": string[3-5],
  "suggested_avatar_config": { "bg", "hair", "hairColor", "beard", "mustache", "glasses", "accessory" }
}`,
      schema: generatedProfessorSchema,
      maxTokens: 2000,
    });

    const { data: updated, error: upErr } = await admin
      .from("generation_jobs")
      .update({
        status: "succeeded",
        output: { ...data, _meta: { usage, model: OPENAI_MODEL } },
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    console.info("[ai] professor generation ok", usage);
    return NextResponse.json({ job: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await admin
      .from("generation_jobs")
      .update({ status: "failed", output: { error: message } })
      .eq("id", job.id);
    console.error("[ai] professor generation failed", message);
    return NextResponse.json({ error: message, job_id: job.id }, { status: 502 });
  }
}
