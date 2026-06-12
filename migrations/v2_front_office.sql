-- v2 Front Office Schema — idempotent, safe to re-run
-- Run with: railway run npx prisma db execute --file migrations/v2_front_office.sql

-- ─── 1. Trade enum ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "Trade" AS ENUM (
    'HVAC','PLUMBING','ELECTRICAL','CLEANING','ROOFING','HANDYMAN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Business: generative onboarding + address + Stripe Connect ────────────
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "trade"              "Trade";
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "aiGreetingScript"   TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "intakeQuestions"    JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "addressLine1"       TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "province"           TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "postalCode"         TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "stripeAccountId"    TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "stripeChargesEnabled"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "stripeOnboardedAt"  TIMESTAMP(3);

-- ─── 3. Customer: address fields ──────────────────────────────────────────────
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "addressLine1" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "city"         TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "province"     TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "postalCode"   TEXT;

-- ─── 4. Job: price book link + quote type + address completion ────────────────
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "priceBookItemId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "quoteType"       TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "city"            TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "province"        TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "postalCode"      TEXT;

-- ─── 5. PriceBookItem table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PriceBookItem" (
  "id"          TEXT NOT NULL,
  "businessId"  TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "priceMin"    DECIMAL(65,30) NOT NULL,
  "priceMax"    DECIMAL(65,30) NOT NULL,
  "unit"        TEXT NOT NULL DEFAULT 'flat',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceBookItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PriceBookItem_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── 6. Payment table (Stripe Connect flow) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "Payment" (
  "id"                    TEXT NOT NULL,
  "jobId"                 TEXT NOT NULL,
  "businessId"            TEXT NOT NULL,
  "stripePaymentLinkId"   TEXT,
  "stripePaymentIntentId" TEXT,
  "amount"                DECIMAL(65,30) NOT NULL,
  "applicationFee"        DECIMAL(65,30) NOT NULL,
  "status"                TEXT NOT NULL DEFAULT 'pending',
  "paidAt"                TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "Payment_jobId_key"  UNIQUE ("jobId"),
  CONSTRAINT "Payment_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── 7. Optional FK: Job → PriceBookItem ─────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_priceBookItemId_fkey"
    FOREIGN KEY ("priceBookItemId") REFERENCES "PriceBookItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
