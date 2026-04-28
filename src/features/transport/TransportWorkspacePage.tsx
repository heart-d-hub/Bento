import { TransportCompanyModal } from '@/features/transport/components/TransportCompanyModal'
import {
  deleteTransportCompany,
  loadTransportDirectory,
  TRANSPORT_DIRECTORY_CHANGED_EVENT,
  type TransportCompany,
} from '@/features/transport/data/transportDirectoryStore'
import {
  getTransportStats,
  TRANSPORT_SHIPMENT_LOG_CHANGED,
} from '@/features/transport/data/transportShipmentLogStore'
import { clsx } from 'clsx'
import { AlertTriangle, Clock, ExternalLink, MessageCircle, Pencil, Phone, Plus, Search, Trash2, Truck, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type TransportWorkspacePageProps = {
  className?: string
}

export function TransportWorkspacePage({ className }: TransportWorkspacePageProps) {
  const [rows, setRows] = useState<TransportCompany[]>(() => loadTransportDirectory())
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    item: TransportCompany | null
  }>({ open: false, mode: 'create', item: null })

  const [, setStatsRefresh] = useState(0)

  const refresh = useCallback(() => setRows(loadTransportDirectory()), [])

  useEffect(() => {
    window.addEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, refresh)
  }, [refresh])

  useEffect(() => {
    const handler = () => setStatsRefresh((n) => n + 1)
    window.addEventListener(TRANSPORT_SHIPMENT_LOG_CHANGED, handler)
    return () => window.removeEventListener(TRANSPORT_SHIPMENT_LOG_CHANGED, handler)
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((c) =>
      [c.name, c.phone ?? '', c.contactName ?? '', c.lineId ?? '', c.notes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [rows, q])

  const confirmDelete = (c: TransportCompany) => {
    if (!window.confirm(`ลบบริษัทขนส่ง «${c.name}»?`)) return
    deleteTransportCompany(c.id)
    refresh()
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Truck className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">รายชื่อบริษัทขนส่ง</h1>
              <p className="text-xs text-slate-400">{rows.length} บริษัท</p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:min-w-[320px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาชื่อ, เบอร์โทร..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <button
              type="button"
              onClick={() => setModal({ open: true, mode: 'create', item: null })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              <Plus className="size-4" aria-hidden />
              เพิ่มบริษัทขนส่ง
            </button>
          </div>
        </div>
      </header>

      {/* Column labels */}
      {filtered.length > 0 && (
        <div className="grid shrink-0 border-b border-slate-100 bg-slate-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          style={{ gridTemplateColumns: '1fr 140px 140px 140px 1fr auto' }}>
          <span>บริษัทขนส่ง</span>
          <span>เบอร์โทร</span>
          <span>ผู้ติดต่อ</span>
          <span>LINE ID</span>
          <span>ติดตามพัสดุ / หมายเหตุ</span>
          <span className="w-16 text-center">จัดการ</span>
        </div>
      )}

      {/* List */}
      <div className="min-h-0 flex-1 overflow-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-300">
              <Truck className="size-8" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-slate-500">
                {rows.length === 0 ? 'ยังไม่มีบริษัทขนส่ง' : 'ไม่พบรายการ'}
              </p>
              {rows.length === 0 && (
                <p className="mt-1 text-sm text-slate-400">กด «เพิ่มบริษัทขนส่ง» เพื่อเริ่มต้น</p>
              )}
            </div>
            {rows.length === 0 && (
              <button
                type="button"
                onClick={() => setModal({ open: true, mode: 'create', item: null })}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="size-4" />
                เพิ่มบริษัทขนส่ง
              </button>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="group grid items-center gap-4 px-5 py-3.5 hover:bg-sky-50/40 transition-colors"
              style={{ gridTemplateColumns: '1fr 140px 140px 140px 1fr auto' }}
            >
              {/* Name + speed + cost + live stats */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-500">
                  <Truck className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {/* Manual config chips */}
                    {(c.minDays != null || c.maxDays != null) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-600">
                        <Clock className="size-3" aria-hidden />
                        {c.minDays != null && c.maxDays != null
                          ? `${c.minDays}–${c.maxDays} วัน`
                          : c.minDays != null
                            ? `≥${c.minDays} วัน`
                            : `≤${c.maxDays} วัน`}
                      </span>
                    )}
                    {c.costRating && (
                      <span className="text-[11px] font-bold tracking-tight">
                        <span className="text-amber-400">{'฿'.repeat(c.costRating)}</span>
                        <span className="text-slate-200">{'฿'.repeat(5 - c.costRating)}</span>
                      </span>
                    )}
                    {/* Live stats from shipment logs */}
                    {(() => {
                      const st = getTransportStats(c.id)
                      if (st.shipmentCount === 0) return null
                      const dmg = [
                        st.damageRatePct.small != null ? `เล็ก ${st.damageRatePct.small}%` : null,
                        st.damageRatePct.normal != null ? `กลาง ${st.damageRatePct.normal}%` : null,
                        st.damageRatePct.large != null ? `ใหญ่ ${st.damageRatePct.large}%` : null,
                      ].filter(Boolean).join(' · ')
                      const hasDmg = dmg.length > 0
                      const maxDmg = Math.max(
                        st.damageRatePct.small ?? 0,
                        st.damageRatePct.normal ?? 0,
                        st.damageRatePct.large ?? 0,
                      )
                      return (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {st.shipmentCount} ครั้ง
                            {st.avgTransitDays != null && ` · ~${st.avgTransitDays} วัน`}
                          </span>
                          {hasDmg && (
                            <span className={clsx(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                              maxDmg > 5
                                ? 'bg-rose-100 text-rose-700'
                                : maxDmg > 2
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700',
                            )}>
                              <AlertTriangle className="size-2.5" aria-hidden />
                              เสีย {dmg}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5 min-w-0">
                {c.phone?.trim() ? (
                  <>
                    <Phone className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span className="tabular-nums text-sm text-slate-700 truncate">{c.phone.trim()}</span>
                  </>
                ) : (
                  <span className="text-slate-300 text-sm">—</span>
                )}
              </div>

              {/* Contact */}
              <div className="flex items-center gap-1.5 min-w-0">
                {c.contactName?.trim() ? (
                  <>
                    <User className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span className="text-sm text-slate-700 truncate">{c.contactName.trim()}</span>
                  </>
                ) : (
                  <span className="text-slate-300 text-sm">—</span>
                )}
              </div>

              {/* LINE ID */}
              <div className="flex items-center gap-1.5 min-w-0">
                {c.lineId?.trim() ? (
                  <>
                    <MessageCircle className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
                    <span className="text-sm font-medium text-emerald-600 truncate">{c.lineId.trim()}</span>
                  </>
                ) : (
                  <span className="text-slate-300 text-sm">—</span>
                )}
              </div>

              {/* Tracking + Notes */}
              <div className="flex min-w-0 flex-col gap-0.5">
                {c.trackingUrl?.trim() && (
                  <a
                    href={c.trackingUrl.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-700 hover:underline"
                  >
                    <ExternalLink className="size-3" aria-hidden />
                    ลิงก์ติดตามพัสดุ
                  </a>
                )}
                {c.notes?.trim() && (
                  <span className="truncate text-xs text-slate-400">{c.notes.trim()}</span>
                )}
                {!c.trackingUrl?.trim() && !c.notes?.trim() && (
                  <span className="text-slate-300 text-sm">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex w-16 items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, mode: 'edit', item: c })}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="แก้ไข"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(c)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="ลบ"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal.open && (
        <TransportCompanyModal
          open
          mode={modal.mode}
          initial={modal.item}
          onClose={() => setModal({ open: false, mode: 'create', item: null })}
          onSaved={() => {
            refresh()
            setModal({ open: false, mode: 'create', item: null })
          }}
        />
      )}
    </div>
  )
}
