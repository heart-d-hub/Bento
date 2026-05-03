import { getSupplierCreditTerms, setSupplierCreditTerms } from '@/features/finance/data/creditTermsStore'
import { DEFAULT_SUPPLIER_CREDIT, describeSupplierCreditRule } from '@/features/finance/data/supplierPaymentDueDate'
import {
  createSupplierProfile,
  nextSupplierDisplayCode,
  upsertSupplierProfile,
  type SupplierProfile,
  type SupplierBankAccount,
  type EarlyPayDiscount,
  type DefaultDiscountByBrand,
} from '@/features/purchase/data/supplierDirectoryStore'
import {
  getSupplierCatalog,
  saveSupplierCatalogItems,
  type SupplierCatalogItem,
} from '@/features/purchase/data/supplierCatalogStore'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  loadTransportDirectory,
  TRANSPORT_DIRECTORY_CHANGED_EVENT,
} from '@/features/transport/data/transportDirectoryStore'
import { clsx } from 'clsx'
import { Pencil, Plus, Save, Tag, Trash2, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

/** เลย์เอาต์ช่องตัวเลขเครดิตให้สอดคล้องกับฟอร์มสมาชิก */
const supplierCreditTinyNumClass =
  'h-6 w-[2rem] min-w-[2rem] shrink-0 rounded border border-slate-200 bg-white px-0.5 py-0 text-center text-[10px] font-medium tabular-nums text-slate-900 shadow-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200'
const supplierCreditLabelClass = 'mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500'

type SupplierProfileModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialProfile: SupplierProfile | null
  onClose: () => void
  onSaved: (profile: SupplierProfile, mode: 'create' | 'edit') => void
}

const SHIPPING_EXTRA_OPTIONS = [
  { value: 'รับสินค้าเอง', label: 'รับสินค้าเอง' },
] as const

type PrimaryPaymentKey = 'cash' | 'transfer' | 'both' | 'credit'

function primaryPaymentFlags(k: PrimaryPaymentKey): { acceptsCash: boolean; acceptsTransfer: boolean } {
  if (k === 'cash') return { acceptsCash: true, acceptsTransfer: false }
  if (k === 'transfer') return { acceptsCash: false, acceptsTransfer: true }
  return { acceptsCash: true, acceptsTransfer: true }
}

function primaryPaymentFromProfile(p: SupplierProfile): PrimaryPaymentKey {
  const ac = p.acceptsCash !== false
  const at = p.acceptsTransfer !== false
  if (ac && !at) return 'cash'
  if (!ac && at) return 'transfer'
  if (ac && at) return 'both'
  return 'credit'
}

function parseBrandsComma(s: string): string[] | undefined {
  const parts = s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
  return parts.length ? parts : undefined
}

function BrandTagInput({
  brands,
  onChange,
}: {
  brands: string[]
  onChange: (next: string[]) => void
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addBrand = (raw: string) => {
    const tags = raw.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    if (!tags.length) return
    const next = [...brands]
    for (const tag of tags) {
      if (!next.some((b) => b.toLowerCase() === tag.toLowerCase())) {
        next.push(tag)
      }
    }
    onChange(next)
    setInput('')
  }

  const removeBrand = (idx: number) => {
    onChange(brands.filter((_, i) => i !== idx))
  }

  return (
    <div
      className="mt-1 flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {brands.map((b, i) => (
        <span
          key={`${b}-${i}`}
          className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-800"
        >
          {b}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeBrand(i) }}
            className="ml-0.5 text-indigo-400 hover:text-rose-500"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addBrand(input)
          } else if (e.key === 'Backspace' && !input && brands.length > 0) {
            removeBrand(brands.length - 1)
          }
        }}
        onBlur={() => { if (input.trim()) addBrand(input) }}
        placeholder={brands.length === 0 ? 'พิมพ์ชื่อแบรนด์ แล้ว Enter หรือ , เช่น Brembo' : 'เพิ่มแบรนด์…'}
        className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  )
}

type CatalogRowDraft = {
  id: string
  productId: string | null
  sku: string
  name: string
  priceStr: string
}

function CatalogSection({
  supplierId,
  rows,
  onChange,
}: {
  supplierId: string | null
  rows: CatalogRowDraft[]
  onChange: (rows: CatalogRowDraft[]) => void
}) {
  const [searchQ, setSearchQ] = useState<Record<string, string>>({})
  const [dropdownId, setDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const allProducts = useMemo(() => getPosCatalogProducts(), [])

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownId(null)
    }
    document.addEventListener('pointerdown', close, true)
    return () => document.removeEventListener('pointerdown', close, true)
  }, [])

  const addRow = () => {
    const id = `cr-${Date.now()}`
    onChange([...rows, { id, productId: null, sku: '', name: '', priceStr: '' }])
    setSearchQ((q) => ({ ...q, [id]: '' }))
  }

  const deleteRow = (id: string) =>
    onChange(rows.filter((r) => r.id !== id))

  const updatePrice = (id: string, priceStr: string) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, priceStr } : r)))

  const selectProduct = (rowId: string, product: { id: string; sku: string; name: string }) => {
    onChange(
      rows.map((r) =>
        r.id === rowId ? { ...r, productId: product.id, sku: product.sku, name: product.name } : r,
      ),
    )
    setDropdownId(null)
    setSearchQ((q) => ({ ...q, [rowId]: '' }))
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">รายการสินค้าที่จำหน่าย</p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="size-3" aria-hidden />
          เพิ่มสินค้า
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">ยังไม่มีสินค้า — กด «เพิ่มสินค้า»</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => {
            const q = searchQ[row.id] ?? ''
            const hits = q.length >= 1
              ? allProducts
                  .filter((p) => {
                    const t = q.toLowerCase()
                    return p.sku.toLowerCase().includes(t) || p.name.toLowerCase().includes(t)
                  })
                  .slice(0, 8)
              : []

            return (
              <div key={row.id} className="relative flex items-center gap-1.5">
                <div className="relative min-w-0 flex-1" ref={dropdownId === row.id ? dropdownRef : undefined}>
                  {row.name ? (
                    <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                        {row.sku && <span className="mr-1 text-slate-500">[{row.sku}]</span>}
                        {row.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(rows.map((r) => (r.id === row.id ? { ...r, productId: null, sku: '', name: '' } : r)))
                          setSearchQ((q2) => ({ ...q2, [row.id]: '' }))
                        }}
                        className="shrink-0 text-slate-400 hover:text-rose-500"
                        title="เปลี่ยนสินค้า"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <input
                      className={inputClass}
                      placeholder="ค้นหาสินค้า (SKU / ชื่อ)..."
                      value={q}
                      onChange={(e) => {
                        setSearchQ((prev) => ({ ...prev, [row.id]: e.target.value }))
                        setDropdownId(row.id)
                      }}
                      onFocus={() => setDropdownId(row.id)}
                    />
                  )}
                  {dropdownId === row.id && hits.length > 0 && (
                    <div className="absolute left-0 top-full z-[200] mt-0.5 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {hits.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sky-50"
                          onClick={() => selectProduct(row.id, p)}
                        >
                          <span className="w-16 shrink-0 text-[10px] text-slate-500">{p.sku}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-800">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-24 shrink-0">
                  <input
                    className={inputClass}
                    placeholder="ราคา ฿"
                    value={row.priceStr}
                    onChange={(e) => updatePrice(row.id, e.target.value)}
                    inputMode="decimal"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => deleteRow(row.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="ลบ"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type SupplierMasterFormProps = {
  mode: 'create' | 'edit'
  initialProfile: SupplierProfile | null
  onClose: () => void
  onSaved: (profile: SupplierProfile, mode: 'create' | 'edit') => void
}

function catalogItemsToDrafts(items: SupplierCatalogItem[]): CatalogRowDraft[] {
  return items.map((item, i) => ({
    id: `cr-existing-${i}-${item.sku}`,
    productId: item.productId,
    sku: item.sku,
    name: item.name,
    priceStr: item.lastPrice > 0 ? String(item.lastPrice) : '',
  }))
}

function SupplierMasterForm({ mode, initialProfile, onClose, onSaved }: SupplierMasterFormProps) {
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [primaryPayment, setPrimaryPayment] = useState<PrimaryPaymentKey>('cash')
  const [creditTermDays, setCreditTermDays] = useState(DEFAULT_SUPPLIER_CREDIT.creditDays)
  const [creditTermMonths, setCreditTermMonths] = useState(DEFAULT_SUPPLIER_CREDIT.creditMonths)
  const [payAtMonthEnd, setPayAtMonthEnd] = useState(DEFAULT_SUPPLIER_CREDIT.payAtEndOfDueMonth)
  const [cutOffDayOfMonth, setCutOffDayOfMonth] = useState<number | null>(null)
  const [excludePurchaseMonth, setExcludePurchaseMonth] = useState(DEFAULT_SUPPLIER_CREDIT.excludePurchaseMonth)
  const [address, setAddress] = useState('')
  const [defaultShipping, setDefaultShipping] = useState('')
  const [brands, setBrands] = useState<string[]>([])
  const [catalogRows, setCatalogRows] = useState<CatalogRowDraft[]>([])
  const [bankAccounts, setBankAccounts] = useState<SupplierBankAccount[]>([])
  const [earlyPayDiscounts, setEarlyPayDiscounts] = useState<EarlyPayDiscount[]>([])
  const [defaultDiscountByBrand, setDefaultDiscountByBrand] = useState<DefaultDiscountByBrand[]>([])
  const [priceListVatMode, setPriceListVatMode] = useState<'vat_included' | 'vat_excluded' | 'no_vat'>('vat_excluded')
  const [transportNames, setTransportNames] = useState<string[]>(() =>
    loadTransportDirectory().map((c) => c.name),
  )

  useEffect(() => {
    const onChanged = () => setTransportNames(loadTransportDirectory().map((c) => c.name))
    window.addEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(TRANSPORT_DIRECTORY_CHANGED_EVENT, onChanged)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (mode === 'create') {
      setName('')
      setTaxId('')
      setContactName('')
      setPhone('')
      setLineId('')
      setPrimaryPayment('cash')
      setCreditTermDays(DEFAULT_SUPPLIER_CREDIT.creditDays)
      setCreditTermMonths(DEFAULT_SUPPLIER_CREDIT.creditMonths)
      setPayAtMonthEnd(DEFAULT_SUPPLIER_CREDIT.payAtEndOfDueMonth)
      setCutOffDayOfMonth(null)
      setExcludePurchaseMonth(DEFAULT_SUPPLIER_CREDIT.excludePurchaseMonth)
      setAddress('')
      setDefaultShipping('')
      setBrands([])
      setBankAccounts([])
      setEarlyPayDiscounts([])
      setPriceListVatMode('vat_excluded')
      setCatalogRows([])
      return
    }
    if (!initialProfile) return
    const p = initialProfile
    setName(p.name)
    setTaxId(p.taxId ?? '')
    setContactName(p.contactName ?? '')
    setPhone(p.phone ?? '')
    setLineId(p.lineId ?? '')
    setPrimaryPayment(primaryPaymentFromProfile(p))
    setAddress(p.address ?? '')
    setDefaultShipping(p.defaultShipping ?? '')
    setBrands(p.brandsSold ?? [])
    setBankAccounts(p.bankAccounts ?? [])
    setEarlyPayDiscounts(p.earlyPayDiscounts ?? [])
    setDefaultDiscountByBrand(p.defaultDiscountByBrand ?? [])
    setPriceListVatMode(p.priceListVatMode ?? 'vat_excluded')
    const c = getSupplierCreditTerms(p.id)
    setCreditTermDays(Math.min(99, Math.max(0, c.creditDays)))
    setCreditTermMonths(Math.min(99, Math.max(0, c.creditMonths ?? 0)))
    setPayAtMonthEnd(c.payAtEndOfDueMonth)
    setCutOffDayOfMonth(c.statementCutoffDay)
    setExcludePurchaseMonth(c.excludePurchaseMonth)
    setCatalogRows(catalogItemsToDrafts(getSupplierCatalog(p.id)))
  }, [mode, initialProfile])

  const shippingSelectOptions = useMemo(() => {
    const v = defaultShipping.trim()
    const base: { value: string; label: string }[] = [
      { value: '', label: '-- ไม่ระบุ --' },
      ...transportNames.map((n) => ({ value: n, label: n })),
      ...SHIPPING_EXTRA_OPTIONS,
    ]
    if (v && !base.some((o) => o.value === v)) {
      return [{ value: v, label: v }, ...base]
    }
    return base
  }, [defaultShipping, transportNames])

  const creditPreviewSlice = {
    creditDays: Math.min(99, Math.max(0, creditTermDays)),
    creditMonths: Math.min(99, Math.max(0, creditTermMonths)),
    payAtEndOfDueMonth: payAtMonthEnd,
    statementCutoffDay:
      cutOffDayOfMonth != null
        ? Math.min(31, Math.max(1, cutOffDayOfMonth))
        : DEFAULT_SUPPLIER_CREDIT.statementCutoffDay,
    excludePurchaseMonth,
  }

  const submit = () => {
    const nm = name.trim()
    if (!nm) {
      window.alert('กรุณากรอกชื่อร้าน/บริษัท')
      return
    }
    const flags = primaryPaymentFlags(primaryPayment)
    const cd = Math.min(99, Math.max(0, Math.floor(Number(creditTermDays) || 0)))
    const cm = Math.min(99, Math.max(0, Math.floor(Number(creditTermMonths) || 0)))
    const co =
      cutOffDayOfMonth != null ? Math.min(31, Math.max(1, Math.floor(cutOffDayOfMonth))) : DEFAULT_SUPPLIER_CREDIT.statementCutoffDay

    const termsPayload = {
      ...DEFAULT_SUPPLIER_CREDIT,
      creditDays: cd,
      creditMonths: cm,
      payAtEndOfDueMonth: payAtMonthEnd,
      statementCutoffDay: co,
      excludePurchaseMonth,
    }

    const now = new Date().toISOString()
    const catalogItems: SupplierCatalogItem[] = catalogRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        productId: r.productId,
        sku: r.sku,
        name: r.name.trim(),
        lastPrice: parseFloat(r.priceStr.replace(/,/g, '')) || 0,
        lastQty: 1,
        lastBoughtAt: now,
      }))

    const cleanedBankAccounts = bankAccounts
      .map((a) => ({
        bankName: a.bankName?.trim() || undefined,
        accountNo: a.accountNo?.trim() || undefined,
        accountName: a.accountName?.trim() || undefined,
      }))
      .filter((a) => a.bankName || a.accountNo)

    if (mode === 'create') {
      const created = createSupplierProfile({
        supplierCode: nextSupplierDisplayCode(),
        name: nm,
        taxId: taxId.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        contactName: contactName.trim() || undefined,
        lineId: lineId.trim() || undefined,
        brandsSold: brands.length ? brands : undefined,
        defaultShipping: defaultShipping.trim() || undefined,
        acceptsCash: flags.acceptsCash,
        acceptsTransfer: flags.acceptsTransfer,
        bankAccounts: cleanedBankAccounts.length ? cleanedBankAccounts : undefined,
        earlyPayDiscounts: earlyPayDiscounts.length ? earlyPayDiscounts : undefined,
        defaultDiscountByBrand: defaultDiscountByBrand.length ? defaultDiscountByBrand : undefined,
        regularProductCount: catalogItems.length,
        priceListVatMode,
      })
      setSupplierCreditTerms(created.id, termsPayload)
      saveSupplierCatalogItems(created.id, catalogItems)
      onSaved(created, 'create')
      onClose()
      return
    }

    if (!initialProfile?.id) return
    const profile: SupplierProfile = {
      ...initialProfile,
      name: nm,
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      contactName: contactName.trim() || undefined,
      lineId: lineId.trim() || undefined,
      brandsSold: brands.length ? brands : undefined,
      defaultShipping: defaultShipping.trim() || undefined,
      acceptsCash: flags.acceptsCash,
      acceptsTransfer: flags.acceptsTransfer,
      bankAccounts: cleanedBankAccounts.length ? cleanedBankAccounts : undefined,
      earlyPayDiscounts: earlyPayDiscounts.length ? earlyPayDiscounts : undefined,
      defaultDiscountByBrand: defaultDiscountByBrand.length ? defaultDiscountByBrand : undefined,
      regularProductCount: catalogItems.length,
      priceListVatMode,
    }
    upsertSupplierProfile(profile)
    setSupplierCreditTerms(profile.id, termsPayload)
    saveSupplierCatalogItems(profile.id, catalogItems)
    onSaved(profile, 'edit')
    onClose()
  }

  const title =
    mode === 'create' ? 'เพิ่มผู้จัดจำหน่ายใหม่ (Supplier Master)' : 'แก้ไขผู้จัดจำหน่าย (Supplier Master)'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              {mode === 'create' ? <UserPlus className="size-5" aria-hidden /> : <Pencil className="size-5" aria-hidden />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="ปิด">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[11px] font-medium text-slate-700">
              ชื่อร้าน/บริษัท <span className="text-rose-600">*</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น บจก. ออโต้พาร์ท"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              เลขประจำตัวผู้เสียภาษี
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เลข 13 หลัก"
                inputMode="numeric"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              ชื่อผู้ติดต่อ (เซลล์)
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น คุณวิชัย"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-[11px] font-medium text-slate-700">
              เบอร์โทรศัพท์
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น 02-123-4567"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              LINE ID
              <input
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="เช่น @autopart"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              เงื่อนไขชำระเงินหลัก
              <select
                value={primaryPayment}
                onChange={(e) => setPrimaryPayment(e.target.value as PrimaryPaymentKey)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="cash">เงินสด (Cash)</option>
                <option value="transfer">เงินโอน (Bank transfer)</option>
                <option value="both">เงินสด + โอน</option>
                <option value="credit">เครดิต (Credit)</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">เครดิต</p>
            <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
              <div>
                <label className={supplierCreditLabelClass} htmlFor="sup-master-credit-days">
                  เครดิต (วัน)
                </label>
                <input
                  id="sup-master-credit-days"
                  type="number"
                  min={0}
                  max={99}
                  value={Math.min(99, creditTermDays)}
                  onChange={(e) => {
                    const n = Math.floor(Number(e.target.value) || 0)
                    setCreditTermDays(Math.min(99, Math.max(0, n)))
                  }}
                  className={supplierCreditTinyNumClass}
                  title="0–99 วัน"
                />
              </div>
              <div>
                <label className={supplierCreditLabelClass} htmlFor="sup-master-credit-months">
                  เครดิต (เดือน)
                </label>
                <input
                  id="sup-master-credit-months"
                  type="number"
                  min={0}
                  max={99}
                  value={Math.min(99, creditTermMonths)}
                  onChange={(e) => {
                    const n = Math.floor(Number(e.target.value) || 0)
                    setCreditTermMonths(Math.min(99, Math.max(0, n)))
                  }}
                  className={supplierCreditTinyNumClass}
                  title="0–99 เดือน"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-1 pb-0.5 text-[10px] font-medium text-slate-800">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-slate-300"
                  checked={payAtMonthEnd}
                  onChange={(e) => setPayAtMonthEnd(e.target.checked)}
                />
                สิ้นเดือน
              </label>
              <div className="flex items-end gap-1">
                <span className="pb-1.5 text-[10px] font-medium text-slate-500">ตัดวันที่</span>
                <div>
                  <label className="sr-only" htmlFor="sup-master-cutoff">
                    ตัดวันที่ (1–31)
                  </label>
                  <input
                    id="sup-master-cutoff"
                    type="number"
                    min={1}
                    max={31}
                    value={cutOffDayOfMonth ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') {
                        setCutOffDayOfMonth(null)
                        return
                      }
                      const n = Math.min(31, Math.max(1, Number(v) || 1))
                      setCutOffDayOfMonth(n)
                    }}
                    placeholder="—"
                    className={supplierCreditTinyNumClass}
                    title="ว่าง = ใช้ค่าเริ่มต้น 25 · หรือระบุ 1–31"
                  />
                </div>
              </div>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={excludePurchaseMonth}
                onChange={(e) => setExcludePurchaseMonth(e.target.checked)}
                className="rounded"
              />
              ไม่รวมเดือนซื้อ
            </label>
            <p className="mt-2 rounded border border-slate-100 bg-white px-2 py-1.5 text-[10px] leading-relaxed text-slate-600">
              {describeSupplierCreditRule({
                ...DEFAULT_SUPPLIER_CREDIT,
                ...creditPreviewSlice,
              })}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="block text-[11px] font-medium text-slate-700 lg:col-span-1">
              ที่อยู่ (สำหรับการเปิดบิล/ออกใบกำกับภาษี)
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              ขนส่งประจำ
              <select
                value={defaultShipping}
                onChange={(e) => setDefaultShipping(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                {shippingSelectOptions.map((o) => (
                  <option key={`${o.value}-${o.label}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <Tag className="size-3.5 text-indigo-500" />
              แบรนด์ที่จำหน่าย
              {brands.length > 0 && (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {brands.length}
                </span>
              )}
            </label>
            <BrandTagInput brands={brands} onChange={setBrands} />
            <p className="mt-1 text-[10px] text-slate-400">
              พิมพ์ชื่อแบรนด์แล้วกด Enter หรือ , เพื่อเพิ่ม · กด Backspace เพื่อลบแบรนด์สุดท้าย
            </p>
          </div>

          {/* ─── Bank Accounts ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                บัญชีธนาคาร (สำหรับโอนชำระ)
              </p>
              <button
                type="button"
                onClick={() => setBankAccounts((prev) => [...prev, { bankName: '', accountNo: '', accountName: '' }])}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="size-3" aria-hidden />
                เพิ่มบัญชี
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">ยังไม่มีบัญชีธนาคาร — กด «เพิ่มบัญชี»</p>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map((acct, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <input
                      value={acct.bankName ?? ''}
                      onChange={(e) => setBankAccounts((prev) => prev.map((a, i) => i === idx ? { ...a, bankName: e.target.value } : a))}
                      placeholder="ธนาคาร เช่น กสิกร"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                    />
                    <input
                      value={acct.accountNo ?? ''}
                      onChange={(e) => setBankAccounts((prev) => prev.map((a, i) => i === idx ? { ...a, accountNo: e.target.value } : a))}
                      placeholder="เลขบัญชี"
                      inputMode="numeric"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                    />
                    <input
                      value={acct.accountName ?? ''}
                      onChange={(e) => setBankAccounts((prev) => prev.map((a, i) => i === idx ? { ...a, accountName: e.target.value } : a))}
                      placeholder="ชื่อบัญชี"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => setBankAccounts((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="ลบบัญชี"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Early Payment Discounts ─────────────────────────────── */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                  ส่วนลดจ่ายก่อนกำหนด (Early Payment Discount)
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">จ่ายภายใน X วัน จากวันยืนยัน PO ได้ส่วนลด Y%</p>
              </div>
              <button
                type="button"
                onClick={() => setEarlyPayDiscounts((prev) => [...prev, { withinDays: 10, discountPct: 2 }])}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="size-3" aria-hidden />
                เพิ่มเงื่อนไข
              </button>
            </div>
            {earlyPayDiscounts.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">ยังไม่มีเงื่อนไข — กด «เพิ่มเงื่อนไข»</p>
            ) : (
              <div className="space-y-1.5">
                {earlyPayDiscounts.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-slate-600">จ่ายภายใน</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={d.withinDays}
                      onChange={(e) =>
                        setEarlyPayDiscounts((prev) =>
                          prev.map((x, i) => i === idx ? { ...x, withinDays: Math.max(1, Number(e.target.value) || 1) } : x)
                        )
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm font-mono outline-none focus:border-emerald-400"
                    />
                    <span className="shrink-0 text-xs text-slate-600">วัน ได้ลด</span>
                    <input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.5}
                      value={d.discountPct}
                      onChange={(e) =>
                        setEarlyPayDiscounts((prev) =>
                          prev.map((x, i) => i === idx ? { ...x, discountPct: Math.max(0.1, Number(e.target.value) || 0.1) } : x)
                        )
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm font-mono outline-none focus:border-emerald-400"
                    />
                    <span className="shrink-0 text-xs text-slate-600">%</span>
                    <button
                      type="button"
                      onClick={() => setEarlyPayDiscounts((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Default Discount By Brand ──────────────────────────── */}
          <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800">
                  ส่วนลดประจำตามแบรนด์
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  ลด chain ที่ซัพให้กับทุกสินค้าของแบรนด์นี้ — auto pre-fill ตอนเพิ่มสินค้าลง PO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDefaultDiscountByBrand((prev) => [...prev, { brand: brands[0] ?? '', discountChain: '' }])}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700"
              >
                <Plus className="size-3" aria-hidden />
                เพิ่มแบรนด์
              </button>
            </div>
            {defaultDiscountByBrand.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">
                {brands.length === 0
                  ? 'ใส่แบรนด์ในช่อง «แบรนด์ที่จำหน่าย» ก่อน แล้วค่อยตั้งส่วนลด'
                  : 'ยังไม่มี — กด «เพิ่มแบรนด์» เพื่อตั้งส่วนลดประจำ'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {defaultDiscountByBrand.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-slate-600">แบรนด์</span>
                    {brands.length > 0 ? (
                      <select
                        value={d.brand}
                        onChange={(e) =>
                          setDefaultDiscountByBrand((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, brand: e.target.value } : x)),
                          )
                        }
                        className="min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-400"
                      >
                        {!brands.includes(d.brand) && <option value={d.brand}>{d.brand || '— เลือก —'}</option>}
                        {brands.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={d.brand}
                        onChange={(e) =>
                          setDefaultDiscountByBrand((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, brand: e.target.value } : x)),
                          )
                        }
                        placeholder="ชื่อแบรนด์"
                        className="min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-400"
                      />
                    )}
                    <span className="shrink-0 text-xs text-slate-600">ลด</span>
                    <input
                      type="text"
                      value={d.discountChain}
                      onChange={(e) =>
                        setDefaultDiscountByBrand((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, discountChain: e.target.value } : x)),
                        )
                      }
                      placeholder="เช่น 45+12"
                      className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm font-mono outline-none focus:border-violet-400"
                    />
                    <span className="shrink-0 text-xs text-slate-600">%</span>
                    <button
                      type="button"
                      onClick={() => setDefaultDiscountByBrand((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Price List VAT Mode ──────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              ราคาในใบเสนอราคา / รายการสินค้า
            </p>
            <div className="flex gap-2">
              {(
                [
                  { value: 'vat_excluded', label: 'ยังไม่รวม VAT', sub: 'บวก VAT 7% เพิ่ม' },
                  { value: 'vat_included', label: 'รวม VAT แล้ว', sub: 'ราคาที่เห็น = ราคาจ่ายจริง' },
                  { value: 'no_vat', label: 'ไม่มี VAT', sub: 'ไม่อยู่ในระบบภาษี' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriceListVatMode(opt.value)}
                  className={clsx(
                    'flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors',
                    priceListVatMode === opt.value
                      ? 'border-sky-400 bg-sky-50 text-sky-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className={clsx('text-[10px]', priceListVatMode === opt.value ? 'text-sky-600' : 'text-slate-400')}>
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <CatalogSection
            supplierId={initialProfile?.id ?? null}
            rows={catalogRows}
            onChange={setCatalogRows}
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
          >
            <Save className="size-4" aria-hidden />
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  )
}

export function SupplierProfileModal({ open, mode, initialProfile, onClose, onSaved }: SupplierProfileModalProps) {
  if (!open) return null
  if (mode === 'edit' && !initialProfile) return null
  return <SupplierMasterForm mode={mode} initialProfile={initialProfile} onClose={onClose} onSaved={onSaved} />
}
