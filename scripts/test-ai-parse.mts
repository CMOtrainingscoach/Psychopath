/**
 * Minimal AI JSON extraction + schema smoke tests (no API key required).
 * Run: npm run test:ai-parse
 */
import assert from "node:assert/strict";
import { z } from "zod";
import { extractJsonText } from "../lib/ai/extract-json.ts";

assert.equal(extractJsonText('{"a":1}'), '{"a":1}');
assert.equal(extractJsonText('Here:\n```json\n{"a":2}\n```\n'), '{"a":2}');
assert.equal(extractJsonText('noise {"b":3} trailing'), '{"b":3}');

const professorSchema = z.object({
  tagline: z.string().min(1),
  bio: z.string().min(1),
  voice_prompt: z.string().min(1),
  sample_phrases: z.array(z.string()).min(2),
  suggested_avatar_config: z.object({
    hair: z.enum(["short", "sides", "bald", "long", "curly"]).optional(),
    accessory: z.enum(["none", "cigar", "bowtie"]).optional(),
  }),
});

const professor = professorSchema.parse({
  tagline: "Behaviorist with a wink",
  bio: "Teaches conditioning through everyday stories.",
  voice_prompt: "Warm, concrete metaphors, light humor.",
  sample_phrases: ["Let's pair this.", "Nice catch."],
  suggested_avatar_config: { hair: "short", accessory: "none" },
});
assert.ok(professor.tagline.includes("Behaviorist"));

const bad = professorSchema.safeParse({ tagline: "" });
assert.equal(bad.success, false);

console.log("test-ai-parse: ok");
