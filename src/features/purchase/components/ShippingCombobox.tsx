import { loadPurchaseOrders } from '@/features/purchase/data/poStore'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const SHIPPING_STATIC = [
  { value: 'รับเอง', label: 'รับเอง' },
  { value: 'ส่งฟรี', label: 'ส่งฟรี (ร้านค้าส่ง)' },
]

type Props = {
  value: string
  supplierId: string
  transportNames: string[]
  onChange: (v: string) => void
  disabled?: boolean
  /** 'inline' = bare button trigger (cart header); 'field' = bordered input-style trigger (PO detail) */
  variant?: 'inline' | 'field'
}

export function ShippingCombobox({ value, supplierId, transportNames, onChange, disabled, variant = 'inline' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const history = useMemo(() => {
    if (!supplierId) return []
    const all = loadPurchaseOrders()
    const seen = new Set<string>()
    const result: string[] = []
    for (const po of all
      .filter((p) => p.supplierId === supplierId && p.shippingMethod)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const m = po.shippingMethod!
      if (!seen.has(m)) { seen.add(m); result.push(m) }
    }
    return result
  }, [supplierId])

  const openDropdown = () => {
    if (disabled) return
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const dropH = 260
      const spaceBelow = window.innerHeight - r.bottom
      const top = spaceBelow >= dropH ? r.bottom + 2 : Math.max(8, r.top - dropH)
      setPos({ top, left: r.left, width: Math.max(r.width, 200) })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    setTimeout(() => searchRef.current?.focus(), 10)
    const onMouse = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    const onScroll = () => { setOpen(false); setQuery('') }
    document.addEventListener('mousedown', onMouse)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const q = query.toLowerCase()
  const historySet = new Set(history)
  const filteredHistory = history.filter((n) => !q || n.toLowerCase().includes(q))
  const filteredStatic = SHIPPING_STATIC.filter((o) => !historySet.has(o.value) && (!q || o.label.toLowerCase().includes(q)))
  const filteredTransport = transportNames.filter((n) => !historySet.has(n) && (!q || n.toLowerCase().includes(q)))
  const displayLabel = SHIPPING_STATIC.find((o) => o.value === value)?.label ?? value
  const isRecommended = history.length > 0 && value === history[0]

  const select = (v: string) => { onChange(v); setOpen(false); setQuery('') }

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="border-b border-slate-100 p-1.5">
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา…"
          className="w-full rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {value && !query && (
          <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery('') }}
            className="w-full px-3 py-1.5 text-left text-[10px] text-slate-400 hover:bg-slate-50">
            — ไม่ระบุ —
          </button>
        )}
        {filteredHistory.length > 0 && (
          <>
            <p className="px-3 pt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">เคยใช้กับร้านนี้</p>
            {filteredHistory.map((name, idx) => (
              <button key={name} type="button" onClick={() => select(name)}
                className={clsx('flex w-full items-center justify-between px-3 py-1.5 text-left text-[10px] hover:bg-emerald-50',
                  value === name ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-700')}>
                <span>{SHIPPING_STATIC.find((o) => o.value === name)?.label ?? name}</span>
                {idx === 0 && (
                  <span className="ml-2 shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                    แนะนำ
                  </span>
                )}
              </button>
            ))}
          </>
        )}
        {filteredStatic.length > 0 && (
          <>
            {filteredHistory.length > 0 && <div className="mx-3 my-1 border-t border-slate-100" />}
            {filteredHistory.length > 0 && (
              <p className="px-3 pt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">วิธีรับสินค้า</p>
            )}
            {filteredStatic.map((o) => (
              <button key={o.value} type="button" onClick={() => select(o.value)}
                className={clsx('w-full px-3 py-1.5 text-left text-[10px] hover:bg-slate-50',
                  value === o.value ? 'font-semibold text-slate-800' : 'text-slate-700')}>
                {o.label}
              </button>
            ))}
          </>
        )}
        {filteredTransport.length > 0 && (
          <>
            {(filteredHistory.length > 0 || filteredStatic.length > 0) && <div className="mx-3 my-1 border-t border-slate-100" />}
            <p className="px-3 pt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">บริษัทขนส่ง</p>
            {filteredTransport.map((name) => (
              <button key={name} type="button" onClick={() => select(name)}
                className={clsx('w-full px-3 py-1.5 text-left text-[10px] hover:bg-slate-50',
                  value === name ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                {name}
              </button>
            ))}
          </>
        )}
        {filteredHistory.length === 0 && filteredStatic.length === 0 && filteredTransport.length === 0 && (
          <p className="py-3 text-center text-[10px] text-slate-400">ไม่พบ</p>
        )}
      </div>
    </div>,
    document.body,
  ) : null

  if (variant === 'field') {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={openDropdown}
          disabled={disabled}
          className={clsx(
            'flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs outline-none transition',
            disabled
              ? 'cursor-default border-slate-100 bg-slate-100 text-slate-500'
              : 'border-slate-200 bg-white hover:border-amber-400 focus:border-amber-400',
            !value && 'text-slate-400',
          )}
        >
          <span className="flex items-center gap-1.5">
            {displayLabel || 'Kerry / Flash / รับเอง'}
            {isRecommended && !disabled && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">แนะนำ</span>
            )}
          </span>
          {!disabled && <ChevronDown className={clsx('size-3 text-slate-400 transition', open && 'rotate-180')} />}
        </button>
        {dropdown}
      </>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className="flex items-center gap-0.5 bg-transparent text-[10px] outline-none"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>{displayLabel || '— ขนส่ง —'}</span>
        {isRecommended && (
          <span className="ml-1 rounded-full bg-emerald-100 px-1 py-0.5 text-[8px] font-bold text-emerald-700">แนะนำ</span>
        )}
        <ChevronDown className={clsx('size-2.5 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {dropdown}
    </>
  )
}
