import { z } from "zod";
import { avatarConfigSchema } from "@/lib/schemas/avatar";
import { cardSchema } from "@/lib/schemas/content";

export const generateProfessorInputSchema = z.object({
  name: z.string().min(1).max(120),
  focus: z.string().min(1).max(300),
  personality_notes: z.string().max(1000).default(""),
});

export const generatedProfessorSchema = z.object({
  tagline: z.string().min(1),
  bio: z.string().min(1),
  voice_prompt: z.string().min(1),
  sample_phrases: z.array(z.string()).min(2).max(8),
  suggested_avatar_config: avatarConfigSchema,
});

export const generateContentInputSchema = z.object({
  professor_id: z.string().uuid(),
  topic: z.string().min(1).max(300),
  learning_objectives: z.string().min(1).max(2000),
  course_id: z.string().uuid().optional(),
  course_title: z.string().max(200).optional(),
  num_chapters: z.number().int().min(1).max(6).default(3),
  questions_per_chapter: z.number().int().min(2).max(5).default(3),
  checkpoint_questions: z.number().int().min(3).max(8).default(5),
});

const generatedQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  answer_index: z.number().int().nonnegative(),
  explanation: z.string().min(1),
});

export const generatedContentSchema = z.object({
  lesson_title: z.string().min(1),
  encouragement: z.string().optional(),
  chapters: z
    .array(
      z.object({
        title: z.string().min(1),
        cards: z.array(cardSchema).min(2).max(6),
        quiz: z.array(generatedQuestionSchema).min(1),
      }),
    )
    .min(1),
  checkpoint: z.array(generatedQuestionSchema).min(1),
});

export type GenerateProfessorInput = z.infer<typeof generateProfessorInputSchema>;
export type GeneratedProfessor = z.infer<typeof generatedProfessorSchema>;
export type GenerateContentInput = z.infer<typeof generateContentInputSchema>;
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
