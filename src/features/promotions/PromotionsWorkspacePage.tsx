import { MOCK_PRODUCTS } from '@/features/inventory/data/mockInventory'
import type {
  BuyQtyPromotion,
  PercentOffPromotion,
  SecondPieceDiscountPromotion,
} from '@/features/promotions/data/promotionTypes'
import {
  loadPercentOffPromotions,
  savePercentOffPromotions,
} from '@/features/promotions/data/percentPromotionsStore'
import {
  loadSecondPiecePromotions,
  saveSecondPiecePromotions,
} from '@/features/promotions/data/secondPiecePromotionsStore'
import {
  DEFAULT_PROMOTIONS,
  loadPromotions,
  savePromotions,
} from '@/features/promotions/data/promotionsStore'
import { isPercentPromotionActive } from '@/features/promotions/evaluatePercentOff'
import { isSecondPiecePromotionActive } from '@/features/promotions/evaluateSecondPiece'
import { isPromotionActive } from '@/features/promotions/evaluateBuyQty'
import { getPosSellConfig } from '@/features/pos/data/posUnitPricing'
import { clsx } from 'clsx'
import {
  Check,
  ChevronDown,
  Gift,
  Layers2,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

/** ฟอร์มแก้ไขโปร — กะทัดรัดให้เห็นในหน้าจอเดียว */
const fieldEditor =
  'w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/15'
const fieldEditorMono = `${fieldEditor} font-mono text-[11px]`
const fieldEditorReadonly = `${fieldEditorMono} bg-slate-50/90 text-slate-600`
const labelEditor = 'mb-1 block text-[10px] font-medium tracking-wide text-slate-600'

const btnGhost =
  'inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]'
const btnAddPromoSize =
  'inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-none shadow-md transition active:scale-[0.99] sm:gap-1.5 sm:px-2.5 sm:text-[11px]'
const btnViolet =
  `${btnAddPromoSize} border border-violet-500/20 bg-gradient-to-b from-violet-600 to-violet-700 text-white shadow-violet-600/20 hover:from-violet-500 hover:to-violet-600`
const btnTeal =
  `${btnAddPromoSize} border border-teal-500/20 bg-gradient-to-b from-teal-600 to-teal-700 text-white shadow-teal-600/20 hover:from-teal-500 hover:to-teal-600`
const btnAmber =
  `${btnAddPromoSize} border border-amber-500/20 bg-gradient-to-b from-amber-600 to-orange-700 text-white shadow-amber-600/20 hover:from-amber-500 hover:to-orange-600`
const btnDanger =
  'inline-flex min-h-8 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-800 transition hover:bg-red-100'

function newId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newGiftPromotion(): BuyQtyPromotion {
  return {
    id: newId(),
    name: 'โปรใหม่',
    enabled: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2099-12-31',
    triggerProductId: MOCK_PRODUCTS[0]?.id ?? 'p1',
    triggerUnitIndex: undefined,
    minQty: 1,
    giftProductId: MOCK_PRODUCTS[0]?.id ?? 'p1',
    giftQty: 1,
  }
}

function newPercentPromotion(): PercentOffPromotion {
  const pid = MOCK_PRODUCTS[0]?.id ?? 'p1'
  const cfg = getPosSellConfig(pid)
  const u0 = cfg.units[0]?.index ?? 0
  return {
    id: newId(),
    name: 'โปรลด % ใหม่',
    enabled: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2099-12-31',
    productId: pid,
    unitIndex: u0,
    percentOff: 20,
  }
}

function newSecondPiecePromotion(): SecondPieceDiscountPromotion {
  const pid = MOCK_PRODUCTS[0]?.id ?? 'p1'
  const cfg = getPosSellConfig(pid)
  const u0 = cfg.units[0]?.index ?? 0
  return {
    id: newId(),
    name: 'โปรชิ้นถัดไปถูกลง (ใหม่)',
    enabled: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2099-12-31',
    productId: pid,
    unitIndex: u0,
    fullPricePieces: 1,
    percentOffAdditional: 10,
  }
}

type PromoModal =
  | { kind: 'gift'; id: string | null }
  | { kind: 'percent'; id: string | null }
  | { kind: 'second'; id: string | null }

function productLabel(productId: string): string {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId)
  return p ? `${p.name} (${p.sku})` : productId
}

function staffReadableSummary(p: BuyQtyPromotion): string {
  const trigger = productLabel(p.triggerProductId)
  const gift = productLabel(p.giftProductId)
  const unit =
    p.triggerUnitIndex === undefined
      ? 'นับรวมทุกหน่วยของสินค้านี้'
      : `นับเฉพาะหน่วยขายลำดับที่ ${p.triggerUnitIndex + 1} ใน POS`
  return `ซื้อ ${trigger} ขั้นต่ำ ${p.minQty} (${unit}) → แถม ${gift} จำนวน ${p.giftQty} ชิ้น`
}

function staffReadablePercentSummary(p: PercentOffPromotion): string {
  const prod = productLabel(p.productId)
  const cfg = getPosSellConfig(p.productId)
  const u = cfg.units.find((x) => x.index === p.unitIndex)
  const unitLabel = u ? `${u.label} (ลำดับที่ ${p.unitIndex + 1})` : `หน่วยลำดับที่ ${p.unitIndex + 1}`
  return `ลด ${p.percentOff}% — ${prod} เฉพาะขายเป็น${unitLabel}`
}

function staffReadableSecondPieceSummary(p: SecondPieceDiscountPromotion): string {
  const prod = productLabel(p.productId)
  const cfg = getPosSellConfig(p.productId)
  const u = cfg.units.find((x) => x.index === p.unitIndex)
  const unitLabel = u ? `${u.label} (ลำดับที่ ${p.unitIndex + 1})` : `หน่วยลำดับที่ ${p.unitIndex + 1}`
  const fp = Math.max(1, Math.floor(Number(p.fullPricePieces)) || 1)
  return `ชิ้นแรก ${fp} ชิ้นราคาเต็ม ชิ้นถัดไปลด ${p.percentOffAdditional}% — ${prod} หน่วย ${unitLabel}`
}

type PromotionsWorkspacePageProps = {
  className?: string
}

type PromoEditorTab = 'gift' | 'percent' | 'second'

export function PromotionsWorkspacePage({ className }: PromotionsWorkspacePageProps) {
  const [promotions, setPromotions] = useState<BuyQtyPromotion[]>(() => loadPromotions())
  const [percentPromos, setPercentPromos] = useState<PercentOffPromotion[]>(() => loadPercentOffPromotions())
  const [secondPiecePromos, setSecondPiecePromos] = useState<SecondPieceDiscountPromotion[]>(() =>
    loadSecondPiecePromotions(),
  )
  const [savedHint, setSavedHint] = useState(false)
  const [promoModal, setPromoModal] = useState<PromoModal | null>(null)
  const [giftDraft, setGiftDraft] = useState<BuyQtyPromotion | null>(null)
  const [percentDraft, setPercentDraft] = useState<PercentOffPromotion | null>(null)
  const [secondDraft, setSecondDraft] = useState<SecondPieceDiscountPromotion | null>(null)

  const productOptions = useMemo(
    () => [...MOCK_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name, 'th')),
    [],
  )

  const persist = useCallback((next: BuyQtyPromotion[]) => {
    setPromotions(next)
    savePromotions(next)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2000)
  }, [])

  const persistPercent = useCallback((next: PercentOffPromotion[]) => {
    setPercentPromos(next)
    savePercentOffPromotions(next)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2000)
  }, [])

  const persistSecondPiece = useCallback((next: SecondPieceDiscountPromotion[]) => {
    setSecondPiecePromos(next)
    saveSecondPiecePromotions(next)
    setSavedHint(true)
    window.setTimeout(() => setSavedHint(false), 2000)
  }, [])

  const closePromoModal = useCallback(() => {
    setPromoModal(null)
    setGiftDraft(null)
    setPercentDraft(null)
    setSecondDraft(null)
  }, [])

  const removePromotion = useCallback(
    (id: string) => {
      if (!window.confirm('ลบโปรโมชันนี้?')) return
      persist(promotions.filter((p) => p.id !== id))
    },
    [promotions, persist],
  )

  const resetDefaults = useCallback(() => {
    if (!window.confirm('รีเซ็ตเป็นโปรตัวอย่างเริ่มต้น (ทับข้อมูลที่บันทึกไว้)?')) return
    persist([...DEFAULT_PROMOTIONS])
  }, [persist])

  const removePercentPromotion = useCallback(
    (id: string) => {
      if (!window.confirm('ลบโปรลดราคานี้?')) return
      persistPercent(percentPromos.filter((p) => p.id !== id))
    },
    [percentPromos, persistPercent],
  )

  const removeSecondPiecePromotion = useCallback(
    (id: string) => {
      if (!window.confirm('ลบโปรชิ้นถัดไปถูกลงนี้?')) return
      persistSecondPiece(secondPiecePromos.filter((p) => p.id !== id))
    },
    [secondPiecePromos, persistSecondPiece],
  )

  const saveGiftDraft = useCallback(() => {
    if (!giftDraft) return
    const exists = promotions.some((p) => p.id === giftDraft.id)
    if (exists) persist(promotions.map((p) => (p.id === giftDraft.id ? giftDraft : p)))
    else persist([...promotions, giftDraft])
    closePromoModal()
  }, [giftDraft, promotions, persist, closePromoModal])

  const savePercentDraft = useCallback(() => {
    if (!percentDraft) return
    const exists = percentPromos.some((p) => p.id === percentDraft.id)
    if (exists) persistPercent(percentPromos.map((p) => (p.id === percentDraft.id ? percentDraft : p)))
    else persistPercent([...percentPromos, percentDraft])
    closePromoModal()
  }, [percentDraft, percentPromos, persistPercent, closePromoModal])

  const saveSecondDraft = useCallback(() => {
    if (!secondDraft) return
    const exists = secondPiecePromos.some((p) => p.id === secondDraft.id)
    if (exists) {
      persistSecondPiece(secondPiecePromos.map((p) => (p.id === secondDraft.id ? secondDraft : p)))
    } else {
      persistSecondPiece([...secondPiecePromos, secondDraft])
    }
    closePromoModal()
  }, [secondDraft, secondPiecePromos, persistSecondPiece, closePromoModal])

  useEffect(() => {
    if (!promoModal) return
    if (promoModal.kind === 'gift') {
      if (promoModal.id) {
        const p = promotions.find((x) => x.id === promoModal.id)
        setGiftDraft(p ? { ...p } : null)
      } else {
        setGiftDraft(newGiftPromotion())
      }
      setPercentDraft(null)
      setSecondDraft(null)
    } else if (promoModal.kind === 'percent') {
      if (promoModal.id) {
        const p = percentPromos.find((x) => x.id === promoModal.id)
        setPercentDraft(p ? { ...p } : null)
      } else {
        setPercentDraft(newPercentPromotion())
      }
      setGiftDraft(null)
      setSecondDraft(null)
    } else {
      if (promoModal.id) {
        const p = secondPiecePromos.find((x) => x.id === promoModal.id)
        setSecondDraft(p ? { ...p } : null)
      } else {
        setSecondDraft(newSecondPiecePromotion())
      }
      setGiftDraft(null)
      setPercentDraft(null)
    }
  }, [promoModal, promotions, percentPromos, secondPiecePromos])

  useEffect(() => {
    if (!promoModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePromoModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [promoModal, closePromoModal])

  const activeForStaff = useMemo(() => {
    const now = new Date()
    return promotions.filter((p) => isPromotionActive(p, now))
  }, [promotions])

  const activePercentForStaff = useMemo(() => {
    const now = new Date()
    return percentPromos.filter((p) => isPercentPromotionActive(p, now))
  }, [percentPromos])

  const activeSecondPieceForStaff = useMemo(() => {
    const now = new Date()
    return secondPiecePromos.filter((p) => isSecondPiecePromotionActive(p, now))
  }, [secondPiecePromos])

  const staffHasAnyActive =
    activeForStaff.length > 0 || activePercentForStaff.length > 0 || activeSecondPieceForStaff.length > 0

  const activePromoCount =
    activeForStaff.length + activePercentForStaff.length + activeSecondPieceForStaff.length

  const [editorTab, setEditorTab] = useState<PromoEditorTab>('gift')
  const [staffExpanded, setStaffExpanded] = useState(false)

  return (
    <div
      className={clsx(
        'relative flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-gradient-to-br from-slate-100/95 via-white to-indigo-50/35 p-2 sm:gap-3 sm:p-3 lg:p-4',
        className,
      )}
    >
      {savedHint ? (
        <div
          className="pointer-events-none absolute right-2 top-2 z-10 sm:right-3 sm:top-3"
          aria-live="polite"
        >
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 shadow-md ring-1 ring-emerald-100/80 backdrop-blur-sm sm:px-3 sm:text-[11px]">
            <Check className="size-3 shrink-0 text-emerald-600" aria-hidden />
            บันทึกแล้ว
          </span>
        </div>
      ) : null}

      <section
        className="relative shrink-0 overflow-hidden rounded-xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 shadow-[0_4px_24px_-8px_rgba(16,185,129,0.2)] ring-1 ring-emerald-100/50"
        aria-label="โปรโมชันที่ใช้ได้ในขณะนี้"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-emerald-400/[0.1] blur-2xl" aria-hidden />
        <button
          type="button"
          onClick={() => setStaffExpanded((e) => !e)}
          className="relative flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/40 sm:px-4 sm:py-3"
          aria-expanded={staffExpanded}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-bold text-emerald-950 sm:text-sm">โปรที่ใช้ได้ตอนนี้</h2>
            <p className="text-[10px] leading-snug text-emerald-900/75">
              {staffHasAnyActive
                ? `เปิดใช้งาน ${activePromoCount} รายการวันนี้ — แตะเพื่อ${staffExpanded ? 'ซ่อน' : 'ดูรายละเอียด'}`
                : 'ยังไม่มีโปรที่ใช้งานวันนี้'}
            </p>
          </div>
          <ChevronDown
            className={clsx(
              'size-5 shrink-0 text-emerald-800/80 transition-transform duration-200',
              staffExpanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        {staffExpanded ? (
          <div className="border-t border-emerald-100/80 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
            <p className="mb-2 pt-2 text-[10px] text-emerald-900/70">ให้พนักงานอ่าน · เฉพาะโปรที่เปิดและอยู่ในช่วงวันที่</p>
            <div className="max-h-[min(32vh,14rem)] space-y-3 overflow-y-auto pr-0.5 text-[11px] text-emerald-950">
          {!staffHasAnyActive ? (
            <p className="rounded-lg border border-emerald-100/80 bg-white/60 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-900/70">
              ยังไม่มีโปรที่ใช้งานในช่วงนี้ — เปิด &quot;เปิดใช้งาน&quot; และตั้งช่วงวันที่ให้ครอบคลุมวันนี้
            </p>
          ) : (
            <div className="space-y-3 text-[11px] text-emerald-950">
              {activeForStaff.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800/90">
                    <Gift className="size-3.5 text-violet-600" aria-hidden />
                    โปรโมชั่นแถม
                  </p>
                  <ul className="space-y-2.5">
                    {activeForStaff.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-white/80 bg-white/85 px-3 py-2.5 leading-snug shadow-sm ring-1 ring-emerald-100/60 backdrop-blur-sm"
                      >
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/90">
                          {staffReadableSummary(p)}
                        </p>
                        <p className="mt-2 inline-flex items-center rounded-md bg-emerald-50/90 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          {p.startDate} → {p.endDate}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activePercentForStaff.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800/90">
                    <Percent className="size-3.5 text-teal-600" aria-hidden />
                    โปรโมชั่นลดราคา
                  </p>
                  <ul className="space-y-2.5">
                    {activePercentForStaff.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-white/80 bg-white/85 px-3 py-2.5 leading-snug shadow-sm ring-1 ring-emerald-100/60 backdrop-blur-sm"
                      >
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/90">
                          {staffReadablePercentSummary(p)}
                        </p>
                        <p className="mt-2 inline-flex items-center rounded-md bg-emerald-50/90 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          {p.startDate} → {p.endDate}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeSecondPieceForStaff.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800/90">
                    <Layers2 className="size-3.5 text-amber-600" aria-hidden />
                    โปรชิ้นถัดไปถูกลง
                  </p>
                  <ul className="space-y-2.5">
                    {activeSecondPieceForStaff.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-white/80 bg-white/85 px-3 py-2.5 leading-snug shadow-sm ring-1 ring-emerald-100/60 backdrop-blur-sm"
                      >
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/90">
                          {staffReadableSecondPieceSummary(p)}
                        </p>
                        <p className="mt-2 inline-flex items-center rounded-md bg-emerald-50/90 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          {p.startDate} → {p.endDate}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex min-h-0 flex-1 flex-row gap-2 overflow-hidden">
        <nav
          className="flex w-[5.75rem] shrink-0 flex-col gap-1 self-stretch rounded-xl border border-slate-200/80 bg-slate-100/60 p-1 sm:w-[8rem]"
          role="tablist"
          aria-label="ประเภทโปรโมชัน"
        >
          <button
            type="button"
            role="tab"
            aria-selected={editorTab === 'gift'}
            onClick={() => setEditorTab('gift')}
            className={clsx(
              'flex w-full flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center text-[10px] font-semibold leading-snug transition sm:gap-1.5 sm:py-2.5 sm:text-[11px]',
              editorTab === 'gift'
                ? 'bg-white text-violet-900 shadow-sm ring-1 ring-violet-200/80'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )}
          >
            <Gift className="size-[18px] shrink-0 sm:size-5" aria-hidden />
            <span className="px-0.5">แถมสินค้า</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={editorTab === 'percent'}
            onClick={() => setEditorTab('percent')}
            className={clsx(
              'flex w-full flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center text-[10px] font-semibold leading-snug transition sm:gap-1.5 sm:py-2.5 sm:text-[11px]',
              editorTab === 'percent'
                ? 'bg-white text-teal-900 shadow-sm ring-1 ring-teal-200/80'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )}
          >
            <Percent className="size-[18px] shrink-0 sm:size-5" aria-hidden />
            <span className="px-0.5">ลด %</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={editorTab === 'second'}
            onClick={() => setEditorTab('second')}
            className={clsx(
              'flex w-full flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center text-[10px] font-semibold leading-snug transition sm:gap-1.5 sm:py-2.5 sm:text-[11px]',
              editorTab === 'second'
                ? 'bg-white text-amber-900 shadow-sm ring-1 ring-amber-200/80'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )}
          >
            <Layers2 className="size-[18px] shrink-0 sm:size-5" aria-hidden />
            <span className="px-0.5 leading-tight">ชิ้นถัดไป</span>
          </button>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        {editorTab === 'gift' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="max-w-md text-[11px] leading-snug text-slate-500">
                ซื้อถึงจำนวน/หน่วย → แถมสินค้า (ราคา 0 ที่ POS)
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={resetDefaults} className={btnGhost}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  รีเซ็ตตัวอย่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorTab('gift')
                    setPromoModal({ kind: 'gift', id: null })
                  }}
                  className={btnViolet}
                >
                  <Plus className="size-3 shrink-0 sm:size-3.5" aria-hidden />
                  เพิ่มโปร
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 ring-1 ring-slate-100/80">
              {promotions.length === 0 ? (
                <p className="py-10 text-center text-[12px] text-slate-500">ยังไม่มีโปรแถม — กด &quot;เพิ่มโปร&quot;</p>
              ) : (
                <ul className="space-y-2">
                  {promotions.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{staffReadableSummary(p)}</p>
                          <p className="mt-2 text-[10px] text-slate-500">
                            {p.startDate} → {p.endDate}
                            <span className={p.enabled ? ' text-emerald-700' : ' text-slate-400'}>
                              {' '}
                              · {p.enabled ? 'เปิดใช้งาน' : 'ปิด'}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5 sm:flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              setEditorTab('gift')
                              setPromoModal({ kind: 'gift', id: p.id })
                            }}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-900 hover:bg-violet-100"
                          >
                            <Pencil className="size-3" aria-hidden />
                            แก้ไข
                          </button>
                          <button type="button" onClick={() => removePromotion(p.id)} className={btnDanger}>
                            <Trash2 className="size-3.5" aria-hidden />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {editorTab === 'percent' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="max-w-md text-[11px] leading-snug text-slate-500">
                ลดราคาต่อหน่วยใน POS — ซ้ำสินค้า+หน่วยหลายโปรจะแจ้งเตือนและไม่ลดอัตโนมัติ
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditorTab('percent')
                  setPromoModal({ kind: 'percent', id: null })
                }}
                className={btnTeal}
              >
                <Plus className="size-3 shrink-0 sm:size-3.5" aria-hidden />
                เพิ่มโปร
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 ring-1 ring-slate-100/80">
              {percentPromos.length === 0 ? (
                <p className="py-10 text-center text-[12px] text-slate-500">ยังไม่มีโปรลด % — กด &quot;เพิ่มโปร&quot;</p>
              ) : (
                <ul className="space-y-2">
                  {percentPromos.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{staffReadablePercentSummary(p)}</p>
                          <p className="mt-2 text-[10px] text-slate-500">
                            {p.startDate} → {p.endDate}
                            <span className={p.enabled ? ' text-emerald-700' : ' text-slate-400'}>
                              {' '}
                              · {p.enabled ? 'เปิดใช้งาน' : 'ปิด'} ·{' '}
                              <span className="tabular-nums text-teal-700">{p.percentOff}%</span>
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5 sm:flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              setEditorTab('percent')
                              setPromoModal({ kind: 'percent', id: p.id })
                            }}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[10px] font-semibold text-teal-900 hover:bg-teal-100"
                          >
                            <Pencil className="size-3" aria-hidden />
                            แก้ไข
                          </button>
                          <button type="button" onClick={() => removePercentPromotion(p.id)} className={btnDanger}>
                            <Trash2 className="size-3.5" aria-hidden />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {editorTab === 'second' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="max-w-md text-[11px] leading-snug text-slate-500">
                ชิ้นแรก N ชิ้นเต็มราคา ชิ้นถัดไปลด % — มีลำดับก่อนโปรลด % ทุกชิ้นเมื่อตรงสินค้าและหน่วย
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditorTab('second')
                  setPromoModal({ kind: 'second', id: null })
                }}
                className={btnAmber}
              >
                <Plus className="size-3 shrink-0 sm:size-3.5" aria-hidden />
                เพิ่มโปร
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 ring-1 ring-slate-100/80">
              {secondPiecePromos.length === 0 ? (
                <p className="py-10 text-center text-[12px] text-slate-500">ยังไม่มีโปรชิ้นถัดไป — กด &quot;เพิ่มโปร&quot;</p>
              ) : (
                <ul className="space-y-2">
                  {secondPiecePromos.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{staffReadableSecondPieceSummary(p)}</p>
                          <p className="mt-2 text-[10px] text-slate-500">
                            {p.startDate} → {p.endDate}
                            <span className={p.enabled ? ' text-emerald-700' : ' text-slate-400'}>
                              {' '}
                              · {p.enabled ? 'เปิดใช้งาน' : 'ปิด'}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5 sm:flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              setEditorTab('second')
                              setPromoModal({ kind: 'second', id: p.id })
                            }}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-100"
                          >
                            <Pencil className="size-3" aria-hidden />
                            แก้ไข
                          </button>
                          <button type="button" onClick={() => removeSecondPiecePromotion(p.id)} className={btnDanger}>
                            <Trash2 className="size-3.5" aria-hidden />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {promoModal?.kind === 'gift' && giftDraft ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-[1px]"
            role="presentation"
            onClick={closePromoModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-modal-gift-title"
              className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl ring-1 ring-slate-200/60 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <h2 id="promo-modal-gift-title" className="text-sm font-bold text-slate-900">
                  {promoModal.id ? 'แก้ไขโปรแถม' : 'เพิ่มโปรแถม'}
                </h2>
                <button
                  type="button"
                  onClick={closePromoModal}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="block">
                  <span className={labelEditor}>รหัส (id)</span>
                  <input readOnly value={giftDraft.id} className={fieldEditorReadonly} />
                </label>
                <label className="block">
                  <span className={labelEditor}>ชื่อโปร</span>
                  <input
                    value={giftDraft.name}
                    onChange={(e) => setGiftDraft((d) => (d ? { ...d, name: e.target.value } : null))}
                    className={fieldEditor}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-slate-300 text-violet-600"
                    checked={giftDraft.enabled}
                    onChange={(e) => setGiftDraft((d) => (d ? { ...d, enabled: e.target.checked } : null))}
                  />
                  เปิดใช้งาน
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelEditor}>เริ่ม (YYYY-MM-DD)</span>
                    <input
                      type="date"
                      value={giftDraft.startDate}
                      onChange={(e) => setGiftDraft((d) => (d ? { ...d, startDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                  <label className="block">
                    <span className={labelEditor}>สิ้นสุด</span>
                    <input
                      type="date"
                      value={giftDraft.endDate}
                      onChange={(e) => setGiftDraft((d) => (d ? { ...d, endDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelEditor}>สินค้าที่ต้องซื้อ (trigger)</span>
                  <select
                    value={giftDraft.triggerProductId}
                    onChange={(e) => setGiftDraft((d) => (d ? { ...d, triggerProductId: e.target.value } : null))}
                    className={fieldEditor}
                  >
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>หน่วยที่นับ (index) — ว่าง = นับทุกหน่วย</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 2 = ม้วน"
                    value={giftDraft.triggerUnitIndex === undefined ? '' : String(giftDraft.triggerUnitIndex)}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      setGiftDraft((d) => {
                        if (!d) return null
                        if (v === '') return { ...d, triggerUnitIndex: undefined }
                        const n = parseInt(v, 10)
                        return Number.isFinite(n) ? { ...d, triggerUnitIndex: n } : d
                      })
                    }}
                    className={fieldEditorMono}
                  />
                </label>
                <label className="block">
                  <span className={labelEditor}>จำนวนขั้นต่ำ</span>
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={giftDraft.minQty}
                    onChange={(e) =>
                      setGiftDraft((d) => (d ? { ...d, minQty: Math.max(0, Number(e.target.value) || 0) } : null))
                    }
                    className={fieldEditor}
                  />
                </label>
                <label className="block">
                  <span className={labelEditor}>ของแถม (สินค้า)</span>
                  <select
                    value={giftDraft.giftProductId}
                    onChange={(e) => setGiftDraft((d) => (d ? { ...d, giftProductId: e.target.value } : null))}
                    className={fieldEditor}
                  >
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>จำนวนของแถม</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={giftDraft.giftQty}
                    onChange={(e) =>
                      setGiftDraft((d) =>
                        d ? { ...d, giftQty: Math.max(1, Math.floor(Number(e.target.value) || 1)) } : null,
                      )
                    }
                    className={fieldEditor}
                  />
                </label>
                <p className="rounded-lg border border-amber-200/60 bg-amber-50/90 px-2.5 py-2 text-[10px] text-amber-950">
                  ของแถมควรเป็นสินค้านับชิ้น — ราคา 0 ในตะกร้า
                </p>
                <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={closePromoModal} className={btnGhost}>
                    ยกเลิก
                  </button>
                  <button type="button" onClick={saveGiftDraft} className={btnViolet}>
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {promoModal?.kind === 'percent' && percentDraft ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-[1px]"
            onClick={closePromoModal}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-modal-pct-title"
              className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl ring-1 ring-slate-200/60 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <h2 id="promo-modal-pct-title" className="text-sm font-bold text-slate-900">
                  {promoModal.id ? 'แก้ไขโปรลด %' : 'เพิ่มโปรลด %'}
                </h2>
                <button
                  type="button"
                  onClick={closePromoModal}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="block">
                  <span className={labelEditor}>รหัส (id)</span>
                  <input readOnly value={percentDraft.id} className={fieldEditorReadonly} />
                </label>
                <label className="block">
                  <span className={labelEditor}>ชื่อโปร</span>
                  <input
                    value={percentDraft.name}
                    onChange={(e) => setPercentDraft((d) => (d ? { ...d, name: e.target.value } : null))}
                    className={fieldEditor}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-slate-300 text-teal-600"
                    checked={percentDraft.enabled}
                    onChange={(e) => setPercentDraft((d) => (d ? { ...d, enabled: e.target.checked } : null))}
                  />
                  เปิดใช้งาน
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelEditor}>เริ่ม</span>
                    <input
                      type="date"
                      value={percentDraft.startDate}
                      onChange={(e) => setPercentDraft((d) => (d ? { ...d, startDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                  <label className="block">
                    <span className={labelEditor}>สิ้นสุด</span>
                    <input
                      type="date"
                      value={percentDraft.endDate}
                      onChange={(e) => setPercentDraft((d) => (d ? { ...d, endDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelEditor}>สินค้า</span>
                  <select
                    value={percentDraft.productId}
                    onChange={(e) => {
                      const productId = e.target.value
                      const cfg = getPosSellConfig(productId)
                      const u = cfg.units[0]?.index ?? 0
                      setPercentDraft((d) => (d ? { ...d, productId, unitIndex: u } : null))
                    }}
                    className={fieldEditor}
                  >
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>หน่วยที่ให้ลด</span>
                  <select
                    value={percentDraft.unitIndex}
                    onChange={(e) =>
                      setPercentDraft((d) => (d ? { ...d, unitIndex: Number(e.target.value) } : null))
                    }
                    className={fieldEditor}
                  >
                    {getPosSellConfig(percentDraft.productId).units.map((u) => (
                      <option key={u.index} value={u.index}>
                        {u.label} (ลำดับที่ {u.index + 1})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>ลด % (1–100)</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={percentDraft.percentOff}
                    onChange={(e) =>
                      setPercentDraft((d) =>
                        d
                          ? {
                              ...d,
                              percentOff: Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1))),
                            }
                          : null,
                      )
                    }
                    className={fieldEditor}
                  />
                </label>
                <p className="rounded-lg border border-teal-200/60 bg-teal-50/90 px-2.5 py-2 text-[10px] text-teal-950">
                  โปรซ้ำสินค้า+หน่วย POS จะแจ้งเตือนและไม่ลดราคา
                </p>
                <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={closePromoModal} className={btnGhost}>
                    ยกเลิก
                  </button>
                  <button type="button" onClick={savePercentDraft} className={btnTeal}>
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {promoModal?.kind === 'second' && secondDraft ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-[1px]"
            onClick={closePromoModal}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-modal-2nd-title"
              className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl ring-1 ring-slate-200/60 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <h2 id="promo-modal-2nd-title" className="text-sm font-bold text-slate-900">
                  {promoModal.id ? 'แก้ไขโปรชิ้นถัดไปถูกลง' : 'เพิ่มโปรชิ้นถัดไปถูกลง'}
                </h2>
                <button
                  type="button"
                  onClick={closePromoModal}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100"
                  aria-label="ปิด"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="block">
                  <span className={labelEditor}>รหัส (id)</span>
                  <input readOnly value={secondDraft.id} className={fieldEditorReadonly} />
                </label>
                <label className="block">
                  <span className={labelEditor}>ชื่อโปร</span>
                  <input
                    value={secondDraft.name}
                    onChange={(e) => setSecondDraft((d) => (d ? { ...d, name: e.target.value } : null))}
                    className={fieldEditor}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-slate-300 text-amber-600"
                    checked={secondDraft.enabled}
                    onChange={(e) => setSecondDraft((d) => (d ? { ...d, enabled: e.target.checked } : null))}
                  />
                  เปิดใช้งาน
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelEditor}>เริ่ม</span>
                    <input
                      type="date"
                      value={secondDraft.startDate}
                      onChange={(e) => setSecondDraft((d) => (d ? { ...d, startDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                  <label className="block">
                    <span className={labelEditor}>สิ้นสุด</span>
                    <input
                      type="date"
                      value={secondDraft.endDate}
                      onChange={(e) => setSecondDraft((d) => (d ? { ...d, endDate: e.target.value } : null))}
                      className={fieldEditor}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelEditor}>สินค้า</span>
                  <select
                    value={secondDraft.productId}
                    onChange={(e) => {
                      const productId = e.target.value
                      const cfg = getPosSellConfig(productId)
                      const u = cfg.units[0]?.index ?? 0
                      setSecondDraft((d) => (d ? { ...d, productId, unitIndex: u } : null))
                    }}
                    className={fieldEditor}
                  >
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>หน่วยที่ใช้โปร</span>
                  <select
                    value={secondDraft.unitIndex}
                    onChange={(e) =>
                      setSecondDraft((d) => (d ? { ...d, unitIndex: Number(e.target.value) } : null))
                    }
                    className={fieldEditor}
                  >
                    {getPosSellConfig(secondDraft.productId).units.map((u) => (
                      <option key={u.index} value={u.index}>
                        {u.label} (ลำดับที่ {u.index + 1})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelEditor}>ชิ้นแรกกี่ชิ้นเต็มราคา (ขั้นต่ำ 1)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={secondDraft.fullPricePieces}
                    onChange={(e) =>
                      setSecondDraft((d) =>
                        d
                          ? { ...d, fullPricePieces: Math.max(1, Math.floor(Number(e.target.value) || 1)) }
                          : null,
                      )
                    }
                    className={fieldEditor}
                  />
                </label>
                <label className="block">
                  <span className={labelEditor}>ลด % ชิ้นที่เกิน (1–100)</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={secondDraft.percentOffAdditional}
                    onChange={(e) =>
                      setSecondDraft((d) =>
                        d
                          ? {
                              ...d,
                              percentOffAdditional: Math.min(
                                100,
                                Math.max(1, Math.floor(Number(e.target.value) || 1)),
                              ),
                            }
                          : null,
                      )
                    }
                    className={fieldEditor}
                  />
                </label>
                <p className="rounded-lg border border-amber-200/60 bg-amber-50/90 px-2.5 py-2 text-[10px] text-amber-950">
                  โปรซ้ำสินค้า+หน่วย POS จะแจ้งเตือนและข้ามโปรนี้
                </p>
                <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={closePromoModal} className={btnGhost}>
                    ยกเลิก
                  </button>
                  <button type="button" onClick={saveSecondDraft} className={btnAmber}>
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}
