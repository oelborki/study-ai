import { z } from "zod";

export const createDeckSchema = z.object({
  title: z
    .string()
    .min(1, "Deck title is required")
    .max(200, "Deck title must be less than 200 characters")
    .trim(),
  fileId: z.string().min(1, "File ID is required"),
  teamId: z.string().optional(),
});

export const generateSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  config: z
    .object({
      numCards: z
        .number()
        .int()
        .min(1, "Must generate at least 1 card")
        .max(100, "Cannot generate more than 100 cards at once")
        .optional(),
      focusTopics: z.array(z.string()).optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    })
    .optional(),
});

export const updateDeckSchema = z.object({
  title: z
    .string()
    .min(1, "Deck title is required")
    .max(200, "Deck title must be less than 200 characters")
    .trim()
    .optional(),
  isPublic: z.boolean().optional(),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type GenerateInput = z.infer<typeof generateSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
