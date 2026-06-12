-- v3 Booking Rules + Vapi — idempotent, safe to re-run
-- Run with: railway run npx prisma db execute --file migrations/v3_booking_rules.sql

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "vapiAssistantId"       TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "bookingHoursStart"     TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "bookingHoursEnd"       TEXT NOT NULL DEFAULT '18:00';
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "bookingBufferMins"     INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "bookingWeekendEnabled" BOOLEAN NOT NULL DEFAULT false;
