export type LabelTemplate = 'small' | 'medium' | 'large'

export type LabelPrintQueueItem = {
  id: string
  name: string
  barcode: string
  sku?: string
  oemNo?: string
  factoryNo?: string
  price?: number
  qty: number
  template: LabelTemplate
}

const KEY = 'bento.inventory.labelPrintQueue.v1'
export const LABEL_PRINT_QUEUE_CHANGED_EVENT = 'bento-label-print-queue-changed'

function newId(): string {
  return `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadLabelPrintQueue(): LabelPrintQueueItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LabelPrintQueueItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveLabelPrintQueue(rows: LabelPrintQueueItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(rows))
  window.dispatchEvent(new CustomEvent(LABEL_PRINT_QUEUE_CHANGED_EVENT))
}

export function appendLabelPrintQueue(item: Omit<LabelPrintQueueItem, 'id'>): LabelPrintQueueItem {
  const full: LabelPrintQueueItem = { ...item, id: newId() }
  const next = [full, ...loadLabelPrintQueue()]
  saveLabelPrintQueue(next)
  return full
}
