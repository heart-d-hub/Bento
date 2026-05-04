import { clsx } from 'clsx'
import {
  LabelDesignerPrintPage,
  type LabelDesignerPrintLayoutMode,
} from '@/features/inventory/components/LabelDesignerPrintPage'
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
  appendLabelPrintQueue,
  LABEL_PRINT_QUEUE_CHANGED_EVENT,
  loadLabelPrintQueue,
  saveLabelPrintQueue,
  type LabelPrintQueueItem,
} from '@/features/inventory/data/labelPrintQueueStore'
import {
  computeAutoSheetCols,
  DESIGNER_PRINT_SHEET_ROWS_DEFAULT,
  labelPrintPageBoxMm,
} from '@/features/inventory/data/labelDesignerPrintMedia'
import { loadLabelPrintUiPrefs } from '@/features/inventory/data/labelPrintUiPrefs'
import {
  buildComposite2x4LabelPages,
  buildLabelPages,
  buildPriceCipherMoneyForRow,
  expandQueueToLabels,
  type EnrichedLabelRow,
} from '@/features/inventory/labelPrintLayout'
import { isComposite2x4StickerTemplate } from '@/features/inventory/data/labelDesignerDensityPresets'
import {
  loadCategoryTree,
  resolveLabelTemplateIdForProduct,
  INVENTORY_CATEGORIES_UPDATED_EVENT,
  type MainCategory,
} from '@/features/inventory/data/inventoryCategories'
import { getProductMasterList, normalizeSalesUnits, primaryStorageLocation, productStorageLocations, type ProductMasterDetail } from '@/features/inventory/data/productMasterData'
import { DESIGNER_SAMPLE_ROW } from '@/features/inventory/labelDesignerFieldUtils'
import { LabelBarcodeDesignerView } from '@/features/inventory/LabelBarcodeDesignerView'
import { LabelPriceCipherSettingsView } from '@/features/inventory/LabelPriceCipherSettingsView'
import { ReceiptDesignerView } from '@/features/inventory/ReceiptDesignerView'
import { TaxInvoiceFormDesignerView } from '@/features/inventory/TaxInvoiceFormDesignerView'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import {
  ArrowRight,
  Barcode,
  Eye,
  FlaskConical,
  KeyRound,
  LayoutTemplate,
  Package,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type LabelPrintWorkspacePageProps = {
  className?: string
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
  storeName: string
  priceCipher: PriceCipherSettings
}

export function LabelPrintWorkspacePage({ className }: LabelPrintWorkspacePageProps) {
  const { labelPrintTopSection, setLabelPrintTopSection, openTab, setBranchStockPanel } = useWorkspaceTabs()
  const [barcodeSubTab, setBarcodeSubTab] = useState<'queue' | 'designer' | 'price-cipher'>('queue')
  const [rows, setRows] = useState<LabelPrintQueueItem[]>(() => loadLabelPrintQueue())
  const prefs = useMemo(() => loadLabelPrintUiPrefs(), [])
  const [addQuery, setAddQuery] = useState('')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<PrintJob | null>(null)
  const [printJob, setPrintJob] = useState<PrintJob | null>(null)

  const [designerLib, setDesignerLib] = useState(() => loadLabelDesignerTemplatesState())
  const [categoryTree, setCategoryTree] = useState<MainCategory[]>(() => loadCategoryTree())

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

  useEffect(() => {
    const refresh = () => setCategoryTree(loadCategoryTree())
    window.addEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(INVENTORY_CATEGORIES_UPDATED_EVENT, refresh)
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
          storageLocation: master ? primaryStorageLocation(master) : undefined,
          storageLocations: master ? productStorageLocations(master) : undefined,
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

  const designerPreviewRow = rowsWithMeta[0] ?? DESIGNER_SAMPLE_ROW

  type QueueGroup = {
    templateId: string
    templateName: string
    templateMissing: boolean
    rows: EnrichedLabelRow[]
    totalSheets: number
  }

  const groups: QueueGroup[] = useMemo(() => {
    const fallbackId = prefs.lastDesignerTemplateId ?? designerLib.templates[0]?.id ?? ''
    const order: string[] = []
    const map = new Map<string, EnrichedLabelRow[]>()
    for (const r of rowsWithMeta) {
      const id = r.labelTemplateId ?? fallbackId
      if (!map.has(id)) {
        map.set(id, [])
        order.push(id)
      }
      map.get(id)!.push(r)
    }
    return order.map((templateId) => {
      const groupRows = map.get(templateId)!
      const entry = designerLib.templates.find((t) => t.id === templateId)
      return {
        templateId,
        templateName: entry?.name || (templateId ? '(ไม่พบแม่แบบ)' : '(ยังไม่ได้เลือกแม่แบบ)'),
        templateMissing: !entry,
        rows: groupRows,
        totalSheets: groupRows.reduce((s, r) => s + r.qty, 0),
      }
    })
  }, [rowsWithMeta, prefs.lastDesignerTemplateId, designerLib.templates])

  const buildJobForGroup = (group: QueueGroup): PrintJob | null => {
    if (group.templateMissing) {
      window.alert(`ไม่พบแม่แบบ "${group.templateName}" — แก้แม่แบบที่หมวด/สินค้า หรือสร้างแม่แบบใหม่ในแท็บออกแบบป้าย`)
      return null
    }
    const expanded = expandQueueToLabels(group.rows)
    if (expanded.length === 0) {
      window.alert('จำนวนแผ่นในกลุ่มเป็น 0 — ตรวจสอบจำนวนต่อรายการ')
      return null
    }
    const entry = designerLib.templates.find((t) => t.id === group.templateId)
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
      storeName: loadStoreProfile().storeName,
      priceCipher: loadPriceCipherSettings(),
    }
  }

  const handlePrintGroup = (group: QueueGroup) => {
    const job = buildJobForGroup(group)
    if (job) setPrintJob(job)
  }

  const handlePreviewGroup = (group: QueueGroup) => {
    const job = buildJobForGroup(group)
    if (!job) return
    setPreviewData(job)
    setPreviewOpen(true)
  }

  const handleTestGroup = (group: QueueGroup) => {
    if (group.rows.length === 0) return
    const sample = [{ ...group.rows[0]!, qty: 1 }]
    const job = buildJobForGroup({ ...group, rows: sample })
    if (job) setPrintJob(job)
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

  // Inline search → add directly to queue
  const addQueryHits = useMemo(() => {
    const q = addQuery.trim().toLowerCase()
    if (q.length < 2) return []
    const masters = getProductMasterList()
    const matches: ProductMasterDetail[] = []
    for (const p of masters) {
      const sku = p.sku.toLowerCase()
      const name = p.name.toLowerCase()
      const oem = (p.oemTags ?? []).join(' ').toLowerCase()
      const factory = (p.factoryNo ?? '').toLowerCase()
      const barcode = (p.boxBarcode ?? '').toLowerCase()
      if (
        sku.includes(q) ||
        name.includes(q) ||
        oem.includes(q) ||
        factory.includes(q) ||
        barcode.includes(q)
      ) {
        matches.push(p)
        if (matches.length >= 8) break
      }
    }
    return matches
  }, [addQuery])

  const handleAddProductToQueue = (p: ProductMasterDetail) => {
    const barcode = (p.boxBarcode?.trim() || p.sku.trim())
    if (!barcode) {
      window.alert('ไม่มีบาร์โค้ดหรือ SKU สำหรับสินค้านี้')
      return
    }
    appendLabelPrintQueue({
      name: p.name,
      barcode,
      sku: p.sku,
      oemNo: p.oemTags[0],
      factoryNo: p.factoryNo,
      price: p.sellPrice,
      qty: 1,
      template: 'medium',
      labelTemplateId: resolveLabelTemplateIdForProduct(p, categoryTree),
    })
    setAddQuery('')
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
                <h1 className="text-base font-semibold text-slate-900 lg:text-lg">
                  {barcodeSubTab === 'queue' ? 'คิวพิมพ์ป้าย' : 'ตั้งค่ารหัสราคา'}
                </h1>
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
            {barcodeSubTab === 'queue' && rows.length > 0 ? (
              <p className="text-[11px] text-slate-500">
                {rows.length.toLocaleString('th-TH')} รายการ · {totalSheets.toLocaleString('th-TH')} แผ่นรวม · {groups.length} กลุ่มแม่แบบ
              </p>
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
          <LabelBarcodeDesignerView
            className="min-h-0 flex-1"
            previewRow={designerPreviewRow}
            previewRowOptions={rowsWithMeta}
          />
        </div>
      ) : null}

      {labelPrintTopSection === 'barcode' && barcodeSubTab === 'queue' ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
          {/* Inline search → add directly */}
          <div className="relative shrink-0 rounded-2xl border border-slate-200 bg-slate-50/40 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="text"
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && addQueryHits[0]) {
                    e.preventDefault()
                    handleAddProductToQueue(addQueryHits[0])
                  }
                  if (e.key === 'Escape') setAddQuery('')
                }}
                placeholder="ค้นหาสินค้าเพื่อเพิ่มในคิว — SKU / ชื่อ / OEM / บาร์โค้ด..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              {addQuery && (
                <button
                  type="button"
                  onClick={() => setAddQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="ล้างการค้นหา"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {addQuery.trim().length >= 2 && (
              <div className="absolute left-2 right-2 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {addQueryHits.length === 0 ? (
                  <p className="px-3 py-3 text-[11px] text-slate-500">ไม่พบสินค้า — ลองคำอื่น</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {addQueryHits.map((p, i) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => handleAddProductToQueue(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-violet-50"
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-[12px] font-semibold text-slate-800">
                              {p.name}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-mono">{p.sku}</span>
                              {p.oemTags?.[0] && (
                                <span className="rounded bg-amber-50 px-1 text-amber-700">
                                  OEM {p.oemTags[0]}
                                </span>
                              )}
                              {p.sellPrice != null && (
                                <span className="text-emerald-700">฿{p.sellPrice.toLocaleString('th-TH')}</span>
                              )}
                            </span>
                          </span>
                          {i === 0 && (
                            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                              Enter
                            </kbd>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
                  <Package className="size-8 text-violet-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">ยังไม่มีคิวพิมพ์</h3>
                  <p className="text-xs text-slate-500">เลือกสินค้าจากแฟ้ม แล้วส่งเข้าคิวเพื่อพิมพ์ป้าย</p>
                </div>
                <ol className="mt-1 grid w-full grid-cols-3 gap-2 text-left">
                  {[
                    { n: 1, t: 'ไปแฟ้มสินค้า', d: 'เปิดรายการสินค้าทั้งหมด' },
                    { n: 2, t: 'เลือกสินค้า', d: 'ติ๊กแถวที่ต้องการพิมพ์' },
                    { n: 3, t: 'กด F8', d: 'ส่งเข้าคิวพิมพ์ที่นี่' },
                  ].map((s) => (
                    <li
                      key={s.n}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                        {s.n}
                      </span>
                      <span className="text-[12px] font-bold text-slate-700">{s.t}</span>
                      <span className="text-[10px] text-slate-500">{s.d}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openTab('branch-stock', 'แฟ้มสินค้า')
                      setBranchStockPanel('product-file')
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
                  >
                    <Package className="size-3.5" />
                    ไปแฟ้มสินค้า
                    <ArrowRight className="size-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-400">
                    หรือกด <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">F8</kbd> ในแฟ้มสินค้า
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
              {groups.map((group) => (
                <section
                  key={group.templateId}
                  className={clsx(
                    'overflow-hidden rounded-2xl border bg-white',
                    group.templateMissing ? 'border-red-200' : 'border-slate-200',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <LayoutTemplate className="size-3.5 text-indigo-600" aria-hidden />
                        <span className="truncate">{group.templateName}</span>
                        {group.templateMissing ? (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                            ไม่พบแม่แบบ
                          </span>
                        ) : null}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {group.rows.length.toLocaleString('th-TH')} รายการ ·{' '}
                        {group.totalSheets.toLocaleString('th-TH')} แผ่น
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTestGroup(group)}
                        disabled={group.templateMissing}
                        title="พิมพ์ป้ายแรกในกลุ่ม 1 ใบ"
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FlaskConical className="size-3.5" aria-hidden />
                        ทดสอบ 1 ใบ
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreviewGroup(group)}
                        disabled={group.templateMissing}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye className="size-3.5" aria-hidden />
                        ดูตัวอย่าง
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintGroup(group)}
                        disabled={group.templateMissing}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Printer className="size-3.5" aria-hidden />
                        พิมพ์ ({group.totalSheets.toLocaleString('th-TH')} แผ่น)
                      </button>
                    </div>
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-1.5 text-left">สินค้า</th>
                        <th className="px-3 py-1.5 text-left">บาร์โค้ด</th>
                        <th className="px-3 py-1.5 text-right">จำนวนแผ่น</th>
                        <th className="px-3 py-1.5 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((r) => (
                        <tr key={r.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 text-slate-800">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{r.barcode}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                            {r.qty.toLocaleString('th-TH')}
                          </td>
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
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
