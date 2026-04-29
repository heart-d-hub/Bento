/**
 * Local VIN decoder — no internet required.
 * Covers Thai market brands (Japan-assembled + Thailand-assembled) and common imports.
 *
 * VIN structure (ISO 3779 / SAE J853):
 *   [0-2]  WMI  — World Manufacturer Identifier → brand
 *   [3-7]  VDS  — Vehicle Descriptor Section (model / body / engine)
 *   [8]    Check digit (0-9 or X)
 *   [9]    Model year code
 *   [10]   Assembly plant
 *   [11-16] Sequential number
 */

export type CheckDigitStatus = 'valid' | 'invalid' | 'unknown'

export type VinDecodeResult = {
  vin: string
  wmi: string
  brand?: string
  /** Primary model year (most likely for Thai market) */
  modelYear?: number
  /** Alternate year when position-10 code is ambiguous (e.g. A = 1980 or 2010) */
  modelYearAlt?: number
  /** ISO check-digit validation result. 'unknown' = non-US VIN may use 0 as placeholder */
  checkDigit: CheckDigitStatus
  isValid: boolean
  error?: string
}

// ── WMI lookup ──────────────────────────────────────────────────────────────
// Sorted longest-match-first so exact 3-char WMIs win over 2-char prefixes.

const WMI_TABLE: [prefix: string, brand: string][] = [
  // Thailand-assembled (M = Thailand/Asia zone)
  ['MHF', 'Toyota'],
  ['MHR', 'Honda'],
  ['MNA', 'Nissan'],
  ['MNB', 'Nissan'],
  ['MMB', 'Mitsubishi'],
  ['MMC', 'Mitsubishi'],
  ['MR0', 'Isuzu'],
  ['MR1', 'Isuzu'],
  ['MLC', 'Chevrolet'],
  ['MLH', 'Honda'],
  ['MA3', 'Suzuki'],
  ['MA1', 'Mahindra'],
  // Japan (J)
  ['JAA', 'Isuzu'],
  ['JAB', 'Isuzu'],
  ['JAC', 'Isuzu'],
  ['JA3', 'Mitsubishi'],
  ['JA4', 'Mitsubishi'],
  ['JMB', 'Mitsubishi'],
  ['JHM', 'Honda'],
  ['JT2', 'Toyota'], ['JT3', 'Toyota'], ['JT4', 'Toyota'],
  ['JT5', 'Toyota'], ['JT6', 'Toyota'], ['JT7', 'Toyota'], ['JT8', 'Toyota'],
  ['JTE', 'Toyota'], ['JTM', 'Toyota'], ['JTN', 'Toyota'], ['JTK', 'Toyota'],
  ['JNA', 'Nissan'], ['JNB', 'Nissan'], ['JNC', 'Nissan'],
  ['JN1', 'Nissan'], ['JN3', 'Nissan'], ['JN6', 'Nissan'], ['JN8', 'Nissan'],
  ['JM1', 'Mazda'], ['JM3', 'Mazda'], ['JM6', 'Mazda'],
  ['JSA', 'Suzuki'], ['JS1', 'Suzuki'], ['JS2', 'Suzuki'], ['JS3', 'Suzuki'],
  ['JF1', 'Subaru'], ['JF2', 'Subaru'],
  ['JDA', 'Daihatsu'], ['JDB', 'Daihatsu'],
  ['JKA', 'Kawasaki'], ['JKB', 'Kawasaki'],
  ['JYA', 'Yamaha'], ['JYB', 'Yamaha'],
  ['SHH', 'Honda'],
  // Korea (K)
  ['KMH', 'Hyundai'], ['KMF', 'Hyundai'], ['KMT', 'Hyundai'],
  ['KNA', 'Kia'], ['KNB', 'Kia'], ['KND', 'Kia'],
  // Germany (W)
  ['WBA', 'BMW'], ['WBS', 'BMW'], ['WBY', 'BMW'],
  ['WDB', 'Mercedes-Benz'], ['WDC', 'Mercedes-Benz'], ['WDD', 'Mercedes-Benz'],
  ['WVW', 'Volkswagen'], ['WV1', 'Volkswagen'], ['WV2', 'Volkswagen'],
  ['WAU', 'Audi'], ['TRU', 'Audi'],
  ['WP0', 'Porsche'], ['WP1', 'Porsche'],
  // USA (1/4/5)
  ['1FA', 'Ford'], ['1FB', 'Ford'], ['1FC', 'Ford'], ['1FD', 'Ford'],
  ['1FM', 'Ford'], ['1FT', 'Ford'],
  ['1G1', 'Chevrolet'], ['1GC', 'Chevrolet'], ['1GN', 'Chevrolet'], ['1GT', 'Chevrolet'],
  ['2HG', 'Honda'], ['2HK', 'Honda'],
  ['3VW', 'Volkswagen'],
  // China (L)
  ['LFS', 'Changan'], ['LFV', 'Volkswagen'], ['LSG', 'General Motors'],
  ['LGX', 'Buick'], ['LSY', 'Buick'], ['LNB', 'Ford'], ['LVS', 'Volvo'],
  // 2-char prefix fallbacks (lower priority)
  ['JH', 'Honda'],
  ['JT', 'Toyota'],
  ['JN', 'Nissan'],
  ['JM', 'Mazda'],
  ['JS', 'Suzuki'],
  ['JA', 'Isuzu/Mitsubishi'],
  ['JF', 'Subaru'],
  ['JD', 'Daihatsu'],
  ['JK', 'Kawasaki'],
  ['JY', 'Yamaha'],
  ['KM', 'Hyundai/Kia'],
  ['WB', 'BMW'],
  ['WD', 'Mercedes-Benz'],
  ['WV', 'Volkswagen'],
  ['WA', 'Audi'],
  ['MM', 'Mitsubishi'],
  ['MH', 'Toyota/Honda'],
  ['MN', 'Nissan'],
  ['MR', 'Isuzu'],
]

// ── Model year (position 10, index 9) ───────────────────────────────────────
// Letters I, O, Q, U, Z and digit 0 are never used in VINs.

const YEAR_CODE: Record<string, number[]> = {
  A: [1980, 2010], B: [1981, 2011], C: [1982, 2012], D: [1983, 2013],
  E: [1984, 2014], F: [1985, 2015], G: [1986, 2016], H: [1987, 2017],
  J: [1988, 2018], K: [1989, 2019], L: [1990, 2020], M: [1991, 2021],
  N: [1992, 2022], P: [1993, 2023], R: [1994, 2024], S: [1995, 2025],
  T: [1996], V: [1997], W: [1998], X: [1999], Y: [2000],
  '1': [2001], '2': [2002], '3': [2003], '4': [2004], '5': [2005],
  '6': [2006], '7': [2007], '8': [2008], '9': [2009],
}

// ── Check digit (position 9, index 8) ───────────────────────────────────────
// Reference: NHTSA / SAE J853

const CHAR_VALUE: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}

// Position weights 1-9, 10-17 (index 0-16)
const POSITION_WEIGHT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

function checkDigitValidate(vin: string): CheckDigitStatus {
  if (vin.length !== 17) return 'unknown'
  const declared = vin[8].toUpperCase()
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const v = CHAR_VALUE[vin[i].toUpperCase()]
    if (v === undefined) return 'unknown'
    sum += v * POSITION_WEIGHT[i]
  }
  const rem = sum % 11
  const expected = rem === 10 ? 'X' : String(rem)
  if (declared === expected) return 'valid'
  // Many non-US manufacturers (Thai/Japanese assembled) use '0' as a non-checked placeholder.
  // Treat that as unknown rather than invalid so we don't alarm staff unnecessarily.
  if (declared === '0') return 'unknown'
  return 'invalid'
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const INVALID_CHARS = /[IOQioq]/

function lookupBrand(wmi: string): string | undefined {
  const upper = wmi.toUpperCase()
  for (const [prefix, brand] of WMI_TABLE) {
    if (prefix.length === 3 && upper.startsWith(prefix)) return brand
  }
  for (const [prefix, brand] of WMI_TABLE) {
    if (prefix.length === 2 && upper.startsWith(prefix)) return brand
  }
  return undefined
}

function decodeYear(code: string): { year?: number; yearAlt?: number } {
  const years = YEAR_CODE[code.toUpperCase()]
  if (!years) return {}
  if (years.length === 1) return { year: years[0] }
  const [older, newer] = [...years].sort((a, b) => a - b)
  return { year: newer, yearAlt: older }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function isValidVinFormat(vin: string): boolean {
  return vin.length === 17 && !INVALID_CHARS.test(vin) && /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

export function decodeVin(raw: string): VinDecodeResult {
  const vin = raw.trim().toUpperCase()

  if (vin.length === 0) {
    return { vin, wmi: '', checkDigit: 'unknown', isValid: false, error: 'กรอก VIN' }
  }
  if (vin.length !== 17) {
    return {
      vin, wmi: vin.slice(0, 3), checkDigit: 'unknown', isValid: false,
      error: `VIN ต้องมี 17 ตัวอักษร (ขณะนี้ ${vin.length} ตัว)`,
    }
  }
  if (INVALID_CHARS.test(vin)) {
    return { vin, wmi: vin.slice(0, 3), checkDigit: 'unknown', isValid: false, error: 'VIN ไม่ควรมีตัวอักษร I, O หรือ Q' }
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return { vin, wmi: vin.slice(0, 3), checkDigit: 'unknown', isValid: false, error: 'VIN มีอักขระที่ไม่ถูกต้อง' }
  }

  const wmi = vin.slice(0, 3)
  const yearCode = vin[9]
  const brand = lookupBrand(wmi)
  const { year, yearAlt } = decodeYear(yearCode)
  const checkDigit = checkDigitValidate(vin)

  return { vin, wmi, brand, modelYear: year, modelYearAlt: yearAlt, checkDigit, isValid: true }
}
