-- CreditNote: ใบลดหนี้ — auto-created when returning from a TAX-mode bill
CREATE TABLE "CreditNote" (
  "id"             TEXT                     NOT NULL,
  "creditNoteNo"   TEXT                     NOT NULL,
  "originalSaleId" TEXT                     NOT NULL,
  "returnId"       TEXT                     NOT NULL,
  "creditNoteDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "beforeVat"      DOUBLE PRECISION         NOT NULL DEFAULT 0,
  "vatAmount"      DOUBLE PRECISION         NOT NULL DEFAULT 0,
  "totalAmount"    DOUBLE PRECISION         NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "CreditNote_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "CreditNote_creditNoteNo_key"  UNIQUE ("creditNoteNo"),
  CONSTRAINT "CreditNote_returnId_key"      UNIQUE ("returnId"),
  CONSTRAINT "CreditNote_return_fkey"
    FOREIGN KEY ("returnId")       REFERENCES "SaleReturn"("id") ON DELETE CASCADE,
  CONSTRAINT "CreditNote_sale_fkey"
    FOREIGN KEY ("originalSaleId") REFERENCES "Sale"("id")       ON DELETE RESTRICT
);

CREATE INDEX "CreditNote_originalSaleId_idx" ON "CreditNote"("originalSaleId");
