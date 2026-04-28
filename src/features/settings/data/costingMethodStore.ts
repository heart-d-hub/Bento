export type CostingMethod = 'average' | 'latest'

const KEY = 'bento.settings.costingMethod.v1'
export const COSTING_METHOD_CHANGED_EVENT = 'bento-costing-method-changed'

export function loadCostingMethod(): CostingMethod {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'latest' ? 'latest' : 'average'
  } catch {
    return 'average'
  }
}

export function saveCostingMethod(m: CostingMethod): void {
  localStorage.setItem(KEY, m)
  window.dispatchEvent(new CustomEvent(COSTING_METHOD_CHANGED_EVENT))
}
