-- ย้าย driveType ออกจาก engineLabel ใน vehicleFitments
--
-- ก่อนหน้านี้ระบบเก็บ driveType ไว้ใน engineLabel เช่น "1KD · 4WD (2001-2010)"
-- migration นี้ดึงค่า driveType ออกมาใส่ field ที่ถูกต้อง และลบออกจาก engineLabel
--
-- Pattern ที่รองรับ: 2WD, 4WD, AWD, FWD, RWD (case-insensitive)
-- ตัวอย่าง:
--   "1KD · 4WD (2001-2010)" → engineLabel: "1KD (2001-2010)", driveType: "4WD"
--   "1KD · 4WD"             → engineLabel: "1KD",             driveType: "4WD"
--   "4WD (2001-2010)"       → engineLabel: "(2001-2010)",      driveType: "4WD"
--   "4WD"                   → engineLabel: "",                  driveType: "4WD"
--   ถ้า driveType มีค่าอยู่แล้ว → ข้าม (ไม่แก้ไข)

UPDATE "ProductMasterRow"
SET payload = payload || jsonb_build_object(
  'vehicleFitments',
  (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          -- null element (JSON null or SQL null) — ข้ามไว้ตามเดิม
          WHEN fitment IS NULL OR fitment = 'null'::jsonb
            THEN fitment

          -- มี driveType อยู่แล้ว (ไม่ว่างเปล่า) — ไม่แตะ
          WHEN (fitment->>'driveType') IS NOT NULL
               AND trim(fitment->>'driveType') <> ''
            THEN fitment

          -- engineLabel มี drive-type pattern → ดึงออก + ลบออกจาก label
          WHEN (
            regexp_match(
              COALESCE(fitment->>'engineLabel', ''),
              '([0-9]{1,2}WD|AWD|FWD|RWD)',
              'i'
            )
          )[1] IS NOT NULL
            THEN
              fitment
              -- ตั้ง driveType = ค่าที่ดึงได้ (uppercase)
              || jsonb_build_object(
                   'driveType',
                   upper(
                     (regexp_match(
                       fitment->>'engineLabel',
                       '([0-9]{1,2}WD|AWD|FWD|RWD)',
                       'i'
                     ))[1]
                   )
                 )
              -- ลบ drive-type ออกจาก engineLabel แล้ว trim
              || jsonb_build_object(
                   'engineLabel',
                   trim(
                     -- ขั้น 2: ลบรูปแบบ "DRIVE ·" หรือ "DRIVE " ที่อยู่ต้นหรือกลาง
                     regexp_replace(
                       -- ขั้น 1: ลบรูปแบบ " · DRIVE" ที่อยู่หลัง separator
                       regexp_replace(
                         fitment->>'engineLabel',
                         '\s*·\s*([0-9]{1,2}WD|AWD|FWD|RWD)',
                         '',
                         'gi'
                       ),
                       '([0-9]{1,2}WD|AWD|FWD|RWD)\s*(?:·\s*)?',
                       '',
                       'gi'
                     )
                   )
                 )

          ELSE fitment
        END
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(payload->'vehicleFitments') AS fitment
  )
)
WHERE
  -- มี vehicleFitments และเป็น array
  payload ? 'vehicleFitments'
  AND jsonb_typeof(payload->'vehicleFitments') = 'array'
  AND payload->'vehicleFitments' <> '[]'::jsonb
  -- มีอย่างน้อย 1 fitment ที่ engineLabel มี drive-type pattern และยังไม่มี driveType
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(payload->'vehicleFitments') AS f
    WHERE f IS NOT NULL
      AND f <> 'null'::jsonb
      AND ((f->>'driveType') IS NULL OR trim(f->>'driveType') = '')
      AND (
        regexp_match(
          COALESCE(f->>'engineLabel', ''),
          '([0-9]{1,2}WD|AWD|FWD|RWD)',
          'i'
        )
      )[1] IS NOT NULL
  );
