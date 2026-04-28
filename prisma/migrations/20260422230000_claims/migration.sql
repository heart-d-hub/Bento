CREATE TABLE IF NOT EXISTS "Claim" (
  "id"          TEXT NOT NULL,
  "claimNo"     TEXT NOT NULL,
  "returnId"    TEXT,
  "productId"   TEXT,
  "productName" TEXT NOT NULL DEFAULT '',
  "serialNo"    TEXT,
  "issue"       TEXT NOT NULL DEFAULT '',
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "vendorName"  TEXT,
  "resolution"  TEXT,
  "resolvedAt"  TIMESTAMP WITH TIME ZONE,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Claim_claimNo_key" ON "Claim"("claimNo");
