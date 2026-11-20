ALTER TABLE "project" ADD COLUMN "life_domains" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "start_date" date;