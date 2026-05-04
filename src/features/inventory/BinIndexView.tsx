import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  getProductMasterList,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  productStorageLocations,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import { ArrowRight, MapPin, Package, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type BinIndexViewProps = {
  className?: string
}

type BinEntry = {
  location: string
  /** สินค้าที่ตั้ง location นี้เป็น "หลัก" */
  primary: ProductMasterDetail[]
  /** สินค้าที่ตั้ง location นี้เป็น "สำรอง" */
  secondary: ProductMasterDetail[]
}

type SortMode = 'alpha' | 'count-desc' | 'count-asc'

export function BinIndexView({ className }: BinIndexViewProps) {
  const { openTab, setBranchStockPanel } = useWorkspaceTabs()
  const [productListTick, setProductListTick] = useState(0)
  const [q, setQ] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('alpha')

  useEffect(() => {
    const on = () => setProductListTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
  }, [])

  const products = useMemo(() => {
    void productListTick
    return getProductMasterList().filter((p) => !p.deletedAt)
  }, [productListTick])

  /** key = canonical location string (case-sensitive trim); value = entry */
  const allBins: BinEntry[] = useMemo(() => {
    const map = new Map<string, BinEntry>()
    for (const p of products) {
      const locs = productStorageLocations(p)
      locs.forEach((loc, idx) => {
        const key = loc
        let entry = map.get(key)
        if (!entry) {
          entry = { location: key, primary: [], secondary: [] }
          map.set(key, entry)
        }
        if (idx === 0) entry.primary.push(p)
        else entry.secondary.push(p)
      })
    }
    return Array.from(map.values())
  }, [products])

  const productsWithoutLocation = useMemo(
    () => products.filter((p) => productStorageLocations(p).length === 0),
    [products],
  )

  const filteredBins = useMemo(() => {
    const tok = q.trim().toLowerCase()
    const filtered = tok.length === 0
      ? allBins
      : allBins.filter((b) => {
          if (b.location.toLowerCase().includes(tok)) return true
          // ค้นในรายชื่อสินค้าด้วย — ถ้าตู้นี้มีสินค้าตรงคำค้น
          const matchesProduct = (p: ProductMasterDetail) =>
            p.name.toLowerCase().includes(tok) ||
            p.sku.toLowerCase().includes(tok) ||
            (p.oemTags ?? []).some((o) => o.toLowerCase().includes(tok))
          return b.primary.some(matchesProduct) || b.secondary.some(matchesProduct)
        })

    const sorted = [...filtered]
    if (sortMode === 'alpha') {
      sorted.sort((a, b) => a.location.localeCompare(b.location, 'th', { numeric: true }))
    } else if (sortMode === 'count-desc') {
      sorted.sort((a, b) => (b.primary.length + b.secondary.length) - (a.primary.length + a.secondary.length))
    } else {
      sorted.sort((a, b) => (a.primary.length + a.secondary.length) - (b.primary.length + b.secondary.length))
    }
    return sorted
  }, [allBins, q, sortMode])

  const totalProductsAcrossBins = useMemo(
    () => allBins.reduce((sum, b) => sum + b.primary.length + b.secondary.length, 0),
    [allBins],
  )

  const openProductFile = () => {
    openTab('branch-stock', 'แฟ้มสินค้า')
    setBranchStockPanel('product-file')
  }

  return (
    <div className={clsx('flex min-h-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-800 shadow-sm">
          <MapPin className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-slate-900 lg:text-lg">ดัชนีที่เก็บ</h1>
          <p className="text-xs text-slate-600 lg:text-sm">
            ทุกตำแหน่งเก็บในร้าน — เห็นว่าตู้/ชั้นไหนมีสินค้าอะไรบ้าง · ใช้ค้น "ของอยู่ที่ไหน" ได้เร็ว
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
            ที่เก็บทั้งหมด <strong className="font-bold">{allBins.length.toLocaleString('th-TH')}</strong>
          </span>
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
            สินค้ามีตำแหน่ง <strong className="font-bold">{totalProductsAcrossBins.toLocaleString('th-TH')}</strong>
          </span>
          {productsWithoutLocation.length > 0 ? (
            <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
              ไม่มีตำแหน่ง <strong className="font-bold">{productsWithoutLocation.length.toLocaleString('th-TH')}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นที่เก็บ หรือ ค้นสินค้าในที่เก็บ — ชื่อตู้ / SKU / OEM / ชื่อสินค้า"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="ล้าง"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
          title="เรียงลำดับ"
        >
          <option value="alpha">เรียงชื่อ A→Z</option>
          <option value="count-desc">สินค้ามาก→น้อย</option>
          <option value="count-asc">สินค้าน้อย→มาก</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredBins.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
            <MapPin className="size-12 text-slate-300" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {q.trim() ? 'ไม่พบที่เก็บ' : 'ยังไม่มีที่เก็บในระบบ'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {q.trim()
                  ? 'ลองคำอื่น หรือเช็คชื่อสินค้า/SKU'
                  : 'ตั้งค่าที่เก็บที่หน้าแฟ้มสินค้า — เปิดสินค้า → กรอก «ที่เก็บ»'}
              </p>
            </div>
            <button
              type="button"
              onClick={openProductFile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
            >
              <Package className="size-3.5" />
              ไปแฟ้มสินค้า
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredBins.map((bin) => (
              <BinCard key={bin.location} bin={bin} />
            ))}
          </div>
        )}
      </div>

      {productsWithoutLocation.length > 0 && !q.trim() ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
          <strong className="font-semibold">เคล็ดลับ:</strong> มีสินค้า{' '}
          <strong className="font-bold">{productsWithoutLocation.length.toLocaleString('th-TH')}</strong> รายการ
          ที่ยังไม่ได้ตั้งที่เก็บ — เปิดแฟ้มสินค้าแล้วกรอกได้
        </div>
      ) : null}
    </div>
  )
}

function BinCard({ bin }: { bin: BinEntry }) {
  const total = bin.primary.length + bin.secondary.length
  const [expanded, setExpanded] = useState(false)
  const showCount = expanded ? total : Math.min(total, 5)
  const items = expanded
    ? [...bin.primary, ...bin.secondary]
    : [...bin.primary, ...bin.secondary].slice(0, 5)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/40 px-3 py-2">
        <div className="min-w-0 flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-amber-600" aria-hidden />
          <h3 className="truncate text-sm font-semibold text-slate-900">{bin.location}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
          {total}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 text-[11px]">
        {items.map((p, i) => {
          const isPrimary = i < bin.primary.length
          return (
            <li key={p.id} className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={clsx(
                  'shrink-0 rounded px-1 py-0.5 text-[9px] font-medium',
                  isPrimary
                    ? 'bg-violet-100 text-violet-800'
                    : 'bg-slate-100 text-slate-600',
                )}
                title={isPrimary ? 'ที่หลัก' : 'ที่สำรอง'}
              >
                {isPrimary ? 'หลัก' : 'สำรอง'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{p.name}</p>
                <p className="truncate text-[10px] text-slate-500">
                  <span className="font-mono">{p.sku}</span>
                  {p.oemTags?.[0] ? <span className="ml-1.5">OEM {p.oemTags[0]}</span> : null}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {total > showCount ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="block w-full border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] font-medium text-violet-700 hover:bg-slate-100"
        >
          แสดงทั้งหมด ({total - showCount} อีก)
        </button>
      ) : null}
      {expanded && total > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="block w-full border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
        >
          ย่อลง
        </button>
      ) : null}
    </section>
  )
}
