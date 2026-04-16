import type { InventoryProduct } from '@/features/inventory/data/mockInventory'
import { clsx } from 'clsx'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AssemblyProductComboboxProps = {
  products: InventoryProduct[]
  value: string
  onChange: (productId: string) => void
  className?: string
  /** จำกัดรายการเมื่อไม่พิมพ์ค้นหา (ป้องกัน DOM หนัก) */
  maxInitial?: number
}

/** สูงกว่า overlay modal (z-150) เพื่อไม่ถูกบัง */
const PANEL_Z = 10_000

type PanelGeom = {
  top: number
  left: number
  width: number
  maxHeight: number
}

function productLabel(p: InventoryProduct): string {
  return `${p.sku} — ${p.name}`
}

function matchesQuery(p: InventoryProduct, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    p.sku.toLowerCase().includes(s) ||
    p.name.toLowerCase().includes(s) ||
    (p.genuineNo?.trim() && p.genuineNo.toLowerCase().includes(s)) ||
    (p.factoryOem?.trim() && p.factoryOem.toLowerCase().includes(s)) ||
    p.brand.toLowerCase().includes(s) ||
    p.category.toLowerCase().includes(s)
  )
}

export function AssemblyProductCombobox({
  products,
  value,
  onChange,
  className,
  maxInitial = 80,
}: AssemblyProductComboboxProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [panelGeom, setPanelGeom] = useState<PanelGeom | null>(null)

  const selected = useMemo(() => products.find((p) => p.id === value) ?? null, [products, value])

  const filtered = useMemo(() => {
    const q = query.trim()
    const list = q ? products.filter((p) => matchesQuery(p, q)) : products.slice(0, maxInitial)
    return list
  }, [products, query, maxInitial])

  const syncQueryFromValue = useCallback(() => {
    setQuery(selected ? productLabel(selected) : '')
  }, [selected])

  useEffect(() => {
    if (!open) syncQueryFromValue()
  }, [value, open, syncQueryFromValue])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector(`[data-index="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open, filtered.length])

  const updatePanelGeom = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const maxList = 13 * 16 /* max-h-52 ≈ 13rem */
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const maxHeight = Math.min(maxList, Math.max(120, spaceBelow))
    setPanelGeom({
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPanelGeom(null)
      return
    }
    updatePanelGeom()
    const onScrollOrResize = () => updatePanelGeom()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePanelGeom])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t)) return
      if (portalRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const onBlurInput = () => {
    requestAnimationFrame(() => {
      const ae = document.activeElement
      if (wrapRef.current?.contains(ae)) return
      if (portalRef.current?.contains(ae)) return
      setOpen(false)
    })
  }

  const pick = useCallback(
    (id: string) => {
      onChange(id)
      setOpen(false)
      const p = products.find((x) => x.id === id)
      setQuery(p ? productLabel(p) : '')
    },
    [onChange, products],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      setQuery('')
      e.preventDefault()
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      syncQueryFromValue()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filtered.length === 0) return
      setHighlight((i) => (i + 1) % filtered.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filtered.length === 0) return
      setHighlight((i) => (i - 1 + filtered.length) % filtered.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const p = filtered[highlight]
      if (p) pick(p.id)
    }
  }

  const inputCls = clsx(
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm outline-none',
    'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200',
    className,
  )

  const portalHost = typeof document !== 'undefined' ? document.body : null

  const listPanel =
    open && panelGeom && filtered.length > 0 ? (
      <div
        ref={portalRef}
        role="listbox"
        style={{
          position: 'fixed',
          top: panelGeom.top,
          left: panelGeom.left,
          width: panelGeom.width,
          maxHeight: panelGeom.maxHeight,
          zIndex: PANEL_Z,
        }}
        className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white py-0.5 shadow-lg"
      >
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === value}
              data-index={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(p.id)}
              className={clsx(
                'flex w-full cursor-pointer items-start gap-2 px-2 py-1.5 text-left text-[11px] leading-snug',
                i === highlight ? 'bg-cyan-50 text-cyan-950' : 'text-slate-800 hover:bg-slate-50',
              )}
            >
              <span className="shrink-0 font-mono tabular-nums text-slate-600">{p.sku}</span>
              <span className="min-w-0 flex-1 break-words">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null

  const emptyPanel =
    open && panelGeom && query.trim() && filtered.length === 0 ? (
      <div
        ref={portalRef}
        style={{
          position: 'fixed',
          top: panelGeom.top,
          left: panelGeom.left,
          width: panelGeom.width,
          zIndex: PANEL_Z,
        }}
        className="rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-500 shadow-lg"
      >
        ไม่พบสินค้าที่ตรงกับคำค้น
      </div>
    ) : null

  return (
    <div ref={wrapRef} className="relative min-w-[12rem]">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onBlur={onBlurInput}
        onKeyDown={onKeyDown}
        placeholder="พิมพ์ค้นหา SKU / ชื่อ…"
        className={inputCls}
      />
      {portalHost && listPanel ? createPortal(listPanel, portalHost) : null}
      {portalHost && emptyPanel ? createPortal(emptyPanel, portalHost) : null}
    </div>
  )
}
