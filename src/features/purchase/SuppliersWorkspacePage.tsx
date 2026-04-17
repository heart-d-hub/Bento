import { SupplierProfileModal } from '@/features/purchase/components/SupplierProfileModal'
import {
  deleteSupplierProfile,
  loadSupplierDirectory,
  supplierBankAccountsSearchText,
  supplierPaymentMethodsLabel,
  SUPPLIER_DIRECTORY_CHANGED_EVENT,
  type SupplierProfile,
} from '@/features/purchase/data/supplierDirectoryStore'
import { CREDIT_TERMS_CHANGED_EVENT, getSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import { describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import { clsx } from 'clsx'
import { Pencil, Plus, Search, Star, Trash2, Truck, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'

type SuppliersWorkspacePageProps = {
  className?: string
}

export function SuppliersWorkspacePage({ className }: SuppliersWorkspacePageProps) {
  const [rows, setRows] = useState<SupplierProfile[]>(() => loadSupplierDirectory())
  const [q, setQ] = useState('')
  const [supplierModal, setSupplierModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    profile: SupplierProfile | null
  }>({ open: false, mode: 'create', profile: null })
  const [rowContext, setRowContext] = useState<{
    left: number
    top: number
    supplier: SupplierProfile
  } | null>(null)

  const refresh = useCallback(() => {
    setRows(loadSupplierDirectory())
  }, [])

  useEffect(() => {
    const onDir = () => refresh()
    const onCredit = () => refresh()
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, onDir)
    window.addEventListener(CREDIT_TERMS_CHANGED_EVENT, onCredit)
    return () => {
      window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, onDir)
      window.removeEventListener(CREDIT_TERMS_CHANGED_EVENT, onCredit)
    }
  }, [refresh])

  const closeRowContext = useCallback(() => setRowContext(null), [])

  useEffect(() => {
    if (!rowContext) return
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest?.('[data-supplier-row-context-menu]')) return
      closeRowContext()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRowContext()
    }
    const onScroll = () => closeRowContext()
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [rowContext, closeRowContext])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((s) => {
      const blob = [
        s.supplierCode,
        s.name,
        s.taxId ?? '',
        s.phone ?? '',
        s.contactName ?? '',
        s.lineId ?? '',
        s.defaultShipping ?? '',
        (s.brandsSold ?? []).join(' '),
        s.address ?? '',
        s.notes ?? '',
        supplierBankAccountsSearchText(s),
        (s.otherPaymentMethods ?? []).join(' '),
        supplierPaymentMethodsLabel(s),
        describeSupplierCreditRule(getSupplierCreditTerms(s.id)),
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })
  }, [rows, q])

  const openCreate = () => {
    setSupplierModal({ open: true, mode: 'create', profile: null })
  }

  const openEdit = (p: SupplierProfile) => {
    setSupplierModal({ open: true, mode: 'edit', profile: p })
  }

  const confirmAndDeleteSupplier = (p: SupplierProfile) => {
    if (!window.confirm(`ลบผู้จัดจำหน่าย «${p.name}» (${p.supplierCode})?`)) return
    deleteSupplierProfile(p.id)
    refresh()
  }

  const handleDelete = (p: SupplierProfile, e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    confirmAndDeleteSupplier(p)
  }

  const openRowContextMenu = (e: MouseEvent, s: SupplierProfile) => {
    e.preventDefault()
    const pad = 8
    const mw = 176
    const mh = 76
    let x = e.clientX
    let y = e.clientY
    if (x + mw > window.innerWidth - pad) x = window.innerWidth - mw - pad
    if (y + mh > window.innerHeight - pad) y = window.innerHeight - mh - pad
    x = Math.max(pad, x)
    y = Math.max(pad, y)
    setRowContext({ left: x, top: y, supplier: s })
  }

  const handleSaved = () => {
    refresh()
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <Users className="size-5" aria-hidden />
          </div>
          <h1 className="text-base font-bold text-slate-900">รายชื่อผู้จัดจำหน่ายทั้งหมด</h1>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:min-w-[280px]">
          <div className="relative min-w-0 max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
          >
            <Plus className="size-4" aria-hidden />
            เพิ่มผู้จัดจำหน่าย
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100/95 text-slate-600 backdrop-blur">
            <tr className="text-xs font-semibold">
              <th className="whitespace-nowrap px-4 py-3">รหัส</th>
              <th className="min-w-[12rem] px-4 py-3">ชื่อร้าน/บริษัท</th>
              <th className="whitespace-nowrap px-4 py-3">สินค้าประจำ</th>
              <th className="min-w-[14rem] px-4 py-3">แบรนด์ที่จำหน่าย</th>
              <th className="whitespace-nowrap px-4 py-3">ขนส่งประจำ</th>
              <th className="min-w-[10rem] px-4 py-3">ผู้ติดต่อ/เบอร์โทร</th>
              <th className="whitespace-nowrap px-4 py-3">LINE ID</th>
              <th className="whitespace-nowrap px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                  {rows.length === 0 ? 'ยังไม่มีผู้จัดจำหน่าย — กด «เพิ่มผู้จัดจำหน่าย»' : 'ไม่พบรายการตามคำค้น'}
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const n = s.regularProductCount ?? 0
                const brands = s.brandsSold ?? []
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                    onContextMenu={(e) => openRowContextMenu(e, s)}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-bold text-slate-900">{s.supplierCode}</span>
                    </td>
                    <td className="max-w-[20rem] px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                        <Star className="size-3.5 fill-amber-400 text-amber-600" aria-hidden />
                        {n} รายการ
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {brands.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          brands.map((b) => (
                            <span
                              key={`${s.id}-b-${b}`}
                              className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                            >
                              {b}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                        <Truck className="size-3.5 shrink-0 text-sky-600" aria-hidden />
                        {s.defaultShipping?.trim() || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs leading-snug text-slate-700">
                      <span className="block font-medium text-slate-800">{s.contactName?.trim() || '—'}</span>
                      <span className="text-slate-600">{s.phone?.trim() || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-medium text-emerald-600">{s.lineId?.trim() || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="แก้ไข"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(s, e)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="ลบ"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {supplierModal.open && (
        <SupplierProfileModal
          open
          mode={supplierModal.mode}
          initialProfile={supplierModal.profile}
          onClose={() => setSupplierModal({ open: false, mode: 'create', profile: null })}
          onSaved={() => {
            handleSaved()
            setSupplierModal({ open: false, mode: 'create', profile: null })
          }}
        />
      )}

      {rowContext ? (
        <div
          data-supplier-row-context-menu
          role="menu"
          className="fixed z-[200] min-w-[11rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
          style={{ left: rowContext.left, top: rowContext.top }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100"
            onClick={() => {
              openEdit(rowContext.supplier)
              closeRowContext()
            }}
          >
            <Pencil className="size-4 shrink-0 text-slate-500" aria-hidden />
            แก้ไข
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-700 hover:bg-rose-50"
            onClick={() => {
              const p = rowContext.supplier
              closeRowContext()
              confirmAndDeleteSupplier(p)
            }}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            ลบ
          </button>
        </div>
      ) : null}
    </div>
  )
}
