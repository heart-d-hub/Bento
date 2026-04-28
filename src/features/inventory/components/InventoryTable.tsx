import { InventoryColumnSettingsModal } from '@/features/inventory/components/InventoryColumnSettingsModal'
import { InventorySortModal } from '@/features/inventory/components/InventorySortModal'
import {
  INVENTORY_COLUMN_LABELS,
  INVENTORY_COLUMN_ORDER,
  loadColumnVisibility,
  saveColumnVisibility,
  type InventoryColumnKey,
} from '@/features/inventory/data/inventoryColumns'
import { WarehouseStockAdjustModal } from '@/features/inventory/components/WarehouseStockAdjustModal'
import {
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  collectInventoryCarFilterOptions,
  productMatchesInventoryCarFilters,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { type InventoryProduct } from '@/features/inventory/data/mockInventory'
import {
  applyWarehouseThresholds,
  INVENTORY_THRESHOLDS_CHANGED_EVENT,
} from '@/features/inventory/data/inventoryStockThresholds'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  formatBoxPieceHint,
  formatRollStockHint,
  getBoxPieceStateForProduct,
  getRollStateForProduct,
  isBoxPieceProduct,
  LIVE_STOCK_CHANGED_EVENT,
  loadBoxPieceStock,
  loadRollStock,
  mergeInventoryProductsWithLiveStock,
} from '@/features/pos/data/posLiveStock'
import { POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  loadSortRules,
  saveSortRules,
  sortProducts,
  toggleHeaderSort,
  SORTABLE_COLUMN_KEYS,
  type SortRule,
  type SortableColumnKey,
} from '@/features/inventory/data/inventorySort'
import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Columns3, ListOrdered, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

function Thumb() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      <span className="text-xs">IMG</span>
    </div>
  )
}

function isSortableKey(key: InventoryColumnKey): key is SortableColumnKey {
  return SORTABLE_COLUMN_KEYS.includes(key as SortableColumnKey)
}

function SortableTh({
  colKey,
  label,
  sortRules,
  onSort,
  alignRight,
}: {
  colKey: InventoryColumnKey
  label: string
  sortRules: SortRule[]
  onSort: (k: SortableColumnKey) => void
  alignRight?: boolean
}) {
  const sortable = isSortableKey(colKey)
  const idx = sortable ? sortRules.findIndex((r) => r.key === colKey) : -1
  const active = sortable && idx >= 0
  const dir = active ? sortRules[idx].dir : null

  if (!sortable) {
    return (
      <th
        className={clsx(
          'px-3 py-2 font-medium',
          colKey === 'thumb' && 'px-4',
          colKey === 'actions' && 'px-4',
          alignRight && 'text-right',
        )}
      >
        {colKey === 'thumb' ? ' ' : label}
      </th>
    )
  }

  return (
    <th
      className={clsx(
        'px-3 py-2 font-medium',
        alignRight && 'text-right',
      )}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={clsx(
          'inline-flex max-w-full items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-900',
          alignRight ? 'ml-auto w-full justify-end text-right' : 'text-left',
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        {active && (
          <>
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold tabular-nums text-slate-700"
              title={`ลำดับการเรียง ${idx + 1}`}
            >
              {idx + 1}
            </span>
            {dir === 'asc' ? (
              <ArrowUp className="size-3.5 shrink-0 text-slate-700" aria-hidden />
            ) : (
              <ArrowDown className="size-3.5 shrink-0 text-slate-700" aria-hidden />
            )}
          </>
        )}
      </button>
    </th>
  )
}

export function InventoryTable() {
  const { activeTabId, setBranchStockPanel } = useWorkspaceTabs()
  const [category, setCategory] = useState('ทั้งหมด')
  const [brand, setBrand] = useState('ทั้งหมด')
  const [location, setLocation] = useState('ทั้งหมด')
  const [filterCarBrand, setFilterCarBrand] = useState('ทั้งหมด')
  const [filterCarModel, setFilterCarModel] = useState('ทั้งหมด')
  const [filterYear, setFilterYear] = useState('ทั้งหมด')
  const [filterEngine, setFilterEngine] = useState('ทั้งหมด')
  const [filterDrive, setFilterDrive] = useState('ทั้งหมด')
  const [q, setQ] = useState('')
  const [visibility, setVisibility] = useState(loadColumnVisibility)
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [sortRules, setSortRules] = useState<SortRule[]>(loadSortRules)
  const [stockTick, setStockTick] = useState(0)
  const [masterTick, setMasterTick] = useState(0)
  const [thresholdTick, setThresholdTick] = useState(0)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockModalId, setStockModalId] = useState<string | null>(null)
  const [rowCtxMenu, setRowCtxMenu] = useState<{ productId: string; x: number; y: number } | null>(null)
  const rowCtxRef = useRef<HTMLDivElement>(null)

  const closeRowCtxMenu = useCallback(() => setRowCtxMenu(null), [])

  useEffect(() => {
    if (!rowCtxMenu) return
    const onDown = (e: MouseEvent) => {
      if (rowCtxRef.current?.contains(e.target as Node)) return
      closeRowCtxMenu()
    }
    const id = window.requestAnimationFrame(() => {
      document.addEventListener('mousedown', onDown, true)
    })
    return () => {
      window.cancelAnimationFrame(id)
      document.removeEventListener('mousedown', onDown, true)
    }
  }, [rowCtxMenu, closeRowCtxMenu])

  useEffect(() => {
    const bump = () => setStockTick((n) => n + 1)
    window.addEventListener(POS_SALE_RECORDED_EVENT, bump)
    window.addEventListener(LIVE_STOCK_CHANGED_EVENT, bump)
    return () => {
      window.removeEventListener(POS_SALE_RECORDED_EVENT, bump)
      window.removeEventListener(LIVE_STOCK_CHANGED_EVENT, bump)
    }
  }, [])

  useEffect(() => {
    const onMaster = () => setMasterTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, onMaster)
  }, [])

  useEffect(() => {
    const onTh = () => setThresholdTick((n) => n + 1)
    window.addEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, onTh)
    return () => window.removeEventListener(INVENTORY_THRESHOLDS_CHANGED_EVENT, onTh)
  }, [])

  useEffect(() => {
    saveColumnVisibility(visibility)
  }, [visibility])

  useEffect(() => {
    saveSortRules(sortRules)
  }, [sortRules])

  function applyColumnSettings(next: Record<InventoryColumnKey, boolean>) {
    setVisibility(next)
  }

  const catalogBase = useMemo(
    () => getPosCatalogProducts(),
    [stockTick, masterTick],
  )

  const filterCategories = useMemo(() => {
    const u = [...new Set(catalogBase.map((p) => p.category))].sort((a, b) =>
      a.localeCompare(b, 'th'),
    )
    return ['ทั้งหมด', ...u]
  }, [catalogBase])

  const filterBrands = useMemo(() => {
    const hasEmpty = catalogBase.some((p) => !p.brand.trim())
    const u = [...new Set(catalogBase.map((p) => p.brand.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'th'),
    )
    return ['ทั้งหมด', ...(hasEmpty ? ['__brand_empty__'] : []), ...u]
  }, [catalogBase])

  const filterLocations = useMemo(() => {
    const hasEmpty = catalogBase.some((p) => !p.location.trim())
    const u = [...new Set(catalogBase.map((p) => p.location.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'th'),
    )
    return ['ทั้งหมด', ...(hasEmpty ? ['__loc_empty__'] : []), ...u]
  }, [catalogBase])

  const carFilterOptions = useMemo(
    () =>
      collectInventoryCarFilterOptions(catalogBase as unknown as ProductMasterDetail[], {
        carBrand: filterCarBrand,
        carModel: filterCarModel,
        engineLabel: filterEngine,
        driveType: filterDrive,
        filterAll: 'ทั้งหมด',
      }),
    [catalogBase, filterCarBrand, filterCarModel, filterEngine, filterDrive],
  )

  const productsLive = useMemo(
    () => applyWarehouseThresholds(mergeInventoryProductsWithLiveStock(catalogBase)),
    [catalogBase, thresholdTick],
  )

  const rollStockHintsById = useMemo(() => {
    const roll = loadRollStock()
    const box = loadBoxPieceStock()
    const m = new Map<string, string>()
    for (const p of catalogBase) {
      if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll) {
        const r = getRollStateForProduct(p, roll)
        m.set(p.id, formatRollStockHint(r, p.nominalKgPerRoll))
      } else if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll) {
        const r = getRollStateForProduct(p, roll)
        m.set(p.id, formatRollStockHint(r, p.nominalMetersPerRoll, 'm'))
      } else if (isBoxPieceProduct(p)) {
        const b = getBoxPieceStateForProduct(p, box)
        m.set(p.id, formatBoxPieceHint(b, p.piecesPerBox!))
      }
    }
    return m
  }, [catalogBase])

  const filtered = useMemo(() => {
    const hasVehicleFilter =
      filterCarBrand !== 'ทั้งหมด' ||
      filterCarModel !== 'ทั้งหมด' ||
      filterYear !== 'ทั้งหมด' ||
      filterEngine !== 'ทั้งหมด' ||
      filterDrive !== 'ทั้งหมด'

    return productsLive.filter((p) => {
      if (category !== 'ทั้งหมด' && p.category !== category) return false
      if (brand !== 'ทั้งหมด') {
        if (brand === '__brand_empty__') {
          if (p.brand.trim()) return false
        } else if (p.brand !== brand) return false
      }
      if (location !== 'ทั้งหมด') {
        if (location === '__loc_empty__') {
          if (p.location.trim()) return false
        } else if (p.location !== location) return false
      }
      if (hasVehicleFilter &&
        !productMatchesInventoryCarFilters(
          p as unknown as ProductMasterDetail,
          { brand: 'ทั้งหมด', carBrand: filterCarBrand, carModel: filterCarModel, year: filterYear, engineLabel: filterEngine, driveType: filterDrive },
          'ทั้งหมด',
        )
      ) return false
      if (q.trim()) {
        const s = q.trim().toLowerCase()
        const inText =
          p.sku.toLowerCase().includes(s) ||
          p.name.toLowerCase().includes(s) ||
          p.factoryOem.toLowerCase().includes(s) ||
          p.genuineNo.toLowerCase().includes(s)
        if (!inText) return false
      }
      return true
    })
  }, [category, brand, location, q, productsLive, filterCarBrand, filterCarModel, filterYear, filterEngine, filterDrive])

  const rows = useMemo(() => sortProducts(filtered, sortRules), [filtered, sortRules])

  const stockModalProduct = useMemo(
    () => (stockModalId ? (productsLive.find((p) => p.id === stockModalId) ?? null) : null),
    [productsLive, stockModalId],
  )

  function handleHeaderSort(key: SortableColumnKey) {
    setSortRules((prev) => toggleHeaderSort(prev, key))
  }

  const visibleCount = INVENTORY_COLUMN_ORDER.filter((k) => visibility[k]).length

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">รายการสินค้าคงคลัง</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            คลิกขวาที่แถว — ปรับสต็อกหรือย้ายที่เก็บ
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSortModalOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            title="จัดเรียงแบบลำดับ 1–3"
            aria-label="จัดเรียงแบบลำดับ 1–3"
          >
            <ListOrdered className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setColumnModalOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            title="เลือกคอลัมน์ที่แสดง"
            aria-label="เลือกคอลัมน์ที่แสดง"
          >
            <Columns3 className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-4 py-3">
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">หมวดหมู่</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {filterCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">แบรนด์</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            {filterBrands.map((b) => (
              <option key={b} value={b}>
                {b === '__brand_empty__' ? '(ไม่ระบุแบรนด์)' : b}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">ตำแหน่งที่เก็บ</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {filterLocations.map((l) => (
              <option key={l} value={l}>
                {l === '__loc_empty__' ? '(ไม่ระบุตำแหน่ง)' : l}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">ยี่ห้อรถ</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={filterCarBrand}
            onChange={(e) => {
              setFilterCarBrand(e.target.value)
              setFilterCarModel('ทั้งหมด')
              setFilterEngine('ทั้งหมด')
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {carFilterOptions.carBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">รุ่นรถ</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={filterCarModel}
            onChange={(e) => {
              setFilterCarModel(e.target.value)
              setFilterEngine('ทั้งหมด')
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {carFilterOptions.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">เครื่องยนต์</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={filterEngine}
            onChange={(e) => {
              setFilterEngine(e.target.value)
              setFilterDrive('ทั้งหมด')
              setFilterYear('ทั้งหมด')
            }}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {carFilterOptions.engines.map((en) => (
              <option key={en} value={en}>{en}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">ขับเคลื่อน</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={filterDrive}
            onChange={(e) => {
              setFilterDrive(e.target.value)
              setFilterYear('ทั้งหมด')
            }}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {carFilterOptions.driveTypes.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[7rem] flex-1">
          <span className="mb-0.5 block text-xs text-slate-500">รุ่นปี</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {carFilterOptions.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-[2]">
          <span className="mb-0.5 block text-xs text-slate-500">ค้นหา</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="รหัส / ชื่อ / เบอร์แท้ / เบอร์โรงงาน..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </span>
        </label>
      </div>

      {visibleCount === 0 && (
        <p className="border-b border-amber-100 bg-amber-50/80 px-4 py-2 text-xs text-amber-800">
          ยังไม่ได้เลือกคอลัมน์ — กดไอคอนคอลัมน์ด้านขวาบนเพื่อตั้งค่า
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-0 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500">
              {INVENTORY_COLUMN_ORDER.map((key) =>
                visibility[key] ? (
                  <SortableTh
                    key={key}
                    colKey={key}
                    label={INVENTORY_COLUMN_LABELS[key]}
                    sortRules={sortRules}
                    onSort={handleHeaderSort}
                    alignRight={key === 'stock' || key === 'minStock' || key === 'maxStock'}
                  />
                ) : null,
              )}
            </tr>
          </thead>
          <tbody>
            {visibleCount === 0 ? (
              <tr>
                <td className="py-12 text-center text-sm text-slate-500" colSpan={99}>
                  เลือกคอลัมน์อย่างน้อย 1 รายการเพื่อแสดงตาราง
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <InventoryRow
                  key={p.id}
                  product={p}
                  visibility={visibility}
                  rollStockHint={rollStockHintsById.get(p.id)}
                  restockHint={null}
                  onRowContextMenu={(e: ReactMouseEvent) => {
                    e.preventDefault()
                    setRowCtxMenu({ productId: p.id, x: e.clientX, y: e.clientY })
                  }}
                />
              ))
            )}
          </tbody>
        </table>
        {visibleCount > 0 && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">ไม่พบรายการตามตัวกรอง</p>
        )}
      </div>

      <InventoryColumnSettingsModal
        open={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        visibility={visibility}
        onSave={(next) => {
          applyColumnSettings(next)
        }}
      />

      <InventorySortModal
        open={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        rules={sortRules}
        onSave={(next) => setSortRules(next)}
      />

      <WarehouseStockAdjustModal
        open={stockModalOpen && Boolean(stockModalProduct)}
        product={stockModalProduct}
        onClose={() => {
          setStockModalOpen(false)
          setStockModalId(null)
        }}
      />

      {rowCtxMenu ? (
        <div
          ref={rowCtxRef}
          role="menu"
          className="fixed z-[70] min-w-[12rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{ left: rowCtxMenu.x, top: rowCtxMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
            onClick={() => {
              setStockModalId(rowCtxMenu.productId)
              setStockModalOpen(true)
              closeRowCtxMenu()
            }}
          >
            ปรับปรุง
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
            onClick={() => {
              const pid = rowCtxMenu.productId
              const row = productsLive.find((x) => x.id === pid)
              const skuHint = row?.sku?.trim() ? `SKU ${row.sku}` : 'รายการนี้'
              closeRowCtxMenu()
              if (activeTabId === 'branch-stock') {
                setBranchStockPanel('product-file')
                window.alert(
                  `ย้ายที่เก็บ: สลับไปแฟ้มสินค้าแล้ว — ค้นหา ${skuHint} แล้วแก้ฟิลด์ «ที่เก็บ» ในฟอร์มแล้วบันทึก`,
                )
              } else {
                window.alert(
                  `ย้ายที่เก็บ: เปิดเมนู คลังสินค้า → แฟ้มสินค้า — ค้นหา ${skuHint} แล้วแก้ฟิลด์ «ที่เก็บ» ในฟอร์มแล้วบันทึก`,
                )
              }
            }}
          >
            ย้ายที่เก็บ
          </button>
        </div>
      ) : null}
    </section>
  )
}

function InventoryRow({
  product: p,
  visibility: vis,
  rollStockHint,
  restockHint,
  onRowContextMenu,
}: {
  product: InventoryProduct
  visibility: Record<InventoryColumnKey, boolean>
  /** kg_roll — รายละเอียดม้วนเต็ม/ม้วนเปิด */
  rollStockHint?: string
  /** คำใบ้เมื่อสต็อกต่ำ (ถ้ามี) */
  restockHint?: string | null
  onRowContextMenu: (e: ReactMouseEvent) => void
}) {
  const isKg =
    (p.stockMode === 'kg_roll' && p.nominalKgPerRoll) ||
    (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll)
  const low = p.stock < p.minStock
  const over = (p.maxStock ?? 0) > 0 && p.stock > (p.maxStock ?? 0)
  const lowTitle = low ? (restockHint ?? 'สต็อกต่ำกว่าขั้นต่ำ') : undefined

  return (
    <tr className="border-b border-slate-50 last:border-0" onContextMenu={onRowContextMenu}>
      {vis.thumb && (
        <td className="px-4 py-2 align-middle">
          <Thumb />
        </td>
      )}
      {vis.sku && (
        <td className="px-3 py-2 align-middle font-mono text-xs text-slate-700">{p.sku}</td>
      )}
      {vis.genuine && (
        <td className="px-3 py-2 align-middle font-mono text-xs text-slate-700">{p.genuineNo}</td>
      )}
      {vis.oem && (
        <td className="px-3 py-2 align-middle font-mono text-xs text-slate-600">{p.factoryOem}</td>
      )}
      {vis.name && (
        <td className="max-w-[14rem] px-3 py-2 align-middle text-slate-800">{p.name}</td>
      )}
      {vis.brand && <td className="px-3 py-2 align-middle text-slate-700">{p.brand}</td>}
      {vis.location && (
        <td className="px-3 py-2 align-middle font-mono text-xs text-slate-600">{p.location}</td>
      )}
      {vis.stock && (
        <td
          className="px-3 py-2 text-right tabular-nums align-middle text-slate-900"
          title={rollStockHint}
        >
          {isKg ? p.stock : Math.floor(p.stock)}
        </td>
      )}
      {vis.minStock && (
        <td className="px-3 py-2 text-right tabular-nums align-middle text-slate-600">
          {isKg ? p.minStock : Math.floor(p.minStock)}
        </td>
      )}
      {vis.maxStock && (
        <td className="px-3 py-2 text-right tabular-nums align-middle text-slate-600">
          {p.maxStock != null && p.maxStock > 0 ? (isKg ? p.maxStock : Math.floor(p.maxStock)) : '—'}
        </td>
      )}
      {vis.status && (
        <td className="px-3 py-2 align-middle" title={lowTitle}>
          <span
            className={clsx(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
              low
                ? 'cursor-help bg-rose-100 text-rose-800'
                : over
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800',
            )}
          >
            {low ? 'ต่ำ' : over ? 'เกินเพดาน' : 'ปกติ'}
          </span>
        </td>
      )}
      {vis.actions && (
        <td
          className="px-4 py-2 align-middle text-[11px] text-slate-400"
          title="คลิกขวาที่แถว — ปรับปรุง / ย้ายที่เก็บ"
        >
          คลิกขวา
        </td>
      )}
    </tr>
  )
}
