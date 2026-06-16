-- v5: Client Hub, Review Requests, Cancellation System
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING pattern)

-- Job: v5 fields
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "clientToken"              TEXT UNIQUE;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "addressLine1"             TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "addressLine2"             TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "country"                  TEXT DEFAULT 'Canada';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "paymentMethod"            TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "cancelledBy"              TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "setupIntentId"            TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewRequestScheduledAt" TIMESTAMPTZ;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewRequestSentAt"      TIMESTAMPTZ;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewClicked"            BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewClickedAt"          TIMESTAMPTZ;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewClickedVia"         TEXT;

-- Customer: v5 risk fields
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "noShowCount"     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "isHighRisk"      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "requiresDeposit" BOOLEAN NOT NULL DEFAULT FALSE;

-- Business: v5 cancellation policy
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cancellationProtectionEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cancellationWindowHours"       INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cancellationFeeType"           TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cancellationFeeAmount"         DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cancellationPolicyText"        TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "noShowFeeEnabled"              BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "noShowFeeAmount"               DECIMAL(10,2) NOT NULL DEFAULT 0;

-- JobReviewStatus: new model
CREATE TABLE IF NOT EXISTS "JobReviewStatus" (
  "id"             TEXT NOT NULL,
  "jobId"          TEXT NOT NULL,
  "smsSent"        BOOLEAN NOT NULL DEFAULT FALSE,
  "emailSent"      BOOLEAN NOT NULL DEFAULT FALSE,
  "reviewClicked"  BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt"    TIMESTAMPTZ,
  "completedVia"   TEXT,
  "reminderSentAt" TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "JobReviewStatus_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobReviewStatus_jobId_key" UNIQUE ("jobId"),
  CONSTRAINT "JobReviewStatus_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
);

-- Backfill clientToken for all existing jobs that don't have one
UPDATE "Job" SET "clientToken" = gen_random_uuid()::TEXT WHERE "clientToken" IS NULL;
