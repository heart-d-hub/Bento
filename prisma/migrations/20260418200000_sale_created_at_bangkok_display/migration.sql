-- คอลัมน์ธรรมดา + trigger (GENERATED ต้อง immutable — to_char/concat_ws กับ timestamp มักไม่ผ่าน)
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "createdAtBangkokDisplay";

ALTER TABLE "Sale" ADD COLUMN "createdAtBangkokDisplay" TEXT;

CREATE OR REPLACE FUNCTION sale_refresh_created_at_bkk_display()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."createdAt" IS NOT NULL THEN
    NEW."createdAtBangkokDisplay" := to_char(NEW."createdAt", 'YYYY-MM-DD HH24:MI:SS.MS');
  ELSE
    NEW."createdAtBangkokDisplay" := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sale_created_at_bkk_display_trg ON "Sale";
CREATE TRIGGER sale_created_at_bkk_display_trg
  BEFORE INSERT OR UPDATE OF "createdAt" ON "Sale"
  FOR EACH ROW
  EXECUTE PROCEDURE sale_refresh_created_at_bkk_display();

UPDATE "Sale" SET "createdAtBangkokDisplay" = to_char("createdAt", 'YYYY-MM-DD HH24:MI:SS.MS')
WHERE "createdAtBangkokDisplay" IS NULL;

ALTER TABLE "Sale" ALTER COLUMN "createdAtBangkokDisplay" SET NOT NULL;
