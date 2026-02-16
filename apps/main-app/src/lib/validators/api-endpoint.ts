import { z } from "zod";

const upstreamHeaderSchema = z.object({
  headerName: z.string().min(1, "Header name is required"),
  headerValue: z.string().min(1, "Header value is required"),
});

const queryParamSchema = z.object({
  name: z.string().min(1, "Param name is required"),
  type: z.string().min(1, "Type is required"),
  required: z.boolean().default(false),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
});

const requestBodySchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldType: z.string().min(1, "Field type is required"),
  required: z.boolean().default(false),
  description: z.string().optional(),
  exampleValue: z.string().optional(),
});

export const createApiEndpointSchema = z.object({
  description: z.string().min(1, "Description is required"),
  docsUrl: z.string().url("Must be a valid URL"),
  imageUrl: z.string().optional(),
  sampleResponse: z.string().min(1, "Sample response is required"),
  walletId: z.string().min(1, "Wallet is required"),
  priceAmount: z.string().min(1, "Price is required"),
  tokenId: z.string().min(1, "Token is required"),
  providerUrl: z.string().url("Must be a valid URL").min(1, "Provider URL is required"),
  gatewayPath: z
    .string()
    .min(1, "Gateway path is required")
    .regex(/^\/[a-zA-Z0-9\-_/]+$/, "Must start with / and contain only letters, numbers, hyphens, underscores, and slashes")
    .optional(),
  category: z.string().optional(),
  upstreamHeaders: z.array(upstreamHeaderSchema).optional(),
  queryParams: z.array(queryParamSchema).optional(),
  requestBody: z.array(requestBodySchema).optional(),
});

export type CreateApiEndpointInput = z.infer<typeof createApiEndpointSchema>;

export const updateApiEndpointSchema = createApiEndpointSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateApiEndpointInput = z.infer<typeof updateApiEndpointSchema>;
