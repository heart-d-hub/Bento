import {
  B2B_TIER_COLORS,
  B2B_TIER_ORDER,
  loadCustomerTiers,
  saveCustomerTiers,
  type B2bTier,
  type B2bTierConfig,
  type DiscountRule,
  type DiscountRuleType,
} from '@/features/settings/data/customerTiersStore'
import { loadCategoryTree } from '@/features/inventory/data/inventoryCategories'
import { getProductMasterList } from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const TIER_ICONS: Record<B2bTier, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'

export function CustomerTiersPanel() {
  const [tiers, setTiers] = useState<B2bTierConfig[]>(() => loadCustomerTiers().b2bTiers)
  const [saved, setSaved] = useState(false)

  const { categoryNames, brandNames } = useMemo(() => {
    const tree = loadCategoryTree()
    const cats = tree.map((c) => c.name).filter(Boolean).sort()
    const brands = [...new Set(getProductMasterList().map((p) => p.brand).filter(Boolean))].sort()
    return { categoryNames: cats, brandNames: brands }
  }, [])

  function updateTier(tier: B2bTier, patch: Partial<B2bTierConfig>) {
    setSaved(false)
    setTiers((prev) => prev.map((t) => (t.tier === tier ? { ...t, ...patch } : t)))
  }

  function addRule(tier: B2bTier) {
    const newRule: DiscountRule = { id: `r-${Date.now()}`, type: 'category', value: '', discountPercent: 0 }
    const cfg = tiers.find((t) => t.tier === tier)!
    updateTier(tier, { discountRules: [...cfg.discountRules, newRule] })
  }

  function updateRule(tier: B2bTier, ruleId: string, patch: Partial<DiscountRule>) {
    const cfg = tiers.find((t) => t.tier === tier)!
    updateTier(tier, { discountRules: cfg.discountRules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)) })
  }

  function removeRule(tier: B2bTier, ruleId: string) {
    const cfg = tiers.find((t) => t.tier === tier)!
    updateTier(tier, { discountRules: cfg.discountRules.filter((r) => r.id !== ruleId) })
  }

  function handleSave() {
    saveCustomerTiers({ b2bTiers: tiers })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-800">B2B — ลูกค้าธุรกิจ</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200">4 ระดับ</span>
      </div>
      <p className="text-xs text-slate-500 -mt-3">
        เลือก Price Tier เริ่มต้นต่อ B2B tier แล้วเพิ่ม Discount Rules สำหรับหมวด/แบรนด์ที่ต้องการหักเพิ่ม
      </p>

      {B2B_TIER_ORDER.map((tier) => {
        const cfg = tiers.find((t) => t.tier === tier)!
        const colors = B2B_TIER_COLORS[tier]
        return (
          <div key={tier} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <span className="text-lg">{TIER_ICONS[tier]}</span>
              <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', colors.badge)}>{cfg.label}</span>
              <input
                value={cfg.description}
                onChange={(e) => updateTier(tier, { description: e.target.value })}
                placeholder="คำอธิบาย"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="p-4 flex flex-col gap-4">

              {/* ── Discount % + credit ── */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    ส่วนลดอู่/ช่าง (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={50} step={0.5} value={cfg.garageDiscountPercent}
                      onChange={(e) => updateTier(tier, { garageDiscountPercent: Math.min(50, Math.max(0, Number(e.target.value))) })}
                      className={inputCls} />
                    <span className="shrink-0 text-[10px] text-slate-400">%</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-slate-400">จากราคาอู่</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    ส่วนลดร้านค้า (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={50} step={0.5} value={cfg.storeDiscountPercent}
                      onChange={(e) => updateTier(tier, { storeDiscountPercent: Math.min(50, Math.max(0, Number(e.target.value))) })}
                      className={inputCls} />
                    <span className="shrink-0 text-[10px] text-slate-400">%</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-slate-400">จากราคาร้านค้า</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">วงเงิน (฿)</label>
                  <input type="number" min={0} step={1000} value={cfg.creditLimitBaht}
                    onChange={(e) => updateTier(tier, { creditLimitBaht: Math.max(0, Number(e.target.value)) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">เครดิต (วัน)</label>
                  <input type="number" min={0} max={90} value={cfg.creditTermDays}
                    onChange={(e) => updateTier(tier, { creditTermDays: Math.max(0, Number(e.target.value)) })}
                    className={inputCls} />
                </div>
              </div>

              {/* ── Discount Rules ── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Discount Rules — หักเพิ่มจากราคาฐาน ต่อ line item
                  </span>
                  <button type="button" onClick={() => addRule(tier)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100">
                    <Plus className="size-3" />เพิ่ม Rule
                  </button>
                </div>

                {cfg.discountRules.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3 text-center text-[11px] text-slate-400">
                    ยังไม่มี rule — ลูกค้าจะใช้ราคาฐานตามประเภท โดยไม่หักเพิ่ม
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[90px_1fr_64px_32px] gap-2 px-1">
                      {(['ประเภท', 'หมวด / แบรนด์', 'ส่วนลด', ''] as const).map((h, i) => (
                        <span key={i} className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
                      ))}
                    </div>

                    {cfg.discountRules.map((rule) => (
                      <div key={rule.id} className="grid grid-cols-[90px_1fr_64px_32px] items-center gap-2">
                        {/* Type */}
                        <select value={rule.type}
                          onChange={(e) => updateRule(tier, rule.id, { type: e.target.value as DiscountRuleType, value: '' })}
                          className={inputCls}>
                          <option value="category">หมวดหมู่</option>
                          <option value="brand">แบรนด์</option>
                        </select>

                        {/* Value — datalist for autocomplete */}
                        <div className="relative">
                          <input
                            list={`${rule.id}-opts`}
                            value={rule.value}
                            onChange={(e) => updateRule(tier, rule.id, { value: e.target.value })}
                            placeholder={rule.type === 'category' ? 'เลือกหมวดหมู่…' : 'เลือกแบรนด์…'}
                            className={clsx(inputCls, !rule.value && 'border-dashed')}
                          />
                          <datalist id={`${rule.id}-opts`}>
                            {(rule.type === 'category' ? categoryNames : brandNames).map((v) => (
                              <option key={v} value={v} />
                            ))}
                          </datalist>
                        </div>

                        {/* Discount % */}
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={50} step={0.5} value={rule.discountPercent}
                            onChange={(e) => updateRule(tier, rule.id, { discountPercent: Math.max(0, Math.min(50, Number(e.target.value))) })}
                            className={clsx(inputCls, 'text-center font-bold')} />
                          <span className="shrink-0 text-[10px] text-slate-400">%</span>
                        </div>

                        {/* Remove */}
                        <button type="button" onClick={() => removeRule(tier, rule.id)}
                          className="flex size-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] text-slate-400">
                      rule แรกที่ match จะถูกใช้ — สินค้าที่ไม่ match = ใช้ราคาฐาน − tier % ปกติ
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Customer type notes */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-px text-sm">👤</span>
          <div>
            <p className="text-xs font-semibold text-slate-600">B2C — ลูกค้าทั่วไป</p>
            <p className="text-[11px] text-slate-400">ใช้ราคาปลีก — สะสมแต้ม — ไม่มี tier</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-px text-sm">🔧</span>
          <div>
            <p className="text-xs font-semibold text-slate-600">อู่ / ช่าง</p>
            <p className="text-[11px] text-slate-400">ใช้ราคาอู่ − ส่วนลด tier — มีเครดิต</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-px text-sm">🏪</span>
          <div>
            <p className="text-xs font-semibold text-slate-600">ร้านอะไหล่</p>
            <p className="text-[11px] text-slate-400">ใช้ราคาร้านค้า − ส่วนลด tier — มีเครดิต</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-px text-sm">⭐</span>
          <div>
            <p className="text-xs font-semibold text-slate-600">VIP</p>
            <p className="text-[11px] text-slate-400">ใช้ราคา VIP — ไม่มี tier discount</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95">
          บันทึก
        </button>
        {saved && <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  )
}
