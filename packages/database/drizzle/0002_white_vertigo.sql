ALTER TABLE "subscriptions" ADD COLUMN "yookassa_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "next_payment_date" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "grace_period_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_subscriptions_grace_period" ON "subscriptions" USING btree ("status","grace_period_ends_at");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_yookassa_sub" ON "subscriptions" USING btree ("yookassa_subscription_id");