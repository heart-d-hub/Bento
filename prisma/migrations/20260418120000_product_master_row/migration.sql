-- แฟ้มสินค้า (มาสเตอร์) — เก็บ JSON เต็มต่อ id สินค้า
CREATE TABLE "ProductMasterRow" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMasterRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductMasterRow_payload_sku_idx" ON "ProductMasterRow" ((payload->>'sku'));
