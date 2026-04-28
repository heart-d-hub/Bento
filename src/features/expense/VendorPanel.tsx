import {
  vendorCreateAsync,
  vendorDeleteAsync,
  vendorListAsync,
  vendorSpendingAsync,
  vendorUpdateAsync,
  type VendorRow,
  type VendorSpendingRow,
} from '@/features/expense/vendorDb'
import { clsx } from 'clsx'
import { Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10) }

type VendorForm = {
  name: string; bankName: string; bankAccount: string
  contactName: string; phone: string; note: string
}

const BLANK: VendorForm = { name: '', bankName: '', bankAccount: '', contactName: '', phone: '', note: '' }

function vendorToForm(v: VendorRow): VendorForm {
  return {
    name: v.name, bankName: v.bankName ?? '', bankAccount: v.bankAccount ?? '',
    contactName: v.contactName ?? '', phone: v.phone ?? '', note: v.note ?? '',
  }
}

function VendorFormPanel({
  form, setForm, onSave, onCancel, saving, title,
}: {
  form: VendorForm; setForm: (f: VendorForm) => void
  onSave: () => void; onCancel: () => void; saving: boolean; title: string
}) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold text-indigo-800">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { key: 'name',        label: 'ชื่อบริษัท / ผู้รับเงิน', required: true },
          { key: 'contactName', label: 'ชื่อผู้ติดต่อ' },
          { key: 'phone',       label: 'โทรศัพท์' },
          { key: 'bankName',    label: 'ธนาคาร' },
          { key: 'bankAccount', label: 'เลขบัญชี' },
          { key: 'note',        label: 'หมายเหตุ' },
        ].map(({ key, label, required }) => (
          <div key={key}>
            <label className="mb-1 block text-[10px] font-medium text-slate-600">
              {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
            </label>
            <input type="text" value={form[key as keyof VendorForm]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          ยกเลิก
        </button>
        <button type="button" onClick={onSave} disabled={saving || !form.name}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}บันทึก
        </button>
      </div>
    </div>
  )
}

export function VendorPanel() {
  const [vendors, setVendors]     = useState<VendorRow[]>([])
  const [spending, setSpending]   = useState<VendorSpendingRow[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState<VendorForm>(BLANK)
  const [editId, setEditId]       = useState<string | null>(null)
  const [editForm, setEditForm]   = useState<VendorForm>(BLANK)
  const [saving, setSaving]       = useState(false)

  const now = new Date()
  const dateFrom = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const dateTo   = fmtDate(now)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [v, s] = await Promise.all([vendorListAsync(), vendorSpendingAsync(dateFrom, dateTo)])
      setVendors(v); setSpending(s)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const handleAdd = async () => {
    if (!addForm.name) return
    setSaving(true)
    try {
      await vendorCreateAsync(addForm.name, addForm.bankName || null, addForm.bankAccount || null,
        addForm.contactName || null, addForm.phone || null, addForm.note || null)
      setAddForm(BLANK); setShowAdd(false); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!editId || !editForm.name) return
    setSaving(true)
    try {
      await vendorUpdateAsync(editId, editForm.name, editForm.bankName || null,
        editForm.bankAccount || null, editForm.contactName || null,
        editForm.phone || null, editForm.note || null)
      setEditId(null); await load()
    } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบผู้รับเงินนี้?')) return
    await vendorDeleteAsync(id); await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">สมุดคู่ค้า / ผู้รับเงิน</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={clsx('size-3', loading && 'animate-spin')} />
          </button>
          <button type="button" onClick={() => { setShowAdd(true); setEditId(null) }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
            <Plus className="size-3" />เพิ่มคู่ค้า
          </button>
        </div>
      </div>

      {loading && <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด…</p>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}

      {showAdd && (
        <VendorFormPanel form={addForm} setForm={setAddForm}
          onSave={() => void handleAdd()} onCancel={() => setShowAdd(false)}
          saving={saving} title="เพิ่มคู่ค้าใหม่" />
      )}

      {editId && (
        <VendorFormPanel form={editForm} setForm={setEditForm}
          onSave={() => void handleEdit()} onCancel={() => setEditId(null)}
          saving={saving} title="แก้ไขข้อมูลคู่ค้า" />
      )}

      {/* Vendor list */}
      {!loading && vendors.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">รายชื่อคู่ค้า ({vendors.length})</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left">ชื่อ</th>
                  <th className="px-3 py-2 text-left">ผู้ติดต่อ</th>
                  <th className="px-3 py-2 text-left">โทร</th>
                  <th className="px-3 py-2 text-left">บัญชีธนาคาร</th>
                  <th className="w-16 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900">{v.name}</p>
                      {v.note && <p className="text-[10px] text-slate-400">{v.note}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{v.contactName || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{v.phone || '—'}</td>
                    <td className="px-3 py-2.5">
                      {v.bankName
                        ? <span className="text-slate-600">{v.bankName} {v.bankAccount ?? ''}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button type="button"
                          onClick={() => { setEditId(v.id); setEditForm(vendorToForm(v)); setShowAdd(false) }}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="size-3" />
                        </button>
                        <button type="button" onClick={() => void handleDelete(v.id)}
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top payees this month */}
      {!loading && spending.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">
            ค่าใช้จ่ายแยกตามผู้รับเงิน — เดือนนี้
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 text-left">ผู้รับเงิน</th>
                  <th className="px-3 py-2 text-right">จำนวน</th>
                  <th className="px-3 py-2 text-right">รายการ</th>
                  <th className="px-3 py-2 text-right">ล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spending.map((s) => (
                  <tr key={s.payee} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-medium text-slate-900">{s.payee}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-700">
                      ฿{fmt(s.total)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {s.count}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">{s.lastDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && vendors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <p className="text-sm">ยังไม่มีคู่ค้า — เพิ่มเพื่อใช้ autocomplete ในช่องผู้รับเงิน</p>
        </div>
      )}
    </div>
  )
}
