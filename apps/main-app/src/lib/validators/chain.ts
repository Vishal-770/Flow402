import { z } from "zod";

export const createChainSchema = z.object({
  name: z.string().min(1, "Name is required"),
  chainId: z.number().int().positive("Chain ID must be a positive integer"),
  explorerBaseUrl: z.string().url("Must be a valid URL"),
  imageUri: z.string().optional(),
});

export type CreateChainInput = z.infer<typeof createChainSchema>;

export const updateChainSchema = createChainSchema.partial();
export type UpdateChainInput = z.infer<typeof updateChainSchema>;
