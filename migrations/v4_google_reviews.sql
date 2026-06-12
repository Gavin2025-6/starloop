-- v4: Google Reviews sync fields
-- Run: railway run npx prisma db execute --file migrations/v4_google_reviews.sql

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "googleReviewId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Review_googleReviewId_key"
  ON "Review"("googleReviewId")
  WHERE "googleReviewId" IS NOT NULL;

ALTER TABLE "GoogleBusinessConnection" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);
