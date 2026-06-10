-- Job system + Availability system migration
-- Safe: all IF NOT EXISTS

-- Job table
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "address" TEXT,
    "lineItems" JSONB,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedTo" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "captureStatus" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Job_jobNumber_key" ON "Job"("jobNumber");
ALTER TABLE "Job" ADD CONSTRAINT "Job_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lineItems" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "stripePaymentLink" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_jobId_key" ON "Invoice"("jobId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'technician',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Availability table
CREATE TABLE IF NOT EXISTS "Availability" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "workingDays" JSONB NOT NULL DEFAULT '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}',
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 120,
    "bufferTime" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Availability_businessId_key" ON "Availability"("businessId");

DO $$ BEGIN
  ALTER TABLE "Availability" ADD CONSTRAINT "Availability_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TimeOff table
CREATE TABLE IF NOT EXISTS "TimeOff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TimeOff_businessId_date_idx" ON "TimeOff"("businessId", "date");

DO $$ BEGIN
  ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
