import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const apiCallStatus = pgEnum("api_call_status", [
  "success",
  "failed",
  "refunded",
]);
export const emailStatus = pgEnum("email_status", ["queued", "sent", "failed"]);

// Auth & Users
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    address: text("address").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("wallets_user_id_idx").on(table.userId)],
);

// Chain & Token
export const chains = pgTable("chains", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  chainId: integer("chain_id").notNull().unique(),
  imageUri: text("image_uri"),
  explorerBaseUrl: text("explorer_base_url").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const tokens = pgTable(
  "tokens",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name"),
    imageUri: text("image_uri"),
    chainId: text("chain_id").notNull(),
    contractAddress: text("contract_address").notNull(),
    decimals: integer("decimals").notNull(),
    explorerTokenUrl: text("explorer_token_url"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("tokens_symbol_chain_id_idx").on(table.symbol, table.chainId),
  ],
);

// API Marketplace
export const apiEndpoints = pgTable(
  "api_endpoints",
  {
    id: text("id").primaryKey(),
    description: text("description"),
    docsUrl: text("docs_url"),
    imageUrl: text("image_url"),
    sampleResponse: text("sample_response"),
    providerId: text("provider_id").notNull(),
    walletId: text("wallet_id").notNull(),
    priceUsd: decimal("price_usd", { precision: 10, scale: 4 }).notNull(),
    tokenId: text("token_id").notNull(),
    providerUrl: text("provider_url").notNull(),
    gatewayPath: text("gateway_path").notNull().unique(),
    category: text("category"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("api_endpoints_provider_id_idx").on(table.providerId),
    index("api_endpoints_is_active_idx").on(table.isActive),
  ],
);

// API Tags
export const apiTags = pgTable(
  "api_tags",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("api_tags_api_endpoint_id_idx").on(table.apiEndpointId),
    index("api_tags_tag_idx").on(table.tag),
  ],
);

// API Input Definitions
export const apiQueryParams = pgTable(
  "api_query_params",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    required: boolean("required").notNull().default(false),
    description: text("description"),
    defaultValue: text("default_value"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("api_query_params_api_endpoint_id_idx").on(table.apiEndpointId),
    index("api_query_params_name_idx").on(table.name),
  ],
);

export const apiRequestBodies = pgTable(
  "api_request_bodies",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    fieldName: text("field_name").notNull(),
    fieldType: text("field_type").notNull(),
    required: boolean("required").notNull().default(false),
    description: text("description"),
    exampleValue: text("example_value"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("api_request_bodies_api_endpoint_id_idx").on(table.apiEndpointId),
    index("api_request_bodies_field_name_idx").on(table.fieldName),
  ],
);

// API Activity
export const apiCalls = pgTable(
  "api_calls",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    callerWallet: text("caller_wallet").notNull(),
    priceUsd: decimal("price_usd", { precision: 10, scale: 4 }).notNull(),
    status: apiCallStatus("status").notNull(),
    requestHash: text("request_hash").unique(),
    errorMessage: text("error_message"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("api_calls_api_endpoint_id_idx").on(table.apiEndpointId),
    index("api_calls_caller_wallet_idx").on(table.callerWallet),
    index("api_calls_created_at_idx").on(table.createdAt),
  ],
);

export const apiReviews = pgTable(
  "api_reviews",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    reviewerId: text("reviewer_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("api_reviews_api_endpoint_id_reviewer_id_idx").on(
      table.apiEndpointId,
      table.reviewerId,
    ),
  ],
);

export const apiUpstreamHeaders = pgTable(
  "api_upstream_headers",
  {
    id: text("id").primaryKey(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    headerName: text("header_name").notNull(),
    headerValue: text("header_value").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("api_upstream_headers_api_endpoint_id_idx").on(table.apiEndpointId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    apiEndpointId: text("api_endpoint_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("favorites_user_id_api_endpoint_id_idx").on(
      table.userId,
      table.apiEndpointId,
    ),
  ],
);

// Emails
export const emails = pgTable(
  "emails",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: emailStatus("status").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("emails_user_id_idx").on(table.userId),
    index("emails_status_idx").on(table.status),
  ],
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  wallets: many(wallets),
  apiEndpoints: many(apiEndpoints),
  apiReviews: many(apiReviews),
  favorites: many(favorites),
  emails: many(emails),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(user, {
    fields: [wallets.userId],
    references: [user.id],
  }),
}));

export const chainsRelations = relations(chains, ({ many }) => ({
  tokens: many(tokens),
}));

export const tokensRelations = relations(tokens, ({ one, many }) => ({
  chain: one(chains, {
    fields: [tokens.chainId],
    references: [chains.id],
  }),
  apiEndpoints: many(apiEndpoints),
}));

export const apiEndpointsRelations = relations(
  apiEndpoints,
  ({ one, many }) => ({
    provider: one(user, {
      fields: [apiEndpoints.providerId],
      references: [user.id],
    }),
    wallet: one(wallets, {
      fields: [apiEndpoints.walletId],
      references: [wallets.id],
    }),
    token: one(tokens, {
      fields: [apiEndpoints.tokenId],
      references: [tokens.id],
    }),
    apiTags: many(apiTags),
    apiQueryParams: many(apiQueryParams),
    apiRequestBodies: many(apiRequestBodies),
    apiCalls: many(apiCalls),
    apiReviews: many(apiReviews),
    apiUpstreamHeaders: many(apiUpstreamHeaders),
    favorites: many(favorites),
  }),
);

export const apiTagsRelations = relations(apiTags, ({ one }) => ({
  apiEndpoint: one(apiEndpoints, {
    fields: [apiTags.apiEndpointId],
    references: [apiEndpoints.id],
  }),
}));

export const apiQueryParamsRelations = relations(apiQueryParams, ({ one }) => ({
  apiEndpoint: one(apiEndpoints, {
    fields: [apiQueryParams.apiEndpointId],
    references: [apiEndpoints.id],
  }),
}));

export const apiRequestBodiesRelations = relations(
  apiRequestBodies,
  ({ one }) => ({
    apiEndpoint: one(apiEndpoints, {
      fields: [apiRequestBodies.apiEndpointId],
      references: [apiEndpoints.id],
    }),
  }),
);

export const apiCallsRelations = relations(apiCalls, ({ one }) => ({
  apiEndpoint: one(apiEndpoints, {
    fields: [apiCalls.apiEndpointId],
    references: [apiEndpoints.id],
  }),
}));

export const apiReviewsRelations = relations(apiReviews, ({ one }) => ({
  apiEndpoint: one(apiEndpoints, {
    fields: [apiReviews.apiEndpointId],
    references: [apiEndpoints.id],
  }),
  reviewer: one(user, {
    fields: [apiReviews.reviewerId],
    references: [user.id],
  }),
}));

export const apiUpstreamHeadersRelations = relations(
  apiUpstreamHeaders,
  ({ one }) => ({
    apiEndpoint: one(apiEndpoints, {
      fields: [apiUpstreamHeaders.apiEndpointId],
      references: [apiEndpoints.id],
    }),
  }),
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(user, {
    fields: [favorites.userId],
    references: [user.id],
  }),
  apiEndpoint: one(apiEndpoints, {
    fields: [favorites.apiEndpointId],
    references: [apiEndpoints.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(user, {
    fields: [emails.userId],
    references: [user.id],
  }),
}));
