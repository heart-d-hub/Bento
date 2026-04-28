/** Strip everything except digits. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Format digits for display.
 *   10 digits → 0XX-XXX-XXXX  (mobile)
 *    9 digits → 0X-XXX-XXXX   (fixed/home with area code)
 *   anything else → digits as-is
 */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw)
  if (!d) return ''
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 9)  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
  return d
}

/** True if the digit count is a valid Thai phone length (10 = mobile, 9 = fixed/home). */
export function isValidPhoneLength(raw: string): boolean {
  const len = normalizePhone(raw).length
  return len === 0 || len === 9 || len === 10
}

/** Returns true if the phone value matches a search query, regardless of formatting. */
export function phoneMatchesQuery(phone: string, query: string): boolean {
  if (!phone || !query) return false
  const dPhone = normalizePhone(phone)
  const dQuery = normalizePhone(query)
  if (dQuery.length > 0) return dPhone.includes(dQuery)
  return phone.toLowerCase().includes(query.toLowerCase())
}
