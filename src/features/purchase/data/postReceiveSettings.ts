/**
 * Settings สำหรับ workflow «หลังรับของ» — ปรับใน Settings → ซื้อ/รับของ
 */

const STORAGE_KEY = 'bento.postreceive.settings.v1'
export const POST_RECEIVE_SETTINGS_CHANGED_EVENT = 'bento-postreceive-settings-changed'

/** กฎเลือกสินค้าเข้าคิวพิมพ์ป้ายอัตโนมัติหลังรับของ */
export type AutoLabelRule =
  /** พิมพ์ป้ายทุก SKU ที่รับเข้า */
  | 'always'
  /** ข้าม SKU ที่มี boxBarcode (สมมติว่ามีบาร์โค้ดบนสินค้าอยู่แล้ว) — ค่าเริ่มต้น */
  | 'skipIfBoxBarcode'
  /** ไม่ auto-queue — ให้ผู้ใช้เลือกเองในหน้าพิมพ์ป้าย */
  | 'manual'

export type PostReceiveSettings = {
  autoLabelRule: AutoLabelRule
}

const DEFAULTS: PostReceiveSettings = {
  autoLabelRule: 'skipIfBoxBarcode',
}

export function loadPostReceiveSettings(): PostReceiveSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<PostReceiveSettings>
    return {
      autoLabelRule:
        parsed.autoLabelRule === 'always' ||
        parsed.autoLabelRule === 'manual' ||
        parsed.autoLabelRule === 'skipIfBoxBarcode'
          ? parsed.autoLabelRule
          : DEFAULTS.autoLabelRule,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePostReceiveSettings(s: PostReceiveSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(POST_RECEIVE_SETTINGS_CHANGED_EVENT))
}

/**
 * ตัดสินใจว่า SKU นี้ต้องเข้าคิวพิมพ์ป้ายอัตโนมัติหรือไม่
 *  rule = 'always' → true
 *  rule = 'skipIfBoxBarcode' → true ถ้า boxBarcode ว่าง
 *  rule = 'manual' → false (ผู้ใช้ต้องเพิ่มเอง)
 */
export function shouldAutoQueueLabel(
  rule: AutoLabelRule,
  master: { boxBarcode?: string },
): boolean {
  if (rule === 'manual') return false
  if (rule === 'always') return true
  return !master.boxBarcode?.trim()
}
