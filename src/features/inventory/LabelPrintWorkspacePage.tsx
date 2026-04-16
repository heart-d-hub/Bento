import { clsx } from 'clsx'
import {
  LabelDesignerPrintPage,
  type LabelDesignerPrintLayoutMode,
} from '@/features/inventory/components/LabelDesignerPrintPage'
import { type LabelDisplayFlags } from '@/features/inventory/components/LabelPrintParts'
import type { LabelDesignerTemplate } from '@/features/inventory/data/labelDesignerTemplateStore'
import {
  LABEL_DESIGNER_TEMPLATES_CHANGED_EVENT,
  entryToTemplate,
  loadLabelDesignerTemplatesState,
} from '@/features/inventory/data/labelDesignerTemplateStore'
import type { PriceCipherSettings } from '@/features/inventory/data/priceCipherCodec'
import { loadPriceCipherSettings } from '@/features/inventory/data/priceCipherStore'
import { loadStoreProfile } from '@/features/settings/data/storeProfileStore'
import {
  LABEL_PRINT_QUEUE_CHANGED_EVENT,
  loadLabelPrintQueue,
  saveLabelPrintQueue,
  type LabelPrintQueueItem,
} from '@/features/inventory/data/labelPrintQueueStore'
import {
  LABEL_PRINT_REFERENCE_PRINTER_MODEL,
  LABEL_PRINT_SHEET_WIDTH_MM,
  computeAutoSheetCols,
  DESIGNER_PRINT_SHEET_ROWS_DEFAULT,
  labelPrintContentWidthMm,
  labelPrintPageBoxMm,
} from '@/features/inventory/data/labelDesignerPrintMedia'
import {
  loadLabelPrintUiPrefs,
  saveLabelPrintUiPrefs,
  type LabelPrintUiPrefs,
} from '@/features/inventory/data/labelPrintUiPrefs'
import {
  buildComposite2x4LabelPages,
  buildLabelPages,
  buildPriceCipherMoneyForRow,
  expandQueueToLabels,
  type EnrichedLabelRow,
} from '@/features/inventory/labelPrintLayout'
import { isComposite2x4StickerTemplate } from '@/features/inventory/data/labelDesignerDensityPresets'
import { getProductMasterList, normalizeSalesUnits } from '@/features/inventory/data/productMasterData'
import { DESIGNER_SAMPLE_ROW } from '@/features/inventory/labelDesignerFieldUtils'
import { LabelBarcodeDesignerView } from '@/features/inventory/LabelBarcodeDesignerView'
import { LabelPriceCipherSettingsView } from '@/features/inventory/LabelPriceCipherSettingsView'
import { ReceiptDesignerView } from '@/features/inventory/ReceiptDesignerView'
import { TaxInvoiceFormDesignerView } from '@/features/inventory/TaxInvoiceFormDesignerView'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  Barcode,
  KeyRound,
  LayoutTemplate,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type LabelPrintWorkspacePageProps = {
  className?: string
}

function templateLabel(t: LabelPrintQueueItem['template']): string {
  if (t === 'small') return 'เล็ก'
  if (t === 'medium') return 'กลาง'
  return 'ใหญ่'
}

function formatBaht(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function labelCarModelText(
  carModelLabel?: string,
  yearLabel?: string,
  fallback?: string,
): string | undefined {
  const model = (carModelLabel ?? '').trim()
  const year = (yearLabel ?? '').trim()
  if (model && year && year !== '—') return `${model}(${year})`
  if (model) return model
  const fb = (fallback ?? '').trim()
  return fb || undefined
}

type PrintJob = {
  pages: (EnrichedLabelRow | null)[][]
  template: LabelDesignerTemplate
  sheetCols: number
  sheetRows: number
  printLayout: LabelDesignerPrintLayoutMode
  flags: LabelDisplayFlags
  storeName: string
  priceCipher: PriceCipherSettings
}

export function LabelPrintWorkspacePage({ className }: LabelPrintWorkspacePageProps) {
  const prefsRef = useRef<HTMLDivElement | null>(null)
  const { labelPrintTopSection, setLabelPrintTopSection } = useWorkspaceTabs()
  const [barcodeSubTab, setBarcodeSubTab] = useState<'queue' | 'designer' | 'price-cipher'>('queue')
  const [rows, setRows] = useState<LabelPrintQueueItem[]>(() => loadLabelPrintQueue())
  const [prefs, setPrefs] = useState(loadLabelPrintUiPrefs)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<PrintJob | null>(null)
  const [printJob, setPrintJob] = useState<PrintJob | null>(null)

  const showName = prefs.showName
  const showOem = prefs.showOem
  const showFactoryNo = prefs.showFactoryNo
  const showSku = prefs.showSku
  const showPrice = prefs.showPrice
  const [designerLib, setDesignerLib] = useState(() => loadLabelDesignerTemplatesState())

  const effectiveDesignerTemplateId =
    prefs.lastDesignerTemplateId ?? designerLib.templates[0]?.id ?? ''

  const patchPrefs = useCallback((patch: Partial<LabelPrintUiPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      saveLabelPrintUiPrefs(next)
      return next
    })
  }, [])

  useEffect(() => {
    const refresh = () => setRows(loadLabelPrintQueue())
    window.addEventListener(LABEL_PRINT_QUEUE_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(LABEL_PRINT_QUEUE_CHANGED_EVENT, refresh)
  }, [])

  useEffect(() => {
    const refresh = () => setDesignerLib(loadLabelDesignerTemplatesState())
    window.addEventListener(LABEL_DESIGNER_TEMPLATES_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(LABEL_DESIGNER_TEMPLATES_CHANGED_EVENT, refresh)
  }, [])

  const totalSheets = useMemo(() => rows.reduce((sum, r) => sum + r.qty, 0), [rows])
  const rowsWithMeta: EnrichedLabelRow[] = useMemo(
    () =>
      rows.map((r) => {
        const key = (r.sku ?? r.barcode).trim().toLowerCase()
        const master = getProductMasterList().find(
          (m) =>
            m.sku.trim().toLowerCase() === key ||
            (m.boxBarcode?.trim().toLowerCase() ?? '') === r.barcode.trim().toLowerCase(),
        )
        const salesUnit = master ? normalizeSalesUnits(master)[0]?.label : undefined
        const costPrice = master?.costPrice
        return {
          ...r,
          name: r.name || master?.name || '-',
          sku: r.sku ?? master?.sku,
          oemNo: r.oemNo ?? master?.oemTags?.[0],
          factoryNo: r.factoryNo ?? master?.factoryNo,
          carModelText: labelCarModelText(master?.carModelLabel, master?.yearLabel, master?.carModels?.[0]),
          salesUnitText: salesUnit,
          brandText: master?.brand,
          price: r.price ?? master?.sellPrice,
          costPrice,
          priceCipherMoney: buildPriceCipherMoneyForRow(master, {
            costPrice,
            price: r.price ?? master?.sellPrice,
          }),
        }
      }),
    [rows],
  )

  const displayFlags: LabelDisplayFlags = useMemo(
    () => ({ showName, showOem, showFactoryNo, showSku, showPrice }),
    [showName, showOem, showFactoryNo, showSku, showPrice],
  )

  const designerPreviewRow = rowsWithMeta[0] ?? DESIGNER_SAMPLE_ROW

  const openPrintSettings = () => {
    if (rows.length === 0) {
      window.alert('ยังไม่มีคิวพิมพ์')
      return
    }
    if (designerLib.templates.length === 0) {
      window.alert('สร้างแม่แบบในแท็บออกแบบป้ายก่อน')
      return
    }
    setSettingsOpen(true)
  }

  const buildPrintJob = (): PrintJob | null => {
    const expanded = expandQueueToLabels(rowsWithMeta)
    if (expanded.length === 0) {
      window.alert('จำนวนแผ่นในคิวเป็น 0 — ตรวจสอบจำนวนต่อรายการ')
      return null
    }

    const tid = prefs.lastDesignerTemplateId ?? designerLib.templates[0]?.id
    if (!tid) {
      window.alert('ยังไม่มีแม่แบบ — ไปที่แท็บออกแบบป้ายก่อน')
      return null
    }
    const entry = designerLib.templates.find((t) => t.id === tid)
    if (!entry) {
      window.alert('ไม่พบแม่แบบที่เลือก')
      return null
    }
    const template = entryToTemplate(entry)
    const sheetRows = DESIGNER_PRINT_SHEET_ROWS_DEFAULT

    if (isComposite2x4StickerTemplate(template)) {
      const sheetCols = computeAutoSheetCols(50)
      const physicalPerPage = sheetCols * sheetRows
      const pages = buildComposite2x4LabelPages(expanded, physicalPerPage)
      return {
        pages,
        template,
        sheetCols,
        sheetRows,
        printLayout: 'composite2x4' as const,
        flags: displayFlags,
        storeName: loadStoreProfile().storeName,
        priceCipher: loadPriceCipherSettings(),
      }
    }

    const sheetCols = computeAutoSheetCols(template.widthMm)
    const per = sheetCols * sheetRows
    const pages = buildLabelPages(expanded, per)
    return {
      pages,
      template,
      sheetCols,
      sheetRows,
      printLayout: 'simple' as const,
      flags: displayFlags,
      storeName: loadStoreProfile().storeName,
      priceCipher: loadPriceCipherSettings(),
    }
  }

  const handlePreviewFromDialog = () => {
    const job = buildPrintJob()
    if (!job) return
    setPreviewData(job)
    setPreviewOpen(true)
    setSettingsOpen(false)
  }

  const handlePrintFromDialog = () => {
    const job = buildPrintJob()
    if (!job) return
    setPrintJob(job)
    setSettingsOpen(false)
  }

  const scrollToFormPrefs = () => {
    setSettingsOpen(false)
    prefsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!printJob) return
    const { widthMm, heightMm } = labelPrintPageBoxMm({
      printLayout: printJob.printLayout,
      templateWidthMm: printJob.template.widthMm,
      templateHeightMm: printJob.template.heightMm,
      sheetCols: printJob.sheetCols,
      sheetRows: printJob.sheetRows,
    })
    const pageOrient = widthMm >= heightMm ? 'landscape' : 'portrait'
    const style = document.createElement('style')
    style.setAttribute('data-bento-label-print-page', '1')
    style.textContent = `@media print {
      @page { margin: 0; size: ${widthMm}mm ${heightMm}mm ${pageOrient}; }
      /* บังคับความกว้างเอกสาร = ความกว้างป้าย — กัน Chrome จัดกึ่งกลางบน A4 แล้วป้ายไปทับร่องคั่นคอลัมน์ */
      html:has(#label-print-surface),
      html:has(#label-print-surface) body {
        width: ${widthMm}mm !important;
        max-width: ${widthMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    }`
    document.head.appendChild(style)
    const onAfter = () => {
      style.remove()
      setPrintJob(null)
      window.removeEventListener('afterprint', onAfter)
    }
    window.addEventListener('afterprint', onAfter)
    const id = window.requestAnimationFrame(() => window.print())
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('afterprint', onAfter)
      style.remove()
    }
  }, [printJob])

  const removeRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id)
    saveLabelPrintQueue(next)
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
    >
      {printJob
        ? createPortal(
            <div id="label-print-surface" className="bg-white text-black">
              {printJob.pages.map((page, pi) => (
                <LabelDesignerPrintPage
                  key={`print-d-${pi}`}
                  pageRows={page}
                  template={printJob.template}
                  sheetCols={printJob.sheetCols}
                  sheetRows={printJob.sheetRows}
                  printLayout={printJob.printLayout}
                  storeName={printJob.storeName}
                  priceCipher={printJob.priceCipher}
                  pageIndex={pi}
                  isLastPage={pi >= printJob.pages.length - 1}
                />
              ))}
            </div>,
            document.body,
          )
        : null}

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal
          aria-labelledby="label-print-settings-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 id="label-print-settings-title" className="text-base font-semibold text-slate-900">
                  สั่งพิมพ์ป้าย
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  เลือกแม่แบบและเครื่องพิมพ์ — ป้ายเรียงซ้ายไปขวา; จำนวนคอลัมน์คำนวณจากความกว้างแม่แบบและกระดาษ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">แม่แบบป้าย</span>
                <select
                  value={effectiveDesignerTemplateId}
                  onChange={(e) => patchPrefs({ lastDesignerTemplateId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {designerLib.templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || 'ไม่มีชื่อ'} ({t.widthMm}×{t.heightMm} มม.)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  สร้างและแก้ในแท็บออกแบบป้าย — บันทึกแล้วจะอยู่ในรายการนี้ — แม่แบบ 25×17.5 (2×4) พิมพ์ 4 รายการต่อดวง
                  50×35 มม. เรียงซ้ายบน → ซ้ายล่าง → ขวาบน → ขวาล่าง
                </p>
              </label>

              <div>
                <span className="mb-1 block text-xs font-medium text-slate-700">เครื่องพิมพ์</span>
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  เลือก <strong className="font-semibold text-slate-800">{LABEL_PRINT_REFERENCE_PRINTER_MODEL}</strong> ในกล่องพิมพ์ของ
                  Windows (ไดรเวอร์ TSC) — กระดาษ/ม้วนกว้าง ~{LABEL_PRINT_SHEET_WIDTH_MM} มม. พื้นที่พิมพ์กว้าง ~{labelPrintContentWidthMm()} มม.
                  สอบเทียบจุดเริ่มพิมพ์ในไดรเวอร์หรือยูทิลิตี้เครื่องถ้าจำเป็น
                </p>
                <p className="mt-2 rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-[10px] leading-snug text-amber-950">
                  <strong className="font-semibold">สำคัญ — ขนาดกระดาษในกล่องพิมพ์:</strong> อย่าเลือก <strong>&quot;2 x 4&quot;</strong> ถ้าใช้ม้วนกว้าง{' '}
                  {LABEL_PRINT_SHEET_WIDTH_MM} มม. — ค่านั้นมักหมายถึง <strong>2×4 นิ้ว</strong> (แคบ ~51mm กว้าง) ไม่ใช่ม้วน 4 นิ้ว
                  จึงเห็นป้ายแคบๆ อยู่แถวบนและพื้นที่ขาวเต็มหน้า
                  <br />
                  ให้เลือก <strong>USER / Custom</strong> หรือ preset ในไดรเวอร์ TSC สำหรับม้วน <strong>4 นิ้ว (104mm)</strong> / ความกว้างใกล้{' '}
                  {LABEL_PRINT_SHEET_WIDTH_MM} มม. แทน
                  <br />
                  <strong className="font-semibold">อื่นๆ:</strong> ปิด <strong>Headers and footers</strong> — <strong>Scale 100%</strong> —{' '}
                  <strong>Margins: None</strong> (ไม่ใช่ Default) — <strong>Pages per sheet: 1</strong> — ห้าม Fit to page
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handlePrintFromDialog}
                className="inline-flex flex-1 min-w-[5rem] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                พิมพ์
              </button>
              <button
                type="button"
                onClick={handlePreviewFromDialog}
                className="inline-flex flex-1 min-w-[5rem] items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
              >
                <Search className="size-3.5" aria-hidden />
                หน้าจอ
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false)
                  scrollToFormPrefs()
                }}
                className="inline-flex flex-1 min-w-[5rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
              >
                แก้ฟอร์ม
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex flex-1 min-w-[5rem] items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen && previewData ? (
        <div
          className="fixed inset-0 z-[85] flex flex-col bg-slate-800/90 backdrop-blur-[2px]"
          role="dialog"
          aria-modal
          aria-labelledby="label-preview-title"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-white">
            <div>
              <h2 id="label-preview-title" className="text-sm font-semibold">
                แสดงหน้าจอก่อนพิมพ์
              </h2>
              <p className="text-xs text-white/75">
                {previewData.template.name} ·{' '}
                {previewData.printLayout === 'composite2x4'
                  ? `ดวง ${previewData.sheetCols}×${previewData.sheetRows} (50×35) · 2×4 ต่อดวง`
                  : `${previewData.sheetCols}×${previewData.sheetRows}`}{' '}
                · {previewData.pages.length} หน้า
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false)
                setPreviewData(null)
              }}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              ปิด
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
              {previewData.pages.map((page, pi) => (
                <div
                  key={`pvd-${pi}`}
                  className="origin-top scale-[0.72] transform rounded-lg shadow-2xl ring-1 ring-white/20 sm:scale-[0.85] md:scale-95"
                  style={{ transformOrigin: 'top center' }}
                >
                  <LabelDesignerPrintPage
                    pageRows={page}
                    template={previewData.template}
                    sheetCols={previewData.sheetCols}
                    sheetRows={previewData.sheetRows}
                    printLayout={previewData.printLayout}
                    storeName={previewData.storeName}
                    priceCipher={previewData.priceCipher}
                    pageIndex={pi}
                    isLastPage={pi >= previewData.pages.length - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 to-white">
        <div
          className="flex min-h-0 border-b border-slate-200/90 px-1.5 pt-2 sm:px-2 lg:px-4"
          role="tablist"
          aria-label="เลือกประเภทการออกแบบ"
        >
          <button
            type="button"
            role="tab"
            aria-selected={labelPrintTopSection === 'barcode'}
            onClick={() => setLabelPrintTopSection('barcode')}
            className={clsx(
              'min-h-10 min-w-0 flex-1 rounded-t-xl px-1.5 py-2.5 text-center text-[10px] font-semibold transition sm:px-2 sm:text-xs lg:text-sm',
              labelPrintTopSection === 'barcode'
                ? 'bg-white text-indigo-900 shadow-[0_-1px_0_0_white] ring-1 ring-slate-200/90 ring-b-0'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            ออกแบบบาร์โค้ด
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={labelPrintTopSection === 'receipt'}
            onClick={() => setLabelPrintTopSection('receipt')}
            className={clsx(
              'min-h-10 min-w-0 flex-1 rounded-t-xl px-1.5 py-2.5 text-center text-[10px] font-semibold transition sm:px-2 sm:text-xs lg:text-sm',
              labelPrintTopSection === 'receipt'
                ? 'bg-white text-teal-900 shadow-[0_-1px_0_0_white] ring-1 ring-slate-200/90 ring-b-0'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            ออกแบบใบเสร็จ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={labelPrintTopSection === 'tax-invoice'}
            onClick={() => setLabelPrintTopSection('tax-invoice')}
            className={clsx(
              'min-h-10 min-w-0 flex-1 rounded-t-xl px-1.5 py-2.5 text-center text-[10px] font-semibold transition sm:px-2 sm:text-xs lg:text-sm',
              labelPrintTopSection === 'tax-invoice'
                ? 'bg-white text-amber-950 shadow-[0_-1px_0_0_white] ring-1 ring-slate-200/90 ring-b-0'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            ฟอร์มใบกำกับ
          </button>
        </div>

        {labelPrintTopSection === 'barcode' ? (
          <div
            className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-white px-3 py-2.5 lg:px-5"
            role="tablist"
            aria-label="โหมดบาร์โค้ดและป้าย"
          >
            <button
              type="button"
              role="tab"
              aria-selected={barcodeSubTab === 'queue'}
              onClick={() => setBarcodeSubTab('queue')}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition',
                barcodeSubTab === 'queue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
              )}
            >
              <Barcode className="size-3.5" aria-hidden />
              คิวพิมพ์
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={barcodeSubTab === 'designer'}
              onClick={() => setBarcodeSubTab('designer')}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition',
                barcodeSubTab === 'designer'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
              )}
            >
              <LayoutTemplate className="size-3.5" aria-hidden />
              ออกแบบป้าย (ฉลากวาง)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={barcodeSubTab === 'price-cipher'}
              onClick={() => setBarcodeSubTab('price-cipher')}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition',
                barcodeSubTab === 'price-cipher'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
              )}
            >
              <KeyRound className="size-3.5" aria-hidden />
              ตั้งค่ารหัสราคา
            </button>
          </div>
        ) : null}

        {labelPrintTopSection === 'barcode' && (barcodeSubTab === 'queue' || barcodeSubTab === 'price-cipher') ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/80 bg-white text-indigo-800 shadow-sm">
                <Barcode className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h1 className="text-base font-semibold text-slate-900 lg:text-lg">ออกแบบบาร์โค้ด</h1>
                {barcodeSubTab === 'queue' ? (
                  <p className="text-xs text-slate-600 lg:text-sm">
                    จัดคิวก่อนพิมพ์จริง — เลือกข้อมูลที่ต้องการโชว์บนป้ายสินค้า
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 lg:text-sm">
                    เลือกระดับราคา 2 ช่วง (ทุน / ปลีก / ช่าง / ส่ง / VIP / พิเศษ) และชุด 10 หลัก — เลือกแบบที่ใช้พิมพ์ด้วยปุ่มวิทยุ
                  </p>
                )}
              </div>
            </div>
            {barcodeSubTab === 'queue' ? (
              <button
                type="button"
                onClick={openPrintSettings}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Printer className="size-3.5" aria-hidden />
                พิมพ์ทั้งหมด ({totalSheets.toLocaleString('th-TH')} แผ่น)
              </button>
            ) : null}
          </div>
        ) : (
          <div className="h-px bg-slate-100/80" aria-hidden />
        )}
      </div>

      {labelPrintTopSection === 'barcode' && barcodeSubTab === 'price-cipher' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <LabelPriceCipherSettingsView className="min-h-0 flex-1" />
        </div>
      ) : null}

      {labelPrintTopSection === 'receipt' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <ReceiptDesignerView className="min-h-0 flex-1" />
        </div>
      ) : null}

      {labelPrintTopSection === 'tax-invoice' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <TaxInvoiceFormDesignerView className="min-h-0 flex-1" />
        </div>
      ) : null}

      {labelPrintTopSection === 'barcode' && barcodeSubTab === 'designer' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <LabelBarcodeDesignerView className="min-h-0 flex-1" previewRow={designerPreviewRow} />
        </div>
      ) : null}

      {labelPrintTopSection === 'barcode' && barcodeSubTab === 'queue' ? (
      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <aside
          ref={prefsRef}
          className="max-h-full min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3 scroll-mt-4"
        >
          <p className="mb-2 text-xs font-semibold text-slate-700">ข้อมูลที่จะแสดงบนป้าย</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showName}
                onChange={(e) => patchPrefs({ showName: e.target.checked })}
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              ชื่อสินค้า
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showOem}
                onChange={(e) => patchPrefs({ showOem: e.target.checked })}
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              เบอร์ OEM
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showFactoryNo}
                onChange={(e) => patchPrefs({ showFactoryNo: e.target.checked })}
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              เบอร์โรงงาน
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showSku}
                onChange={(e) => patchPrefs({ showSku: e.target.checked })}
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              รหัส SKU
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => patchPrefs({ showPrice: e.target.checked })}
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              ราคา
            </label>
            <p className="text-[11px] text-slate-500">
              รายการพิมพ์จะมาจากคิวที่ส่งเข้ามา (เช่น กด F8 จากแฟ้มข้อมูลสินค้า) — ติ๊กด้านบนคือ “แก้ฟอร์ม”
              ว่าจะโชว์ฟิลด์ใดบนป้าย
            </p>
          </div>
        </aside>

        <section className="min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[48rem] border-collapse text-xs">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left">สินค้า</th>
                <th className="px-3 py-2 text-left">บาร์โค้ด</th>
                <th className="px-3 py-2 text-left">ข้อมูลที่จะแสดง</th>
                <th className="px-3 py-2 text-center">ขนาด</th>
                <th className="px-3 py-2 text-right">จำนวนแผ่น</th>
                <th className="px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    ยังไม่มีคิวพิมพ์
                  </td>
                </tr>
              ) : (
                rowsWithMeta.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-800">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{r.barcode}</td>
                    <td className="px-3 py-2 text-[11px] leading-relaxed text-slate-700">
                      <div className="space-y-0.5">
                        {showName ? <p>ชื่อ: {r.name || '-'}</p> : null}
                        {showOem ? <p>OEM: {r.oemNo || '-'}</p> : null}
                        {showFactoryNo ? <p>โรงงาน: {r.factoryNo || '-'}</p> : null}
                        {showSku ? <p>SKU: {r.sku || '-'}</p> : null}
                        {showPrice ? <p>ราคา: {r.price != null ? `฿${formatBaht(r.price)}` : '-'}</p> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700">{templateLabel(r.template)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-800">{r.qty.toLocaleString('th-TH')}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-100"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
      ) : null}
    </div>
  )
}
