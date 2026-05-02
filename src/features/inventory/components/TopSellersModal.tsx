import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, X } from 'lucide-react'
import { clsx } from 'clsx'
import { loadRecentSales, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { ProductImage } from '@/features/inventory/components/ProductImage'

type TopSellerRow = {
  sku: string
  name: string
  qty: number
  revenue: number
  stock: number
  brand?: string
  category?: string
}

/** Aggregate sales last N days → top SKUs by qty sold */
function computeTopSellers(daysBack: number, limit: number): TopSellerRow[] {
  const sales = loadRecentSales()
  const now = new Date()
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

  type Agg = { qty: number; revenue: number; sku: string; name: string }
  const map = new Map<string, Agg>()

  for (const s of sales) {
    if (s.voidedAt) continue
    const d = new Date(s.at)
    if (d < cutoff) continue
    if (!s.lines?.length) continue
    for (const line of s.lines) {
      const key = (line.sku || line.productId || '').trim()
      if (!key) continue
      const cur = map.get(key) ?? { qty: 0, revenue: 0, sku: line.sku ?? key, name: line.name }
      cur.qty += line.qty || 0
      cur.revenue += (line.unitPrice ?? 0) * (line.qty || 0)
      map.set(key, cur)
    }
  }

  const products = getPosCatalogProducts()
  const byCode = new Map(products.map((p) => [p.sku, p]))
  return [...map.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
    .map((a) => {
      const p = byCode.get(a.sku)
      return {
        sku: a.sku,
        name: a.name,
        qty: a.qty,
        revenue: a.revenue,
        stock: p?.stock ?? 0,
        brand: p?.brand,
        category: p?.category,
      }
    })
}

type TopSellersModalProps = {
  open: boolean
  onClose: () => void
}

export function TopSellersModal({ open, onClose }: TopSellersModalProps) {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!open) return
    const handler = () => setTick((n) => n + 1)
    window.addEventListener(POS_SALE_RECORDED_EVENT, handler)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const rows = useMemo(() => computeTopSellers(days, 20), [days, tick])
  const totalQty = useMemo(() => rows.reduce((s, r) => s + r.qty, 0), [rows])
  const totalRevenue = useMemo(() => rows.reduce((s, r) => s + r.revenue, 0), [rows])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style={{ maxHeight: 'min(94vh, 800px)' }}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" aria-hidden />
            <span className="text-sm font-black uppercase tracking-widest text-slate-800">สินค้าขายดี</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Top {rows.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ช่วงเวลา:</span>
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={clsx(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition',
                days === d
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {d} วัน
            </button>
          ))}
          <span className="ml-auto flex items-center gap-3 text-[10px] font-bold text-slate-500">
            <span>รวม <span className="font-mono text-slate-800">{totalQty.toLocaleString('th-TH')}</span> ชิ้น</span>
            <span>·</span>
            <span>รายได้ <span className="font-mono text-emerald-700">฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}</span></span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <TrendingUp className="size-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">ยังไม่มีข้อมูลในช่วง {days} วัน</p>
              <p className="text-xs text-slate-400">ต้องมีบิลขายในช่วงนี้ก่อน</p>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 text-[10px] font-black uppercase tracking-widest text-slate-500 backdrop-blur">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">#</th>
                  <th className="px-2 py-2 text-left">สินค้า</th>
                  <th className="px-2 py-2 text-right">ขายแล้ว</th>
                  <th className="px-2 py-2 text-right">รายได้</th>
                  <th className="px-2 py-2 text-right">เหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const stockLow = r.stock <= 5
                  return (
                    <tr key={r.sku} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center">
                        <span className={clsx(
                          'inline-flex size-6 items-center justify-center rounded-full font-mono text-[10px] font-black',
                          i === 0 ? 'bg-amber-400 text-white'
                          : i === 1 ? 'bg-slate-300 text-slate-800'
                          : i === 2 ? 'bg-orange-300 text-orange-900'
                          : 'bg-slate-100 text-slate-500',
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <ProductImage sku={r.sku} size="sm" className="size-9 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] font-black text-blue-700">{r.sku}</div>
                            <div className="truncate text-[12px] font-semibold text-slate-700">{r.name}</div>
                            {(r.brand || r.category) && (
                              <div className="truncate text-[10px] text-slate-400">
                                {[r.brand, r.category].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="font-mono text-[12px] font-black text-emerald-700">
                          {r.qty.toLocaleString('th-TH')}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="font-mono text-[11px] font-semibold text-slate-700">
                          ฿{r.revenue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className={clsx(
                          'font-mono text-[11px] font-bold',
                          r.stock <= 0 ? 'text-rose-600' : stockLow ? 'text-amber-600' : 'text-slate-700',
                        )}>
                          {r.stock <= 0 ? 'หมด' : r.stock}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
