import OpenAI from "openai";
import { z } from "zod";
import { extractJsonText } from "@/lib/ai/extract-json";

export { extractJsonText };

/**
 * Balanced cost/quality for structured curriculum drafts.
 * Override with OPENAI_MODEL if you prefer gpt-5.6 / gpt-5.6-luna / etc.
 */
export const OPENAI_MODEL =
  process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra";

export function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: key });
}

export async function generateValidatedJson<T>(params: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<{ data: T; usage: { input_tokens: number; output_tokens: number } }> {
  const client = getOpenAIClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      instructions: `${params.system}

You MUST respond with a single valid JSON object only.
No markdown, no commentary, no code fences.`,
      input:
        attempt === 0
          ? params.user
          : `${params.user}\n\nPrevious response was invalid JSON or failed schema validation. Return corrected JSON only.`,
      text: { format: { type: "json_object" } },
      max_output_tokens: params.maxTokens ?? 4096,
    });

    const text =
      response.output_text ??
      response.output
        ?.filter((item) => item.type === "message")
        .flatMap((item) =>
          item.content
            .filter((c) => c.type === "output_text")
            .map((c) => c.text),
        )
        .join("\n") ??
      "";

    const usage = {
      input_tokens: response.usage?.input_tokens ?? 0,
      output_tokens: response.usage?.output_tokens ?? 0,
    };

    if (response.status === "incomplete") {
      lastError = new Error(
        `Incomplete response: ${response.incomplete_details?.reason ?? "unknown"}`,
      );
      continue;
    }

    try {
      const parsed = JSON.parse(extractJsonText(text)) as unknown;
      const data = params.schema.parse(parsed);
      return { data, usage };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `AI JSON validation failed after retry: ${
      lastError instanceof Error ? lastError.message : "unknown"
    }`,
  );
}
