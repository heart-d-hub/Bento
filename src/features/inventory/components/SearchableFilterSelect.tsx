import { useEffect, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Search, X } from 'lucide-react'

export type SearchableFilterSelectProps = {
  value: string
  options: string[]
  /** Sentinel value that means "all / no filter" — shown at the top */
  allValue: string
  allLabel?: string
  onChange: (next: string) => void
  className?: string
  placeholder?: string
  ariaLabel?: string
}

/**
 * Compact dropdown that lets the user type to filter the option list.
 * Use as a drop-in replacement for a native <select> when the option count
 * is large (engine/year/model filters).
 */
export function SearchableFilterSelect({
  value,
  options,
  allValue,
  allLabel,
  onChange,
  className,
  placeholder,
  ariaLabel,
}: SearchableFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_./()]+/g, '')
    const trimmed = query.trim()
    const q = normalize(trimmed)
    if (!q) return options
    // Year-aware matching: if query is a single 4-digit year, also match
    // ranges that include it ("2015" matches "2012-2019" / "1990+" / "ถึง 2020").
    const yearM = trimmed.match(/^(\d{4})$/)
    const queryYear = yearM ? parseInt(yearM[1], 10) : null
    return options.filter((o) => {
      if (normalize(o).includes(q)) return true
      if (queryYear == null) return false
      // "YYYY-YYYY" range
      const range = o.match(/(\d{4})\s*[-–]\s*(\d{4})/)
      if (range) {
        const from = parseInt(range[1], 10)
        const to = parseInt(range[2], 10)
        return queryYear >= from && queryYear <= to
      }
      // "YYYY+" open-ended
      const open = o.match(/^(\d{4})\+\s*$/)
      if (open) {
        const from = parseInt(open[1], 10)
        return queryYear >= from
      }
      // "ถึง YYYY" closed at end (Thai "until")
      const til = o.match(/ถึง\s*(\d{4})/)
      if (til) {
        const to = parseInt(til[1], 10)
        return queryYear <= to
      }
      return false
    })
  }, [options, query])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlighted(0)
      window.setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${highlighted}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlighted])

  const allText = allLabel ?? allValue
  const isAll = value === allValue
  const showLabel = isAll ? (placeholder ?? allText) : value

  function commit(v: string) {
    onChange(v)
    setOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted === 0) commit(allValue)
      else {
        const opt = filtered[highlighted - 1]
        if (opt !== undefined) commit(opt)
      }
    }
  }

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full min-w-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-left text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        title={showLabel}
      >
        <span className={clsx('flex-1 truncate', isAll && 'text-slate-500')}>
          {showLabel || allText}
        </span>
        {value !== allValue ? (
          <button
            type="button"
            aria-label="ล้างตัวกรอง"
            onClick={(e) => {
              e.stopPropagation()
              commit(allValue)
            }}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-[12rem] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="พิมพ์เพื่อค้นหา..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlighted(0)
              }}
              onKeyDown={handleKey}
              className="w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
          </div>
          <div ref={listRef} className="max-h-64 overflow-y-auto py-1 text-sm" role="listbox">
            <button
              type="button"
              data-i={0}
              onClick={() => commit(allValue)}
              onMouseEnter={() => setHighlighted(0)}
              className={clsx(
                'flex w-full items-center px-3 py-1.5 text-left',
                value === allValue && 'font-semibold text-slate-900',
                highlighted === 0 ? 'bg-slate-100' : 'hover:bg-slate-50',
              )}
            >
              {allText}
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs italic text-slate-400">ไม่พบรายการที่ตรง</div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  data-i={i + 1}
                  onClick={() => commit(opt)}
                  onMouseEnter={() => setHighlighted(i + 1)}
                  className={clsx(
                    'flex w-full items-center px-3 py-1.5 text-left',
                    value === opt && 'font-semibold text-slate-900',
                    highlighted === i + 1 ? 'bg-slate-100' : 'hover:bg-slate-50',
                  )}
                  title={opt}
                >
                  <span className="truncate">{opt}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
