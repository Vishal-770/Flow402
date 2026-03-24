import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment is too long"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
