CREATE TYPE "public"."api_call_status" AS ENUM('success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "api_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"caller_wallet" text NOT NULL,
	"price_usd" numeric(10, 4) NOT NULL,
	"status" "api_call_status" NOT NULL,
	"request_hash" text,
	"error_message" text,
	"latency_ms" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "api_calls_request_hash_unique" UNIQUE("request_hash")
);
--> statement-breakpoint
CREATE TABLE "api_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text,
	"docs_url" text,
	"image_url" text,
	"sample_response" text,
	"provider_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"price_usd" numeric(10, 4) NOT NULL,
	"token_id" text NOT NULL,
	"provider_url" text NOT NULL,
	"gateway_path" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "api_endpoints_gateway_path_unique" UNIQUE("gateway_path")
);
--> statement-breakpoint
CREATE TABLE "api_query_params" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"description" text,
	"default_value" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_request_bodies" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"field_name" text NOT NULL,
	"field_type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"description" text,
	"example_value" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_upstream_headers" (
	"id" text PRIMARY KEY NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"header_name" text NOT NULL,
	"header_value" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chains" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chain_id" integer NOT NULL,
	"image_uri" text,
	"explorer_base_url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "chains_name_unique" UNIQUE("name"),
	CONSTRAINT "chains_chain_id_unique" UNIQUE("chain_id")
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" "email_status" NOT NULL,
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"api_endpoint_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text,
	"image_uri" text,
	"chain_id" text NOT NULL,
	"contract_address" text NOT NULL,
	"decimals" integer NOT NULL,
	"explorer_token_url" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "api_calls_api_endpoint_id_idx" ON "api_calls" USING btree ("api_endpoint_id");--> statement-breakpoint
CREATE INDEX "api_calls_caller_wallet_idx" ON "api_calls" USING btree ("caller_wallet");--> statement-breakpoint
CREATE INDEX "api_calls_created_at_idx" ON "api_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_endpoints_provider_id_idx" ON "api_endpoints" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "api_endpoints_is_active_idx" ON "api_endpoints" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_query_params_api_endpoint_id_idx" ON "api_query_params" USING btree ("api_endpoint_id");--> statement-breakpoint
CREATE INDEX "api_query_params_name_idx" ON "api_query_params" USING btree ("name");--> statement-breakpoint
CREATE INDEX "api_request_bodies_api_endpoint_id_idx" ON "api_request_bodies" USING btree ("api_endpoint_id");--> statement-breakpoint
CREATE INDEX "api_request_bodies_field_name_idx" ON "api_request_bodies" USING btree ("field_name");--> statement-breakpoint
CREATE UNIQUE INDEX "api_reviews_api_endpoint_id_reviewer_id_idx" ON "api_reviews" USING btree ("api_endpoint_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "api_tags_api_endpoint_id_idx" ON "api_tags" USING btree ("api_endpoint_id");--> statement-breakpoint
CREATE INDEX "api_tags_tag_idx" ON "api_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "api_upstream_headers_api_endpoint_id_idx" ON "api_upstream_headers" USING btree ("api_endpoint_id");--> statement-breakpoint
CREATE INDEX "emails_user_id_idx" ON "emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "emails_status_idx" ON "emails" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_id_api_endpoint_id_idx" ON "favorites" USING btree ("user_id","api_endpoint_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tokens_symbol_chain_id_idx" ON "tokens" USING btree ("symbol","chain_id");--> statement-breakpoint
CREATE INDEX "wallets_user_id_idx" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");


