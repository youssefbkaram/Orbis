ALTER TABLE "task_subtask" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "labels" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "location" text;