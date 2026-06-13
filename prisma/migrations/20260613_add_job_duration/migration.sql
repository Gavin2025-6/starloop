-- v5: Add avg job duration and travel buffer fields to Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "avgJobDurationMins" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "travelBufferMins" INTEGER NOT NULL DEFAULT 30;
