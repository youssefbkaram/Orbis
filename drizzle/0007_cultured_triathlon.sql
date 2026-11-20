ALTER TABLE "task" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "task_subtask" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;