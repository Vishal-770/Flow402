ALTER TABLE "api_calls" ADD COLUMN "price_amount" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD COLUMN "price_amount" text NOT NULL;--> statement-breakpoint
CREATE INDEX "api_endpoints_token_id_idx" ON "api_endpoints" USING btree ("token_id");--> statement-breakpoint
ALTER TABLE "api_calls" DROP COLUMN "price_usd";--> statement-breakpoint
ALTER TABLE "api_endpoints" DROP COLUMN "price_usd";