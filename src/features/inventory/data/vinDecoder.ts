export type VinDecodeResult = {
  vin: string
  year: number | null
  make: string | null   // e.g. 'TOYOTA'
  model: string | null  // e.g. 'HILUX'
  engine: string | null // e.g. '2.4L 4สูบ'
  wmi: string           // first 3 chars of VIN — shown when make is unknown
  source: 'local' | 'nhtsa'
}

// ── WMI → Make (World Manufacturer Identifier, first 3 chars) ─────────────────
const WMI: Record<string, string> = {
  // ── Toyota ──────────────────────────────────────────────────────────────────
  JT2: 'TOYOTA', JT3: 'TOYOTA', JT4: 'TOYOTA', JT6: 'TOYOTA',
  JT7: 'TOYOTA', JT8: 'TOYOTA', JTD: 'TOYOTA', JTE: 'TOYOTA',
  MHF: 'TOYOTA',  // Toyota Motor Thailand (Hilux, Fortuner, Commuter, etc.)
  // ── Honda ───────────────────────────────────────────────────────────────────
  JH1: 'HONDA', JH4: 'HONDA', JHM: 'HONDA',
  MRH: 'HONDA',   // Honda Automobile Thailand (Civic, City, CR-V, etc.)
  // ── Isuzu ───────────────────────────────────────────────────────────────────
  JAB: 'ISUZU',
  MHL: 'ISUZU',   // Isuzu Motors (Thailand) — D-Max, MU-X
  MHY: 'ISUZU',   // Isuzu (Thailand) — alternative plant code
  MHC: 'ISUZU',   // Isuzu (Thailand) — older D-Max / TFR variants
  // ── Mitsubishi ──────────────────────────────────────────────────────────────
  JA3: 'MITSUBISHI', JA4: 'MITSUBISHI', JM6: 'MITSUBISHI',
  MM8: 'MITSUBISHI', MMB: 'MITSUBISHI',
  MMC: 'MITSUBISHI',  // Mitsubishi Motors Thailand (Triton, Pajero Sport, Xpander)
  // ── Nissan ──────────────────────────────────────────────────────────────────
  JN1: 'NISSAN', JN3: 'NISSAN', JN6: 'NISSAN', JN8: 'NISSAN',
  MNB: 'NISSAN',  // Nissan Motor Thailand (Navara, Terra, Almera)
  // ── Mazda ───────────────────────────────────────────────────────────────────
  JM1: 'MAZDA', JM3: 'MAZDA', JMB: 'MAZDA',
  MMM: 'MAZDA',   // Mazda Sales (Thailand) — older models
  // ── Ford ────────────────────────────────────────────────────────────────────
  MNA: 'FORD',    // Ford Thailand (Ranger, Everest)
  MNV: 'FORD',
  '1FA': 'FORD', '1FB': 'FORD', '1FC': 'FORD', '1FD': 'FORD',
  // ── Chevrolet / GM ──────────────────────────────────────────────────────────
  MEC: 'CHEVROLET',  // GM Thailand (Colorado, Trailblazer)
  KL8: 'CHEVROLET', KLY: 'CHEVROLET', // GM Korea
  '1G1': 'CHEVROLET', '1G6': 'CADILLAC',
  // ── Hyundai ─────────────────────────────────────────────────────────────────
  KMH: 'HYUNDAI', KMJ: 'HYUNDAI',
  KMY: 'HYUNDAI',  // Hyundai (additional Korea plant)
  // ── Kia ─────────────────────────────────────────────────────────────────────
  KNA: 'KIA', KNB: 'KIA', KND: 'KIA',
  // ── Subaru ──────────────────────────────────────────────────────────────────
  JF1: 'SUBARU', JF2: 'SUBARU',
  // ── Suzuki ──────────────────────────────────────────────────────────────────
  JSA: 'SUZUKI', JSB: 'SUZUKI', JS1: 'SUZUKI', JS2: 'SUZUKI',
  JS3: 'SUZUKI', JS4: 'SUZUKI',
  MED: 'SUZUKI',  // Suzuki Motor Thailand (Carry, Swift, Ertiga, Vitara)
  MEF: 'SUZUKI',  // Suzuki Thailand — Ciaz / Ertiga
  // ── MG / SAIC ───────────────────────────────────────────────────────────────
  LSG: 'MG',  // SAIC Motor — MG ZS, HS, MG3, MG5, etc. (China-assembled, sold in Thailand)
  LRB: 'MG',  // SAIC-MG alternative code
  L6T: 'MG',  // MG (older models)
  // ── BYD ─────────────────────────────────────────────────────────────────────
  LDC: 'BYD',  // BYD Co. Ltd. — Atto 3, Dolphin, Seal, etc.
  LBV: 'BYD',  // BYD — alternative plant
  LFB: 'BYD',  // BYD (some models)
  // ── GWM / Haval / ORA ───────────────────────────────────────────────────────
  LZG: 'GWM',  // Great Wall Motors — Haval H6, Jolion, Poer, ORA Good Cat
  LS5: 'GWM',  // Haval (GWM sub-brand)
  LG1: 'GWM',  // GWM alternative
  // ── BMW ─────────────────────────────────────────────────────────────────────
  WBA: 'BMW', WBS: 'BMW', WBX: 'BMW', WBY: 'BMW',
  // ── Mercedes-Benz ───────────────────────────────────────────────────────────
  WDB: 'MERCEDES-BENZ', WDD: 'MERCEDES-BENZ', WDC: 'MERCEDES-BENZ',
  W1K: 'MERCEDES-BENZ', W1N: 'MERCEDES-BENZ',  // newer chassis codes
  // ── Volkswagen ──────────────────────────────────────────────────────────────
  WVW: 'VOLKSWAGEN', WV1: 'VOLKSWAGEN', WV2: 'VOLKSWAGEN',
  LFV: 'VOLKSWAGEN', LSV: 'VOLKSWAGEN',  // VW China (Polo, etc.)
  // ── Audi ────────────────────────────────────────────────────────────────────
  WAU: 'AUDI', WA1: 'AUDI',
  // ── Porsche ─────────────────────────────────────────────────────────────────
  WP0: 'PORSCHE',
  // ── Volvo ───────────────────────────────────────────────────────────────────
  YV1: 'VOLVO', YV4: 'VOLVO',
  // ── Land Rover ──────────────────────────────────────────────────────────────
  SAL: 'LAND ROVER',
  // ── Jaguar ──────────────────────────────────────────────────────────────────
  SAJ: 'JAGUAR',
  // ── Lexus ───────────────────────────────────────────────────────────────────
  JTH: 'LEXUS', JTJ: 'LEXUS',
  // ── Peugeot / Citroën ───────────────────────────────────────────────────────
  VF3: 'PEUGEOT', VF7: 'PEUGEOT',
  VF8: 'CITROEN', VF9: 'CITROEN',
  // ── Proton ──────────────────────────────────────────────────────────────────
  PL1: 'PROTON',  // Proton (Malaysia) — Saga, X50, X70
  // ── Tesla ───────────────────────────────────────────────────────────────────
  '5YJ': 'TESLA', '7SA': 'TESLA', 'LRW': 'TESLA',
}

// VIN character 10 encodes model year
const YEAR_CHARS = 'ABCDEFGHJKLMNPRSTUVWXY123456789'
const YEAR_BASE = [
  1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,
  1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,
  2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,
]

function decodeYearChar(ch: string): number | null {
  const idx = YEAR_CHARS.indexOf(ch.toUpperCase())
  if (idx === -1) return null
  const base = YEAR_BASE[idx]
  // 30-year cycle: A=1980 or 2010, 1=2001 or 2031, etc.
  const current = new Date().getFullYear()
  const later = base + 30
  return later <= current + 1 ? later : base
}

function localMake(vin: string): string | null {
  const u = vin.toUpperCase()
  return WMI[u.slice(0, 3)] ?? null
}

export function validateVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

export function decodeVinLocal(vin: string): VinDecodeResult {
  const u = vin.toUpperCase()
  return {
    vin: u,
    year: decodeYearChar(u[9]),
    make: localMake(u),
    model: null,
    engine: null,
    wmi: u.slice(0, 3),
    source: 'local',
  }
}

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const u = vin.toUpperCase()
  // Start with local decode as baseline
  const local = decodeVinLocal(u)
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${u}?format=json`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return local
    const json = await res.json() as { Results?: Record<string, string>[] }
    const r = json.Results?.[0]
    if (!r || r.ErrorCode?.startsWith('11')) return local  // code 11 = not found

    const yearNum = parseInt(r.ModelYear ?? '') || local.year
    const make = r.Make?.toUpperCase() || local.make
    const model = r.Model?.toUpperCase() || null
    const displ = r.DisplacementL ? `${parseFloat(r.DisplacementL).toFixed(1)}L` : ''
    const cyl = r.EngineCylinders ? `${r.EngineCylinders}สูบ` : ''
    const engine = [displ, cyl].filter(Boolean).join(' ') || null

    return { vin: u, year: yearNum, make, model, engine, wmi: u.slice(0, 3), source: 'nhtsa' }
  } catch {
    return local
  }
}
