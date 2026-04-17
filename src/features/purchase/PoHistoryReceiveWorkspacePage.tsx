import { getStoredBranch } from '@/features/auth/authSession'
import { BRANCHES, type BranchId } from '@/features/auth/branches'
import { getSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import { supplierPayDueDate, toIsoDateOnly } from '@/features/finance/data/supplierPaymentDueDate'
import {
  applyMovingAverageCost,
  getOnHandQtyBeforeReceive,
} from '@/features/purchase/data/poMovingAverage'
import {
  loadPurchaseOrders,
  PURCHASE_ORDERS_CHANGED_EVENT,
  upsertPurchaseOrder,
  deletePurchaseOrder,
} from '@/features/purchase/data/poStore'
import { mergeLinePatchForOrdered, mergeReceivedQtyTotal } from '@/features/purchase/data/poLineEdit'
import type { PurchaseOrder, PurchaseOrderLine, PoReceiveLine } from '@/features/purchase/data/poTypes'
import { applySignedReceiveQtyToBranchStock, receiveQtyToBranchStock } from '@/features/purchase/data/poStockReceive'
import { printPurchaseOrder } from '@/features/purchase/utils/printPurchaseOrder'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import { clsx } from 'clsx'
import { Ban, ClipboardList, Eye, Plus, Printer, RotateCcw, Trash2, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type PoHistoryReceiveWorkspacePageProps = {
  className?: string
}

function lineBackorder(l: PurchaseOrderLine): number {
  return Math.max(0, l.orderedQty - l.receivedQtyTotal)
}

function displayPoStatus(po: PurchaseOrder): string {
  if (po.status === 'closed') return 'ปิดแล้ว'
  if (po.status === 'draft') return 'ร่าง'
  const allReceived = po.lines.length > 0 && po.lines.every((l) => lineBackorder(l) <= 0)
  if (allReceived) return 'รับครบ'
  const partial = po.receiveBatches.length > 0 || po.lines.some((l) => l.receivedQtyTotal > 0)
  return partial ? 'ค้างรับ (บางส่วน)' : 'รอรับ'
}

function parseLocalNoonFromInput(dateStr: string): Date {
  const part = (dateStr.split('T')[0] ?? dateStr).trim()
  const [ys, ms, ds] = part.split('-')
  const y = Number.parseInt(ys ?? '', 10)
  const m = Number.parseInt(ms ?? '', 10)
  const d = Number.parseInt(ds ?? '', 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date()
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function PoHistoryReceiveWorkspacePage({ className }: PoHistoryReceiveWorkspacePageProps) {
  const branch = getStoredBranch()
  const branchId = branch?.id ?? BRANCHES[0].id

  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveDraft, setReceiveDraft] = useState<Record<string, { qty: string; cost: string }>>({})
  const [receiveDate, setReceiveDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  /** หลายเลขที่ใบกำกับ — บันทึกรวมเป็น refNos คั่นด้วยลูกน้ำ */
  const [refNoRows, setRefNoRows] = useState<string[]>([''])
  const [shippingCost, setShippingCost] = useState(0)
  const [receiveBranchId, setReceiveBranchId] = useState<BranchId>(branchId)

  const [viewOpen, setViewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const refresh = useCallback(() => setOrders(loadPurchaseOrders()), [])

  const patchPoLine = (
    lineId: string,
    patch: Partial<Pick<PurchaseOrderLine, 'orderedQty' | 'unitCostOrder'>>,
  ) => {
    if (!selected || (selected.status !== 'ordered' && selected.status !== 'closed')) return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    const result = mergeLinePatchForOrdered(line, patch)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    upsertPurchaseOrder({
      ...selected,
      lines: selected.lines.map((l) => (l.lineId === lineId ? result.line : l)),
    })
    refresh()
  }

  const patchReceivedTotal = (lineId: string, raw: number) => {
    if (!selected || (selected.status !== 'ordered' && selected.status !== 'closed')) return
    const line = selected.lines.find((l) => l.lineId === lineId)
    if (!line) return
    const result = mergeReceivedQtyTotal(line, raw)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    if (Math.abs(result.delta) < 1e-9) return
    const cat = getPosCatalogProducts()
    const p = cat.find((x) => x.id === line.productId)
    if (!p) {
      window.alert('ไม่พบสินค้าในแคตตาล็อก')
      return
    }
    try {
      applySignedReceiveQtyToBranchStock(line.productId, result.delta)
      if (result.delta > 0) {
        applyMovingAverageCost(line.productId, result.delta, line.unitCostOrder, p)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'ปรับสต็อกไม่สำเร็จ')
      return
    }
    const nextLines = selected.lines.map((l) => (l.lineId === lineId ? result.line : l))
    const afterAllReceived = nextLines.every((l) => l.receivedQtyTotal + 1e-9 >= l.orderedQty)
    upsertPurchaseOrder({
      ...selected,
      lines: nextLines,
      ...(!afterAllReceived ? { status: 'ordered' as const, closedAt: undefined } : {}),
    })
    refresh()
  }

  useEffect(() => {
    const on = () => refresh()
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, on)
  }, [refresh])

  const historyOrders = useMemo(() => {
    return orders
      .filter((o) => o.branchId === branchId && o.status !== 'draft')
      .sort((a, b) => {
        const ta = new Date(a.orderedAt ?? a.createdAt).getTime()
        const tb = new Date(b.orderedAt ?? b.createdAt).getTime()
        return tb - ta
      })
  }, [orders, branchId])

  const selected = useMemo(
    () => historyOrders.find((o) => o.id === selectedId) ?? null,
    [historyOrders, selectedId],
  )

  const openReceive = () => {
    if (!selected || selected.status !== 'ordered') return
    const draft: Record<string, { qty: string; cost: string }> = {}
    for (const l of selected.lines) {
      const remain = lineBackorder(l)
      if (remain > 0) {
        draft[l.lineId] = {
          qty: String(remain),
          cost: String(l.unitCostOrder),
        }
      }
    }
    setReceiveDraft(draft)
    setRefNoRows([''])
    setShippingCost(0)
    setReceiveBranchId(branchId)
    const d = new Date()
    setReceiveDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    )
    setReceiveOpen(true)
  }

  const submitReceive = () => {
    if (!selected || selected.status !== 'ordered') return
    const cat = getPosCatalogProducts()
    const lines: PoReceiveLine[] = []
    for (const l of selected.lines) {
      const d = receiveDraft[l.lineId]
      if (!d) continue
      const qty = Number.parseFloat(d.qty.replace(/,/g, '')) || 0
      const unitCost = Number.parseFloat(d.cost.replace(/,/g, '')) || 0
      if (qty <= 0) continue
      const remain = lineBackorder(l)
      if (qty > remain + 1e-6) {
        window.alert(`จำนวนรับเกินค้างรับสำหรับ ${l.sku}`)
        return
      }
      lines.push({ lineId: l.lineId, qty, unitCost })
    }
    if (!lines.length) {
      const hasPending = selected.lines.some((ln) => lineBackorder(ln) > 0)
      if (hasPending) {
        window.alert('กรอกจำนวนที่รับจริงอย่างน้อย 1 แถว')
        return
      }
      setReceiveOpen(false)
      return
    }

    const nextLines = selected.lines.map((l) => {
      const hit = lines.find((x) => x.lineId === l.lineId)
      if (!hit) return l
      return { ...l, receivedQtyTotal: l.receivedQtyTotal + hit.qty }
    })

    const byProduct = new Map<string, { qty: number; value: number }>()
    for (const hit of lines) {
      const row = selected.lines.find((x) => x.lineId === hit.lineId)
      if (!row) continue
      const cur = byProduct.get(row.productId) ?? { qty: 0, value: 0 }
      byProduct.set(row.productId, {
        qty: cur.qty + hit.qty,
        value: cur.value + hit.qty * hit.unitCost,
      })
    }

    try {
      for (const [productId, agg] of byProduct) {
        const p = cat.find((x) => x.id === productId)
        if (!p) throw new Error(`ไม่พบสินค้าในแคตตาล็อก: ${productId}`)
        const unitAvg = agg.qty > 0 ? agg.value / agg.qty : 0
        applyMovingAverageCost(productId, agg.qty, unitAvg, p)
        receiveQtyToBranchStock(productId, agg.qty)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'รับสินค้าไม่สำเร็จ')
      return
    }

    const refJoined = refNoRows
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(', ')

    const receiveAt = parseLocalNoonFromInput(receiveDate).toISOString()
    const batch = {
      id: `rcv-${Date.now()}`,
      at: receiveAt,
      lines,
      refNos: refJoined || undefined,
      shippingCostBaht: shippingCost > 0 ? Math.round(shippingCost * 100) / 100 : undefined,
      receiveBranchId,
    }

    const allReceived = nextLines.every((l) => l.receivedQtyTotal >= l.orderedQty)

    const nextPo: PurchaseOrder = {
      ...selected,
      lines: nextLines,
      receiveBatches: [...selected.receiveBatches, batch],
      ...(allReceived ? { status: 'closed' as const, closedAt: new Date().toISOString() } : {}),
    }
    upsertPurchaseOrder(nextPo)
    refresh()
    setReceiveOpen(false)

    let msg = 'รับสินค้าแล้ว — สต็อกและต้นทุนเฉลี่ยอัปเดตแล้ว'
    if (selected.paymentMode === 'payable') {
      const anchor = parseLocalNoonFromInput(receiveDate)
      const terms = getSupplierCreditTerms(selected.supplierId)
      const due = supplierPayDueDate(anchor, terms)
      msg += `\nเครดิต — กำหนดจ่ายโดยประมาณ: ${due.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} (${toIsoDateOnly(due)})`
    } else if (selected.paymentMode === 'paid_cash' || selected.paymentMode === 'paid_transfer') {
      msg += '\nชำระเงินสด/โอน — บันทึกชำระได้ที่หน้าใบสั่งซื้อเดิม'
    }
    window.alert(msg)
  }

  const reopenPo = () => {
    if (!selected || selected.status !== 'closed') return
    if (
      !window.confirm(
        'เปิด PO กลับเป็น «รอรับ/ค้างรับ» (Ordered)?\n\n' +
          '• จะรับของเพิ่มหรือแก้ข้อมูลที่เกี่ยวข้องได้อีก\n' +
          '• ถ้าเคยบันทึกชำระ/เจ้าหนี้ไว้แล้ว ให้ตรวจสอบความสอดคล้องกับบัญชีเอง',
      )
    ) {
      return
    }
    const next: PurchaseOrder = { ...selected, status: 'ordered', closedAt: undefined }
    upsertPurchaseOrder(next)
    refresh()
    window.alert(`เปิด PO แล้ว — ${selected.poNo} กลับเป็นสถานะ Ordered`)
  }

  const executeCancelPO = () => {
    if (!selected || selected.status !== 'ordered') return
    if (selected.receiveBatches.length > 0 || selected.lines.some((l) => l.receivedQtyTotal > 0)) {
      window.alert('ไม่สามารถยกเลิกได้ — มีการรับของแล้ว')
      return
    }
    if (!window.confirm(`ยกเลิก PO ${selected.poNo}?`)) return
    deletePurchaseOrder(selected.id)
    refresh()
    setSelectedId(null)
    setCancelOpen(false)
  }

  const printPo = () => {
    if (!selected) return
    const shop = branch?.name ?? 'ร้าน'
    printPurchaseOrder(selected, shop)
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-amber-600" aria-hidden />
          <div>
            <h1 className="text-sm font-bold text-slate-900">ประวัติใบสั่งซื้อและรับของเข้า</h1>
            <p className="text-[11px] text-slate-500">
              สาขา {branch?.name ?? '—'} · แสดงเฉพาะ PO ที่ยืนยันแล้ว (Ordered/ปิด)
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:flex-row">
        <section className="flex min-h-0 w-full shrink-0 flex-col lg:max-w-md lg:pr-2">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">ประวัติ PO</h2>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-2 py-2">เลขที่</th>
                  <th className="px-2 py-2">ซัพพลาย</th>
                  <th className="px-2 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {historyOrders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400">
                      ยังไม่มีประวัติ PO — บันทึกจากตะกร้าสั่งซื้อก่อน
                    </td>
                  </tr>
                ) : (
                  historyOrders.map((o) => (
                    <tr
                      key={o.id}
                      className={clsx(
                        'cursor-pointer border-t border-slate-100 hover:bg-amber-50/60',
                        selectedId === o.id && 'bg-amber-50',
                      )}
                      onClick={() => setSelectedId(o.id)}
                    >
                      <td className="px-2 py-2 font-mono font-medium">{o.poNo}</td>
                      <td className="max-w-[8rem] truncate px-2 py-2">{o.supplierName}</td>
                      <td className="px-2 py-2 text-[10px] font-semibold text-slate-600">{displayPoStatus(o)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-h-0 min-w-0 flex-1 space-y-3">
          {!selected ? (
            <p className="text-sm text-slate-500">เลือก PO จากรายการด้านซ้าย</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold text-slate-900">{selected.poNo}</p>
                  <p className="text-xs text-slate-500">{displayPoStatus(selected)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setViewOpen(true)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold shadow-sm"
                  >
                    <Eye className="size-3.5" aria-hidden />
                    ดูเอกสาร
                  </button>
                  <button
                    type="button"
                    onClick={printPo}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold shadow-sm"
                  >
                    <Printer className="size-3.5" aria-hidden />
                    พิมพ์
                  </button>
                  {selected.status === 'ordered' && (
                    <>
                      <button
                        type="button"
                        onClick={openReceive}
                        className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-900"
                      >
                        <Truck className="size-3.5" aria-hidden />
                        ทำรายการรับของ
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelOpen(true)}
                        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800"
                      >
                        <Ban className="size-3.5" aria-hidden />
                        ยกเลิก PO
                      </button>
                    </>
                  )}
                  {selected.status === 'closed' && (
                    <button
                      type="button"
                      onClick={reopenPo}
                      className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-900"
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      เปิด PO กลับ
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <p className="font-semibold text-slate-700">รายการสินค้า</p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="py-1 text-left">SKU</th>
                        <th className="py-1 text-left">ชื่อ</th>
                        <th className="py-1 text-right">สั่ง</th>
                        <th className="py-1 text-right">ต้นทุน/หน่วย</th>
                        <th className="py-1 text-right">รับแล้ว</th>
                        <th className="py-1 text-right">ค้างรับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.map((l) => (
                        <tr key={l.lineId} className="border-t border-slate-100">
                          <td className="py-1 font-mono">{l.sku}</td>
                          <td className="max-w-[14rem] truncate py-1">{l.name}</td>
                          <td className="py-1 text-right">
                            {selected.status === 'ordered' || selected.status === 'closed' ? (
                              <input
                                type="number"
                                min={Math.max(1, l.receivedQtyTotal)}
                                step="any"
                                value={l.orderedQty}
                                onChange={(e) =>
                                  patchPoLine(l.lineId, { orderedQty: Number.parseFloat(e.target.value) || 0 })
                                }
                                className="w-16 rounded border border-slate-200 px-1 py-0.5 text-right text-xs tabular-nums"
                              />
                            ) : (
                              <span className="tabular-nums">{l.orderedQty}</span>
                            )}
                          </td>
                          <td className="py-1 text-right">
                            {selected.status === 'ordered' || selected.status === 'closed' ? (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={l.unitCostOrder}
                                onChange={(e) =>
                                  patchPoLine(l.lineId, {
                                    unitCostOrder: Math.max(0, Number.parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-20 rounded border border-slate-200 px-1 py-0.5 text-right text-xs tabular-nums"
                              />
                            ) : (
                              <span className="tabular-nums">
                                {l.unitCostOrder.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>
                          <td className="py-1 text-right">
                            {selected.status === 'ordered' || selected.status === 'closed' ? (
                              <input
                                type="number"
                                min={0}
                                max={l.orderedQty}
                                step="any"
                                value={l.receivedQtyTotal}
                                onChange={(e) =>
                                  patchReceivedTotal(l.lineId, Number.parseFloat(e.target.value) || 0)
                                }
                                className="w-16 rounded border border-slate-200 px-1 py-0.5 text-right text-xs tabular-nums"
                              />
                            ) : (
                              <span className="tabular-nums">{l.receivedQtyTotal}</span>
                            )}
                          </td>
                          <td className="py-1 text-right tabular-nums text-amber-700">{lineBackorder(l)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(selected.status === 'ordered' || selected.status === 'closed') && (
                  <div className="mt-2 space-y-1 text-[10px] text-amber-800">
                    <p>แก้จำนวนสั่ง/ต้นทุนได้หากใส่ผิด — จำนวนสั่งต้องไม่น้อยกว่าที่รับแล้ว</p>
                    <p className="text-slate-600">
                      แก้ «รับแล้ว» ได้เมื่อตรวจพลาด — ระบบปรับสต็อกตามผลต่าง; ถ้าลดจำนวนรับ ต้นทุนเฉลี่ยไม่คำนวณย้อนอัตโนมัติ
                    </p>
                  </div>
                )}
              </div>

              {selected.receiveBatches.length > 0 && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-xs">
                  <p className="font-semibold text-indigo-900">ประวัติการรับของ</p>
                  <ul className="mt-2 space-y-2">
                    {selected.receiveBatches.map((b) => (
                      <li key={b.id} className="rounded border border-indigo-100 bg-white/80 px-2 py-1.5">
                        <p className="font-mono text-[11px] text-slate-700">
                          {new Date(b.at).toLocaleString('th-TH')}
                          {b.refNos
                            ? ` · เลขอ้างอิง: ${b.refNos
                                .split(/[,，]/)
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .join(' · ')}`
                            : ''}
                          {b.shippingCostBaht != null && b.shippingCostBaht > 0
                            ? ` · ค่าขนส่ง ${b.shippingCostBaht.toLocaleString('th-TH')} บ.`
                            : ''}
                          {b.receiveBranchId
                            ? ` · เข้า ${BRANCHES.find((x) => x.id === b.receiveBranchId)?.name ?? b.receiveBranchId}`
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {receiveOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">รับสินค้า — {selected.poNo}</h3>
              <button type="button" onClick={() => setReceiveOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {selected.lines.some((ln) => lineBackorder(ln) > 0)
                ? 'กรอกจำนวนที่ได้รับจริงและต้นทุนตามบิล — ไม่เกินค้างรับ'
                : 'รับครบแล้ว — แก้จำนวนรับจริงได้ที่ช่อง «รับแล้ว» ในแต่ละแถวด้านล่าง (หรือในตารางด้านบน)'}
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="block text-[11px] font-medium text-slate-600">
                วันที่รับ
                <input
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-[11px] font-medium text-slate-600">
                ค่าขนส่ง (บาท)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-[11px] font-medium text-slate-600 sm:col-span-2">
                รับเข้าสาขา
                <select
                  value={receiveBranchId}
                  onChange={(e) => setReceiveBranchId(e.target.value as BranchId)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">เลขที่ใบกำกับ/อ้างอิง</span>
                  <button
                    type="button"
                    onClick={() => setRefNoRows((rows) => [...rows, ''])}
                    className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="size-3" aria-hidden />
                    เพิ่มเลขที่
                  </button>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">กรณีส่งมาหลายบิล — กรอกแยกทีละเลขที่</p>
                <div className="mt-1.5 space-y-1.5">
                  {refNoRows.map((row, i) => (
                    <div key={`ref-${i}`} className="flex gap-1.5">
                      <input
                        value={row}
                        onChange={(e) =>
                          setRefNoRows((rows) => rows.map((r, j) => (j === i ? e.target.value : r)))
                        }
                        placeholder={`เช่น INV-2026-${String(i + 1).padStart(3, '0')}`}
                        className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                      />
                      {refNoRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRefNoRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, j) => j !== i)))
                          }
                          className="shrink-0 rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          title="ลบแถวนี้"
                          aria-label="ลบแถวเลขที่ใบกำกับ"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selected.lines.map((l) => {
                const remain = lineBackorder(l)
                const pending = remain > 0
                return (
                  <div key={l.lineId} className="rounded border border-slate-100 p-2">
                    <p className="text-xs font-semibold text-slate-800">
                      {l.sku} — {l.name}
                    </p>
                    {pending ? (
                      <>
                        <p className="text-[10px] text-slate-500">
                          ค้างรับ {remain} · สต็อกก่อนรับ{' '}
                          {(() => {
                            const p = getPosCatalogProducts().find((x) => x.id === l.productId)
                            return p ? getOnHandQtyBeforeReceive(p) : '—'
                          })()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <label className="text-[11px]">
                            จำนวนรับ
                            <input
                              value={receiveDraft[l.lineId]?.qty ?? ''}
                              onChange={(e) =>
                                setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: '', cost: String(l.unitCostOrder) }
                                  return { ...d, [l.lineId]: { ...cur, qty: e.target.value } }
                                })
                              }
                              className="mt-0.5 block w-24 rounded border px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="text-[11px]">
                            ต้นทุน/หน่วย
                            <input
                              value={receiveDraft[l.lineId]?.cost ?? ''}
                              onChange={(e) =>
                                setReceiveDraft((d) => {
                                  const cur = d[l.lineId] ?? { qty: String(remain), cost: '' }
                                  return { ...d, [l.lineId]: { ...cur, cost: e.target.value } }
                                })
                              }
                              className="mt-0.5 block w-28 rounded border px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-500">
                          สั่ง {l.orderedQty} · รับแล้ว {l.receivedQtyTotal} · ค้างรับ 0
                        </p>
                        <label className="mt-2 block text-[11px] font-medium text-slate-700">
                          รับแล้ว (แก้ไขเมื่อตรวจพลาด)
                          <input
                            type="number"
                            min={0}
                            max={l.orderedQty}
                            step="any"
                            value={l.receivedQtyTotal}
                            onChange={(e) =>
                              patchReceivedTotal(l.lineId, Number.parseFloat(e.target.value) || 0)
                            }
                            className="mt-0.5 block w-28 rounded border border-slate-200 px-2 py-1 text-sm tabular-nums"
                          />
                        </label>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReceiveOpen(false)} className="rounded border border-slate-200 px-3 py-2 text-sm">
                ยกเลิก
              </button>
              <button type="button" onClick={submitReceive} className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                ยืนยันรับสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {viewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900">ใบสั่งซื้อ {selected.poNo}</h3>
              <button type="button" onClick={() => setViewOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">ซัพพลายเออร์: {selected.supplierName}</p>
            <p className="text-sm text-slate-600">
              วันที่: {new Date(selected.orderedAt ?? selected.createdAt).toLocaleString('th-TH')}
            </p>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2">SKU</th>
                  <th className="py-2">รายการ</th>
                  <th className="py-2 text-right">จำนวน</th>
                  <th className="py-2 text-right">ต้นทุน</th>
                  <th className="py-2 text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                {selected.lines.map((l) => (
                  <tr key={l.lineId} className="border-b border-slate-100">
                    <td className="py-2 font-mono text-xs">{l.sku}</td>
                    <td className="py-2">{l.name}</td>
                    <td className="py-2 text-right tabular-nums">{l.orderedQty}</td>
                    <td className="py-2 text-right tabular-nums">{l.unitCostOrder.toLocaleString('th-TH')}</td>
                    <td className="py-2 text-right tabular-nums">
                      {(l.orderedQty * l.unitCostOrder).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setViewOpen(false)} className="rounded border border-slate-200 px-4 py-2 text-sm">
                ปิด
              </button>
              <button
                type="button"
                onClick={() => {
                  printPo()
                }}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">ยกเลิก PO {selected.poNo}?</h3>
            <p className="mt-2 text-sm text-slate-600">ใช้ได้เมื่อยังไม่มีการรับของ — ระบบจะลบเอกสารออกจากประวัติ</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCancelOpen(false)} className="rounded border border-slate-200 px-3 py-2 text-sm">
                ไม่
              </button>
              <button type="button" onClick={executeCancelPO} className="rounded bg-rose-600 px-3 py-2 text-sm font-semibold text-white">
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
