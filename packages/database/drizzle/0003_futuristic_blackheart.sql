ALTER TABLE "admin_actions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_blocked" ON "users" USING btree ("is_blocked");--> statement-breakpoint
ALTER TABLE "model_pricing" ADD CONSTRAINT "model_pricing_model_id_unique" UNIQUE("model_id");