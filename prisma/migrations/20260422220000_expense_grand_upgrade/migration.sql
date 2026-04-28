-- Phase 1: recurring + status on Expense
ALTER TABLE "Expense"
  ADD COLUMN IF NOT EXISTS "isRecurring"        BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "recurringInterval"  TEXT,
  ADD COLUMN IF NOT EXISTS "status"             TEXT      NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS "approvedBy"         TEXT;

-- Phase 2: budget per category
CREATE TABLE IF NOT EXISTS "ExpenseBudget" (
  "id"            TEXT              NOT NULL,
  "category"      TEXT              NOT NULL,
  "monthlyAmount" DOUBLE PRECISION  NOT NULL DEFAULT 0,
  "branchId"      TEXT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "ExpenseBudget_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseBudget_category_branch_key"
  ON "ExpenseBudget" (category, COALESCE("branchId",''));

-- Phase 3: vendor / payee book
CREATE TABLE IF NOT EXISTS "Vendor" (
  "id"            TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "bankName"      TEXT,
  "bankAccount"   TEXT,
  "contactName"   TEXT,
  "phone"         TEXT,
  "note"          TEXT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name");
