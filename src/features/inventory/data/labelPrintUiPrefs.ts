import type { LabelPrintFormId } from '@/features/inventory/data/labelPrintForms'

const KEY = 'bento.inventory.labelPrintUiPrefs.v1'

export type LabelPrintUiPrefs = {
  showName: boolean
  showOem: boolean
  showFactoryNo: boolean
  showSku: boolean
  showPrice: boolean
  lastFormId: LabelPrintFormId
  lastDesignerTemplateId: string | null
}

const DEFAULTS: LabelPrintUiPrefs = {
  showName: true,
  showOem: true,
  showFactoryNo: true,
  showSku: true,
  showPrice: true,
  lastFormId: 'product_2x1',
  lastDesignerTemplateId: null,
}

export function loadLabelPrintUiPrefs(): LabelPrintUiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Record<string, unknown>

    return {
      showName: typeof p.showName === 'boolean' ? p.showName : DEFAULTS.showName,
      showOem: typeof p.showOem === 'boolean' ? p.showOem : DEFAULTS.showOem,
      showFactoryNo: typeof p.showFactoryNo === 'boolean' ? p.showFactoryNo : DEFAULTS.showFactoryNo,
      showSku: typeof p.showSku === 'boolean' ? p.showSku : DEFAULTS.showSku,
      showPrice: typeof p.showPrice === 'boolean' ? p.showPrice : DEFAULTS.showPrice,
      lastFormId: isFormId(p.lastFormId) ? p.lastFormId : DEFAULTS.lastFormId,
      lastDesignerTemplateId:
        typeof p.lastDesignerTemplateId === 'string' && p.lastDesignerTemplateId.length > 0
          ? p.lastDesignerTemplateId
          : null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveLabelPrintUiPrefs(prefs: LabelPrintUiPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

function isFormId(x: unknown): x is LabelPrintFormId {
  return (
    x === 'product_2x1' ||
    x === 'product_2x1_price' ||
    x === 'product_2x2' ||
    x === 'product_2x2_price' ||
    x === 'product_2x2_box' ||
    x === 'product_2x4' ||
    x === 'shelf_1x1' ||
    x === 'shelf_1x1_large'
  )
}
