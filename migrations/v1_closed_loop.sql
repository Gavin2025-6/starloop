-- v1 closed loop schema migration
-- All IF NOT EXISTS — safe to re-run

-- Availability: business hours per day
CREATE TABLE IF NOT EXISTS "Availability" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "businessId"       TEXT NOT NULL,
  "dayOfWeek"        INTEGER NOT NULL, -- 0=Sun .. 6=Sat
  "startTime"        TEXT NOT NULL,    -- "09:00"
  "endTime"          TEXT NOT NULL,    -- "17:00"
  "slotDurationMin"  INTEGER NOT NULL DEFAULT 60,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Availability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Availability_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Availability_businessId_idx" ON "Availability"("businessId");

-- TimeOff: specific dates off
CREATE TABLE IF NOT EXISTS "TimeOff" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "businessId" TEXT NOT NULL,
  "date"       DATE NOT NULL,
  "reason"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimeOff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TimeOff_businessId_idx" ON "TimeOff"("businessId");

-- BusinessMember: team/owner table
CREATE TABLE IF NOT EXISTS "BusinessMember" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "businessId"   TEXT NOT NULL,
  "userId"       TEXT,
  "role"         TEXT NOT NULL DEFAULT 'member',  -- owner | member
  "invitedEmail" TEXT,
  "status"       TEXT NOT NULL DEFAULT 'active',  -- active | invited
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BusinessMember_businessId_idx" ON "BusinessMember"("businessId");

-- GoogleBusinessConnection: OAuth + location info (from StarLoop pattern)
CREATE TABLE IF NOT EXISTS "GoogleBusinessConnection" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "businessId"   TEXT NOT NULL,
  "accessToken"  TEXT NOT NULL,
  "refreshToken" TEXT,
  "locationId"   TEXT,
  "reviewUrl"    TEXT,
  "placeId"      TEXT,
  "expiresAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoogleBusinessConnection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoogleBusinessConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "GoogleBusinessConnection_businessId_key" ON "GoogleBusinessConnection"("businessId");

-- JobEvent: audit log for Job state machine
CREATE TABLE IF NOT EXISTS "JobEvent" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "jobId"     TEXT NOT NULL,
  "type"      TEXT NOT NULL,   -- status_changed | invoice_sent | sms_sent | etc
  "payload"   JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "JobEvent_jobId_idx" ON "JobEvent"("jobId");

-- Add source column to Job if missing
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';

-- Add autoConfirm flag to Business (controls booking auto-confirm)
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "autoConfirmBooking" BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing Business owners into BusinessMember table
INSERT INTO "BusinessMember" ("id", "businessId", "userId", "role", "status")
SELECT
  gen_random_uuid()::TEXT,
  b."id",
  b."userId",
  'owner',
  'active'
FROM "Business" b
WHERE NOT EXISTS (
  SELECT 1 FROM "BusinessMember" bm
  WHERE bm."businessId" = b."id" AND bm."role" = 'owner'
);
