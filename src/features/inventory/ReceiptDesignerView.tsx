import { clsx } from 'clsx'
import { ReceiptDesignerPreview } from '@/features/inventory/components/ReceiptDesignerPreview'
import {
  emptyImageBlock,
  emptyQrReceiptNoBlock,
  emptyQrTextBlock,
  emptyTextBlock,
  RECEIPT_FONT_LABELS,
  type ReceiptExtraBlock,
  type ReceiptExtraText,
  type ReceiptFontPreset,
} from '@/features/inventory/data/receiptDesignerExtras'
import {
  DEFAULT_RECEIPT_DESIGNER_LAYOUT,
  type ReceiptDesignerLayout,
  type ReceiptPaperWidthMm,
  loadReceiptDesignerLayout,
  saveReceiptDesignerLayout,
} from '@/features/inventory/data/receiptDesignerStore'
import { getStaffUsername, getStoredBranch } from '@/features/auth/authSession'
import { getStoreContextForPrint, STORE_PROFILE_CHANGED_EVENT } from '@/features/settings/data/storeProfileStore'
import { ChevronDown, ChevronUp, ImagePlus, Printer, QrCode, RotateCcw, Save, Trash2, Type } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ReceiptDesignerViewProps = {
  className?: string
}

type ToggleKey = keyof Pick<
  ReceiptDesignerLayout,
  | 'showStoreName'
  | 'showBranch'
  | 'showTaxId'
  | 'showPhone'
  | 'showAddress'
  | 'showDocNo'
  | 'showDateTime'
  | 'showCashier'
  | 'showItemNo'
  | 'showItemSku'
  | 'showItemUnitPrice'
  | 'showItemQty'
  | 'showItemLineTotal'
  | 'showSubtotal'
  | 'showDiscount'
  | 'showTax'
  | 'showTotal'
  | 'showPaymentMethod'
  | 'showChange'
  | 'showThankYou'
  | 'showSectionDividers'
  | 'showEndBillText1'
  | 'showEndBillBarcode'
  | 'showEndBillPromoText'
>

function patchLayout(prev: ReceiptDesignerLayout, patch: Partial<ReceiptDesignerLayout>): ReceiptDesignerLayout {
  return { ...prev, ...patch, version: 1 }
}

type ExtraPlacement = 'top' | 'bottom'

function replaceExtra(
  list: ReceiptExtraBlock[],
  id: string,
  next: ReceiptExtraBlock,
): ReceiptExtraBlock[] {
  return list.map((b) => (b.id === id ? next : b))
}

function moveExtra(list: ReceiptExtraBlock[], id: string, dir: -1 | 1): ReceiptExtraBlock[] {
  const i = list.findIndex((b) => b.id === id)
  if (i < 0) return list
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  const t = next[i]!
  next[i] = next[j]!
  next[j] = t
  return next
}

export function ReceiptDesignerView({ className }: ReceiptDesignerViewProps) {
  const [layout, setLayout] = useState<ReceiptDesignerLayout>(() => loadReceiptDesignerLayout())
  const [profile, setProfile] = useState(() => getStoreContextForPrint())
  const [printLayout, setPrintLayout] = useState<ReceiptDesignerLayout | null>(null)
  const savedBaselineRef = useRef<ReceiptDesignerLayout | null>(null)
  const imagePickTargetRef = useRef<{ placement: ExtraPlacement; id: string } | null>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    savedBaselineRef.current = structuredClone(loadReceiptDesignerLayout())
  }, [])

  useEffect(() => {
    const sync = () => setProfile(getStoreContextForPrint())
    window.addEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
    return () => window.removeEventListener(STORE_PROFILE_CHANGED_EVENT, sync)
  }, [])

  const branch = getStoredBranch()
  const branchLabel = branch ? `สาขา: ${branch.name}` : undefined
  const cashier = getStaffUsername() ?? 'ผู้ใช้'

  const persist = useCallback((next: ReceiptDesignerLayout) => {
    setLayout(saveReceiptDesignerLayout(next))
  }, [])

  const setToggle = (key: ToggleKey, value: boolean) => {
    persist(patchLayout(layout, { [key]: value }))
  }

  const extrasKey = (p: ExtraPlacement) => (p === 'top' ? 'topExtras' : 'bottomExtras')

  const pushExtra = (p: ExtraPlacement, block: ReceiptExtraBlock) => {
    const k = extrasKey(p)
    persist(patchLayout(layout, { [k]: [...layout[k], block] }))
  }

  const setExtra = (p: ExtraPlacement, id: string, block: ReceiptExtraBlock) => {
    const k = extrasKey(p)
    persist(patchLayout(layout, { [k]: replaceExtra(layout[k], id, block) }))
  }

  const removeExtra = (p: ExtraPlacement, id: string) => {
    const k = extrasKey(p)
    persist(patchLayout(layout, { [k]: layout[k].filter((b) => b.id !== id) }))
  }

  const moveExtraIn = (p: ExtraPlacement, id: string, dir: -1 | 1) => {
    const k = extrasKey(p)
    persist(patchLayout(layout, { [k]: moveExtra(layout[k], id, dir) }))
  }

  const openImagePicker = (p: ExtraPlacement, id: string) => {
    imagePickTargetRef.current = { placement: p, id }
    imageFileInputRef.current?.click()
  }

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const target = imagePickTargetRef.current
    imagePickTargetRef.current = null
    if (!file || !target) return
    if (!file.type.startsWith('image/')) {
      window.alert('เลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    if (file.size > 600_000) {
      window.alert('ไฟล์ใหญ่เกิน — จำกัดประมาณ 600 KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setLayout((prev) => {
        const k = extrasKey(target.placement)
        const list = prev[k]
        const cur = list.find((x) => x.id === target.id)
        if (!cur || cur.kind !== 'image') return prev
        return saveReceiptDesignerLayout(
          patchLayout(prev, { [k]: replaceExtra(list, target.id, { ...cur, dataUrl }) }),
        )
      })
    }
    reader.readAsDataURL(file)
  }

  const renderExtraEditor = (p: ExtraPlacement, b: ReceiptExtraBlock) => {
    const up = (
      <button
        type="button"
        aria-label="เลื่อนขึ้น"
        onClick={() => moveExtraIn(p, b.id, -1)}
        className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
      >
        <ChevronUp className="size-3.5" />
      </button>
    )
    const down = (
      <button
        type="button"
        aria-label="เลื่อนลง"
        onClick={() => moveExtraIn(p, b.id, 1)}
        className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
      >
        <ChevronDown className="size-3.5" />
      </button>
    )
    const del = (
      <button
        type="button"
        aria-label="ลบ"
        onClick={() => removeExtra(p, b.id)}
        className="rounded border border-red-200 bg-white p-1 text-red-700 hover:bg-red-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    )

    if (b.kind === 'text') {
      return (
        <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">ข้อความ</span>
            <div className="flex gap-0.5">
              {up}
              {down}
              {del}
            </div>
          </div>
          <textarea
            value={b.text}
            onChange={(e) => setExtra(p, b.id, { ...b, text: e.target.value })}
            rows={2}
            className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]"
          />
          <div className="flex flex-wrap gap-2">
            <label className="text-[10px] text-slate-600">
              จัด
              <select
                value={b.align}
                onChange={(e) =>
                  setExtra(p, b.id, { ...b, align: e.target.value as ReceiptExtraText['align'] })
                }
                className="ml-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]"
              >
                <option value="left">ซ้าย</option>
                <option value="center">กลาง</option>
                <option value="right">ขวา</option>
              </select>
            </label>
            <label className="flex flex-1 items-center gap-1 text-[10px] text-slate-600">
              ขนาด ×{b.fontEm.toFixed(2)}
              <input
                type="range"
                min={0.75}
                max={1.75}
                step={0.05}
                value={b.fontEm}
                onChange={(e) => setExtra(p, b.id, { ...b, fontEm: Number(e.target.value) })}
                className="min-w-0 flex-1"
              />
            </label>
          </div>
        </div>
      )
    }

    if (b.kind === 'image') {
      return (
        <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">รูปภาพ</span>
            <div className="flex gap-0.5">
              {up}
              {down}
              {del}
            </div>
          </div>
          <div className="mb-2 flex justify-center rounded-lg bg-slate-50 p-1">
            {b.dataUrl ? (
              <img src={b.dataUrl} alt="" className="max-h-24 max-w-full object-contain" />
            ) : (
              <span className="py-4 text-[10px] text-slate-400">ยังไม่มีรูป</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => openImagePicker(p, b.id)}
            className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-100"
          >
            เลือกรูป…
          </button>
          <label className="flex items-center gap-2 text-[10px] text-slate-600">
            กว้าง {b.widthPercent}%
            <input
              type="range"
              min={15}
              max={100}
              value={b.widthPercent}
              onChange={(e) => setExtra(p, b.id, { ...b, widthPercent: Number(e.target.value) })}
              className="flex-1"
            />
          </label>
        </div>
      )
    }

    return (
      <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">QR code</span>
          <div className="flex gap-0.5">
            {up}
            {down}
            {del}
          </div>
        </div>
        <label className="mb-2 block text-[10px] text-slate-600">
          เนื้อหาใน QR
          <select
            value={b.mode}
            onChange={(e) =>
              setExtra(p, b.id, {
                ...b,
                mode: e.target.value === 'text' ? 'text' : 'receiptNo',
              })
            }
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
          >
            <option value="receiptNo">เลขที่ใบเสร็จ (ตามบิลจริงตอนพิมพ์)</option>
            <option value="text">ข้อความ / URL กำหนดเอง</option>
          </select>
        </label>
        {b.mode === 'text' ? (
          <input
            type="text"
            value={b.text}
            onChange={(e) => setExtra(p, b.id, { ...b, text: e.target.value })}
            placeholder="https://… หรือข้อความ"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-[11px]"
          />
        ) : (
          <p className="text-[10px] leading-snug text-slate-500">
            ตัวอย่าง: R-2026-0411-0001 — ตอนพิมพ์จาก POS จะใส่เลขที่บิลจริงใน QR ให้
          </p>
        )}
      </div>
    )
  }

  const revertBaseline = () => {
    const b = savedBaselineRef.current
    if (!b) return
    if (!window.confirm('คืนค่าตามที่กดบันทึกล่าสุด?')) return
    const clone = structuredClone(b)
    setLayout(saveReceiptDesignerLayout(clone))
  }

  const handleSaveBaseline = () => {
    persist(layout)
    savedBaselineRef.current = structuredClone(layout)
    window.alert('บันทึกแบบใบเสร็จแล้ว — หน้าขายจะอ่านค่านี้เมื่อเชื่อมต่อพิมพ์จริง')
  }

  useEffect(() => {
    if (!printLayout) return
    const w = printLayout.paperWidthMm
    const style = document.createElement('style')
    style.setAttribute('data-bento-receipt-print-page', '1')
    style.textContent = `@media print {
      @page { margin: 0; size: ${w}mm auto; }
      html:has(#receipt-print-surface),
      html:has(#receipt-print-surface) body {
        width: ${w}mm !important;
        max-width: ${w}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    }`
    document.head.appendChild(style)
    const onAfter = () => {
      style.remove()
      setPrintLayout(null)
      window.removeEventListener('afterprint', onAfter)
    }
    window.addEventListener('afterprint', onAfter)
    const id = window.requestAnimationFrame(() => window.print())
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('afterprint', onAfter)
      style.remove()
    }
  }, [printLayout])

  const toggleRow = (label: string, key: ToggleKey, hint?: string) => (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800">
      <input
        type="checkbox"
        checked={layout[key]}
        onChange={(e) => setToggle(key, e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{hint}</span> : null}
      </span>
    </label>
  )

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-3 overflow-hidden', className)}>
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageFile}
      />
      {printLayout
        ? createPortal(
            <div
              id="receipt-print-surface"
              className="bg-white text-black"
              style={{ width: `${printLayout.paperWidthMm}mm`, maxWidth: `${printLayout.paperWidthMm}mm` }}
            >
              <ReceiptDesignerPreview
                layout={printLayout}
                profile={profile}
                branchLabel={branchLabel}
                cashierLabel={cashier}
              />
            </div>,
            document.body,
          )
        : null}

      <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/90 to-white px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">ออกแบบใบเสร็จ (POS)</p>
            <p className="text-[11px] text-slate-600">
              เลือกส่วนที่แสดงและขนาดกระดาษ — ตัวอย่างเป็นข้อมูลจำลอง —{' '}
              <strong className="font-medium text-slate-700">บันทึก</strong> เป็นจุดอ้างอิงสำหรับเมื่อเชื่อมพิมพ์จริง
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintLayout(structuredClone(layout))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Printer className="size-3.5" aria-hidden />
              พิมพ์ตัวอย่าง
            </button>
            <button
              type="button"
              onClick={handleSaveBaseline}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
            >
              <Save className="size-3.5" aria-hidden />
              บันทึก
            </button>
            <button
              type="button"
              onClick={revertBaseline}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              ค่าเริ่มต้น
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('รีเซ็ตเป็นค่าเริ่มระบบทั้งหมด?')) return
                const d = { ...DEFAULT_RECEIPT_DESIGNER_LAYOUT }
                const saved = saveReceiptDesignerLayout(d)
                setLayout(saved)
                savedBaselineRef.current = structuredClone(saved)
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-950 hover:bg-amber-100"
            >
              รีเซ็ตระบบ
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,19rem)_1fr]">
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">กระดาษ</p>
            <label className="mb-2 block text-xs text-slate-700">
              <span className="mb-1 block font-medium">ความกว้างม้วน</span>
              <select
                value={layout.paperWidthMm}
                onChange={(e) => persist(patchLayout(layout, { paperWidthMm: Number(e.target.value) as ReceiptPaperWidthMm }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs"
              >
                <option value={58}>58 มม. (เครื่องเล็ก)</option>
                <option value={80}>80 มม. (มาตรฐาน)</option>
              </select>
            </label>
            <label className="mt-2 block text-xs text-slate-700">
              <span className="mb-1 block font-medium">แบบอักษร</span>
              <select
                value={layout.fontPreset}
                onChange={(e) =>
                  persist(patchLayout(layout, { fontPreset: e.target.value as ReceiptFontPreset }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs"
              >
                {(Object.keys(RECEIPT_FONT_LABELS) as ReceiptFontPreset[]).map((id) => (
                  <option key={id} value={id}>
                    {RECEIPT_FONT_LABELS[id]}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-xs text-slate-700">
              <span className="mb-1 block font-medium">ขนาดตัวอักษรฐาน {layout.baseFontPx}px</span>
              <input
                type="range"
                min={9}
                max={18}
                step={1}
                value={layout.baseFontPx}
                onChange={(e) => persist(patchLayout(layout, { baseFontPx: Number(e.target.value) }))}
                className="w-full"
              />
            </label>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              องค์ประกอบเพิ่มเติม
            </p>
            <p className="mb-2 text-[10px] leading-snug text-slate-500">
              ด้านบน = หลังข้อมูลร้าน ก่อนเลขที่บิล · ด้านล่าง = หลังชำระเงิน ก่อนขอบคุณ — รูปเก็บในเครื่อง (จำกัดขนาด)
            </p>

            <div className="mb-3 space-y-2 rounded-xl border border-teal-100 bg-white/90 p-2">
              <p className="text-[10px] font-semibold text-teal-900">แทรกหลังหัวร้าน</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => pushExtra('top', emptyTextBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <Type className="size-3" aria-hidden />
                  ข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('top', emptyImageBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <ImagePlus className="size-3" aria-hidden />
                  รูป
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('top', emptyQrReceiptNoBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <QrCode className="size-3" aria-hidden />
                  QR เลขที่บิล
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('top', emptyQrTextBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <QrCode className="size-3" aria-hidden />
                  QR ข้อความ
                </button>
              </div>
              <div className="space-y-2">{layout.topExtras.map((b) => renderExtraEditor('top', b))}</div>
            </div>

            <div className="space-y-2 rounded-xl border border-teal-100 bg-white/90 p-2">
              <p className="text-[10px] font-semibold text-teal-900">แทรกก่อนขอบคุณ</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => pushExtra('bottom', emptyTextBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <Type className="size-3" aria-hidden />
                  ข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('bottom', emptyImageBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <ImagePlus className="size-3" aria-hidden />
                  รูป
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('bottom', emptyQrReceiptNoBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <QrCode className="size-3" aria-hidden />
                  QR เลขที่บิล
                </button>
                <button
                  type="button"
                  onClick={() => pushExtra('bottom', emptyQrTextBlock())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-100"
                >
                  <QrCode className="size-3" aria-hidden />
                  QR ข้อความ
                </button>
              </div>
              <div className="space-y-2">{layout.bottomExtras.map((b) => renderExtraEditor('bottom', b))}</div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">หัวใบเสร็จ</p>
            <div className="space-y-2">
              {toggleRow('ชื่อร้าน', 'showStoreName', 'จากการตั้งค่าโปรไฟล์ร้าน')}
              {toggleRow('สาขา', 'showBranch', 'จากสาขาที่ล็อกอิน')}
              {toggleRow('เลขผู้เสียภาษี', 'showTaxId')}
              {toggleRow('โทรศัพท์', 'showPhone')}
              {toggleRow('ที่อยู่', 'showAddress', 'อาจยาว — ทดสอบกับม้วนจริง')}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">เอกสาร</p>
            <div className="space-y-2">
              {toggleRow('เลขที่ใบเสร็จ', 'showDocNo')}
              {toggleRow('วันเวลา', 'showDateTime')}
              {toggleRow('ผู้ขาย / แคชเชียร์', 'showCashier')}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">รายการสินค้า</p>
            <div className="space-y-2">
              {toggleRow('ลำดับ', 'showItemNo')}
              {toggleRow('SKU', 'showItemSku')}
              {toggleRow('ราคา/หน่วย', 'showItemUnitPrice')}
              {toggleRow('จำนวน', 'showItemQty')}
              {toggleRow('รวมบรรทัด', 'showItemLineTotal')}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">สรุปยอด</p>
            <div className="space-y-2">
              {toggleRow('รวมเงิน', 'showSubtotal')}
              {toggleRow('ส่วนลด', 'showDiscount')}
              {toggleRow('ภาษี', 'showTax')}
              {toggleRow('ยอดสุทธิ', 'showTotal')}
              {toggleRow('วิธีชำระ', 'showPaymentMethod')}
              {toggleRow('เงินทอน', 'showChange', 'รับเงิน + ทอน')}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              ช่องท้ายบิล (โปรโมชั่น)
            </p>
            <p className="mb-2 text-[10px] leading-snug text-slate-500">
              แสดงหลังชำระเงิน — ลำดับ: ข้อความ → บาร์โค้ดเลขที่บิล → ข้อความโปรท้ายบิล — ก่อนบล็อกเสริม &quot;แทรกก่อนขอบคุณ&quot;
            </p>
            <div className="space-y-2">
              {toggleRow('ช่อง 1: ข้อความ (เช่น โปรด้านบน)', 'showEndBillText1')}
              {layout.showEndBillText1 ? (
                <textarea
                  value={layout.endBillText1}
                  onChange={(e) => persist(patchLayout(layout, { endBillText1: e.target.value }))}
                  rows={3}
                  placeholder="เช่น ซื้อครบ 1,000 บ. รับสิทธิ์ลุ้นรางวัล"
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-900"
                />
              ) : null}
              {toggleRow(
                'ช่อง 2: บาร์โค้ดเลขที่บิล (CODE128)',
                'showEndBillBarcode',
                'ใช้เลขที่ใบเสร็จเดียวกับบรรทัด «เลขที่» — ตอนพิมพ์จริงส่งเลขบิลผ่าน printData.receiptNo',
              )}
              {toggleRow('ช่อง 3: ข้อความโปรท้ายบิล', 'showEndBillPromoText')}
              {layout.showEndBillPromoText ? (
                <textarea
                  value={layout.endBillPromoText}
                  onChange={(e) => persist(patchLayout(layout, { endBillPromoText: e.target.value }))}
                  rows={3}
                  placeholder="เช่น แลกของรางวัลที่เคาน์เตอร์ภายใน 30 วัน"
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-900"
                />
              ) : null}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">ท้ายใบ</p>
            <div className="space-y-2">
              {toggleRow('ขอบคุณที่ใช้บริการ', 'showThankYou')}
              {toggleRow('เส้นคั่นระหว่างส่วน', 'showSectionDividers')}
            </div>
            <label className="mt-2 block text-xs text-slate-700">
              <span className="mb-1 block font-medium">ข้อความท้าย (บรรทัดละ 1 บรรทัด สูงสุด 8)</span>
              <textarea
                value={layout.footerLines.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').map((s) => s.trimEnd())
                  persist(patchLayout(layout, { footerLines: lines }))
                }}
                rows={4}
                placeholder="เช่น รับประกันสินค้า 7 วัน&#10;Line OA: @myshop"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-2.5 py-2 font-mono text-[11px] text-slate-900"
              />
            </label>
          </section>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/90 px-3 py-2">
            <p className="text-xs font-semibold text-slate-800">ตัวอย่างบนหน้าจอ</p>
            <p className="text-[10px] text-slate-500">ขยาย/ย่อด้วยตัวเลื่อนขนาดตัวอักษร — กว้างกระดาษตามม้วนที่เลือก</p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-slate-200/60 p-4">
            <div className="mx-auto w-fit max-w-full rounded-lg shadow-lg ring-1 ring-slate-300/80">
              <ReceiptDesignerPreview
                layout={layout}
                profile={profile}
                branchLabel={branchLabel}
                cashierLabel={cashier}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
