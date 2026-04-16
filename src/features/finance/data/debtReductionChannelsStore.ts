const LS_KEY = 'bento.finance.debtReductionChannels.v1'

export const DEBT_REDUCTION_CHANNELS_CHANGED_EVENT = 'bento-finance-debt-reduction-channels-changed'

/** ค่าเริ่มต้น — ใช้เมื่อยังไม่เคยบันทึก หรือข้อมูล LS เสีย */
export const DEFAULT_DEBT_REDUCTION_CHANNELS: string[] = [
  'เงินสด',
  'โอนธนาคาร',
  'เช็ค',
  'พร้อมเพย์ / QR',
  'หักบัญชี / ลดหนี้',
  'ชดเชยจาก CN / เคลม',
]

function dedupeOrdered(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of items) {
    const k = s.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(s)
  }
  return out
}

/** รายการช่องทางลดหนี้ (ใช้ตอนบันทึกจ่ายเจ้าหนี้ / รับชำระลูกหนี้ และใน PO) */
export function loadDebtReductionChannels(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return [...DEFAULT_DEBT_REDUCTION_CHANNELS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_DEBT_REDUCTION_CHANNELS]
    const list = parsed
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter((s) => s.length > 0)
    if (list.length === 0) return [...DEFAULT_DEBT_REDUCTION_CHANNELS]
    return dedupeOrdered(list)
  } catch {
    return [...DEFAULT_DEBT_REDUCTION_CHANNELS]
  }
}

export function saveDebtReductionChannels(channels: string[]): void {
  const cleaned = dedupeOrdered(
    channels.map((c) => c.trim()).filter((c) => c.length > 0),
  )
  const toSave = cleaned.length ? cleaned : [...DEFAULT_DEBT_REDUCTION_CHANNELS]
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(toSave))
    window.dispatchEvent(new CustomEvent(DEBT_REDUCTION_CHANNELS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}
