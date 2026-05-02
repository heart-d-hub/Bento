import {
  applySplitMapToProducts,
  applySplitsToCatalog,
  buildSplitBackupJson,
  DEFAULT_SLASH_SPLIT_DELIMITERS,
  scanCatalogForSplitCandidates,
  type SplitCandidate,
  type SplitFieldKind,
} from '@/features/vehicle/data/splitVehicleCatalogSlash'
import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import {
  getProductMasterList,
  saveProductMasterList,
} from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import { ArrowRight, Download, Scissors, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const KIND_LABEL: Record<SplitFieldKind, string> = {
  model: 'รุ่น (Model)',
  engine_code: 'รหัสเครื่อง',
  engine_size: 'ขนาดเครื่อง',
}

const KIND_BADGE: Record<SplitFieldKind, string> = {
  model: 'bg-violet-100 text-violet-700 ring-violet-200',
  engine_code: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  engine_size: 'bg-sky-100 text-sky-700 ring-sky-200',
}

export function SplitSlashFieldsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { catalog, setCatalog } = useVehicleCatalog()
  const [enabledDelimiters, setEnabledDelimiters] = useState<Set<string>>(
    () => new Set(DEFAULT_SLASH_SPLIT_DELIMITERS),
  )
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | SplitFieldKind>('all')
  const [busy, setBusy] = useState(false)

  const products = useMemo(() => (open ? getProductMasterList() : []), [open])

  const scan = useMemo(() => {
    if (!open) return null
    const delims = DEFAULT_SLASH_SPLIT_DELIMITERS.filter((d) => enabledDelimiters.has(d))
    return scanCatalogForSplitCandidates(catalog, products, delims)
  }, [open, catalog, products, enabledDelimiters])

  // เลือกทุกอันเป็น default เมื่อ scan เปลี่ยน
  useEffect(() => {
    if (!scan) return
    setSelectedKeys(new Set(scan.candidates.map((c) => c.key)))
  }, [scan])

  if (!open) return null

  const filteredCandidates = (scan?.candidates ?? []).filter((c) => {
    if (kindFilter !== 'all' && c.kind !== kindFilter) return false
    if (!filter.trim()) return true
    const q = filter.trim().toLowerCase()
    return (
      c.originalText.toLowerCase().includes(q) ||
      c.parts.some((p) => p.toLowerCase().includes(q)) ||
      c.location.brandName.toLowerCase().includes(q) ||
      c.location.modelName.toLowerCase().includes(q) ||
      c.location.categoryLabel.toLowerCase().includes(q)
    )
  })

  const totalCount = scan?.candidates.length ?? 0
  const selectedCount = selectedKeys.size

  const productsImpacted = (() => {
    if (!scan) return 0
    let total = 0
    for (const c of scan.candidates) {
      if (!selectedKeys.has(c.key)) continue
      if (c.kind === 'model') {
        // count products on any engine under this model
        // approximate: sum impactByEngineId for engines under this model is heavier;
        // we simplify by reusing engine impact for engine_* candidates only.
        continue
      }
      if (c.location.engineId) {
        total += scan.productImpactByEngineId.get(c.location.engineId) ?? 0
      }
    }
    return total
  })()

  const newRecordsAdded = (() => {
    if (!scan) return 0
    let total = 0
    for (const c of scan.candidates) {
      if (!selectedKeys.has(c.key)) continue
      total += c.parts.length - 1
    }
    return total
  })()

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const c of filteredCandidates) next.add(c.key)
      return next
    })
  }
  const clearAllVisible = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const c of filteredCandidates) next.delete(c.key)
      return next
    })
  }

  const downloadBackup = () => {
    const json = buildSplitBackupJson(catalog, products)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bento-vehicle-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const apply = () => {
    if (!scan) return
    if (selectedKeys.size === 0) {
      window.alert('ยังไม่ได้เลือกรายการที่จะแยก')
      return
    }
    if (
      !window.confirm(
        `ยืนยันแยกข้อมูล ${selectedKeys.size} รายการ? จะเพิ่ม ${newRecordsAdded} record ใหม่ในแคตตาล็อก และอัปเดต fitments ของสินค้าทั้งหมดอัตโนมัติ`,
      )
    )
      return

    setBusy(true)
    try {
      // 1) backup ก่อน apply
      downloadBackup()

      // 2) apply ลง catalog
      const { catalog: nextCatalog, maps } = applySplitsToCatalog(
        catalog,
        selectedKeys,
        scan,
      )

      // 3) propagate to product fitments
      const nextProducts = applySplitMapToProducts(products, nextCatalog, maps)

      setCatalog(nextCatalog)
      saveProductMasterList(nextProducts)

      window.alert(
        `แยกสำเร็จ — เพิ่ม ${newRecordsAdded} record และอัปเดตสินค้า ${nextProducts.length} รายการ\n(สำรองข้อมูลก่อนแก้อยู่ใน Downloads แล้ว)`,
      )
      onClose()
    } catch (e) {
      window.alert('เกิดข้อผิดพลาด: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-50 to-sky-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Scissors className="size-5 text-violet-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">แยกข้อมูลที่มีตัวคั่น</h2>
              <p className="text-[11px] text-slate-500">
                สแกน รุ่นรถ / รหัสเครื่อง / ขนาดเครื่อง ที่มีหลายค่ารวมกัน แล้วแยกเป็น records แยก พร้อมอัปเดต fitments ของสินค้า
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold text-slate-600">ตัวคั่น:</div>
            {DEFAULT_SLASH_SPLIT_DELIMITERS.map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-[12px]">
                <input
                  type="checkbox"
                  checked={enabledDelimiters.has(d)}
                  onChange={() => {
                    setEnabledDelimiters((prev) => {
                      const next = new Set(prev)
                      if (next.has(d)) next.delete(d)
                      else next.add(d)
                      return next
                    })
                  }}
                />
                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700 shadow-sm">
                  {d === ' & ' ? '␣&␣' : d === ' + ' ? '␣+␣' : d}
                </code>
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
              <Search className="size-3.5 text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="ค้นหา..."
                className="w-48 bg-transparent text-[12px] outline-none"
              />
            </div>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as 'all' | SplitFieldKind)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="model">เฉพาะรุ่น</option>
              <option value="engine_code">เฉพาะรหัสเครื่อง</option>
              <option value="engine_size">เฉพาะขนาดเครื่อง</option>
            </select>
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] hover:bg-slate-50"
            >
              เลือกทั้งหมดในมุมมอง
            </button>
            <button
              type="button"
              onClick={clearAllVisible}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] hover:bg-slate-50"
            >
              ยกเลิกทั้งหมดในมุมมอง
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {!scan || scan.candidates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              ไม่พบข้อมูลที่มีตัวคั่นที่เลือก
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              ไม่ตรงกับตัวกรอง
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-8 px-2 py-2"></th>
                  <th className="px-2 py-2">ประเภท / ตำแหน่ง</th>
                  <th className="px-2 py-2">ค่าเดิม</th>
                  <th className="px-2 py-2">หลังแยก</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => (
                  <CandidateRow
                    key={c.key}
                    cand={c}
                    checked={selectedKeys.has(c.key)}
                    onToggle={() => toggleKey(c.key)}
                    productImpact={
                      c.location.engineId
                        ? scan.productImpactByEngineId.get(c.location.engineId) ?? 0
                        : 0
                    }
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12px] text-slate-600">
              เลือก <span className="font-bold text-slate-900">{selectedCount}</span> /{' '}
              <span>{totalCount}</span> รายการ · เพิ่ม{' '}
              <span className="font-bold text-emerald-700">+{newRecordsAdded}</span> record · กระทบสินค้าประมาณ{' '}
              <span className="font-bold text-amber-700">{productsImpacted}</span> fitment
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadBackup}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-3.5" />
                สำรองข้อมูลก่อน
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={busy || selectedCount === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Scissors className="size-3.5" />
                {busy ? 'กำลังแยก...' : `แยก ${selectedCount} รายการ`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateRow({
  cand,
  checked,
  onToggle,
  productImpact,
}: {
  cand: SplitCandidate
  checked: boolean
  onToggle: () => void
  productImpact: number
}) {
  return (
    <tr className={clsx('border-b border-slate-100', checked && 'bg-violet-50/40')}>
      <td className="px-2 py-2 align-top">
        <input type="checkbox" checked={checked} onChange={onToggle} className="size-4" />
      </td>
      <td className="px-2 py-2 align-top">
        <span
          className={clsx(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
            KIND_BADGE[cand.kind],
          )}
        >
          {KIND_LABEL[cand.kind]}
        </span>
        <div className="mt-1 text-[11px] text-slate-500">
          {cand.location.categoryLabel} · {cand.location.brandName}
          {cand.kind !== 'model' && (
            <>
              {' '}
              · {cand.location.modelName}
            </>
          )}
        </div>
        {productImpact > 0 && (
          <div className="mt-0.5 text-[10px] text-amber-600">
            กระทบ {productImpact} fitment
          </div>
        )}
      </td>
      <td className="px-2 py-2 align-top font-mono text-[12px] text-slate-800">
        {cand.originalText}
        <div className="mt-0.5 text-[10px] text-slate-400">
          ตัวคั่น:{' '}
          <code className="rounded bg-slate-100 px-1">
            {cand.delimiter === ' & '
              ? '␣&␣'
              : cand.delimiter === ' + '
                ? '␣+␣'
                : cand.delimiter}
          </code>
        </div>
      </td>
      <td className="px-2 py-2 align-top">
        <div className="flex items-center gap-1.5">
          <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
          <div className="flex flex-wrap gap-1">
            {cand.parts.map((p, i) => (
              <span
                key={i}
                className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] text-emerald-800"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </td>
    </tr>
  )
}
