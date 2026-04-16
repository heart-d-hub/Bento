import {
  getSupplierCreditTerms,
  setSupplierCreditTerms,
  type CounterpartyCreditConfig,
} from '@/features/finance/data/creditTermsStore'
import { describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import {
  createSupplierProfile,
  upsertSupplierProfile,
  type SupplierBankAccount,
  type SupplierProfile,
} from '@/features/purchase/data/supplierDirectoryStore'
import { clsx } from 'clsx'
import { Building2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type BankRowDraft = { bankName: string; accountNo: string; accountName: string }

function emptyBankRow(): BankRowDraft {
  return { bankName: '', accountNo: '', accountName: '' }
}

function bankRowsFromProfile(p: SupplierProfile | null): BankRowDraft[] {
  const accs = p?.bankAccounts
  if (accs?.length) {
    return accs.map((a) => ({
      bankName: a.bankName ?? '',
      accountNo: a.accountNo ?? '',
      accountName: a.accountName ?? '',
    }))
  }
  return [emptyBankRow()]
}

function bankRowsToAccounts(rows: BankRowDraft[]): SupplierBankAccount[] | undefined {
  const out: SupplierBankAccount[] = []
  for (const r of rows) {
    const bankName = r.bankName.trim() || undefined
    const accountNo = r.accountNo.trim() || undefined
    const accountName = r.accountName.trim() || undefined
    if (bankName || accountNo || accountName) {
      out.push({ bankName, accountNo, accountName })
    }
  }
  return out.length ? out : undefined
}

function otherRowsFromProfile(p: SupplierProfile | null): string[] {
  const o = p?.otherPaymentMethods
  if (o?.length) return [...o]
  return ['']
}

function otherRowsToMethods(rows: string[]): string[] | undefined {
  const out = rows.map((r) => r.trim()).filter((s) => s.length > 0)
  return out.length ? out : undefined
}

type SupplierProfileModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialProfile: SupplierProfile | null
  onClose: () => void
  onSaved: (profile: SupplierProfile, mode: 'create' | 'edit') => void
}

export function SupplierProfileModal({
  open,
  mode,
  initialProfile,
  onClose,
  onSaved,
}: SupplierProfileModalProps) {
  const [supplierCode, setSupplierCode] = useState('')
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [acceptsCash, setAcceptsCash] = useState(true)
  const [acceptsTransfer, setAcceptsTransfer] = useState(true)
  const [otherPaymentRows, setOtherPaymentRows] = useState<string[]>([''])
  const [bankRows, setBankRows] = useState<BankRowDraft[]>([emptyBankRow()])
  const [cutoff, setCutoff] = useState(25)
  const [creditDays, setCreditDays] = useState(30)
  const [excl, setExcl] = useState(true)
  const [eom, setEom] = useState(true)

  useEffect(() => {
    if (!open) return
    if (initialProfile) {
      setSupplierCode(initialProfile.supplierCode)
      setName(initialProfile.name)
      setTaxId(initialProfile.taxId ?? '')
      setPhone(initialProfile.phone ?? '')
      setAddress(initialProfile.address ?? '')
      setNotes(initialProfile.notes ?? '')
      setAcceptsCash(initialProfile.acceptsCash !== false)
      setAcceptsTransfer(initialProfile.acceptsTransfer !== false)
      setOtherPaymentRows(otherRowsFromProfile(initialProfile))
      setBankRows(bankRowsFromProfile(initialProfile))
      const c = getSupplierCreditTerms(initialProfile.id)
      setCutoff(c.statementCutoffDay)
      setCreditDays(c.creditDays)
      setExcl(c.excludePurchaseMonth)
      setEom(c.payAtEndOfDueMonth)
    } else {
      setSupplierCode('')
      setName('')
      setTaxId('')
      setPhone('')
      setAddress('')
      setNotes('')
      setAcceptsCash(true)
      setAcceptsTransfer(true)
      setOtherPaymentRows([''])
      setBankRows([emptyBankRow()])
      const c = getSupplierCreditTerms('new-supplier-placeholder')
      setCutoff(c.statementCutoffDay)
      setCreditDays(c.creditDays)
      setExcl(c.excludePurchaseMonth)
      setEom(c.payAtEndOfDueMonth)
    }
  }, [open, initialProfile])

  if (!open) return null

  const creditPreview: CounterpartyCreditConfig = {
    statementCutoffDay: cutoff,
    creditDays,
    excludePurchaseMonth: excl,
    payAtEndOfDueMonth: eom,
  }

  const submit = () => {
    const nm = name.trim()
    if (!nm) {
      window.alert('กรุณากรอกชื่อผู้จำหน่าย')
      return
    }
    const code = supplierCode.trim() || nm.slice(0, 12)
    const bankAccounts = bankRowsToAccounts(bankRows)
    const otherPaymentMethods = otherRowsToMethods(otherPaymentRows)
    if (mode === 'create') {
      const created = createSupplierProfile({
        supplierCode: code,
        name: nm,
        taxId: taxId.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        acceptsCash,
        acceptsTransfer,
        otherPaymentMethods,
        bankAccounts,
      })
      setSupplierCreditTerms(created.id, creditPreview)
      onSaved(created, 'create')
      onClose()
      return
    }
    if (!initialProfile?.id) return
    const profile: SupplierProfile = {
      id: initialProfile.id,
      supplierCode: code,
      name: nm,
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      acceptsCash,
      acceptsTransfer,
      otherPaymentMethods,
      bankAccounts,
    }
    upsertSupplierProfile(profile)
    setSupplierCreditTerms(profile.id, creditPreview)
    onSaved(profile, 'edit')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-amber-600" aria-hidden />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {mode === 'create' ? 'เพิ่มผู้จำหน่าย' : 'รายละเอียดผู้จำหน่ายและเครดิต'}
              </h2>
              <p className="text-[11px] text-slate-500">ใช้ร่วมกับใบสั่งซื้อและเจ้าหนี้</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="ปิด">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-medium text-slate-700">
            รหัสผู้จำหน่าย
            <input
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="เช่น S-BKK-01"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            ชื่อบริษัท / ร้าน <span className="text-rose-600">*</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            เลขผู้เสียภาษี
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            โทรศัพท์
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            ที่อยู่ / สาขา
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-medium text-slate-700">
            หมายเหตุ (เช่น เงื่อนไขจัดส่ง)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-bold text-slate-800">การชำระเงิน</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            เลือกเงินสด/โอน — เพิ่มช่องทางอื่นได้หลายรายการ — บัญชีรับโอนได้หลายบัญชี
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" checked={acceptsCash} onChange={(e) => setAcceptsCash(e.target.checked)} className="rounded" />
              เงินสด
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={acceptsTransfer}
                onChange={(e) => setAcceptsTransfer(e.target.checked)}
                className="rounded"
              />
              เงินโอน
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            <p className="text-[11px] font-semibold text-slate-800">ช่องทางอื่นๆ</p>
            <p className="mt-0.5 text-[10px] text-slate-500">เช่น เช็ค, บัตรเครดิต, พร้อมเพย์, วอลเล็ต — แต่ละช่องหนึ่งรายการ</p>
            <div className="mt-2 space-y-2">
              {otherPaymentRows.map((row, idx) => (
                <div key={`other-pay-${idx}`} className="flex gap-2">
                  <input
                    value={row}
                    onChange={(e) =>
                      setOtherPaymentRows((prev) => prev.map((r, i) => (i === idx ? e.target.value : r)))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="ระบุช่องทางชำระ"
                  />
                  {otherPaymentRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setOtherPaymentRows((prev) => prev.filter((_, i) => i !== idx))}
                      className="shrink-0 rounded-lg border border-rose-200 bg-white px-2 py-2 text-rose-700 hover:bg-rose-50"
                      aria-label="ลบช่องทาง"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOtherPaymentRows((prev) => [...prev, ''])}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="size-3.5" aria-hidden />
              เพิ่มช่องทางอื่น
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {bankRows.map((row, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    บัญชีที่ {idx + 1}
                  </span>
                  {bankRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setBankRows((prev) => prev.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[10px] font-medium text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="size-3" aria-hidden />
                      ลบ
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block text-[11px] font-medium text-slate-700 sm:col-span-2">
                    ธนาคาร
                    <input
                      value={row.bankName}
                      onChange={(e) =>
                        setBankRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, bankName: e.target.value } : r)),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="เช่น กสิกรไทย"
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-slate-700">
                    เลขที่บัญชี
                    <input
                      value={row.accountNo}
                      onChange={(e) =>
                        setBankRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, accountNo: e.target.value } : r)),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm"
                      placeholder="เลขบัญชีรับโอน"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-slate-700">
                    ชื่อบัญชี
                    <input
                      value={row.accountName}
                      onChange={(e) =>
                        setBankRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, accountName: e.target.value } : r)),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="ชื่อบัญชีตามสมุดธนาคาร"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBankRows((prev) => [...prev, emptyBankRow()])}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50"
            >
              <Plus className="size-3.5" aria-hidden />
              เพิ่มบัญชีรับโอน
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-bold text-slate-800">กำหนดเครดิต / วันชำระ (กับซัพพลายรายนี้)</p>
          <div className="mt-2 space-y-2">
            <label className="block text-[11px] text-slate-700">
              วันตัดรอบบิล (1–31)
              <input
                type="number"
                min={1}
                max={31}
                value={cutoff}
                onChange={(e) => setCutoff(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-[11px] text-slate-700">
              วันเครดิต
              <input
                type="number"
                min={0}
                max={180}
                value={creditDays}
                onChange={(e) => setCreditDays(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" checked={excl} onChange={(e) => setExcl(e.target.checked)} className="rounded" />
              ไม่รวมเดือนซื้อ
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" checked={eom} onChange={(e) => setEom(e.target.checked)} className="rounded" />
              ชำระสิ้นเดือน
            </label>
          </div>
          <p className={clsx('mt-2 rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600')}>
            {describeSupplierCreditRule(creditPreview)}
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
