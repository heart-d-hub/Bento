import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { CheckCircle2, MapPin, Printer, Tag } from 'lucide-react'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  appendLabelPrintQueue,
  type LabelPrintQueueItem,
} from '@/features/inventory/data/labelPrintQueueStore'
import {
  getProductMasterBySku,
  saveProductMasterList,
  getProductMasterList,
  productStorageLocations,
} from '@/features/inventory/data/productMasterData'
import {
  loadCategoryTree,
  resolveLabelTemplateIdForProduct,
} from '@/features/inventory/data/inventoryCategories'
import {
  isTaskFullyDone,
  upsertPostReceiveTask,
  type PostReceiveSku,
  type PostReceiveTask,
} from '@/features/purchase/data/postReceiveTaskStore'
import { loadPostReceiveSettings } from '@/features/purchase/data/postReceiveSettings'

type PostReceiveWorklistModalProps = {
  task: PostReceiveTask
  onClose: () => void
}

export function PostReceiveWorklistModal({ task, onClose }: PostReceiveWorklistModalProps) {
  const [draft, setDraft] = useState<PostReceiveTask>(task)
  const { openTab } = useWorkspaceTabs()

  const persist = (next: PostReceiveTask) => {
    setDraft(next)
    const fullyDone = isTaskFullyDone(next)
    const stamped = fullyDone
      ? { ...next, completedAt: next.completedAt ?? new Date().toISOString() }
      : { ...next, completedAt: undefined }
    upsertPostReceiveTask(stamped)
    setDraft(stamped)
  }

  const updateSku = (sku: string, patch: Partial<PostReceiveSku>) => {
    const next: PostReceiveTask = {
      ...draft,
      skus: draft.skus.map((s) => (s.sku === sku ? { ...s, ...patch } : s)),
    }
    persist(next)
  }

  const counts = useMemo(() => {
    const total = draft.skus.length
    return {
      total,
      labels: draft.skus.filter((s) => s.labelQueued).length,
      stored: draft.skus.filter((s) => s.storedAway).length,
      priced: draft.skus.filter((s) => s.priceReviewed).length,
    }
  }, [draft])

  const sendAllToLabelQueue = () => {
    const tree = loadCategoryTree()
    let sent = 0
    for (const s of draft.skus) {
      if (s.labelQueued) continue
      const master = getProductMasterBySku(s.sku)
      if (!master) continue
      const item: Omit<LabelPrintQueueItem, 'id'> = {
        name: master.name,
        barcode: master.boxBarcode || master.sku,
        sku: master.sku,
        oemNo: (master.oemTags ?? [])[0],
        factoryNo: master.factoryNo,
        price: master.sellPrice,
        qty: Math.max(1, Math.floor(s.qty)),
        template: 'medium',
        labelTemplateId: resolveLabelTemplateIdForProduct(master, tree),
      }
      appendLabelPrintQueue(item)
      sent++
    }
    persist({
      ...draft,
      skus: draft.skus.map((s) => (s.labelQueued ? s : { ...s, labelQueued: true })),
    })
    if (sent > 0) {
      const go = window.confirm(`ส่งเข้าคิวพิมพ์แล้ว ${sent} รายการ\n\nไปที่หน้า «พิมพ์ป้าย» เลยไหม?`)
      if (go) {
        openTab('label-print', 'พิมพ์ป้ายสินค้า')
        onClose()
      }
    }
  }

  const commitNewLocation = (sku: string) => {
    const row = draft.skus.find((s) => s.sku === sku)
    if (!row?.newLocation) return
    const newLoc = row.newLocation.trim()
    if (!newLoc) return
    const list = getProductMasterList()
    const next = list.map((p) => {
      if (p.sku.trim().toLowerCase() !== sku.trim().toLowerCase()) return p
      const existing = productStorageLocations(p)
      if (existing.includes(newLoc)) return { ...p, storageLocations: [newLoc, ...existing.filter((l) => l !== newLoc)] }
      return { ...p, storageLocations: [newLoc, ...existing] }
    })
    saveProductMasterList(next, { notify: true })
    updateSku(sku, { storedAway: true, currentLocation: newLoc })
  }

  const commitNewSellPrice = (sku: string) => {
    const row = draft.skus.find((s) => s.sku === sku)
    if (!row?.newSellPrice || row.newSellPrice <= 0) return
    const list = getProductMasterList()
    const next = list.map((p) =>
      p.sku.trim().toLowerCase() === sku.trim().toLowerCase()
        ? { ...p, sellPrice: row.newSellPrice! }
        : p,
    )
    saveProductMasterList(next, { notify: true })
    updateSku(sku, { priceReviewed: true })
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">หลังรับของ — {draft.poNo}</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {draft.supplierName} · {draft.skus.length} SKU · รับเข้า{' '}
              {new Date(draft.receivedAt).toLocaleString('th-TH', { hour12: false })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className={clsx('rounded-full px-2 py-0.5', counts.labels === counts.total ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                ป้าย {counts.labels}/{counts.total}
              </span>
              <span className={clsx('rounded-full px-2 py-0.5', counts.stored === counts.total ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                จัดเก็บ {counts.stored}/{counts.total}
              </span>
              <span className={clsx('rounded-full px-2 py-0.5', counts.priced === counts.total ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                ราคา {counts.priced}/{counts.total}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            ภายหลัง
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1 — Label print (driven by post-receive settings rule) */}
          {(() => {
            const rule = loadPostReceiveSettings().autoLabelRule
            const needsLabel = draft.skus.filter((s) => !s.labelQueued)
            const autoSkipped =
              rule === 'skipIfBoxBarcode'
                ? draft.skus.filter((s) => {
                    const m = getProductMasterBySku(s.sku)
                    return !!m?.boxBarcode?.trim() && s.labelQueued
                  })
                : []
            const ruleLabel =
              rule === 'always'
                ? 'พิมพ์ทุก SKU'
                : rule === 'manual'
                  ? 'ผู้ใช้เลือกเอง'
                  : 'ข้ามถ้ามีบาร์โค้ด'
            return (
              <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-violet-900">
                    <Printer className="size-4" /> 1. พิมพ์ป้ายราคา
                  </h3>
                  <button
                    type="button"
                    onClick={sendAllToLabelQueue}
                    disabled={needsLabel.length === 0}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ส่งเข้าคิว · {needsLabel.length} SKU
                  </button>
                </div>
                {needsLabel.length > 0 ? (
                  <ul className="mb-2 divide-y divide-violet-100 rounded-lg border border-violet-200 bg-white text-[11px]">
                    {needsLabel.map((s) => (
                      <li key={s.sku} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                        <span className="truncate">
                          <span className="font-mono font-semibold text-slate-700">{s.sku}</span>{' '}
                          <span className="text-slate-600">{s.name}</span>
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-500">×{s.qty}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-[11px] text-emerald-700">
                    ✓ ไม่มีรายการที่ต้องพิมพ์ป้าย
                  </p>
                )}
                {autoSkipped.length > 0 ? (
                  <p className="text-[11px] text-violet-800/80">
                    ข้าม {autoSkipped.length} รายการที่มีบาร์โค้ดบนสินค้าอยู่แล้ว — ไม่ต้องพิมพ์
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-slate-500">
                  กฎปัจจุบัน: <strong>{ruleLabel}</strong> — เปลี่ยนได้ที่ ตั้งค่า → ซื้อ/รับของ
                </p>
              </section>
            )
          })()}

          {/* Section 2 — Putaway */}
          <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-sky-900">
              <MapPin className="size-4" /> 2. จัดเก็บ (putaway)
            </h3>
            <ul className="divide-y divide-sky-100 rounded-lg border border-sky-200 bg-white">
              {draft.skus.map((s) => {
                const noLoc = !s.currentLocation
                return (
                  <li key={s.sku} className={clsx('flex flex-wrap items-center gap-x-3 gap-y-1.5 p-2 text-xs', noLoc && !s.storedAway && 'bg-amber-50/60')}>
                    <input
                      type="checkbox"
                      checked={s.storedAway}
                      onChange={(e) => updateSku(s.sku, { storedAway: e.target.checked })}
                      className="size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-mono font-semibold text-slate-700">{s.sku}</span>{' '}
                        <span className="text-slate-600">{s.name}</span>{' '}
                        <span className="text-[10px] text-slate-400">×{s.qty}</span>
                      </p>
                      {s.currentLocation ? (
                        <p className="text-[11px] text-slate-500">ที่เก็บ: <span className="font-mono">{s.currentLocation}</span></p>
                      ) : (
                        <p className="text-[11px] font-semibold text-amber-700">ยังไม่มีที่เก็บ — กรุณาตั้ง</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="text"
                        placeholder={s.currentLocation ?? 'ตั้งที่เก็บ (เช่น A-3-15)'}
                        value={s.newLocation ?? ''}
                        onChange={(e) => updateSku(s.sku, { newLocation: e.target.value })}
                        className="w-32 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => commitNewLocation(s.sku)}
                        disabled={!s.newLocation?.trim()}
                        className="rounded bg-sky-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        เก็บ
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Section 3 — Price review */}
          <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-900">
              <Tag className="size-4" /> 3. ทบทวนราคาขาย
            </h3>
            <ul className="divide-y divide-emerald-100 rounded-lg border border-emerald-200 bg-white">
              {draft.skus.map((s) => {
                const sell = s.sellPriceAtReceive
                const margin = sell > 0 ? ((sell - s.unitCost) / sell) * 100 : 0
                const lowMargin = sell > 0 && margin < 15
                const noPrice = sell <= 0
                return (
                  <li key={s.sku} className={clsx('flex flex-wrap items-center gap-x-3 gap-y-1.5 p-2 text-xs', (lowMargin || noPrice) && !s.priceReviewed && 'bg-rose-50/60')}>
                    <input
                      type="checkbox"
                      checked={s.priceReviewed}
                      onChange={(e) => updateSku(s.sku, { priceReviewed: e.target.checked })}
                      className="size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-mono font-semibold text-slate-700">{s.sku}</span>{' '}
                        <span className="text-slate-600">{s.name}</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        ทุนใหม่ <strong>฿{s.unitCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                        {' · '}ขายเดิม{' '}
                        {sell > 0 ? (
                          <strong>฿{sell.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                        ) : (
                          <span className="font-semibold text-rose-700">ยังไม่ตั้งราคา</span>
                        )}
                        {sell > 0 ? (
                          <span className={clsx('ml-2 font-semibold', lowMargin ? 'text-rose-700' : 'text-emerald-700')}>
                            {' '}กำไร {margin.toFixed(0)}%
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder={sell > 0 ? String(sell) : 'ตั้งราคาขาย'}
                        value={s.newSellPrice ?? ''}
                        onChange={(e) => updateSku(s.sku, { newSellPrice: Number(e.target.value) || undefined })}
                        className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => commitNewSellPrice(s.sku)}
                        disabled={!s.newSellPrice || s.newSellPrice <= 0}
                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ตั้ง
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 p-3">
          <div className="text-[11px] text-slate-600">
            {isTaskFullyDone(draft) ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" /> ครบทุกขั้นแล้ว
              </span>
            ) : (
              <span>เสร็จแล้วจะปิดเอง · กด «ภายหลัง» เพื่อกลับมาทำต่อ</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}
