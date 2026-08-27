import { z } from "zod";

export const avatarConfigSchema = z.object({
  bg: z.string().optional(),
  skin: z.string().optional(),
  hair: z.enum(["short", "sides", "bald", "long", "curly"]).optional(),
  hairColor: z.string().optional(),
  beard: z.boolean().optional(),
  mustache: z.boolean().optional(),
  glasses: z.boolean().optional(),
  accessory: z.enum(["none", "cigar", "bowtie"]).optional(),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;
