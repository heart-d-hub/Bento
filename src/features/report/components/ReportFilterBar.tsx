import { useReportFilters, type FilterPreset } from '@/features/report/context/ReportFilterContext'
import { clsx } from 'clsx'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'

const PRESETS: { id: FilterPreset; label: string }[] = [
  { id: 'today',      label: 'วันนี้' },
  { id: 'week',       label: 'สัปดาห์นี้' },
  { id: 'month',      label: 'เดือนนี้' },
  { id: 'last_month', label: 'เดือนที่แล้ว' },
  { id: 'custom',     label: 'กำหนดเอง' },
]

const PAYMENT_OPTIONS = [
  { value: 'cash',     label: 'เงินสด' },
  { value: 'transfer', label: 'โอน/QR' },
  { value: 'account',  label: 'ลงบัญชี' },
  { value: 'mixed',    label: 'ผสม' },
]

const TIER_OPTIONS = [
  { value: 'tier1', label: 'ราคา 1' },
  { value: 'tier2', label: 'ราคา 2' },
  { value: 'tier3', label: 'ราคา 3' },
  { value: 'tier4', label: 'ราคา 4' },
  { value: 'tier5', label: 'ราคา 5' },
]

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">
      {label}
      <button type="button" onClick={onRemove} className="opacity-60 hover:opacity-100">
        <X className="size-2.5" />
      </button>
    </span>
  )
}

export function ReportFilterBar({ onApply }: { onApply?: () => void }) {
  const { filters, options, setFilter, resetFilters, activeCount } = useReportFilters()
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm space-y-2.5">
      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFilter('preset', p.id)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              filters.preset === p.id
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {p.label}
          </button>
        ))}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
          >
            <X className="size-3" />ล้าง ({activeCount})
          </button>
        )}
      </div>

      {/* Custom date range */}
      {filters.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm outline-none focus:border-indigo-400"
          />
          <span className="text-xs text-slate-400">ถึง</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm outline-none focus:border-indigo-400"
          />
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              โหลด
            </button>
          )}
        </div>
      )}

      {/* Quick filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {options && options.categories.length > 0 && (
          <select
            value={filters.category ?? ''}
            onChange={(e) => setFilter('category', e.target.value || null)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
          >
            <option value="">ทุกหมวด</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {options && options.brands.length > 0 && (
          <select
            value={filters.brand ?? ''}
            onChange={(e) => setFilter('brand', e.target.value || null)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
          >
            <option value="">ทุกแบรนด์</option>
            {options.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        <select
          value={filters.paymentType ?? ''}
          onChange={(e) => setFilter('paymentType', e.target.value || null)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
        >
          <option value="">ทุกช่องทาง</option>
          {PAYMENT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        {options && options.branches.length > 1 && (
          <select
            value={filters.branchId ?? ''}
            onChange={(e) => setFilter('branchId', e.target.value || null)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
          >
            <option value="">ทุกสาขา</option>
            {options.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={clsx(
            'ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
            showAdvanced
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          <Filter className="size-3" />ขั้นสูง
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2.5">
          {options && options.memberTypes.length > 0 && (
            <select
              value={filters.memberType ?? ''}
              onChange={(e) => setFilter('memberType', e.target.value || null)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
            >
              <option value="">ทุกประเภทลูกค้า</option>
              {options.memberTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <select
            value={filters.priceTier ?? ''}
            onChange={(e) => setFilter('priceTier', e.target.value || null)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400"
          >
            <option value="">ทุกระดับราคา</option>
            {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.category    && <FilterChip label={`หมวด: ${filters.category}`}    onRemove={() => setFilter('category', null)} />}
          {filters.brand       && <FilterChip label={`แบรนด์: ${filters.brand}`}      onRemove={() => setFilter('brand', null)} />}
          {filters.paymentType && <FilterChip label={`ชำระ: ${PAYMENT_OPTIONS.find(p => p.value === filters.paymentType)?.label ?? filters.paymentType}`}
                                               onRemove={() => setFilter('paymentType', null)} />}
          {filters.branchId    && options && <FilterChip label={`สาขา: ${options.branches.find(b => b.id === filters.branchId)?.name ?? filters.branchId}`}
                                               onRemove={() => setFilter('branchId', null)} />}
          {filters.memberType  && <FilterChip label={`ลูกค้า: ${filters.memberType}`} onRemove={() => setFilter('memberType', null)} />}
          {filters.priceTier   && <FilterChip label={`ราคา: ${TIER_OPTIONS.find(t => t.value === filters.priceTier)?.label ?? filters.priceTier}`}
                                               onRemove={() => setFilter('priceTier', null)} />}
        </div>
      )}
    </div>
  )
}
