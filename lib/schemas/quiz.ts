import { z } from "zod";

export const gradeQuizSchema = z.object({
  ownerType: z.enum(["chapter", "lesson"]),
  ownerId: z.string().uuid(),
  answers: z.array(z.number().int().nonnegative()),
});

export type GradeQuizInput = z.infer<typeof gradeQuizSchema>;
