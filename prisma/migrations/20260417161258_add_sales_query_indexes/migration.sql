-- CreateIndex
CREATE INDEX "Sale_docDate_idx" ON "Sale"("docDate");

-- CreateIndex
CREATE INDEX "Sale_paymentType_idx" ON "Sale"("paymentType");

-- CreateIndex
CREATE INDEX "Sale_branchId_docDate_idx" ON "Sale"("branchId", "docDate");

-- CreateIndex
CREATE INDEX "SaleLine_saleId_idx" ON "SaleLine"("saleId");

-- CreateIndex
CREATE INDEX "SaleLine_productId_idx" ON "SaleLine"("productId");
