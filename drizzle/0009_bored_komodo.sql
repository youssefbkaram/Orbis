CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(140) NOT NULL,
	"description" text,
	"domain" varchar(80),
	"target_date" date,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"color" varchar(7) DEFAULT '#2563eb' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_progress_range" CHECK ("project"."progress" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_user_status_idx" ON "project" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "project_user_target_date_idx" ON "project" USING btree ("user_id","target_date");