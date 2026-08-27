import { z } from "zod";
import { avatarConfigSchema } from "@/lib/schemas/avatar";
import { cardsSchema } from "@/lib/schemas/content";

export const professorWriteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().default(""),
  bio: z.string().default(""),
  avatar_config: avatarConfigSchema.default({}),
  voice_prompt: z.string().default(""),
  sample_phrases: z.array(z.string()).default([]),
  legacy_key: z.string().nullable().optional(),
});

export const courseWriteSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  description: z.string().default(""),
  color: z.string().default("#6C5CE7"),
  icon: z.string().default("🧠"),
  order_index: z.number().int().optional(),
  is_published: z.boolean().optional(),
  default_professor_id: z.string().uuid().nullable().optional(),
});

export const lessonWriteSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1),
  order_index: z.number().int().optional(),
  professor_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().optional(),
  legacy_key: z.string().nullable().optional(),
});

export const lessonUpdateSchema = lessonWriteSchema.partial().omit({ course_id: true }).extend({
  title: z.string().min(1).optional(),
});

export const chapterWriteSchema = z.object({
  lesson_id: z.string().uuid(),
  title: z.string().min(1),
  order_index: z.number().int().optional(),
  cards: cardsSchema.default([]),
  is_published: z.boolean().optional(),
  legacy_key: z.string().nullable().optional(),
});

export const chapterUpdateSchema = chapterWriteSchema.partial().omit({ lesson_id: true }).extend({
  title: z.string().min(1).optional(),
  cards: cardsSchema.optional(),
});

export const questionWriteSchema = z.object({
  owner_type: z.enum(["chapter", "lesson"]),
  owner_id: z.string().uuid(),
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
  explanation: z.string().default(""),
  order_index: z.number().int().optional(),
  type: z.literal("mcq").optional().default("mcq"),
});

export const questionUpdateSchema = z.object({
  prompt: z.string().min(1).optional(),
  options: z.array(z.string()).min(2).optional(),
  answer_index: z.number().int().nonnegative().optional(),
  explanation: z.string().optional(),
  order_index: z.number().int().optional(),
});

export const reorderSchema = z.object({
  table: z.enum(["courses", "lessons", "chapters", "questions"]),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order_index: z.number().int().nonnegative(),
    }),
  ),
});

export const publishSchema = z.object({
  table: z.enum(["courses", "lessons", "chapters"]),
  id: z.string().uuid(),
  is_published: z.boolean(),
});
