import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import { setWarehouseMinMax } from '@/features/inventory/data/inventoryStockThresholds'
import {
  NUT_STOCK_TAG_ID,
  productHasSplitSaleRollColumnsTag,
} from '@/features/inventory/data/productTagsRegistry'
import {
  NUT_STOCK_OPEN_BOX_TITLE,
  nutStockOpenBoxMessage,
  SmallConfirmModal,
} from '@/features/inventory/components/SmallConfirmModal'
import {
  countFullRollsOnShelf,
  getBoxPieceStateForProduct,
  getRollStateForProduct,
  isBoxPieceProduct,
  loadBoxPieceStock,
  loadRollStock,
  setBoxPieceStock,
  setPieceStock,
  setRollProductTotalKg,
  setRollStockStateForProduct,
  sortFullRollPartsFifo,
  totalKgFromRoll,
  totalPiecesFromBoxPiece,
  usesPerRollWeightTracking,
  type FullRollPart,
  type OpenRollPart,
} from '@/features/pos/data/posLiveStock'
import { clsx } from 'clsx'
import { Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type WarehouseStockAdjustModalProps = {
  open: boolean
  product: InventoryProduct | null
  onClose: () => void
  /** หน้าแบ่งขาย — ซ่อน Low/High คลัง ไม่บันทึก threshold (เน้นแก้สต็อก/แกะกล่อง) */
  hideWarehouseThresholds?: boolean
  /** หน้าแบ่งขาย — กระชับ ไม่แสดงข้อความอธิบาย */
  compactUi?: boolean
  /** เมื่อ compactUi — คลาสความกว้างสูงสุด (default เท่าหน้าแคปปรับสต็อกชิ้น ≈ max-w-[17.5rem]) */
  compactModalMaxWidthClass?: string
}

function parseQty(s: string, isKg: boolean): number {
  const t = s.trim().replace(',', '.')
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return 0
  if (isKg) return Math.round(n * 1000) / 1000
  return Math.floor(n)
}

function newLocalId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

/** กก./ม้วน — เฉพาะสินค้าที่ตั้งในมาสเตอร์ (ไม่บังคับแท็กสายยาง) */
function rollNominalKgEffective(p: InventoryProduct): number {
  if (p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0) return p.nominalKgPerRoll
  return Math.max(0.001, p.nominalKgPerRoll ?? 0.001)
}

function shouldUsePerRollEditor(p: InventoryProduct, roll: ReturnType<typeof getRollStateForProduct>): boolean {
  if (isBoxPieceProduct(p)) return false
  if (productHasSplitSaleRollColumnsTag(p)) return false
  if (p.stockMode !== 'kg_roll' || !p.nominalKgPerRoll) return false
  return usesPerRollWeightTracking(roll)
}

type FullRow = { id: string; kgStr: string; dateStr: string }
type OpenRow = { id: string; kgStr: string }

/** สำหรับแท็กสายยางอ่อน: สร้างม้วนเปิดจากจำนวนม้วน + กก. เศษรวม (แบ่งเท่าๆ) */
function buildOpenRollPartsFromCountAndScrap(openCount: number, scrapKg: number): OpenRollPart[] {
  const n = Math.max(0, Math.floor(openCount))
  const kg = Math.round(Math.max(0, scrapKg) * 1000) / 1000
  if (n === 0) return []
  if (n === 1) return [{ id: newLocalId('open'), remainingKg: kg }]
  const base = Math.floor((kg * 1000) / n) / 1000
  const out: OpenRollPart[] = []
  let allocated = 0
  for (let i = 0; i < n - 1; i++) {
    out.push({ id: newLocalId('open'), remainingKg: base })
    allocated = Math.round((allocated + base) * 1000) / 1000
  }
  out.push({ id: newLocalId('open'), remainingKg: Math.round((kg - allocated) * 1000) / 1000 })
  return out
}

export function WarehouseStockAdjustModal({
  open,
  product,
  onClose,
  hideWarehouseThresholds = false,
  compactUi = false,
  compactModalMaxWidthClass,
}: WarehouseStockAdjustModalProps) {
  const [stockStr, setStockStr] = useState('')
  const [fullBoxesStr, setFullBoxesStr] = useState('0')
  const [loosePiecesStr, setLoosePiecesStr] = useState('0')
  const [minStr, setMinStr] = useState('')
  const [maxStr, setMaxStr] = useState('')
  const [perRollEditor, setPerRollEditor] = useState(false)
  const [fullRows, setFullRows] = useState<FullRow[]>([])
  const [openRows, setOpenRows] = useState<OpenRow[]>([])
  const [hoseRollFullStr, setHoseRollFullStr] = useState('0')
  const [hoseRollOpenStr, setHoseRollOpenStr] = useState('0')
  const [hoseRollScrapStr, setHoseRollScrapStr] = useState('0')
  const [nutOpenBoxDraft, setNutOpenBoxDraft] = useState<null | {
    nextFull: number
    nextLoose: number
    per: number
  }>(null)

  const applyNutOpenBoxDraft = useCallback(() => {
    setNutOpenBoxDraft((draft) => {
      if (!draft) return null
      setFullBoxesStr(String(draft.nextFull))
      setLoosePiecesStr(String(draft.nextLoose))
      setStockStr(
        String(
          totalPiecesFromBoxPiece(
            { fullBoxes: draft.nextFull, loosePieces: draft.nextLoose },
            draft.per,
          ),
        ),
      )
      return null
    })
  }, [])

  const isHoseRollTagProduct = Boolean(
    product && productHasSplitSaleRollColumnsTag(product) && !isBoxPieceProduct(product),
  )
  /** ม้วน/เมตรในมาสเตอร์ — แก้สต็อกแบบ 3 ช่องได้แม้ไม่มีแท็กสายยาง */
  const isMeterRollWithNominal = Boolean(
    product &&
      product.stockMode === 'meter_roll' &&
      (product.nominalMetersPerRoll ?? 0) > 0 &&
      !isBoxPieceProduct(product),
  )
  /** เศษ + ม้วนเปิด + ม้วนเต็ม (ตรงหน้าแบ่งขาย) */
  const usesHoseStyleRollAdjust = Boolean(
    product &&
      !isBoxPieceProduct(product) &&
      (isHoseRollTagProduct || isMeterRollWithNominal),
  )
  const isKgRoll = Boolean(
    product && product.stockMode === 'kg_roll' && Boolean(product.nominalKgPerRoll) && !isHoseRollTagProduct,
  )
  /** meter_roll แต่ยังไม่ตั้งเมตรต่อม้วน — ใช้ช่องยอดรวมเดียว */
  const isMeterRollSimpleTotal = Boolean(
    product &&
      product.stockMode === 'meter_roll' &&
      !isBoxPieceProduct(product) &&
      !isMeterRollWithNominal,
  )
  const isBoxPiece = Boolean(product && isBoxPieceProduct(product))

  const syncPerRollFromStorage = useCallback((p: InventoryProduct) => {
    const nominal = rollNominalKgEffective(p)
    const roll = getRollStateForProduct(p, loadRollStock())
    let parts = roll.fullRollParts
      ? sortFullRollPartsFifo(roll.fullRollParts).map((pr) => ({
          id: pr.id,
          kgStr: String(pr.kg),
          dateStr: pr.receivedDate ?? '',
        }))
      : []
    if (parts.length === 0 && roll.fullRolls > 0 && nominal > 0) {
      const n = nominal
      parts = Array.from({ length: roll.fullRolls }, (_, i) => ({
        id: newLocalId(`mig-${p.id}-${i}`),
        kgStr: String(n),
        dateStr: '',
      }))
    }
    setFullRows(parts)
    setOpenRows(
      roll.openRolls.map((o) => ({
        id: o.id,
        kgStr: String(o.remainingKg),
      })),
    )
    setStockStr(String(totalKgFromRoll(roll, nominal)))
  }, [])

  useEffect(() => {
    if (!open || !product) return
    if (isBoxPieceProduct(product)) {
      setPerRollEditor(false)
      const b = getBoxPieceStateForProduct(product, loadBoxPieceStock())
      setFullBoxesStr(String(b.fullBoxes))
      setLoosePiecesStr(String(b.loosePieces))
      setStockStr(String(totalPiecesFromBoxPiece(b, product.piecesPerBox!)))
    } else if (usesHoseStyleRollAdjust) {
      setPerRollEditor(false)
      const roll = getRollStateForProduct(product, loadRollStock())
      setHoseRollFullStr(String(countFullRollsOnShelf(roll)))
      setHoseRollOpenStr(String(roll.openRolls.length))
      setHoseRollScrapStr(
        String(Math.round(roll.openRolls.reduce((s, o) => s + o.remainingKg, 0) * 1000) / 1000),
      )
    } else if (product.stockMode === 'kg_roll' && product.nominalKgPerRoll) {
      const roll = getRollStateForProduct(product, loadRollStock())
      const usePer = shouldUsePerRollEditor(product, roll)
      setPerRollEditor(usePer)
      if (usePer) {
        syncPerRollFromStorage(product)
      } else {
        setStockStr(String(product.stock))
      }
    } else if (isMeterRollSimpleTotal) {
      setPerRollEditor(false)
      setStockStr(String(product.stock))
    } else {
      setPerRollEditor(false)
      setStockStr(String(Math.floor(product.stock)))
    }
    const minMaxAsKg =
      !usesHoseStyleRollAdjust &&
      ((product.stockMode === 'kg_roll' && Boolean(product.nominalKgPerRoll)) || isMeterRollSimpleTotal)
    setMinStr(minMaxAsKg ? String(product.minStock) : String(Math.floor(product.minStock)))
    const mx = product.maxStock
    if (mx != null && mx > 0) {
      setMaxStr(minMaxAsKg ? String(mx) : String(Math.floor(mx)))
    } else {
      setMaxStr('')
    }
  }, [
    open,
    product?.id,
    product?.stock,
    product?.minStock,
    product?.maxStock,
    product?.stockMode,
    product?.piecesPerBox,
    product?.nominalKgPerRoll,
    product?.nominalMetersPerRoll,
    product?.productTagIds,
    syncPerRollFromStorage,
    product,
  ])

  const livePerRollKg = useMemo(() => {
    if (!perRollEditor) return null
    const fs = fullRows.reduce((s, r) => s + parseQty(r.kgStr, true), 0)
    const os = openRows.reduce((s, r) => s + parseQty(r.kgStr, true), 0)
    return Math.round((fs + os) * 1000) / 1000
  }, [perRollEditor, fullRows, openRows])

  const hoseRollDisplayTotalKg = useMemo(() => {
    if (!usesHoseStyleRollAdjust) return null
    const scrap = parseQty(hoseRollScrapStr, true)
    return Math.round(scrap * 1000) / 1000
  }, [usesHoseStyleRollAdjust, hoseRollScrapStr])

  if (!open || !product) return null

  const p = product

  const handleClose = () => {
    setNutOpenBoxDraft(null)
    setHoseRollFullStr('0')
    setHoseRollOpenStr('0')
    setHoseRollScrapStr('0')
    onClose()
  }

  function applyStockDelta(delta: number) {
    if (perRollEditor && isKgRoll) return
    if (isBoxPiece && p.piecesPerBox) {
      const full = parseQty(fullBoxesStr, false)
      const loose = Math.max(0, parseQty(loosePiecesStr, false) + Math.floor(delta))
      setLoosePiecesStr(String(loose))
      setStockStr(String(totalPiecesFromBoxPiece({ fullBoxes: full, loosePieces: loose }, p.piecesPerBox)))
      return
    }
    if (isKgRoll || isMeterRollSimpleTotal) {
      const nextKg = Math.max(0, Math.round(((parseQty(stockStr, true) || 0) + delta) * 1000) / 1000)
      setStockStr(String(nextKg))
    } else {
      const next = Math.max(0, parseQty(stockStr, false) + Math.floor(delta))
      setStockStr(String(next))
    }
  }

  function handleSave() {
    if (usesHoseStyleRollAdjust) {
      const mapBefore = loadRollStock()
      const rollBefore = getRollStateForProduct(p, mapBefore)
      if (usesPerRollWeightTracking(rollBefore)) {
        const ok = window.confirm(
          'มีรายการม้วนเต็มแบบจดหน่วยต่อม้วน — การบันทึกแบบนี้จะล้างรายละเอียดและเหลือแค่จำนวนม้วนเต็ม / ม้วนเปิด / เศษ ตามที่กรอก ต้องการดำเนินการต่อหรือไม่?',
        )
        if (!ok) return
      }
      const nFull = Math.max(0, Math.floor(Number(hoseRollFullStr.trim().replace(',', '.')) || 0))
      const nOpen = Math.max(0, Math.floor(Number(hoseRollOpenStr.trim().replace(',', '.')) || 0))
      const scrapKg = parseQty(hoseRollScrapStr, true)
      const scrapUnit = isMeterRollWithNominal ? 'ม.' : 'กก.'
      if (nOpen > 0 && scrapKg <= 1e-6) {
        window.alert(
          `มีม้วนเปิดแต่เศษ (${scrapUnit}) เป็น 0 — กรอกเศษรวม (${scrapUnit}) หรือตั้งม้วนเปิดเป็น 0`,
        )
        return
      }
      setRollStockStateForProduct(p.id, {
        fullRolls: nFull,
        fullRollParts: undefined,
        openRolls: buildOpenRollPartsFromCountAndScrap(nOpen, scrapKg),
      })
      handleClose()
      return
    }

    if (isBoxPiece && p.piecesPerBox) {
      const full = parseQty(fullBoxesStr, false)
      const loose = parseQty(loosePiecesStr, false)
      setBoxPieceStock(p.id, full, loose)
    } else if (isKgRoll) {
      const nominal = rollNominalKgEffective(p)
      if (perRollEditor) {
        const fullRollParts: FullRollPart[] = fullRows
          .map((row) => {
            const kg = parseQty(row.kgStr, true)
            const d = row.dateStr.trim()
            const receivedDate = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined
            return { id: row.id, kg, receivedDate }
          })
          .filter((x) => x.kg > 1e-6)

        const openRolls: OpenRollPart[] = openRows
          .map((row) => ({
            id: row.id || newLocalId('open'),
            remainingKg: parseQty(row.kgStr, true),
          }))
          .filter((x) => x.remainingKg > 1e-6)

        setRollStockStateForProduct(p.id, {
          fullRolls: 0,
          fullRollParts,
          openRolls,
        })
      } else {
        const kg = parseQty(stockStr, true)
        setRollProductTotalKg(p.id, kg, nominal)
      }
    } else if (isMeterRollSimpleTotal) {
      const nominal = Math.max(0.001, p.nominalMetersPerRoll ?? 0.001)
      const m = parseQty(stockStr, true)
      setRollProductTotalKg(p.id, m, nominal)
    } else {
      setPieceStock(p.id, parseQty(stockStr, false))
    }

    if (!hideWarehouseThresholds) {
      const min = parseQty(minStr, isKgRoll || isMeterRollSimpleTotal)
      const maxRaw = maxStr.trim()
      const max = maxRaw === '' ? null : Math.max(0, parseQty(maxStr, isKgRoll || isMeterRollSimpleTotal))
      setWarehouseMinMax(p.id, min, max === null || max <= 0 ? null : max)
    }
    handleClose()
  }

  function handleOpenNextFullFifo() {
    const sorted = [...fullRows].sort((a, b) => {
      const da = /^\d{4}-\d{2}-\d{2}$/.test(a.dateStr.trim()) ? a.dateStr.trim() : '9999-12-31'
      const db = /^\d{4}-\d{2}-\d{2}$/.test(b.dateStr.trim()) ? b.dateStr.trim() : '9999-12-31'
      if (da !== db) return da.localeCompare(db)
      return a.id.localeCompare(b.id)
    })
    const first = sorted.find((row) => parseQty(row.kgStr, true) > 1e-6)
    if (!first) {
      window.alert('ไม่มีม้วนเต็มให้เปิด')
      return
    }
    const kg = parseQty(first.kgStr, true)
    setFullRows((prev) => prev.filter((r) => r.id !== first.id))
    setOpenRows((prev) => [...prev, { id: newLocalId('open'), kgStr: String(kg) }])
  }

  const unitLabel = isKgRoll ? 'กก.' : isMeterRollSimpleTotal || isMeterRollWithNominal ? 'ม.' : isBoxPiece ? 'ตัว (รวม)' : 'ชิ้น'
  const wide = usesHoseStyleRollAdjust || (isKgRoll && perRollEditor)
  const compactBoxToolbar = Boolean(compactUi && isBoxPiece && p.piecesPerBox)
  /** แบ่งขาย: น็อตสต็อก / สายยางอ่อน / ชิ้นทั่วไป — ความกว้างเดียวกับหน้าแคปปรับสต็อกชิ้น */
  const compactModalMaxW = compactModalMaxWidthClass?.trim() || 'max-w-[17.5rem]'

  const compactBoxControlH = 'h-8'
  const openBoxGoldBtnClass =
    'inline-flex shrink-0 items-center justify-center rounded-md border border-amber-700/40 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 px-2.5 text-[10px] font-semibold tracking-wide text-amber-950 shadow-sm shadow-amber-900/20 outline-none transition hover:from-amber-50 hover:via-amber-200 hover:to-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500/60'

  return (
    <>
    <div className={clsx('fixed inset-0 z-[60] flex items-center justify-center', compactUi ? 'p-2' : 'p-4')}>
      <button type="button" className="absolute inset-0 bg-slate-900/45" aria-label="ปิด" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="wh-stock-modal-title"
        className={clsx(
          'relative z-10 w-full border border-slate-200/80 bg-white',
          compactUi ? 'rounded-xl p-3 shadow-xl ring-1 ring-slate-900/[0.04]' : 'rounded-2xl p-4 shadow-xl',
          compactUi
            ? clsx(compactModalMaxW, wide && 'max-h-[min(88vh,30rem)] overflow-y-auto')
            : wide
              ? 'max-h-[min(90vh,40rem)] max-w-2xl overflow-y-auto'
              : 'max-w-md',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {compactUi ? (
          <div className="relative border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="absolute -right-0.5 -top-0.5 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="ปิด"
            >
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
            <div className="px-5 text-center">
              <h2 id="wh-stock-modal-title" className="text-xs font-bold tracking-tight text-slate-900">
                ปรับสต็อกคลัง
              </h2>
              <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-slate-500">{p.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="min-w-0">
              <h2 id="wh-stock-modal-title" className="text-sm font-semibold text-slate-900">
                ปรับสต็อกคลัง
              </h2>
              <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{p.sku}</p>
              <p className="truncate text-sm text-slate-700">{p.name}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="ปิด"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        <div className={clsx(compactUi ? 'mt-2 space-y-2' : 'mt-4 space-y-4')}>
          {isBoxPiece && p.piecesPerBox ? (
            <>
              {compactBoxToolbar ? (
                <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1.5">
                  <label className="min-w-[3.75rem] flex-1 sm:max-w-[5.5rem]">
                    <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      เศษ (ตัว)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={clsx(
                        'box-border w-full rounded-md border border-slate-200 bg-white px-2 text-xs tabular-nums shadow-sm outline-none transition focus:border-slate-300 focus:ring-1 focus:ring-slate-200/80',
                        compactBoxControlH,
                      )}
                      value={loosePiecesStr}
                      onChange={(e) => setLoosePiecesStr(e.target.value)}
                    />
                  </label>
                  <label className="min-w-[3.75rem] flex-1 sm:max-w-[5.5rem]">
                    <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      กล่องเต็ม (ปิด)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={clsx(
                        'box-border w-full rounded-md border border-slate-200 bg-white px-2 text-xs tabular-nums shadow-sm outline-none transition focus:border-slate-300 focus:ring-1 focus:ring-slate-200/80',
                        compactBoxControlH,
                      )}
                      value={fullBoxesStr}
                      onChange={(e) => setFullBoxesStr(e.target.value)}
                    />
                  </label>
                  <div className="w-[3.5rem] shrink-0 sm:w-14">
                    <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      ตัว/กล่อง
                    </span>
                    <div
                      className={clsx(
                        'flex items-center justify-center rounded-md border border-amber-200/90 bg-amber-50 px-1.5 text-xs font-semibold tabular-nums text-amber-950 shadow-inner',
                        compactBoxControlH,
                      )}
                      aria-label="ตัวต่อกล่องจากมาสเตอร์"
                    >
                      {p.piecesPerBox}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={clsx(openBoxGoldBtnClass, compactBoxControlH)}
                    onClick={() => {
                      const full = parseQty(fullBoxesStr, false)
                      const loose = parseQty(loosePiecesStr, false)
                      const per = Math.max(1, Math.floor(p.piecesPerBox!))
                      if (full < 1) {
                        window.alert('ไม่มีกล่องเต็มให้เปิด')
                        return
                      }
                      const nextFull = full - 1
                      const nextLoose = loose + per
                      if ((p.productTagIds ?? []).includes(NUT_STOCK_TAG_ID)) {
                        setNutOpenBoxDraft({ nextFull, nextLoose, per })
                        return
                      }
                      setFullBoxesStr(String(nextFull))
                      setLoosePiecesStr(String(nextLoose))
                      setStockStr(
                        String(totalPiecesFromBoxPiece({ fullBoxes: nextFull, loosePieces: nextLoose }, per)),
                      )
                    }}
                  >
                    เปิดกล่อง
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] leading-snug text-slate-500">
                    กล่องปิด + เศษตัว — POS จะแกะกล่องอัตโนมัติเมื่อขายเกินเศษ ({p.piecesPerBox} ตัว/กล่อง)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">กล่องเต็ม (ปิด)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
                        value={fullBoxesStr}
                        onChange={(e) => setFullBoxesStr(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">เศษ (ตัว)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
                        value={loosePiecesStr}
                        onChange={(e) => setLoosePiecesStr(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const full = parseQty(fullBoxesStr, false)
                        const loose = parseQty(loosePiecesStr, false)
                        const per = Math.max(1, Math.floor(p.piecesPerBox!))
                        if (full < 1) {
                          window.alert('ไม่มีกล่องเต็มให้เปิด')
                          return
                        }
                        const nextFull = full - 1
                        const nextLoose = loose + per
                        if ((p.productTagIds ?? []).includes(NUT_STOCK_TAG_ID)) {
                          setNutOpenBoxDraft({ nextFull, nextLoose, per })
                          return
                        }
                        setFullBoxesStr(String(nextFull))
                        setLoosePiecesStr(String(nextLoose))
                        setStockStr(
                          String(totalPiecesFromBoxPiece({ fullBoxes: nextFull, loosePieces: nextLoose }, per)),
                        )
                      }}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-900 hover:bg-teal-100"
                    >
                      เปิดกล่อง (+{p.piecesPerBox} ตัวเข้าเศษ)
                    </button>
                  </div>
                </>
              )}
            </>
          ) : usesHoseStyleRollAdjust ? (
            <>
              {!compactUi ? (
                <p className="text-[11px] leading-snug text-slate-600">
                  {isMeterRollWithNominal ? (
                    <>
                      แก้ 3 ช่องให้ตรงหน้าแบ่งขาย — เศษเป็นหน่วย <span className="font-semibold">เมตร</span> ตามโหมดม้วน/เมตรในมาสเตอร์
                      · กด <span className="font-semibold">บันทึก</span> แล้วค่อยปรับรอบถัดไป
                    </>
                  ) : (
                    <>
                      แก้ได้เฉพาะ 3 ช่องนี้ให้ตรงหน้าแบ่งขาย — เศษเป็น <span className="font-semibold">กก.</span> รวมบนม้วนเปิด (ยังไม่บังคับกก./ม้วนในมาสเตอร์){' '}
                      · กด <span className="font-semibold">บันทึก</span> แล้วค่อยปรับรอบถัดไป
                    </>
                  )}
                </p>
              ) : null}
              <div
                className={clsx(
                  'rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/90 to-white shadow-sm',
                  compactUi ? 'p-1.5' : 'p-4',
                )}
              >
                <div className={clsx('grid grid-cols-1 sm:grid-cols-3', compactUi ? 'gap-1.5' : 'gap-3')}>
                  <label className="block min-w-0">
                    <span
                      className={clsx(
                        'block font-semibold uppercase tracking-wide text-amber-900',
                        compactUi ? 'mb-0.5 text-[9px]' : 'mb-1 text-[10px]',
                      )}
                    >
                      {isMeterRollWithNominal ? 'เศษ (ม.)' : 'เศษ (กก.)'}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={clsx(
                        'w-full rounded-lg border border-amber-200/90 bg-white text-center font-semibold tabular-nums text-amber-950 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200',
                        compactUi
                          ? 'px-1.5 py-1 text-xs'
                          : 'px-2.5 py-2.5 text-base',
                      )}
                      value={hoseRollScrapStr}
                      onChange={(e) => setHoseRollScrapStr(e.target.value)}
                      aria-label={
                        isMeterRollWithNominal
                          ? 'เศษเมตรรวมบนม้วนเปิด'
                          : 'เศษกิโลกรัมรวมบนม้วนเปิด'
                      }
                    />
                    {!compactUi ? (
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {isMeterRollWithNominal
                          ? 'เมตร รวมบนม้วนเปิด · บันทึกแล้วแบ่งเท่าๆ ต่อม้วนเปิด'
                          : 'กก. รวมบนม้วนเปิด · บันทึกแล้วแบ่งเท่าๆ ต่อม้วนเปิด'}
                      </span>
                    ) : null}
                  </label>
                  <label className="block min-w-0">
                    <span
                      className={clsx(
                        'block font-semibold uppercase tracking-wide text-teal-800',
                        compactUi ? 'mb-0.5 text-[9px]' : 'mb-1 text-[10px]',
                      )}
                    >
                      ม้วนเปิด
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={clsx(
                        'w-full rounded-lg border border-teal-200/80 bg-white text-center font-semibold tabular-nums text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200',
                        compactUi
                          ? 'px-1.5 py-1 text-xs'
                          : 'px-2.5 py-2.5 text-base',
                      )}
                      value={hoseRollOpenStr}
                      onChange={(e) => setHoseRollOpenStr(e.target.value)}
                      aria-label="จำนวนม้วนเปิด"
                    />
                    {!compactUi ? (
                      <span className="mt-1 block text-[10px] text-slate-500">จำนวนม้วนที่เปิดแล้ว</span>
                    ) : null}
                  </label>
                  <label className="block min-w-0">
                    <span
                      className={clsx(
                        'block font-semibold uppercase tracking-wide text-teal-800',
                        compactUi ? 'mb-0.5 text-[9px]' : 'mb-1 text-[10px]',
                      )}
                    >
                      ม้วนเต็ม
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={clsx(
                        'w-full rounded-lg border border-teal-200/80 bg-white text-center font-semibold tabular-nums text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200',
                        compactUi
                          ? 'px-1.5 py-1 text-xs'
                          : 'px-2.5 py-2.5 text-base',
                      )}
                      value={hoseRollFullStr}
                      onChange={(e) => setHoseRollFullStr(e.target.value)}
                      aria-label="จำนวนม้วนเต็ม"
                    />
                    {!compactUi ? (
                      <span className="mt-1 block text-[10px] text-slate-500">จำนวนม้วนที่ยังไม่แกะ</span>
                    ) : null}
                  </label>
                </div>
                <p
                  className={clsx(
                    'border-t border-teal-100 text-center tabular-nums text-slate-700',
                    compactUi ? 'mt-1.5 pt-1.5 text-[10px]' : 'mt-3 pt-3 text-xs',
                  )}
                >
                  รวมเศษ ({isMeterRollWithNominal ? 'ม.' : 'กก.'}){' '}
                  <span className="font-semibold text-teal-800">
                    {hoseRollDisplayTotalKg != null ? hoseRollDisplayTotalKg.toLocaleString('th-TH') : '—'}
                  </span>
                  {!compactUi ? (
                    <span className="text-[10px] font-normal text-slate-500">
                      {' '}
                      {isMeterRollWithNominal
                        ? '(ม้วนเต็มยังไม่รวมเมตรจนกว่าจะจดเมตรต่อม้วนในระบบ)'
                        : '(ม้วนเต็มยังไม่รวมกก. จนกว่าจะจดกก.ต่อม้วนในระบบ)'}
                    </span>
                  ) : null}
                </p>
              </div>
            </>
          ) : isKgRoll && perRollEditor ? (
            <>
              {!compactUi ? (
                <p className="text-[11px] leading-snug text-slate-600">
                  <strong>ม้วนละกก.ไม่เท่ากัน:</strong> จดม้วนเต็มทีละม้วน (กก. ตามป้ายหรือชั่ง) + วันที่รับ{' '}
                  <span className="font-mono">ปปปป-ดด-วว</span> เพื่อเรียง FIFO เก่าก่อน · POS เปิดม้วนถัดไปตามวันที่อัตโนมัติ
                </p>
              ) : null}
              <div className={clsx('rounded-xl border border-teal-100 bg-teal-50/50', compactUi ? 'p-1.5' : 'p-3')}>
                <div className={clsx('flex flex-wrap items-center justify-between gap-2', compactUi ? 'mb-1' : 'mb-2')}>
                  <span className={clsx('font-semibold text-teal-950', compactUi ? 'text-[10px]' : 'text-xs')}>
                    ม้วนเต็ม (ยังไม่แกะ)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFullRows((rows) => [...rows, { id: newLocalId('full'), kgStr: '', dateStr: '' }])
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2 py-1 text-[11px] font-medium text-teal-900 hover:bg-teal-50"
                    >
                      <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                      เพิ่มม้วน
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenNextFullFifo}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-50"
                    >
                      เปิดม้วนถัดไป (FIFO)
                    </button>
                  </div>
                </div>
                <div
                  className={clsx(
                    'overflow-auto rounded-lg border border-teal-100/80 bg-white',
                    compactUi ? 'max-h-28' : 'max-h-40',
                  )}
                >
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-2 py-1.5 font-medium">กก.</th>
                        <th className="px-2 py-1.5 font-medium">วันที่รับ</th>
                        <th className="w-8 px-1 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {fullRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-2 py-3 text-center text-slate-400">
                            {compactUi ? '—' : 'ยังไม่มีม้วนเต็ม — กด «เพิ่มม้วน»'}
                          </td>
                        </tr>
                      ) : (
                        fullRows.map((row, idx) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-full rounded border border-slate-200 px-1.5 py-1 tabular-nums"
                                value={row.kgStr}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setFullRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, kgStr: v } : r)),
                                  )
                                }}
                                placeholder="เช่น 24.5"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                className="w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-[10px]"
                                value={row.dateStr}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setFullRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, dateStr: v } : r)),
                                  )
                                }}
                                placeholder="2026-04-10"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <button
                                type="button"
                                onClick={() => setFullRows((prev) => prev.filter((_, i) => i !== idx))}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                aria-label="ลบแถว"
                              >
                                <Trash2 className="size-3.5" strokeWidth={1.75} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={clsx('rounded-xl border border-amber-100 bg-amber-50/40', compactUi ? 'p-1.5' : 'p-3')}>
                <div className={clsx('flex flex-wrap items-center justify-between gap-2', compactUi ? 'mb-1' : 'mb-2')}>
                  <span className={clsx('font-semibold text-amber-950', compactUi ? 'text-[10px]' : 'text-xs')}>
                    ม้วนเปิด / เศษ (กก.)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRows((rows) => [...rows, { id: newLocalId('open'), kgStr: '' }])
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-medium text-amber-950 hover:bg-amber-50"
                  >
                    <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                    เพิ่มแถวเศษ
                  </button>
                </div>
                <div
                  className={clsx(
                    'overflow-auto rounded-lg border border-amber-100/80 bg-white',
                    compactUi ? 'max-h-20' : 'max-h-32',
                  )}
                >
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-2 py-1.5 font-medium">กก. คงเหลือ</th>
                        <th className="w-8 px-1 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {openRows.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-2 py-2 text-center text-slate-400">
                            {compactUi ? '—' : 'ไม่มีม้วนเปิด'}
                          </td>
                        </tr>
                      ) : (
                        openRows.map((row, idx) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-full rounded border border-slate-200 px-1.5 py-1 tabular-nums"
                                value={row.kgStr}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setOpenRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, kgStr: v } : r)),
                                  )
                                }}
                              />
                            </td>
                            <td className="px-1 py-1">
                              <button
                                type="button"
                                onClick={() => setOpenRows((prev) => prev.filter((_, i) => i !== idx))}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                aria-label="ลบแถว"
                              >
                                <Trash2 className="size-3.5" strokeWidth={1.75} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <p
                className={clsx(
                  'text-center font-medium tabular-nums text-slate-700',
                  compactUi ? 'text-[10px]' : 'text-xs',
                )}
              >
                รวม{' '}
                <span className="text-teal-800">{livePerRollKg != null ? livePerRollKg : stockStr}</span> กก.
              </p>
            </>
          ) : (
            <div>
              <div className={clsx('flex flex-wrap items-center justify-between gap-2', compactUi ? 'mb-1' : 'mb-1.5')}>
                <span
                  className={clsx('font-medium text-slate-600', compactUi ? 'text-[10px]' : 'text-xs')}
                >
                  สต็อกคงเหลือ ({unitLabel})
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {isKgRoll || isMeterRollSimpleTotal ? (
                    <>
                      <QuickBtn
                        dense={compactUi}
                        label={isMeterRollSimpleTotal ? '-1 ม.' : '-1 กก.'}
                        onClick={() => applyStockDelta(-1)}
                      />
                      <QuickBtn
                        dense={compactUi}
                        label={isMeterRollSimpleTotal ? '+1 ม.' : '+1 กก.'}
                        onClick={() => applyStockDelta(1)}
                      />
                      <QuickBtn
                        dense={compactUi}
                        label={isMeterRollSimpleTotal ? '-0.5 ม.' : '-0.5 กก.'}
                        onClick={() => applyStockDelta(-0.5)}
                      />
                      <QuickBtn
                        dense={compactUi}
                        label={isMeterRollSimpleTotal ? '+0.5 ม.' : '+0.5 กก.'}
                        onClick={() => applyStockDelta(0.5)}
                      />
                    </>
                  ) : (
                    <>
                      <QuickBtn dense={compactUi} label="-10" onClick={() => applyStockDelta(-10)} />
                      <QuickBtn dense={compactUi} label="-1" onClick={() => applyStockDelta(-1)} />
                      <QuickBtn dense={compactUi} label="+1" onClick={() => applyStockDelta(1)} />
                      <QuickBtn dense={compactUi} label="+10" onClick={() => applyStockDelta(10)} />
                    </>
                  )}
                </div>
              </div>
              <input
                type="text"
                inputMode="decimal"
                className={clsx(
                  'w-full rounded-lg border border-slate-200 tabular-nums',
                  compactUi ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-sm',
                )}
                value={stockStr}
                onChange={(e) => setStockStr(e.target.value)}
              />
            </div>
          )}

          {!usesHoseStyleRollAdjust && !hideWarehouseThresholds ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  สต็อกขั้นต่ำ (Low) —{' '}
                  {isKgRoll ? 'กก.' : isMeterRollSimpleTotal ? 'ม.' : isBoxPiece ? 'ตัว (รวม)' : 'ชิ้น'}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  value={minStr}
                  onChange={(e) => setMinStr(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  สต็อกสูงสุด (High) —{' '}
                  {isKgRoll ? 'กก.' : isMeterRollSimpleTotal ? 'ม.' : isBoxPiece ? 'ตัว (รวม)' : 'ชิ้น'}{' '}
                  (ว่าง = ไม่จำกัด)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  value={maxStr}
                  onChange={(e) => setMaxStr(e.target.value)}
                  placeholder="เช่น 500"
                />
              </label>
            </>
          ) : null}
        </div>

        {!compactUi ? (
          <p className="mt-4 text-center text-[11px] text-slate-500">
            แก้ค่าในหน้าต่างนี้ยังไม่ลงคลัง — กด <span className="font-semibold text-slate-700">บันทึก</span> เพื่อยืนยัน
            {isBoxPiece ? ' · เปิดกล่องยังไม่บันทึกจนกดบันทึก' : null}
            {isKgRoll && perRollEditor ? ' · เปิดม้วน FIFO / แก้แถวม้วน ยังไม่บันทึกจนกดบันทึก' : null}
          </p>
        ) : null}

        <div
          className={clsx(
            'mt-3 flex gap-2 border-t border-slate-100 pt-3',
            compactUi ? 'items-stretch' : 'items-center justify-end',
          )}
        >
          <button
            type="button"
            onClick={handleClose}
            className={clsx(
              'font-medium transition',
              compactUi
                ? 'inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                : 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50',
            )}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={clsx(
              'font-semibold text-white transition hover:bg-slate-800',
              compactUi
                ? 'inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-slate-900 text-xs shadow-sm shadow-slate-900/25'
                : 'rounded-xl bg-slate-900 px-4 py-2 text-sm',
            )}
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
    <SmallConfirmModal
      open={Boolean(nutOpenBoxDraft)}
      title={NUT_STOCK_OPEN_BOX_TITLE}
      message={
        nutOpenBoxDraft
          ? nutStockOpenBoxMessage(p.name, nutOpenBoxDraft.per)
          : ''
      }
      confirmLabel="เปิดกล่อง"
      onClose={() => setNutOpenBoxDraft(null)}
      onConfirm={applyNutOpenBoxDraft}
      confirmVariant="amber"
    />
    </>
  )
}

function QuickBtn({
  label,
  onClick,
  dense,
}: {
  label: string
  onClick: () => void
  dense?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded border border-slate-200 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50',
        dense ? 'px-1 py-0.5 text-[9px]' : 'rounded-md px-1.5 py-0.5 text-[10px]',
      )}
    >
      {label}
    </button>
  )
}
