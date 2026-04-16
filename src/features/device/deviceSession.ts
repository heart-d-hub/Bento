const DEVICE_LABEL_KEY = 'bento.device.label.v1'

export function getDeviceLabel(): string {
  try {
    const v = localStorage.getItem(DEVICE_LABEL_KEY)
    const s = (v ?? '').trim()
    return s || 'PC1'
  } catch {
    return 'PC1'
  }
}

export function setDeviceLabel(label: string): void {
  try {
    const s = label.trim()
    if (!s) {
      localStorage.removeItem(DEVICE_LABEL_KEY)
    } else {
      localStorage.setItem(DEVICE_LABEL_KEY, s)
    }
  } catch {
    /* ignore */
  }
}

