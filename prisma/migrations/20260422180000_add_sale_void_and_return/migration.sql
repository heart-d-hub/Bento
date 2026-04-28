-- Void fields on Sale
ALTER TABLE "Sale" ADD COLUMN "voidedAt"   TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Sale" ADD COLUMN "voidReason" TEXT;

-- Return header
CREATE TABLE "SaleReturn" (
  "id"             TEXT                     NOT NULL,
  "returnNo"       TEXT                     NOT NULL,
  "originalSaleId" TEXT                     NOT NULL,
  "returnDate"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "reason"         TEXT,
  "refundMethod"   TEXT                     NOT NULL DEFAULT 'cash',
  "totalRefund"    DOUBLE PRECISION         NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "SaleReturn_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "SaleReturn_returnNo_key"  UNIQUE ("returnNo"),
  CONSTRAINT "SaleReturn_originalSale_fkey"
    FOREIGN KEY ("originalSaleId") REFERENCES "Sale"("id") ON DELETE RESTRICT
);

-- Return lines
CREATE TABLE "SaleReturnLine" (
  "id"                 TEXT             NOT NULL,
  "returnId"           TEXT             NOT NULL,
  "productId"          TEXT             NOT NULL,
  "originalSaleLineId" TEXT,
  "productName"        TEXT             NOT NULL,
  "qty"                DOUBLE PRECISION NOT NULL,
  "unitPrice"          DOUBLE PRECISION NOT NULL,
  "lineTotal"          DOUBLE PRECISION NOT NULL,
  CONSTRAINT "SaleReturnLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SaleReturnLine_return_fkey"
    FOREIGN KEY ("returnId")   REFERENCES "SaleReturn"("id") ON DELETE CASCADE,
  CONSTRAINT "SaleReturnLine_product_fkey"
    FOREIGN KEY ("productId")  REFERENCES "Product"("id")    ON DELETE RESTRICT
);

CREATE INDEX "SaleReturn_originalSaleId_idx"  ON "SaleReturn"("originalSaleId");
CREATE INDEX "SaleReturnLine_returnId_idx"    ON "SaleReturnLine"("returnId");
