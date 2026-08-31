import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const professorChatInputSchema = z.object({
  professor_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  history: z.array(chatMessageSchema).max(24).default([]),
  context: z
    .object({
      course_title: z.string().max(200).optional(),
      lesson_title: z.string().max(200).optional(),
      chapter_title: z.string().max(200).optional(),
    })
    .optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ProfessorChatInput = z.infer<typeof professorChatInputSchema>;
