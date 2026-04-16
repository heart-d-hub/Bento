import { clsx } from 'clsx'
import { LabelDesignerStickerBody } from '@/features/inventory/components/LabelDesignerStickerBody'
import {
  COMPOSITE_2X4_PHYSICAL_HEIGHT_MM,
  COMPOSITE_2X4_PHYSICAL_WIDTH_MM,
  COMPOSITE_2X4_SLOTS_PER_STICKER,
} from '@/features/inventory/data/labelDesignerDensityPresets'
import {
  LABEL_PRINT_MARGIN_BOTTOM_MM,
  LABEL_PRINT_MARGIN_LEFT_MM,
  LABEL_PRINT_MARGIN_RIGHT_MM,
  LABEL_PRINT_MARGIN_TOP_MM,
  LABEL_PRINT_SHEET_WIDTH_MM,
  computeLabelGridGapsMm,
  labelPrintContentWidthMm,
  labelPrintPageTotalHeightMm,
} from '@/features/inventory/data/labelDesignerPrintMedia'
import type { LabelDesignerTemplate } from '@/features/inventory/data/labelDesignerTemplateStore'
import type { PriceCipherSettings } from '@/features/inventory/data/priceCipherCodec'
import type { EnrichedLabelRow } from '@/features/inventory/labelPrintLayout'

export type LabelDesignerPrintLayoutMode = 'simple' | 'composite2x4'

/** ลำดับในคิวต่อดวง: ซ้ายบน → ซ้ายล่าง → ขวาบน → ขวาล่าง */
const COMPOSITE_2X4_GRID_PLACEMENT: { gridColumn: number; gridRow: number; slotIndex: number }[] = [
  { gridColumn: 1, gridRow: 1, slotIndex: 0 },
  { gridColumn: 1, gridRow: 2, slotIndex: 1 },
  { gridColumn: 2, gridRow: 1, slotIndex: 2 },
  { gridColumn: 2, gridRow: 2, slotIndex: 3 },
]

export function LabelDesignerPrintPage({
  pageRows,
  template,
  sheetCols,
  sheetRows,
  printLayout = 'simple',
  storeName,
  priceCipher,
  pageIndex,
  isLastPage,
}: {
  pageRows: (EnrichedLabelRow | null)[]
  template: LabelDesignerTemplate
  sheetCols: number
  sheetRows: number
  printLayout?: LabelDesignerPrintLayoutMode
  storeName: string
  priceCipher: PriceCipherSettings
  pageIndex: number
  isLastPage: boolean
}) {
  const cols = Math.max(1, sheetCols)
  const rows = Math.max(1, sheetRows)
  const per = cols * rows
  const isComposite = printLayout === 'composite2x4'

  const physicalWmm = isComposite ? COMPOSITE_2X4_PHYSICAL_WIDTH_MM : template.widthMm
  const physicalHmm = isComposite ? COMPOSITE_2X4_PHYSICAL_HEIGHT_MM : template.heightMm

  const cells = isComposite
    ? Array.from({ length: per }, (_, i) => {
        const base = i * COMPOSITE_2X4_SLOTS_PER_STICKER
        return pageRows.slice(base, base + COMPOSITE_2X4_SLOTS_PER_STICKER) as (EnrichedLabelRow | null)[]
      })
    : Array.from({ length: per }, (_, i) => [pageRows[i] ?? null] as (EnrichedLabelRow | null)[])

  const contentW = labelPrintContentWidthMm()
  const { colGapMm, rowGapMm } = computeLabelGridGapsMm(cols, rows, physicalWmm)
  const pageHeightMm = labelPrintPageTotalHeightMm(rows, physicalHmm, rowGapMm)

  return (
    <div
      className={clsx(
        'label-print-page mx-auto print:mx-0 box-border bg-white',
        !isLastPage && 'break-after-page',
      )}
      style={{
        width: `${LABEL_PRINT_SHEET_WIDTH_MM}mm`,
        minHeight: `${pageHeightMm}mm`,
        boxSizing: 'border-box',
        padding: `${LABEL_PRINT_MARGIN_TOP_MM}mm ${LABEL_PRINT_MARGIN_RIGHT_MM}mm ${LABEL_PRINT_MARGIN_BOTTOM_MM}mm ${LABEL_PRINT_MARGIN_LEFT_MM}mm`,
      }}
    >
      <div className="flex justify-start" style={{ width: `${contentW}mm` }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${physicalWmm}mm)`,
            gridTemplateRows: `repeat(${rows}, ${physicalHmm}mm)`,
            columnGap: `${colGapMm}mm`,
            rowGap: `${rowGapMm}mm`,
          }}
        >
          {cells.map((slotRows, i) => (
            <div
              key={`cell-${pageIndex}-${i}`}
              className="box-border overflow-hidden bg-white"
              style={{ width: `${physicalWmm}mm`, height: `${physicalHmm}mm` }}
            >
              {isComposite ? (
                <div
                  className="grid size-full bg-white"
                  style={{
                    gridTemplateColumns: `repeat(2, ${template.widthMm}mm)`,
                    gridTemplateRows: `repeat(2, ${template.heightMm}mm)`,
                  }}
                >
                  {COMPOSITE_2X4_GRID_PLACEMENT.map(({ gridColumn, gridRow, slotIndex }) => {
                    const row = slotRows[slotIndex] ?? null
                    return (
                      <div
                        key={`sub-${pageIndex}-${i}-${slotIndex}`}
                        className="box-border overflow-hidden bg-white"
                        style={{
                          gridColumn,
                          gridRow,
                          width: `${template.widthMm}mm`,
                          height: `${template.heightMm}mm`,
                        }}
                      >
                        {row ? (
                          <div className="relative size-full bg-white">
                            <LabelDesignerStickerBody
                              template={template}
                              row={row}
                              storeName={storeName}
                              priceCipher={priceCipher}
                              interactive={false}
                            />
                          </div>
                        ) : (
                          <div className="flex size-full items-center justify-center border border-dashed border-slate-300 text-[7px] text-slate-400 print:border-0">
                            ว่าง
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : slotRows[0] ? (
                <div className="relative size-full bg-white">
                  <LabelDesignerStickerBody
                    template={template}
                    row={slotRows[0]}
                    storeName={storeName}
                    priceCipher={priceCipher}
                    interactive={false}
                  />
                </div>
              ) : (
                <div className="flex size-full items-center justify-center border border-dashed border-slate-300 text-[8px] text-slate-400 print:border-0">
                  ว่าง
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[9px] text-slate-400 print:hidden">
        หน้า {pageIndex + 1} · แผ่น {LABEL_PRINT_SHEET_WIDTH_MM} มม. · พื้นที่พิมพ์ {contentW} มม. ·{' '}
        {isComposite
          ? `ดวง ${cols}×${rows} (50×35 มม.) · 2×4 ต่อดวง ซ้ายบน→ซ้ายล่าง→ขวาบน→ขวาล่าง`
          : `เรียง ${cols}×${rows}`}
      </p>
    </div>
  )
}
