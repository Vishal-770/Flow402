import { z } from "zod";

export const createTokenSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  name: z.string().optional(),
  chainId: z.string().min(1, "Chain is required"),
  contractAddress: z.string().min(1, "Contract address is required"),
  decimals: z.number().int().min(0, "Decimals must be 0 or greater").max(18, "Decimals cannot exceed 18"),
  explorerTokenUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUri: z.string().optional(),
});

export type CreateTokenInput = z.infer<typeof createTokenSchema>;

export const updateTokenSchema = createTokenSchema.partial();
export type UpdateTokenInput = z.infer<typeof updateTokenSchema>;
