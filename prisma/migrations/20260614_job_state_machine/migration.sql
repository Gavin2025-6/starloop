-- v6: Job State Machine — strict enum states, audit trail, zero re-entry fields

-- New Job fields
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "scheduledEnd"       TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "actualStart"        TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "actualEnd"          TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "paidAmount"         DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "balanceAmount"      DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "cancelReason"       TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "customerName"       TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "customerPhone"      TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "serviceDescription" TEXT;

-- Migrate old status values to new state machine states
UPDATE "Job" SET "status" = 'scheduled'        WHERE "status" = 'requested';
UPDATE "Job" SET "status" = 'scheduled'        WHERE "status" = 'confirmed';
UPDATE "Job" SET "status" = 'scheduled'        WHERE "status" = 'quoted';
UPDATE "Job" SET "status" = 'awaiting_payment' WHERE "status" = 'invoiced';

-- New JobEvent audit fields
ALTER TABLE "JobEvent" ADD COLUMN IF NOT EXISTS "fromStatus"  TEXT;
ALTER TABLE "JobEvent" ADD COLUMN IF NOT EXISTS "toStatus"    TEXT;
ALTER TABLE "JobEvent" ADD COLUMN IF NOT EXISTS "triggeredBy" TEXT;
ALTER TABLE "JobEvent" ADD COLUMN IF NOT EXISTS "note"        TEXT;
