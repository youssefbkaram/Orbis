ALTER TABLE "task" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "priority" SET DATA TYPE integer USING CASE WHEN "priority" THEN 1 ELSE 4 END;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "priority" SET DEFAULT 4;