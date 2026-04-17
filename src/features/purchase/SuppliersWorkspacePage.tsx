import { SupplierProfileModal } from '@/features/purchase/components/SupplierProfileModal'
import {
  loadSupplierDirectory,
  supplierBankAccountsSearchText,
  supplierPaymentMethodsLabel,
  SUPPLIER_DIRECTORY_CHANGED_EVENT,
  type SupplierProfile,
} from '@/features/purchase/data/supplierDirectoryStore'
import { CREDIT_TERMS_CHANGED_EVENT, getSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import { describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import { clsx } from 'clsx'
import { Building2, Pencil, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type SuppliersWorkspacePageProps = {
  className?: string
}

export function SuppliersWorkspacePage({ className }: SuppliersWorkspacePageProps) {
  const [rows, setRows] = useState<SupplierProfile[]>(() => loadSupplierDirectory())
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [supplierModal, setSupplierModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    profile: SupplierProfile | null
  }>({ open: false, mode: 'create', profile: null })

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((s) => {
      const blob = [
        s.supplierCode,
        s.name,
        s.taxId ?? '',
        s.phone ?? '',
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

  const selected = selectedId ? rows.find((r) => r.id === selectedId) : undefined

  useEffect(() => {
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      setSelectedId(null)
    }
  }, [rows, selectedId])

  const openCreate = () => {
    setSupplierModal({ open: true, mode: 'create', profile: null })
  }

  const openEdit = (p: SupplierProfile) => {
    setSupplierModal({ open: true, mode: 'edit', profile: p })
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
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-amber-600" aria-hidden />
          <div>
            <h1 className="text-sm font-bold text-slate-900">ผู้จำหน่าย</h1>
            <p className="text-[11px] text-slate-500">
              รายชื่อ · ชำระเงินสด/โอน · เลขบัญชี · เครดิต — ไม่ต้องเปิดใบ PO
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          <Plus className="size-4" aria-hidden />
          เพิ่มผู้จำหน่าย
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-slate-100 px-3 py-2 sm:px-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหา รหัส, ชื่อ, เลขภาษี, เบอร์, บัญชี, เครดิต"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur">
                <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  <th className="whitespace-nowrap px-3 py-2">รหัส</th>
                  <th className="min-w-[10rem] px-3 py-2">ชื่อ</th>
                  <th className="whitespace-nowrap px-3 py-2">เลขผู้เสียภาษี</th>
                  <th className="whitespace-nowrap px-3 py-2">เบอร์</th>
                  <th className="min-w-[7rem] px-3 py-2">ชำระ</th>
                  <th className="min-w-[14rem] px-3 py-2">เครดิต</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right">การทำงาน</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      {rows.length === 0 ? 'ยังไม่มีผู้จำหน่าย — กด «เพิ่มผู้จำหน่าย»' : 'ไม่พบรายการตามคำค้น'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const isSel = s.id === selectedId
                    return (
                      <tr
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedId(s.id)
                          }
                        }}
                        className={clsx(
                          'cursor-pointer border-b border-slate-100 transition-colors hover:bg-amber-50/50',
                          isSel && 'bg-amber-50',
                        )}
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-700">
                          {s.supplierCode}
                        </td>
                        <td className="max-w-[14rem] truncate px-3 py-2 font-medium text-slate-900">{s.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-600">
                          {s.taxId ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{s.phone ?? '—'}</td>
                        <td className="max-w-[9rem] px-3 py-2 text-[11px] leading-snug text-slate-700">
                          <span className="block font-medium text-slate-800">{supplierPaymentMethodsLabel(s)}</span>
                          {(() => {
                            const accs = s.bankAccounts ?? []
                            const a0 = accs[0]
                            if (!a0) return null
                            const line = [a0.bankName, a0.accountNo].filter(Boolean).join(' · ')
                            const extra = accs.length - 1
                            const title = accs
                              .map((a, i) => `${i + 1}. ${[a.bankName, a.accountNo, a.accountName].filter(Boolean).join(' — ')}`)
                              .join('\n')
                            return (
                              <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500" title={title}>
                                {line || a0.accountName}
                                {extra > 0 ? <span className="font-sans text-slate-600"> · +{extra}</span> : null}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-3 py-2 text-[11px] leading-snug text-slate-600">
                          {describeSupplierCreditRule(getSupplierCreditTerms(s.id))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(s)
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:border-amber-300 hover:text-amber-900"
                          >
                            <Pencil className="size-3" aria-hidden />
                            แก้ไข
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col bg-slate-50/80 lg:w-[24rem] lg:max-w-[40%]">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">รายละเอียด</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 text-xs">
            {!selected ? (
              <p className="text-slate-500">เลือกแถวในตารางเพื่อดูที่อยู่และหมายเหตุ</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">ชื่อ</p>
                  <p className="font-semibold text-slate-900">{selected.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase text-slate-500">รหัส</p>
                    <p className="font-mono text-[11px] text-slate-800">{selected.supplierCode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-slate-500">เลขภาษี</p>
                    <p className="font-mono text-[11px] text-slate-800">{selected.taxId ?? '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">โทรศัพท์</p>
                  <p className="text-slate-800">{selected.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">ช่องทางชำระ</p>
                  <p className="text-slate-800">{supplierPaymentMethodsLabel(selected)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-500">บัญชีรับโอน</p>
                  {selected.bankAccounts && selected.bankAccounts.length > 0 ? (
                    <ul className="mt-2 space-y-2.5">
                      {selected.bankAccounts.map((a, i) => (
                        <li
                          key={`${selected.id}-acc-${i}`}
                          className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px]"
                        >
                          <p className="mb-1 text-[10px] font-semibold text-slate-500">บัญชีที่ {i + 1}</p>
                          <dl className="space-y-1 text-slate-800">
                            {a.bankName ? (
                              <div>
                                <dt className="text-slate-500">ธนาคาร</dt>
                                <dd>{a.bankName}</dd>
                              </div>
                            ) : null}
                            {a.accountNo ? (
                              <div>
                                <dt className="text-slate-500">เลขที่บัญชี</dt>
                                <dd className="font-mono">{a.accountNo}</dd>
                              </div>
                            ) : null}
                            {a.accountName ? (
                              <div>
                                <dt className="text-slate-500">ชื่อบัญชี</dt>
                                <dd className="[overflow-wrap:anywhere]">{a.accountName}</dd>
                              </div>
                            ) : null}
                          </dl>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">ยังไม่กรอก — แก้ไขผู้จำหน่ายเพื่อเพิ่ม (หลายบัญชีได้)</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">ที่อยู่</p>
                  <p className="whitespace-pre-wrap text-slate-800 [overflow-wrap:anywhere]">
                    {selected.address?.trim() ? selected.address : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">หมายเหตุ</p>
                  <p className="whitespace-pre-wrap text-slate-700 [overflow-wrap:anywhere]">
                    {selected.notes?.trim() ? selected.notes : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-2.5">
                  <p className="text-[10px] font-medium uppercase text-amber-900/80">เงื่อนไขเครดิต</p>
                  <p className="mt-1 text-[11px] leading-snug text-amber-950">
                    {describeSupplierCreditRule(getSupplierCreditTerms(selected.id))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="w-full rounded-lg border border-amber-300 bg-amber-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  แก้ไข / กำหนดเครดิต
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {supplierModal.open && (
        <SupplierProfileModal
          open
          mode={supplierModal.mode}
          initialProfile={supplierModal.profile}
          onClose={() => setSupplierModal({ open: false, mode: 'create', profile: null })}
          onSaved={(p, mode) => {
            handleSaved(p)
            if (mode === 'create') setSelectedId(p.id)
            setSupplierModal({ open: false, mode: 'create', profile: null })
          }}
        />
      )}
    </div>
  )
}
