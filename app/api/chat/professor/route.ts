import { NextResponse } from "next/server";
import { chatWithProfessor } from "@/lib/ai/chat";
import { assertProfessorChatRateLimit } from "@/lib/ai/chat-rate-limit";
import { OPENAI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth";
import { professorChatInputSchema } from "@/lib/schemas/chat";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response || !user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = professorChatInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await assertProfessorChatRateLimit(user.id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rate limit" },
      { status: 429 },
    );
  }

  const admin = createAdminClient();
  const { data: professor, error: pErr } = await admin
    .from("professors")
    .select("id, name, tagline, bio, voice_prompt")
    .eq("id", parsed.data.professor_id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  if (!professor?.voice_prompt?.trim()) {
    return NextResponse.json({ error: "Professor not found" }, { status: 404 });
  }

  try {
    const { reply, usage } = await chatWithProfessor({
      voicePrompt: professor.voice_prompt,
      professorName: professor.name,
      tagline: professor.tagline,
      bio: professor.bio,
      message: parsed.data.message,
      history: parsed.data.history,
      context: parsed.data.context,
    });

    await admin.from("generation_jobs").insert({
      type: "professor_chat",
      status: "succeeded",
      input: {
        professor_id: professor.id,
        context: parsed.data.context ?? null,
      },
      output: { usage, model: OPENAI_MODEL },
      created_by: user.id,
    });

    console.info("[chat] professor", professor.id, usage);
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[chat] professor failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
