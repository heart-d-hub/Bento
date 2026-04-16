export function newEntityId(prefix: string): string {
  const suffix =
    globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  return `${prefix}-${suffix}`
}
