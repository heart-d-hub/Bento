import {
  clearProductMasterListOverride,
  getProductMasterList,
  saveProductMasterList,
} from '@/features/inventory/data/productMasterData'
import {
  downloadTextFile,
  exportProductMasterCsvTemplateString,
  exportProductsToCsvString,
  importProductsFromCsvString,
} from '@/features/inventory/data/productMasterCsv'
import { useVehicleCatalog } from '@/features/vehicle/context/VehicleCatalogContext'
import {
  exportVehicleCatalogToJsonString,
  importVehicleCatalogFromJsonString,
} from '@/features/vehicle/data/vehicleCatalogIo'
import { clsx } from 'clsx'
import { Car, Download, FileSpreadsheet, FileStack, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

type DataFileSettingsPanelProps = {
  className?: string
}

export function DataFileSettingsPanel({ className }: DataFileSettingsPanelProps) {
  const { catalog, setCatalog } = useVehicleCatalog()
  const fileRef = useRef<HTMLInputElement>(null)
  const vehicleFileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const count = getProductMasterList().length

  const handleExport = () => {
    setLastMessage(null)
    const csv = exportProductsToCsvString(getProductMasterList())
    const stamp = new Date().toISOString().slice(0, 10)
    downloadTextFile(`bento-products-${stamp}.csv`, csv, 'text/csv')
    setLastMessage(
      `ส่งออกแล้ว ${count} รายการ — ไฟล์ถูกบันทึกไปที่โฟลเดอร์ดาวน์โหลดของ Windows (เช่น ดาวน์โหลด) ตามที่เบราว์เซอร์หรือโปรแกรมกำหนด — นำไปเปิดใน Google Sheets ได้ที่เมนู ไฟล์ → นำเข้า`,
    )
  }

  const handleDownloadTemplate = () => {
    setLastMessage(null)
    const csv = exportProductMasterCsvTemplateString()
    downloadTextFile('bento-products-template.csv', csv, 'text/csv')
    setLastMessage(
      'ดาวน์โหลดเทมเพลตแล้ว — อยู่ที่โฟลเดอร์ดาวน์โหลด — เปิดใน Excel/Sheets แล้วกรอกข้อมูล ลบแถวตัวอย่างได้ถ้าไม่ต้องการ จากนั้นบันทึกเป็น CSV แล้วใช้ปุ่มนำเข้า',
    )
  }

  const handlePickImport = () => {
    setLastMessage(null)
    fileRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setLastMessage(null)
    try {
      const text = await file.text()
      const result = importProductsFromCsvString(text, catalog)
      if (!result.ok) {
        setLastMessage(result.error)
        return
      }
      if (
        !window.confirm(
          `นำเข้า ${result.products.length} รายการแทนแฟ้มปัจจุบันทั้งหมด? (การดำเนินการนี้จะเขียนทับข้อมูลสินค้าในเครื่อง)`,
        )
      ) {
        return
      }
      saveProductMasterList(result.products)
      let msg = `นำเข้าแล้ว ${result.products.length} รายการ — รีเฟรชหน้าแฟ้มสินค้าหากเปิดอยู่`
      if (result.warnings.length > 0) {
        const show = result.warnings.slice(0, 25)
        const more =
          result.warnings.length > 25 ? `\n… และอีก ${result.warnings.length - 25} รายการ` : ''
        msg += `\n\nคำเตือน (${result.warnings.length}):\n${show.join('\n')}${more}`
      }
      setLastMessage(msg)
    } catch {
      setLastMessage('อ่านไฟล์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleExportVehicleCatalog = () => {
    setLastMessage(null)
    const json = exportVehicleCatalogToJsonString(catalog)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadTextFile(`bento-vehicle-catalog-${stamp}.json`, json, 'application/json')
    setLastMessage(
      'ส่งออกแคตตาล็อกรถแล้ว — เก็บไฟล์ .json ไว้สำรองหรือนำไปเครื่องอื่น / ให้ลูกน้องแก้แล้วนำเข้า (นำเข้าจะแทนที่ข้อมูลรุ่นรถในเครื่องนี้ทั้งหมด)',
    )
  }

  const handlePickVehicleImport = () => {
    setLastMessage(null)
    vehicleFileRef.current?.click()
  }

  const handleVehicleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setLastMessage(null)
    try {
      const text = await file.text()
      const result = importVehicleCatalogFromJsonString(text)
      if (!result.ok) {
        setLastMessage(result.error)
        return
      }
      if (
        !window.confirm(
          'นำเข้าแคตตาล็อกรถจากไฟล์นี้แทนข้อมูลปัจจุบันทั้งหมด?\n\nควรส่งออก JSON สำรองก่อน — การดำเนินการนี้เขียนทับรุ่นรถในเครื่องนี้',
        )
      ) {
        return
      }
      setCatalog(result.catalog)
      setLastMessage('นำเข้าแคตตาล็อกรถแล้ว — รีเฟรชหน้าจัดการรุ่นรถ / แฟ้มสินค้าหากเปิดอยู่')
    } catch {
      setLastMessage('อ่านไฟล์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleResetSeed = () => {
    setLastMessage(null)
    if (
      !window.confirm(
        'ลบข้อมูลสินค้าที่บันทึกในเครื่อง และคืนชุดตัวอย่างเริ่มต้นของโปรแกรม? การกระทำนี้ไม่ถอยกลับอัตโนมัติ (ควรส่งออก CSV สำรองก่อน)',
      )
    ) {
      return
    }
    clearProductMasterListOverride()
    setLastMessage('คืนชุดตัวอย่างแล้ว')
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
          <FileSpreadsheet className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">แฟ้มข้อมูลสินค้า (CSV / Google Sheets)</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            ส่งออกเป็นไฟล์ CSV แล้วนำเข้า Google Sheets ได้ทางเมนู <strong className="font-medium">ไฟล์ → นำเข้า</strong> หรือลากวางไฟล์
            — แก้ข้อมูลใน Sheet แล้วดาวน์โหลดเป็น CSV (หรือ .csv จากไฟล์ → ดาวน์โหลด) มานำเข้าที่นี่
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            <strong className="font-medium text-slate-800">ไฟล์ไปอยู่ที่ไหน:</strong> เวลากดส่งออก/ดาวน์โหลดเทมเพลต ระบบจะให้เบราว์เซอร์/แอปเก็บไฟล์ไปที่{' '}
            <strong className="font-medium">โฟลเดอร์ดาวน์โหลด (Downloads)</strong> ของ Windows โดยปกติ — ถ้ามีหน้าต่างให้เลือกที่เก็บ ให้เลือกตามที่ต้องการ
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            <strong className="font-medium text-slate-800">คอลัมน์ engineIds:</strong> ใส่รหัส variant จากเมนู{' '}
            <strong className="font-medium">จัดการรุ่นรถ</strong> คั่นด้วย <span className="font-mono">|</span> เช่น{' '}
            <span className="font-mono text-[11px]">e-h-civ-1|e-h-city-1</span> — ผ้าเบรกหน้า/หลังใส่ต่อท้าย{' '}
            <span className="font-mono text-[11px]">:front</span> / <span className="font-mono">:rear</span> ถ้าไม่ใช้ vehicleFitmentsJson
          </p>
          <p className="mt-2 text-xs text-slate-500">จำนวนรายการในเครื่องตอนนี้: {count.toLocaleString('th-TH')} รายการ</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4 shrink-0" aria-hidden />
          ส่งออก CSV
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-950 shadow-sm transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileStack className="size-4 shrink-0" aria-hidden />
          ดาวน์โหลดเทมเพลต
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handlePickImport}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-950 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="size-4 shrink-0" aria-hidden />
          นำเข้า CSV
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleResetSeed}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-sm font-medium text-red-900 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="size-4 shrink-0" aria-hidden />
          คืนชุดตัวอย่าง
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {lastMessage ? (
        <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
          {lastMessage}
        </p>
      ) : null}

      <p className="text-[11px] leading-relaxed text-slate-500">
        คอลัมน์ JSON (เช่น salesUnitsJson, vehicleFitmentsJson) ใช้เก็บข้อมูลซับซ้อน — ถ้าไม่ต้องการแก้ JSON ใน Sheets ให้ใช้คอลัมน์{' '}
        <span className="font-mono">engineIds</span> แทน (ระบบจะดึงยี่ห้อ/รุ่น/ปีจากแคตตาล็อกรถในเครื่องตอนนำเข้า)
        หรือส่งออกใหม่หลังแก้ในโปรแกรม
      </p>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/60 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-800 shadow-sm">
          <Car className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">แคตตาล็อกรุ่นรถ (JSON)</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            สำรองและย้ายเครื่อง — ส่งออกเป็นไฟล์ .json นำไปเก็บหรือให้ลูกน้องแก้แล้วนำเข้า (นำเข้า = แทนที่ข้อมูลรุ่นรถในเครื่องนี้ทั้งหมด)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleExportVehicleCatalog}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-950 shadow-sm transition hover:bg-amber-100/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-3.5 shrink-0" aria-hidden />
              ส่งออกแคตตาล็อกรถ
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handlePickVehicleImport}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-950 shadow-sm transition hover:bg-amber-200/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="size-3.5 shrink-0" aria-hidden />
              นำเข้าแคตตาล็อกรถ
            </button>
            <input
              ref={vehicleFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleVehicleFile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
