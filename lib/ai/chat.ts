import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/openai";
import type { ChatMessage } from "@/lib/schemas/chat";

export async function chatWithProfessor(params: {
  voicePrompt: string;
  professorName: string;
  tagline: string;
  bio: string;
  message: string;
  history: ChatMessage[];
  context?: {
    course_title?: string;
    lesson_title?: string;
    chapter_title?: string;
  };
}): Promise<{ reply: string; usage: { input_tokens: number; output_tokens: number } }> {
  const client = getOpenAIClient();

  const contextLines = [
    params.context?.course_title && `Course: ${params.context.course_title}`,
    params.context?.lesson_title && `Lesson: ${params.context.lesson_title}`,
    params.context?.chapter_title && `Current chapter: ${params.context.chapter_title}`,
  ]
    .filter(Boolean)
    .join("\n");

  const instructions = `${params.voicePrompt}

You are ${params.professorName} (${params.tagline}).
Background: ${params.bio}

You are chatting one-on-one with a psychology student in the PsychPath learning app.
Stay fully in character — use your distinctive tone, humor, and teaching style.
Keep replies concise (2–4 short paragraphs max), warm, accurate, and encouraging.
Focus on psychology and the learner's current topic. Politely redirect off-topic questions.
${contextLines ? `\nLearner context:\n${contextLines}` : ""}`;

  const input = [
    ...params.history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: params.message },
  ];

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions,
    input,
    max_output_tokens: 1024,
  });

  const text =
    response.output_text ??
    response.output
      ?.filter((item) => item.type === "message")
      .flatMap((item) =>
        item.content.filter((c) => c.type === "output_text").map((c) => c.text),
      )
      .join("\n") ??
    "";

  if (response.status === "incomplete") {
    throw new Error("Professor response was cut short — try a shorter question.");
  }
  if (!text.trim()) {
    throw new Error("Professor did not reply — please try again.");
  }

  return {
    reply: text.trim(),
    usage: {
      input_tokens: response.usage?.input_tokens ?? 0,
      output_tokens: response.usage?.output_tokens ?? 0,
    },
  };
}
