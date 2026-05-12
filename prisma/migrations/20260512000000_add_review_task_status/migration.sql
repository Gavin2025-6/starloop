-- AddColumn: taskStatus, resolvedAt, archivedAt to Review table
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "taskStatus" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
