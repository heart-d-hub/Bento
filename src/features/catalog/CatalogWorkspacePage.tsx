import {
  getProductMasterList,
  primarySellPriceFromTiers,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  sellPriceTierContextFromProduct,
} from '@/features/inventory/data/productMasterData'
import {
  type CatalogAudience,
  type CatalogItem,
  type ProductCatalog,
  loadCatalogs,
  saveCatalogs,
} from '@/features/catalog/data/catalogStore'
import { clsx } from 'clsx'
import { BookOpen, Building2, Plus, Save, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CatalogWorkspacePageProps = {
  className?: string
}

const AUDIENCE_LABEL: Record<CatalogAudience, string> = {
  garage: 'อู่ซ่อมรถ',
  shop: 'ร้านอะไหล่',
  dealer: 'ตัวแทนจำหน่าย',
  general: 'ทั่วไป',
}

function newCatalogId(): string {
  return `catalog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function defaultCatalog(): ProductCatalog {
  return {
    id: newCatalogId(),
    name: `แคตตาล็อกใหม่ ${new Date().toLocaleDateString('th-TH')}`,
    audience: 'garage',
    note: '',
    items: [],
    updatedAt: new Date().toISOString(),
  }
}

function suggestedPriceForProduct(productId: string): number {
  const p = getProductMasterList().find((x) => x.id === productId)
  if (!p) return 0
  const byTier = primarySellPriceFromTiers(
    p.sellPriceTiers,
    p.costPrice,
    1,
    sellPriceTierContextFromProduct(p),
  )
  return byTier > 0 ? byTier : Math.max(0, p.sellPrice)
}

export function CatalogWorkspacePage({ className }: CatalogWorkspacePageProps) {
  const [catalogs, setCatalogs] = useState<ProductCatalog[]>(() => loadCatalogs())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [savedHint, setSavedHint] = useState(false)
  const [masterEpoch, setMasterEpoch] = useState(0)

  useEffect(() => {
    const onMaster = () => setMasterEpoch((e) => e + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
  }, [])

  useEffect(() => {
    setSelectedId((id) => id ?? catalogs[0]?.id ?? null)
  }, [catalogs])

  const selected = useMemo(
    () => catalogs.find((c) => c.id === selectedId) ?? null,
    [catalogs, selectedId],
  )

  const catalogTotal = useMemo(
    () => selected?.items.reduce((s, it) => s + Math.max(0, it.suggestedPrice), 0) ?? 0,
    [selected],
  )

  const persist = useCallback((next: ProductCatalog[]) => {
    setCatalogs(next)
    saveCatalogs(next)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 1600)
  }, [])

  const addCatalog = useCallback(() => {
    const c = defaultCatalog()
    persist([c, ...catalogs])
    setSelectedId(c.id)
  }, [catalogs, persist])

  const removeCatalog = useCallback(
    (id: string) => {
      if (!window.confirm('ลบแคตตาล็อกนี้?')) return
      const next = catalogs.filter((c) => c.id !== id)
      persist(next)
      setSelectedId((cur) => (cur === id ? null : cur))
    },
    [catalogs, persist],
  )

  const updateSelected = useCallback(
    (patch: Partial<ProductCatalog>) => {
      if (!selectedId) return
      const now = new Date().toISOString()
      persist(catalogs.map((c) => (c.id === selectedId ? { ...c, ...patch, updatedAt: now } : c)))
    },
    [selectedId, catalogs, persist],
  )

  const addProductToSelected = useCallback(
    (productId: string) => {
      if (!selected) return
      if (selected.items.some((it) => it.productId === productId)) {
        window.alert('สินค้านี้อยู่ในแคตตาล็อกแล้ว')
        return
      }
      const p = getProductMasterList().find((x) => x.id === productId)
      if (!p) return
      const item: CatalogItem = {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        suggestedPrice: suggestedPriceForProduct(p.id),
      }
      updateSelected({ items: [...selected.items, item] })
    },
    [selected, updateSelected],
  )

  const removeItem = useCallback(
    (productId: string) => {
      if (!selected) return
      updateSelected({ items: selected.items.filter((it) => it.productId !== productId) })
    },
    [selected, updateSelected],
  )

  const updateItem = useCallback(
    (productId: string, patch: Partial<CatalogItem>) => {
      if (!selected) return
      updateSelected({
        items: selected.items.map((it) => (it.productId === productId ? { ...it, ...patch } : it)),
      })
    },
    [selected, updateSelected],
  )

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = getProductMasterList().slice(0, 500)
    if (!q) return base
    return base.filter((p) =>
      [
        p.sku,
        p.name,
        p.brand,
        p.category,
        p.subCategory ?? '',
        p.subSubCategory ?? '',
        p.carBrand,
        p.carModelLabel,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [query, masterEpoch])

  return (
    <div
      className={clsx(
        'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/80 bg-white text-cyan-800 shadow-sm">
              <BookOpen className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-semibold text-slate-900 lg:text-lg">Catalog สินค้า</h1>
              <p className="text-xs text-slate-600 lg:text-sm">
                จัดชุดสินค้าเพื่อนำเสนออู่หรือร้านค้า พร้อมราคาที่เสนอขาย
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedHint ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                บันทึกแล้ว
              </span>
            ) : null}
            <button
              type="button"
              onClick={addCatalog}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="size-3.5" aria-hidden />
              เพิ่มแคตตาล็อก
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,16rem)_1fr] lg:p-4">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
          <p className="border-b border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-700">
            แคตตาล็อกที่บันทึก
          </p>
          <ul className="min-h-0 flex-1 space-y-1 overflow-auto p-2 text-[11px]">
            {catalogs.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-slate-500">
                ยังไม่มีแคตตาล็อก
              </li>
            ) : (
              catalogs.map((c) => {
                const selectedRow = c.id === selectedId
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={clsx(
                        'w-full rounded-xl border px-3 py-2 text-left transition',
                        selectedRow
                          ? 'border-cyan-300 bg-cyan-50 text-cyan-950 shadow-sm'
                          : 'border-transparent bg-white text-slate-800 hover:border-slate-200',
                      )}
                    >
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {AUDIENCE_LABEL[c.audience]} · {c.items.length} รายการ
                      </p>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <section className="min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selected ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
              <Building2 className="size-8 text-slate-300" aria-hidden />
              <p className="text-sm font-medium text-slate-700">ยังไม่ได้เลือกแคตตาล็อก</p>
              <p className="text-xs text-slate-500">กดปุ่ม “เพิ่มแคตตาล็อก” เพื่อเริ่มจัดรายการ</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_12rem_8rem]">
                <label className="block text-[11px]">
                  <span className="mb-1 block font-medium text-slate-600">ชื่อแคตตาล็อก</span>
                  <input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] shadow-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="block text-[11px]">
                  <span className="mb-1 block font-medium text-slate-600">กลุ่มลูกค้า</span>
                  <select
                    value={selected.audience}
                    onChange={(e) => updateSelected({ audience: e.target.value as CatalogAudience })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] shadow-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    {(Object.keys(AUDIENCE_LABEL) as CatalogAudience[]).map((k) => (
                      <option key={k} value={k}>
                        {AUDIENCE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCatalog(selected.id)}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800 transition hover:bg-red-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    ลบชุดนี้
                  </button>
                </div>
              </div>

              <label className="block text-[11px]">
                <span className="mb-1 block font-medium text-slate-600">โน้ต / เงื่อนไขขาย</span>
                <textarea
                  value={selected.note ?? ''}
                  onChange={(e) => updateSelected({ note: e.target.value })}
                  rows={2}
                  placeholder="เช่น ราคานี้สำหรับสั่งขั้นต่ำ 10 ชิ้น · เครดิต 30 วัน · ส่งฟรีในเมือง"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-0 flex-1 text-[11px]">
                    <span className="mb-1 block font-medium text-slate-600">ค้นหาสินค้าเพื่อเพิ่ม</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SKU / ชื่อสินค้า / แบรนด์ / หมวดหมู่"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12px] shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>
                  </label>
                </div>
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[34rem] border-collapse text-[11px]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-1.5 text-left">SKU</th>
                        <th className="px-2 py-1.5 text-left">สินค้า</th>
                        <th className="px-2 py-1.5 text-left">หมวด</th>
                        <th className="px-2 py-1.5 text-right">ราคาขายแนะนำ</th>
                        <th className="px-2 py-1.5 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 120).map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                          <td className="px-2 py-1.5 font-mono text-[10px] text-slate-600">{p.sku}</td>
                          <td className="px-2 py-1.5 text-slate-800">{p.name}</td>
                          <td className="px-2 py-1.5 text-slate-600">{p.category}</td>
                          <td className="px-2 py-1.5 text-right font-medium tabular-nums text-slate-700">
                            {formatBaht(suggestedPriceForProduct(p.id))}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => addProductToSelected(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-800 transition hover:bg-cyan-100"
                            >
                              <Plus className="size-3" aria-hidden />
                              เพิ่ม
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-800">รายการในแคตตาล็อก</p>
                  <p className="text-[11px] text-slate-500">
                    {selected.items.length} รายการ · รวมราคาเสนอ ฿{formatBaht(catalogTotal)}
                  </p>
                </div>
                <div className="max-h-72 overflow-auto">
                  <table className="w-full min-w-[40rem] border-collapse text-[11px]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-1.5 text-left">สินค้า</th>
                        <th className="px-2 py-1.5 text-left">แบรนด์</th>
                        <th className="px-2 py-1.5 text-right">ราคาเสนอ</th>
                        <th className="px-2 py-1.5 text-left">หมายเหตุ</th>
                        <th className="px-2 py-1.5 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-2 py-8 text-center text-slate-500">
                            ยังไม่มีสินค้าในชุดนี้
                          </td>
                        </tr>
                      ) : (
                        selected.items.map((it) => (
                          <tr key={it.productId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                            <td className="px-2 py-1.5">
                              <p className="font-mono text-[10px] text-slate-500">{it.sku}</p>
                              <p className="text-slate-800">{it.name}</p>
                            </td>
                            <td className="px-2 py-1.5 text-slate-700">{it.brand}</td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={it.suggestedPrice}
                                onChange={(e) =>
                                  updateItem(it.productId, { suggestedPrice: Math.max(0, Number(e.target.value) || 0) })
                                }
                                className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right text-[11px] shadow-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={it.note ?? ''}
                                onChange={(e) => updateItem(it.productId, { note: e.target.value })}
                                placeholder="เช่น ของแท้ / พร้อมส่ง"
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-[11px] shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(it.productId)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-800 transition hover:bg-red-100"
                              >
                                <Trash2 className="size-3" aria-hidden />
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end border-t border-slate-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => saveCatalogs(catalogs)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Save className="size-3.5" aria-hidden />
                    บันทึกเดี๋ยวนี้
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
