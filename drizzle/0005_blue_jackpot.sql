ALTER TABLE "task" ADD COLUMN "labels" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "project" text;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "scheduled_date" date;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "priority" integer DEFAULT 4 NOT NULL;