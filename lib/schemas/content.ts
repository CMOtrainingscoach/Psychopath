import { z } from "zod";

export const cardTypeSchema = z.enum(["idea", "eg", "tip", "name"]);

export const cardSchema = z.object({
  type: cardTypeSchema,
  heading: z.string().min(1),
  body: z.string().min(1),
});

export const cardsSchema = z.array(cardSchema);

export const questionTypeSchema = z.enum(["mcq"]);

export const questionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
  explanation: z.string(),
  type: questionTypeSchema.default("mcq"),
});

export type ContentCard = z.infer<typeof cardSchema>;
export type ContentQuestion = z.infer<typeof questionSchema>;
