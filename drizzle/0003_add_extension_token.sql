DROP INDEX "time_entry_user_status_idx";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "extension_token" text;--> statement-breakpoint
ALTER TABLE "time_entry" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_extension_token_unique" UNIQUE("extension_token");