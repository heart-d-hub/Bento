import { getStoredCompany } from '@/features/auth/authSession'
import { type CompanyConfig, loadCompanyConfig, saveCompanyConfig } from '@/features/auth/companiesStore'
import { COMPANIES, type CompanyId } from '@/features/auth/companies'
import {
  loadBranchesByCompany,
  newBranchId,
  removeBranch,
  saveBranchesForCompany,
  upsertBranch,
  type DynamicBranch,
} from '@/features/auth/branchesStore'
import { clsx } from 'clsx'
import { Building2, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1'

type BranchFormState = {
  id: string
  name: string
  address: string
  phone: string
  isActive: boolean
}

const emptyForm = (companyId: CompanyId): BranchFormState => ({
  id: newBranchId(),
  name: '',
  address: '',
  phone: '',
  isActive: true,
})

export function CompanyBranchesPanel() {
  const sessionCompany = getStoredCompany()
  const defaultCompanyId = (sessionCompany?.id ?? COMPANIES[0]?.id) as CompanyId
  const [selectedCompanyId, setSelectedCompanyId] = useState<CompanyId>(defaultCompanyId)

  const companyId = selectedCompanyId

  // ── Company config ──
  const [cfg, setCfg] = useState<CompanyConfig>(() => loadCompanyConfig(companyId))
  const [cfgSaved, setCfgSaved] = useState(false)

  function switchCompany(id: CompanyId) {
    setSelectedCompanyId(id)
    setCfg(loadCompanyConfig(id))
    setCfgSaved(false)
    setBranches(loadBranchesByCompany(id))
    setEditingBranch(null)
    setIsAdding(false)
    setDeleteConfirmId(null)
    setDeleteConfirmInput('')
  }

  function handleSaveCfg() {
    saveCompanyConfig(companyId, cfg)
    setCfgSaved(true)
    setTimeout(() => setCfgSaved(false), 2000)
  }

  // ── Branches ──
  const [branches, setBranches] = useState<DynamicBranch[]>(() => loadBranchesByCompany(companyId))
  const [editingBranch, setEditingBranch] = useState<BranchFormState | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  // Permanent delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')

  function openAdd() {
    setEditingBranch(emptyForm(companyId))
    setIsAdding(true)
  }

  function openEdit(b: DynamicBranch) {
    setEditingBranch({ id: b.id, name: b.name, address: b.address, phone: b.phone, isActive: b.isActive })
    setIsAdding(false)
    setDeleteConfirmId(null)
    setDeleteConfirmInput('')
  }

  function cancelEdit() {
    setEditingBranch(null)
    setIsAdding(false)
  }

  function saveBranch() {
    if (!editingBranch || !editingBranch.name.trim()) return
    const branch: DynamicBranch = {
      id: editingBranch.id,
      companyId,
      name: editingBranch.name.trim(),
      address: editingBranch.address.trim(),
      phone: editingBranch.phone.trim(),
      isActive: editingBranch.isActive,
      sortOrder: isAdding ? branches.length : (branches.find((b) => b.id === editingBranch.id)?.sortOrder ?? 0),
      createdAt: isAdding ? new Date().toISOString().slice(0, 10) : (branches.find((b) => b.id === editingBranch.id)?.createdAt ?? new Date().toISOString().slice(0, 10)),
    }
    upsertBranch(branch)
    const next = loadBranchesByCompany(companyId)
    setBranches(next)
    setEditingBranch(null)
    setIsAdding(false)
  }

  function toggleActive(b: DynamicBranch) {
    const activeBranches = branches.filter((br) => br.isActive)
    if (b.isActive && activeBranches.length <= 1) {
      window.alert('ต้องมีสาขาที่ใช้งานอยู่อย่างน้อย 1 สาขา')
      return
    }
    upsertBranch({ ...b, isActive: !b.isActive })
    setBranches(loadBranchesByCompany(companyId))
    // If activating, dismiss any open delete confirm for this branch
    if (!b.isActive) {
      setDeleteConfirmId(null)
      setDeleteConfirmInput('')
    }
  }

  function openDeleteConfirm(b: DynamicBranch) {
    setDeleteConfirmId(b.id)
    setDeleteConfirmInput('')
    // Close edit form if open for this branch
    if (editingBranch?.id === b.id) cancelEdit()
  }

  function cancelDeleteConfirm() {
    setDeleteConfirmId(null)
    setDeleteConfirmInput('')
  }

  function confirmPermanentDelete(b: DynamicBranch) {
    if (deleteConfirmInput.trim() !== b.name.trim()) return
    removeBranch(companyId, b.id)
    setBranches(loadBranchesByCompany(companyId))
    setDeleteConfirmId(null)
    setDeleteConfirmInput('')
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...branches]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    next.forEach((b, i) => (b.sortOrder = i))
    saveBranchesForCompany(companyId, next)
    setBranches([...next])
  }

  function moveDown(idx: number) {
    if (idx === branches.length - 1) return
    const next = [...branches]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    next.forEach((b, i) => (b.sortOrder = i))
    saveBranchesForCompany(companyId, next)
    setBranches([...next])
  }

  const activeBranches = branches.filter((b) => b.isActive)
  const inactiveBranches = branches.filter((b) => !b.isActive)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Company switcher tabs ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
        {COMPANIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => switchCompany(c.id as CompanyId)}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
              selectedCompanyId === c.id
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
            )}
          >
            <Building2 className="size-3.5" />
            {loadCompanyConfig(c.id as CompanyId).name || c.name}
            {sessionCompany?.id === c.id && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">
                ล็อกอินอยู่
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Company info ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <Building2 className="size-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-800">ข้อมูลกิจการ — {cfg.name || companyId}</span>
          <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-200">
            {companyId}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>ชื่อกิจการ</label>
            <input className={inputCls} value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} placeholder="ชื่อร้าน / นิติบุคคล" />
          </div>
          <div>
            <label className={labelCls}>ชื่อย่อ (แสดงบน Nav)</label>
            <input className={inputCls} value={cfg.shortName} onChange={(e) => setCfg({ ...cfg, shortName: e.target.value })} placeholder="เช่น อัง" />
          </div>
          <div>
            <label className={labelCls}>เลขประจำตัวผู้เสียภาษี</label>
            <input className={inputCls} value={cfg.taxId} onChange={(e) => setCfg({ ...cfg, taxId: e.target.value })} placeholder="0-0000-00000-00-0" />
          </div>
          <div>
            <label className={labelCls}>โทรศัพท์</label>
            <input className={inputCls} value={cfg.phone} onChange={(e) => setCfg({ ...cfg, phone: e.target.value })} placeholder="02-xxx-xxxx" />
          </div>
          <div>
            <label className={labelCls}>อีเมล</label>
            <input className={inputCls} value={cfg.email} onChange={(e) => setCfg({ ...cfg, email: e.target.value })} placeholder="shop@example.com" />
          </div>
          <div>
            <label className={labelCls}>ที่อยู่</label>
            <textarea className={clsx(inputCls, 'resize-none')} rows={2} value={cfg.address} onChange={(e) => setCfg({ ...cfg, address: e.target.value })} placeholder="ที่อยู่กิจการ" />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={handleSaveCfg}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95">
            บันทึก
          </button>
          {cfgSaved && <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓</span>}
          <p className="ml-auto text-[10px] text-slate-400">ใช้สำหรับออกใบกำกับภาษีและเอกสารทางธุรกิจ</p>
        </div>
      </div>

      {/* ── Active Branches ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">สาขาที่ใช้งาน</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {activeBranches.length} สาขา
            </span>
          </div>
          <button type="button" onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
            <Plus className="size-3.5" />
            เพิ่มสาขา
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeBranches.map((b) => {
            const idx = branches.indexOf(b)
            const isEditing = editingBranch?.id === b.id && !isAdding
            return (
              <div key={b.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[10px] leading-none">▲</button>
                    <button type="button" onClick={() => moveDown(idx)} disabled={idx === branches.length - 1}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[10px] leading-none">▼</button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{b.name}</p>
                    {(b.phone || b.address) && (
                      <p className="truncate text-[11px] text-slate-500">{[b.phone, b.address].filter(Boolean).join(' · ')}</p>
                    )}
                    <p className="font-mono text-[10px] text-slate-400">{b.id}</p>
                  </div>

                  {/* Deactivate button — replaces delete for active branches */}
                  <button type="button" onClick={() => toggleActive(b)}
                    title="ปิดการใช้งานสาขานี้ (ข้อมูลยังคงอยู่)"
                    className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-slate-100 hover:text-slate-600">
                    ใช้งาน
                  </button>

                  <button type="button" onClick={() => (isEditing ? cancelEdit() : openEdit(b))}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600">
                    {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                  </button>
                </div>

                {isEditing && editingBranch && (
                  <div className="border-t border-indigo-100 bg-indigo-50/40 px-4 pb-4 pt-3">
                    <BranchForm form={editingBranch} onChange={setEditingBranch} onSave={saveBranch} onCancel={cancelEdit} />
                  </div>
                )}
              </div>
            )
          })}

          {isAdding && editingBranch && (
            <div className="border-t border-emerald-100 bg-emerald-50/30 px-4 pb-4 pt-3">
              <p className="mb-3 text-xs font-bold text-emerald-700">+ สาขาใหม่</p>
              <BranchForm form={editingBranch} onChange={setEditingBranch} onSave={saveBranch} onCancel={cancelEdit} />
            </div>
          )}
        </div>
      </div>

      {/* ── Inactive Branches ── */}
      {inactiveBranches.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <span className="text-sm font-bold text-slate-500">สาขาที่ปิดแล้ว</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {inactiveBranches.length} สาขา
            </span>
            <span className="ml-auto text-[10px] text-slate-400">คลิก "ปิด" เพื่อเปิดอีกครั้ง · ลบถาวรได้เฉพาะสาขาที่ปิดแล้ว</span>
          </div>

          <div className="divide-y divide-slate-100">
            {inactiveBranches.map((b) => {
              const idx = branches.indexOf(b)
              const isEditing = editingBranch?.id === b.id && !isAdding
              const isConfirmingDelete = deleteConfirmId === b.id
              const nameMatches = deleteConfirmInput.trim() === b.name.trim()

              return (
                <div key={b.id} className="opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex shrink-0 flex-col">
                      <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[10px] leading-none">▲</button>
                      <button type="button" onClick={() => moveDown(idx)} disabled={idx === branches.length - 1}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[10px] leading-none">▼</button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-600 line-through decoration-slate-400">{b.name}</p>
                      {(b.phone || b.address) && (
                        <p className="truncate text-[11px] text-slate-400">{[b.phone, b.address].filter(Boolean).join(' · ')}</p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400">{b.id}</p>
                    </div>

                    {/* Reactivate button */}
                    <button type="button" onClick={() => toggleActive(b)}
                      title="เปิดการใช้งานสาขานี้อีกครั้ง"
                      className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:bg-emerald-100 hover:text-emerald-700">
                      ปิด
                    </button>

                    <button type="button" onClick={() => (isEditing ? cancelEdit() : openEdit(b))}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600">
                      {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                    </button>

                    {/* Permanent delete — only on inactive branches */}
                    <button type="button"
                      onClick={() => isConfirmingDelete ? cancelDeleteConfirm() : openDeleteConfirm(b)}
                      title="ลบถาวร"
                      className={clsx(
                        'shrink-0 rounded-lg border p-1.5 transition',
                        isConfirmingDelete
                          ? 'border-rose-300 bg-rose-100 text-rose-600'
                          : 'border-rose-100 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600',
                      )}>
                      {isConfirmingDelete ? <X className="size-3.5" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>

                  {isEditing && editingBranch && (
                    <div className="border-t border-indigo-100 bg-indigo-50/40 px-4 pb-4 pt-3">
                      <BranchForm form={editingBranch} onChange={setEditingBranch} onSave={saveBranch} onCancel={cancelEdit} />
                    </div>
                  )}

                  {/* Inline permanent-delete confirmation */}
                  {isConfirmingDelete && (
                    <div className="border-t border-rose-200 bg-rose-50/60 px-4 pb-4 pt-3">
                      <p className="mb-2 text-xs font-bold text-rose-700">ลบสาขานี้ถาวร — ไม่สามารถกู้คืนได้</p>
                      <p className="mb-3 text-[11px] text-rose-600">
                        พิมพ์ชื่อสาขา <span className="font-mono font-bold">"{b.name}"</span> เพื่อยืนยัน
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                          placeholder={b.name}
                          value={deleteConfirmInput}
                          onChange={(e) => setDeleteConfirmInput(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => confirmPermanentDelete(b)}
                          disabled={!nameMatches}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                          ลบถาวร
                        </button>
                        <button
                          type="button"
                          onClick={cancelDeleteConfirm}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
        <p className="text-xs font-semibold text-slate-500">หมายเหตุ</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          การปิดสาขาจะซ่อนออกจากหน้าเลือกสาขา แต่ข้อมูลทั้งหมดยังคงอยู่ · การลบถาวรต้องปิดสาขาก่อน และพิมพ์ชื่อยืนยัน
        </p>
      </div>
    </div>
  )
}

function BranchForm({
  form,
  onChange,
  onSave,
  onCancel,
}: {
  form: BranchFormState
  onChange: (f: BranchFormState) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>ชื่อสาขา *</label>
          <input className={inputCls} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="เช่น อังอะไหล่ สาขา 2" autoFocus />
        </div>
        <div>
          <label className={labelCls}>โทรศัพท์</label>
          <input className={inputCls} value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="02-xxx-xxxx" />
        </div>
        <div>
          <label className={labelCls}>ที่อยู่</label>
          <input className={inputCls} value={form.address} onChange={(e) => onChange({ ...form, address: e.target.value })} placeholder="ที่อยู่สาขา" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} disabled={!form.name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40">
          บันทึก
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
