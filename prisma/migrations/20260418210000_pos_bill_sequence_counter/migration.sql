-- ลำดับเลขบิล POS / ใบกำกับ — แยกตามคีย์ (เครื่อง+สาขา+เดือน) แทน localStorage
CREATE TABLE "PosBillSequenceCounter" (
    "id" TEXT NOT NULL,
    "lastSeq" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosBillSequenceCounter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PosBillSequenceCounter_updatedAt_idx" ON "PosBillSequenceCounter"("updatedAt");
