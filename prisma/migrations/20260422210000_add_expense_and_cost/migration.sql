-- Phase B: Expense management table
CREATE TABLE "Expense" (
  "id"            TEXT NOT NULL,
  "expenseDate"   DATE NOT NULL,
  "category"      TEXT NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "note"          TEXT,
  "payee"         TEXT,
  "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
  "branchId"      TEXT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Expense_branch_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL
);
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- Phase C: Cost tracking
ALTER TABLE "Product"  ADD COLUMN IF NOT EXISTS "costPrice"  DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SaleLine" ADD COLUMN IF NOT EXISTS "costAtSale" DOUBLE PRECISION NOT NULL DEFAULT 0;
