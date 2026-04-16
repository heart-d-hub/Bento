import {
  NUT_STOCK_OPEN_BOX_TITLE,
  nutStockOpenBoxMessage,
  SmallConfirmModal,
} from './components/SmallConfirmModal'
import { AddFullRollsModal } from './components/AddFullRollsModal'
import { UnpackFullRollModal } from './components/UnpackFullRollModal'
import { WarehouseStockAdjustModal } from './components/WarehouseStockAdjustModal'
import {
  addSplitSaleLocalFolder,
  loadSplitSaleFolderAssignments,
  loadSplitSaleLocalFolders,
  removeSplitSaleLocalFolder,
  renameSplitSaleLocalFolder,
  saveSplitSaleLocalFolders,
  setSplitSaleProductFolder,
  updateSplitSaleLocalFolderTagIds,
  type SplitSaleLocalFolder,
} from '@/features/inventory/data/splitSaleLocalFolders'
import {
  canAssignProductToSplitSaleFolder,
  getSplitSaleFolderMatchTagIdSet,
  HOSE_SOFT_TAG_ID,
  loadProductTagsRegistry,
  NUT_STOCK_TAG_ID,
  productHasSplitSaleRollColumnsTag,
  PRODUCT_TAGS_CHANGED_EVENT,
} from '@/features/inventory/data/productTagsRegistry'
import { PRODUCT_MASTER_LIST_CHANGED_EVENT } from '@/features/inventory/data/productMasterData'
import { type InventoryProduct } from '@/features/inventory/data/mockInventory'
import { getPosCatalogProducts } from '@/features/pos/data/posCatalogMerge'
import {
  countFullRollsOnShelf,
  formatBoxPieceHint,
  formatRollStockHint,
  getBoxPieceStateForProduct,
  getRollStateForProduct,
  isBoxPieceProduct,
  LIVE_STOCK_CHANGED_EVENT,
  loadBoxPieceStock,
  loadRollStock,
  mergeInventoryProductsWithLiveStock,
  openFullBoxToLoosePieces,
  posRollNominalForProduct,
  totalKgFromRoll,
  totalPiecesFromBoxPiece,
  usesPerRollWeightTracking,
  type BoxPieceStockState,
  type RollStockState,
} from '@/features/pos/data/posLiveStock'
import { POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import { GripVertical, LayoutGrid, LayoutList, PackageSearch, Plus, Scissors, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

type FolderSelection =
  | { kind: 'all' }
  | { kind: 'unassigned' }
  | { kind: 'folder'; id: string }

function productMatchesFolder(
  p: InventoryProduct,
  assignments: Record<string, string>,
  sel: FolderSelection,
): boolean {
  const fid = assignments[p.id]
  switch (sel.kind) {
    case 'all':
      return true
    case 'unassigned':
      return !fid
    case 'folder':
      return fid === sel.id
  }
}

function folderSelKey(sel: FolderSelection): string {
  switch (sel.kind) {
    case 'all':
      return 'all'
    case 'unassigned':
      return 'unassigned'
    case 'folder':
      return `f:${sel.id}`
  }
}

function folderHasHoseSoftTag(folder: SplitSaleLocalFolder | undefined): boolean {
  return Boolean(folder?.tagIds?.includes(HOSE_SOFT_TAG_ID))
}

function folderHasNutStockTag(folder: SplitSaleLocalFolder | undefined): boolean {
  return Boolean(folder?.tagIds?.includes(NUT_STOCK_TAG_ID))
}

function splitSaleAllowedFoldersForProduct(
  product: InventoryProduct,
  folders: SplitSaleLocalFolder[],
  folderMatchTagIds: Set<string>,
): SplitSaleLocalFolder[] {
  return folders.filter((f) => canAssignProductToSplitSaleFolder(product.productTagIds, f, folderMatchTagIds))
}

function assignedSplitSaleFolderLabel(
  productId: string,
  assignments: Record<string, string>,
  folders: SplitSaleLocalFolder[],
): string {
  const fid = assignments[productId]
  if (!fid) return 'ยังไม่จัดหมวด'
  return folders.find((f) => f.id === fid)?.name ?? fid
}

/** โหมดม้วน/กก. — ใช้คอลัมน์ม้วนเต็ม·เศษ·กก./ม้วน */
function isKgRollSplitProduct(
  p: InventoryProduct,
): p is InventoryProduct & { stockMode: 'kg_roll'; nominalKgPerRoll: number } {
  return p.stockMode === 'kg_roll' && p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0
}

/** โหมดม้วน/เมตร — สต็อกม้วนเก็บเป็นหน่วยเมตร */
function isMeterRollSplitProduct(
  p: InventoryProduct,
): p is InventoryProduct & { stockMode: 'meter_roll'; nominalMetersPerRoll: number } {
  return p.stockMode === 'meter_roll' && p.nominalMetersPerRoll != null && p.nominalMetersPerRoll > 0
}

/** แสดงในหน้านี้เฉพาะเมื่อติ๊ก «สินค้าแบ่งขาย» ในแฟ้มมาสเตอร์ */
function isSplitSaleProduct(p: InventoryProduct): boolean {
  return Boolean(p.splitSale)
}

function effectiveNominalKgForRollUi(p: InventoryProduct): number {
  const n = p.nominalKgPerRoll
  return n != null && n > 0 ? n : 0
}

function formatNominalKgCell(p: InventoryProduct, roll?: RollStockState): string {
  if (roll && usesPerRollWeightTracking(roll)) return '—'
  if (p.stockMode === 'kg_roll' && p.nominalKgPerRoll != null && p.nominalKgPerRoll > 0) {
    return p.nominalKgPerRoll.toLocaleString('th-TH', { maximumFractionDigits: 2 })
  }
  if (p.stockMode === 'meter_roll' && p.nominalMetersPerRoll != null && p.nominalMetersPerRoll > 0) {
    return p.nominalMetersPerRoll.toLocaleString('th-TH', { maximumFractionDigits: 2 })
  }
  return '—'
}

function splitSaleStockTypeLabel(p: InventoryProduct): string {
  if (isKgRollSplitProduct(p)) return 'ม้วน/กก.'
  if (isMeterRollSplitProduct(p)) return 'เมตร/ม้วน'
  if (productHasSplitSaleRollColumnsTag(p) && !isBoxPieceProduct(p)) return 'ม้วน/กก.'
  if (isBoxPieceProduct(p)) return 'กล่อง+เศษ'
  return 'นับชิ้น'
}

function splitSaleMetricSummary(row: SplitSaleTableRow): string {
  if (isMeterRollSplitProduct(row.p)) {
    return `~${row.totalKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ม.`
  }
  if (
    isKgRollSplitProduct(row.p) ||
    (productHasSplitSaleRollColumnsTag(row.p) && !isBoxPieceProduct(row.p))
  ) {
    return `~${row.totalKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })} กก.`
  }
  if (isBoxPieceProduct(row.p)) {
    return `${row.totalPieces.toLocaleString('th-TH')} ตัว`
  }
  const pieceStock = Math.floor(Number.isFinite(row.p.stock) ? row.p.stock : 0)
  return `${pieceStock.toLocaleString('th-TH')} ชิ้น`
}

/** แท็ก splitSaleRollColumns (เช่น สายยางอ่อน) → คอลัมน์ม้วนในตารางแบ่งขาย แม้ยังไม่ตั้ง kg_roll ในมาสเตอร์ */
function productUsesSplitSaleRollColumns(
  p: InventoryProduct,
  rollColumnTagIds: Set<string>,
): boolean {
  if (isBoxPieceProduct(p)) return false
  if (isKgRollSplitProduct(p) || isMeterRollSplitProduct(p)) return true
  return (p.productTagIds ?? []).some((id) => rollColumnTagIds.has(id))
}

function productUsesSplitSaleBoxColumns(p: InventoryProduct, boxColumnTagIds: Set<string>): boolean {
  if (!isBoxPieceProduct(p)) return false
  /** โหมดสต็อกละเอียดในมาสเตอร์ = กล่อง+เศษ → แสดงคอลัมน์กล่องโดยไม่บังคับแท็กนอตสต็อก */
  if (p.stockMode === 'box_piece') return true
  return (p.productTagIds ?? []).some((id) => boxColumnTagIds.has(id))
}

/** แสดงข้อความ "เมตร: รออัตราแปลง" เฉพาะสายยางที่ยังไม่ตั้ง kg_roll / meter_roll ในมาสเตอร์ */
function splitSaleShowHoseMeterPlaceholder(p: InventoryProduct): boolean {
  if (!productHasSplitSaleRollColumnsTag(p) || isBoxPieceProduct(p)) return false
  return !isKgRollSplitProduct(p) && !isMeterRollSplitProduct(p)
}

type RollListHeadings = {
  scrapLabel: string
  scrapTitle: string
  totalLabel: string
  totalTitle: string
}

function computeRollListHeadings(
  rows: SplitSaleTableRow[],
  rollColumnTagIds: Set<string>,
): RollListHeadings | null {
  const prods = rows.map((r) => r.p).filter((p) => productUsesSplitSaleRollColumns(p, rollColumnTagIds))
  if (prods.length === 0) return null
  const allMeter = prods.every((p) => isMeterRollSplitProduct(p))
  const allKgScrap = prods.every((p) => !isMeterRollSplitProduct(p))
  if (allMeter) {
    return {
      scrapLabel: 'เศษ (ม.)',
      scrapTitle: 'เมตร เหลือบนม้วนเปิด',
      totalLabel: 'รวม (ม.)',
      totalTitle: 'ยอดรวมเมตรโดยประมาณ (มาสเตอร์ ม้วน/เมตร)',
    }
  }
  if (allKgScrap) {
    return {
      scrapLabel: 'เศษ (กก.)',
      scrapTitle: 'กก. เหลือบนม้วนที่เปิดแล้ว',
      totalLabel: 'รวม (กก.)',
      totalTitle: 'ยอดรวมกิโลกรัมโดยประมาณ',
    }
  }
  return {
    scrapLabel: 'เศษ',
    scrapTitle: 'หน่วยตามโหมดสต็อกในมาสเตอร์ (กก. หรือ ม.)',
    totalLabel: 'รวม',
    totalTitle: 'ยอดรวมตามโหมดสต็อกในมาสเตอร์ (กก. หรือ ม.)',
  }
}

function productHasNutStockTag(p: InventoryProduct): boolean {
  return (p.productTagIds ?? []).includes(NUT_STOCK_TAG_ID)
}

export type SplitSaleTableRow = {
  p: InventoryProduct
  r: RollStockState
  totalKg: number
  openKg: number
  b: BoxPieceStockState
  totalPieces: number
  piecesPerBox: number
}

function formatSplitSaleStockSummary(row: SplitSaleTableRow): string {
  const p = row.p
  const { r, b, piecesPerBox } = row
  if (isKgRollSplitProduct(p)) {
    return formatRollStockHint(r, effectiveNominalKgForRollUi(p))
  }
  if (isMeterRollSplitProduct(p)) {
    return formatRollStockHint(r, p.nominalMetersPerRoll, 'm')
  }
  if (productHasSplitSaleRollColumnsTag(p) && !isBoxPieceProduct(p)) {
    return formatRollStockHint(r, 0)
  }
  if (isBoxPieceProduct(p) && piecesPerBox > 0) {
    return formatBoxPieceHint(b, piecesPerBox)
  }
  const pieceStock = Math.floor(Number.isFinite(p.stock) ? p.stock : 0)
  return `สต็อก ${pieceStock.toLocaleString('th-TH')} ชิ้น`
}

export function SplitSaleStockView() {
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(0)
  const [folders, setFolders] = useState<SplitSaleLocalFolder[]>(() => loadSplitSaleLocalFolders())
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    loadSplitSaleFolderAssignments(),
  )
  const [folderSel, setFolderSel] = useState<FolderSelection>({ kind: 'all' })
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [stockModalProduct, setStockModalProduct] = useState<InventoryProduct | null>(null)
  const [addFullRollsProduct, setAddFullRollsProduct] = useState<InventoryProduct | null>(null)
  const [unpackRollProduct, setUnpackRollProduct] = useState<InventoryProduct | null>(null)
  const [nutOpenBoxConfirm, setNutOpenBoxConfirm] = useState<null | {
    product: InventoryProduct
    piecesPerBox: number
  }>(null)
  const [ctxMenu, setCtxMenu] = useState<{
    row: SplitSaleTableRow
    x: number
    y: number
  } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)

  const [folderTagModal, setFolderTagModal] = useState<SplitSaleLocalFolder | null>(null)
  const [folderTagDraft, setFolderTagDraft] = useState<Set<string>>(() => new Set())

  const [assignFolderModalRow, setAssignFolderModalRow] = useState<SplitSaleTableRow | null>(null)
  const [assignFolderDraft, setAssignFolderDraft] = useState<string>('')

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const requestOpenFullBox = useCallback(
    (product: InventoryProduct, piecesPerBox: number) => {
      if (productHasNutStockTag(product)) {
        setNutOpenBoxConfirm({ product, piecesPerBox })
        return
      }
      try {
        openFullBoxToLoosePieces(product.id, piecesPerBox)
        refresh()
      } catch {
        window.alert('ไม่มีกล่องเต็มให้เปิด')
      }
    },
    [refresh],
  )

  const handleNutOpenBoxConfirm = useCallback(() => {
    setNutOpenBoxConfirm((cur) => {
      if (!cur) return null
      try {
        openFullBoxToLoosePieces(cur.product.id, cur.piecesPerBox)
        refresh()
      } catch {
        window.alert('ไม่มีกล่องเต็มให้เปิด')
      }
      return null
    })
  }, [refresh])

  const syncFoldersFromStorage = useCallback(() => {
    setFolders(loadSplitSaleLocalFolders())
    setAssignments(loadSplitSaleFolderAssignments())
  }, [])

  const assignProductToFolder = useCallback((productId: string, folderId: string | null) => {
    const ok = setSplitSaleProductFolder(productId, folderId)
    if (!ok) {
      window.alert(
        'จัดเข้าหมวดนี้ไม่ได้ — แท็กจับคู่บนหมวดกับแท็กบนสินค้า (แฟ้มมาสเตอร์) ต้องตรงกันพอดี\nแก้แท็กที่หมวด (คลิกขวา → TAG) หรือแก้แท็กสินค้า หรือเลือกหมวดอื่น',
      )
      return
    }
    setAssignments(loadSplitSaleFolderAssignments())
  }, [])

  useEffect(() => {
    const bump = () => refresh()
    window.addEventListener(LIVE_STOCK_CHANGED_EVENT, bump)
    window.addEventListener(POS_SALE_RECORDED_EVENT, bump)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, bump)
    return () => {
      window.removeEventListener(LIVE_STOCK_CHANGED_EVENT, bump)
      window.removeEventListener(POS_SALE_RECORDED_EVENT, bump)
      window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, bump)
    }
  }, [refresh])

  const resolvedFolderSel = useMemo((): FolderSelection => {
    if (folderSel.kind !== 'folder') return folderSel
    return folders.some((f) => f.id === folderSel.id) ? folderSel : { kind: 'all' }
  }, [folderSel, folders])

  const { rows, emptyMessage, splitCount, navCounts, openStockHintCount } = useMemo(() => {
    void tick
    const catalog = getPosCatalogProducts()
    const merged = mergeInventoryProductsWithLiveStock(catalog)
    const roll = loadRollStock()
    const boxMap = loadBoxPieceStock()
    const split = merged.filter(isSplitSaleProduct)

    const unassignedCount = split.filter((p) => !assignments[p.id]).length
    const byFolder: Record<string, number> = {}
    for (const f of folders) {
      byFolder[f.id] = split.filter((p) => assignments[p.id] === f.id).length
    }
    const navCounts = { all: split.length, unassigned: unassignedCount, byFolder }

    let openStockHintCount = 0
    for (const p of split) {
      if (
        isKgRollSplitProduct(p) ||
        isMeterRollSplitProduct(p) ||
        (productHasSplitSaleRollColumnsTag(p) && !isBoxPieceProduct(p))
      ) {
        const rp = getRollStateForProduct(p, roll)
        if (rp.openRolls.length > 0) openStockHintCount++
      } else if (isBoxPieceProduct(p)) {
        const bp = getBoxPieceStateForProduct(p, boxMap)
        if (bp.loosePieces > 0) openStockHintCount++
      }
    }

    const scoped = split.filter((p) => productMatchesFolder(p, assignments, resolvedFolderSel))

    const q = query.trim().toLowerCase()
    const filtered = !q
      ? scoped
      : scoped.filter((p) => {
          const hay = [p.sku, p.name, p.brand ?? '', p.factoryOem ?? '']
            .join(' ')
            .toLowerCase()
          return hay.includes(q)
        })

    const rowData = filtered.map((p) => {
      const r = getRollStateForProduct(p, roll)
      const nominalEff = isMeterRollSplitProduct(p)
        ? p.nominalMetersPerRoll
        : effectiveNominalKgForRollUi(p)
      const totalKg = isKgRollSplitProduct(p)
        ? totalKgFromRoll(r, nominalEff)
        : isMeterRollSplitProduct(p)
          ? totalKgFromRoll(r, nominalEff)
          : productHasSplitSaleRollColumnsTag(p) && !isBoxPieceProduct(p)
            ? totalKgFromRoll(r, 0)
            : 0
      const openKg = r.openRolls.reduce((s, x) => s + x.remainingKg, 0)
      const b = getBoxPieceStateForProduct(p, boxMap)
      const perBox =
        p.stockMode === 'box_piece' && p.piecesPerBox != null && p.piecesPerBox > 0
          ? Math.floor(p.piecesPerBox)
          : 0
      const totalPieces = isBoxPieceProduct(p) && perBox > 0 ? totalPiecesFromBoxPiece(b, perBox) : 0
      return { p, r, totalKg, openKg, b, totalPieces, piecesPerBox: perBox }
    })

    let emptyMessage = ''
    if (split.length === 0) {
      emptyMessage = 'ยังไม่มีรายการ — ติ๊ก «สินค้าแบ่งขาย» ในแฟ้มมาสเตอร์เมื่อเพิ่ม/แก้สินค้า'
    } else if (scoped.length === 0) {
      if (resolvedFolderSel.kind === 'unassigned') {
        emptyMessage = 'ไม่มีสินค้าที่ยังไม่จัดหมวด'
      } else if (resolvedFolderSel.kind === 'folder') {
        emptyMessage = 'ไม่มีสินค้าในหมวดนี้ — คลิกขวาที่แถวสินค้าแล้วเลือก «จัดหมวด»'
      } else {
        emptyMessage = 'ไม่มีสินค้าในหมวดที่เลือก'
      }
    } else if (filtered.length === 0 && q) {
      emptyMessage = 'ไม่พบสินค้าที่ตรงกับคำค้น'
    }

    return {
      rows: rowData,
      emptyMessage,
      splitCount: split.length,
      navCounts,
      openStockHintCount,
    }
  }, [query, tick, assignments, resolvedFolderSel, folders])

  const [tagEpoch, setTagEpoch] = useState(0)
  useEffect(() => {
    const on = () => setTagEpoch((n) => n + 1)
    window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
  }, [])

  const tagLabelById = useMemo(() => {
    void tagEpoch
    const m: Record<string, string> = {}
    for (const t of loadProductTagsRegistry()) m[t.id] = t.label
    return m
  }, [tagEpoch])

  const folderMatchTagIdSet = useMemo(() => {
    void tagEpoch
    return getSplitSaleFolderMatchTagIdSet()
  }, [tagEpoch])

  const folderMatchTagList = useMemo(() => {
    void tagEpoch
    return loadProductTagsRegistry().filter((t) => t.splitSaleFolderMatch === true)
  }, [tagEpoch])

  const rollColumnTagIds = useMemo(() => {
    void tagEpoch
    const s = new Set<string>()
    for (const t of loadProductTagsRegistry()) {
      if (t.splitSaleRollColumns) s.add(t.id)
    }
    return s
  }, [tagEpoch])

  const boxColumnTagIds = useMemo(() => {
    void tagEpoch
    const s = new Set<string>()
    for (const t of loadProductTagsRegistry()) {
      if (t.splitSaleBoxColumns) s.add(t.id)
    }
    return s
  }, [tagEpoch])

  const listShowsRollColumnGroup = useMemo(
    () => rows.some((row) => productUsesSplitSaleRollColumns(row.p, rollColumnTagIds)),
    [rows, rollColumnTagIds],
  )

  const rollListHeadings = useMemo(
    () => computeRollListHeadings(rows, rollColumnTagIds),
    [rows, rollColumnTagIds],
  )

  const activeFolderForTableLayout = useMemo(() => {
    if (resolvedFolderSel.kind !== 'folder') return undefined
    return folders.find((f) => f.id === resolvedFolderSel.id)
  }, [resolvedFolderSel, folders])

  /** หมวดที่ติดแท็กสายยางอ่อน — โครงตารางรายการแยกจากมุมมองอื่น */
  const hoseSoftFolderTableLayout = folderHasHoseSoftTag(activeFolderForTableLayout)
  /** หมวดที่ติดแท็กนอตสต็อก — คอลัมน์กล่อง/เศษ (ไม่ใช้คู่กับโหมดสายยาง) */
  const nutStockFolderTableLayout =
    !hoseSoftFolderTableLayout && folderHasNutStockTag(activeFolderForTableLayout)

  const splitSaleListLayout = hoseSoftFolderTableLayout
    ? 'hoseSoft'
    : nutStockFolderTableLayout
      ? 'nutStock'
      : 'default'

  const activeFolderKey = folderSelKey(resolvedFolderSel)

  const openContextMenu = useCallback((e: ReactMouseEvent, row: SplitSaleTableRow) => {
    e.preventDefault()
    setCtxMenu({ row, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setCtxMenu(null), [])

  const handleCtxOpenBox = useCallback(() => {
    if (!ctxMenu) return
    const p = ctxMenu.row.p
    if (!isBoxPieceProduct(p) || !p.piecesPerBox) return
    requestOpenFullBox(p, p.piecesPerBox)
    closeContextMenu()
  }, [ctxMenu, requestOpenFullBox, closeContextMenu])

  const handleCtxAdjust = useCallback(() => {
    if (!ctxMenu) return
    setStockModalProduct(ctxMenu.row.p)
    closeContextMenu()
  }, [ctxMenu, closeContextMenu])

  const closeAssignFolderModal = useCallback(() => setAssignFolderModalRow(null), [])

  const handleCtxOpenAssignFolder = useCallback(() => {
    if (!ctxMenu) return
    const row = ctxMenu.row
    const fid = assignments[row.p.id] ?? ''
    const allowed = splitSaleAllowedFoldersForProduct(row.p, folders, folderMatchTagIdSet)
    const allowedIds = new Set(allowed.map((f) => f.id))
    setAssignFolderDraft(fid && allowedIds.has(fid) ? fid : '')
    setAssignFolderModalRow(row)
    closeContextMenu()
  }, [ctxMenu, assignments, folders, folderMatchTagIdSet, closeContextMenu])

  const saveAssignFolderModal = useCallback(() => {
    if (!assignFolderModalRow) return
    assignProductToFolder(
      assignFolderModalRow.p.id,
      assignFolderDraft === '' ? null : assignFolderDraft,
    )
    setAssignFolderModalRow(null)
  }, [assignFolderModalRow, assignFolderDraft, assignProductToFolder])

  const openFolderTagModal = useCallback((f: SplitSaleLocalFolder) => {
    setFolderTagDraft(new Set(f.tagIds ?? []))
    setFolderTagModal(f)
  }, [])

  const closeFolderTagModal = useCallback(() => setFolderTagModal(null), [])

  const saveFolderTagModal = useCallback(() => {
    if (!folderTagModal) return
    updateSplitSaleLocalFolderTagIds(folderTagModal.id, [...folderTagDraft])
    syncFoldersFromStorage()
    setFolderTagModal(null)
  }, [folderTagModal, folderTagDraft, syncFoldersFromStorage])

  const requestRenameFolder = useCallback(
    (f: SplitSaleLocalFolder) => {
      const raw = window.prompt('ชื่อหมวด (แก้ได้แค่ชื่อ)', f.name)
      if (raw == null) return
      const name = raw.trim()
      if (!name) {
        window.alert('ชื่อหมวดต้องไม่ว่าง')
        return
      }
      if (!renameSplitSaleLocalFolder(f.id, name)) return
      syncFoldersFromStorage()
    },
    [syncFoldersFromStorage],
  )

  useEffect(() => {
    if (!ctxMenu) return
    const onDown = (e: MouseEvent) => {
      if (ctxMenuRef.current?.contains(e.target as Node)) return
      closeContextMenu()
    }
    const id = window.requestAnimationFrame(() => {
      document.addEventListener('mousedown', onDown, true)
    })
    return () => {
      window.cancelAnimationFrame(id)
      document.removeEventListener('mousedown', onDown, true)
    }
  }, [ctxMenu, closeContextMenu])

  const handleAddFolder = () => {
    const raw = window.prompt('ชื่อหมวด (ใช้จัดกลุ่มดูสต็อกในหน้านี้เท่านั้น — ไม่เชื่อมกับจัดการหมวดหมู่หลัก)')
    const name = (raw ?? '').trim()
    if (!name) return
    const created = addSplitSaleLocalFolder(name)
    if (created) syncFoldersFromStorage()
  }

  const handleRemoveFolder = (id: string, name: string) => {
    if (!window.confirm(`ลบหมวด «${name}»? สินค้าในหมวดจะกลับไป «ยังไม่จัดหมวด»`)) return
    removeSplitSaleLocalFolder(id)
    syncFoldersFromStorage()
    setFolderSel((s) => (s.kind === 'folder' && s.id === id ? { kind: 'all' } : s))
  }

  const reorderFolders = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= folders.length ||
        toIndex >= folders.length
      ) {
        return
      }
      const next = [...folders]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      saveSplitSaleLocalFolders(next)
      syncFoldersFromStorage()
    },
    [folders, syncFoldersFromStorage],
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 pos-compact:gap-2">
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/90 via-white to-slate-50/80 px-4 py-3 shadow-sm pos-compact:rounded-xl pos-compact:px-3 pos-compact:py-2">
        <div className="flex flex-wrap items-start gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-700 shadow-sm pos-compact:size-9">
            <Scissors className="size-5 pos-compact:size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 pos-compact:text-sm">สินค้าแบ่งขาย</h2>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-600 pos-compact:text-[11px]">
              เฉพาะสินค้าที่ติ๊ก «แบ่งขาย» ในแฟ้มมาสเตอร์ · หมวดซ้ายจัดกลุ่มเฉพาะหน้านี้ — คลิกขวาที่หมวด: แก้ไขชื่อ / ตั้งแท็ก (TAG) / ลบ · แท็กหมวดต้องตรงกับแท็กบนสินค้าในแฟ้มมาสเตอร์จึงจะจัดเข้าหมวดได้ ·
              หมวดที่ติดแท็ก «สายยางอ่อน» แสดงคอลัมน์ม้วน — หน่วยเศษ/รวมตามโหมดสต็อกละเอียดในมาสเตอร์ (ม้วน/กก. หรือ ม้วน/เมตร) · หมวดที่ติด «นอตสต็อก» แสดงคอลัมน์กล่องเต็ม / เศษตัว / รวม เมื่อสินค้าเป็นโหมดกล่อง+เศษในมาสเตอร์ (หรือติดแท็กนอตสต็อก) · คลิกขวาที่แถว: จัดหมวด / เปิดกล่อง / ปรับสต็อก
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 gap-3 pos-compact:gap-2">
        <SplitSaleFolderSidebar
          folders={folders}
          activeKey={activeFolderKey}
          onSelect={setFolderSel}
          onAddFolder={handleAddFolder}
          onRemoveFolder={handleRemoveFolder}
          onReorderFolders={reorderFolders}
          navCounts={navCounts}
          onRenameFolder={requestRenameFolder}
          onOpenFolderTags={openFolderTagModal}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 pos-compact:gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative min-w-0 flex-1">
              <PackageSearch
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา SKU · ชื่อ · แบรนด์ · OEM…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 pos-compact:py-1.5 pos-compact:text-[13px]"
              />
            </div>
            <div
              className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm"
              role="group"
              aria-label="มุมมอง"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium pos-compact:px-2 pos-compact:py-1 pos-compact:text-[11px]',
                  viewMode === 'list'
                    ? 'bg-white text-teal-900 shadow-sm ring-1 ring-teal-200/80'
                    : 'text-slate-600 hover:bg-white/80',
                )}
              >
                <LayoutList className="size-3.5 pos-compact:size-3" strokeWidth={1.75} aria-hidden />
                รายการ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium pos-compact:px-2 pos-compact:py-1 pos-compact:text-[11px]',
                  viewMode === 'card'
                    ? 'bg-white text-teal-900 shadow-sm ring-1 ring-teal-200/80'
                    : 'text-slate-600 hover:bg-white/80',
                )}
              >
                <LayoutGrid className="size-3.5 pos-compact:size-3" strokeWidth={1.75} aria-hidden />
                การ์ด
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div
              className={clsx(
                'min-h-0 flex-1 overflow-auto rounded-2xl border bg-white shadow-sm pos-compact:rounded-xl',
                splitSaleListLayout === 'hoseSoft'
                  ? 'border-teal-200/90 ring-1 ring-teal-100/80'
                  : splitSaleListLayout === 'nutStock'
                    ? 'border-amber-200/90 ring-1 ring-amber-100/80'
                    : 'border-slate-200',
              )}
            >
              <table
                className={clsx(
                  'w-full border-collapse text-left text-sm pos-compact:text-xs',
                  splitSaleListLayout === 'hoseSoft' || splitSaleListLayout === 'nutStock'
                    ? 'min-w-[46rem]'
                    : listShowsRollColumnGroup
                      ? 'min-w-[60rem]'
                      : 'min-w-[38rem]',
                )}
              >
                <thead
                  className={clsx(
                    'sticky top-0 z-10 border-b backdrop-blur-sm',
                    splitSaleListLayout === 'hoseSoft'
                      ? 'border-teal-200/80 bg-gradient-to-b from-teal-50/95 to-teal-50/70 text-teal-950'
                      : splitSaleListLayout === 'nutStock'
                        ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/95 to-amber-50/70 text-amber-950'
                        : 'border-slate-200 bg-slate-50/95 text-slate-600',
                  )}
                >
                  <tr>
                    <th className="px-3 py-2.5 font-semibold pos-compact:px-2 pos-compact:py-2">SKU</th>
                    <th className="px-3 py-2.5 font-semibold pos-compact:px-2">ชื่อสินค้า</th>
                    {splitSaleListLayout === 'hoseSoft' ? (
                      <>
                        <th
                          className="w-[6.5rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:w-[6rem] pos-compact:px-1.5 pos-compact:py-2"
                          title={rollListHeadings?.scrapTitle ?? 'กก. เหลือบนม้วนที่เปิดแล้ว'}
                        >
                          {rollListHeadings?.scrapLabel ?? 'เศษ (กก.)'}
                        </th>
                        <th
                          className="w-[5.5rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:w-[5rem] pos-compact:px-1.5 pos-compact:py-2"
                          title="จำนวนม้วนที่เปิดแล้ว"
                        >
                          ม้วนเปิด
                        </th>
                        <th
                          className="w-[5.5rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:w-[5rem] pos-compact:px-1.5 pos-compact:py-2"
                          title="ม้วนที่ยังไม่แกะ"
                        >
                          ม้วนเต็ม
                        </th>
                        <th
                          className="min-w-[7.5rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:min-w-[7rem] pos-compact:px-1.5 pos-compact:py-2"
                          title={rollListHeadings?.totalTitle ?? 'รวมกิโลกรัม (เมตรต้องใช้อัตราแปลงต่อรุ่น)'}
                        >
                          {rollListHeadings?.totalLabel ?? 'รวม กก.'}
                        </th>
                        <th className="w-[6.5rem] px-2 py-2.5 text-center text-xs font-semibold pos-compact:w-[6rem] pos-compact:px-1.5 pos-compact:py-2">
                          จัดการ
                        </th>
                      </>
                    ) : splitSaleListLayout === 'nutStock' ? (
                      <>
                        <th
                          className="w-[6rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:px-1.5 pos-compact:py-2"
                          title="เศษที่แกะจากกล่องแล้ว"
                        >
                          เศษ (ตัว)
                        </th>
                        <th
                          className="w-[6rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:px-1.5 pos-compact:py-2"
                          title="กล่องปิดที่ยังไม่แกะ"
                        >
                          กล่องเต็ม
                        </th>
                        <th
                          className="w-[6.5rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:px-1.5 pos-compact:py-2"
                          title="จากแฟ้มมาสเตอร์"
                        >
                          ตัว/กล่อง
                        </th>
                        <th
                          className="min-w-[7rem] px-2 py-2.5 text-right text-xs font-semibold tabular-nums pos-compact:px-1.5 pos-compact:py-2"
                          title="รวมเป็นตัวทั้งหมด"
                        >
                          รวม (ตัว)
                        </th>
                        <th className="w-[6.5rem] px-2 py-2.5 text-center text-xs font-semibold pos-compact:w-[6rem] pos-compact:px-1.5 pos-compact:py-2">
                          จัดการ
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="min-w-[5.5rem] px-3 py-2.5 font-semibold pos-compact:px-2">สต็อก</th>
                        {listShowsRollColumnGroup ? (
                          <>
                            <th
                              className="px-3 py-2.5 text-right font-semibold tabular-nums pos-compact:px-2"
                              title={rollListHeadings?.scrapTitle ?? 'กก. เหลือบนม้วนที่เปิดแล้ว'}
                            >
                              {rollListHeadings?.scrapLabel ?? 'เศษ (กก.)'}
                            </th>
                            <th
                              className="px-3 py-2.5 text-right font-semibold tabular-nums pos-compact:px-2"
                              title="จำนวนม้วนที่เปิดแล้ว (อาจมีหลายม้วน)"
                            >
                              ม้วนเปิด
                            </th>
                            <th
                              className="px-3 py-2.5 text-right font-semibold tabular-nums pos-compact:px-2"
                              title="ม้วนที่ยังไม่แกะ"
                            >
                              ม้วนเต็ม
                            </th>
                          </>
                        ) : null}
                        <th className="min-w-[6.5rem] px-3 py-2.5 font-semibold pos-compact:min-w-[5.5rem] pos-compact:px-2">
                          แท็ก
                        </th>
                        <th
                          className="min-w-[10rem] px-3 py-2.5 font-semibold pos-compact:min-w-[9rem] pos-compact:px-2"
                          title={
                            rollListHeadings?.totalTitle ??
                            'ยอดรวมสต็อก (เมตรต้องใช้อัตราแปลงเมื่อยังไม่ตั้งโหมดม้วนในมาสเตอร์)'
                          }
                        >
                          {rollListHeadings?.totalLabel ?? 'รวม'}
                        </th>
                        <th className="w-[7rem] px-3 py-2.5 font-semibold pos-compact:px-2"> </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          splitSaleListLayout === 'hoseSoft' || splitSaleListLayout === 'nutStock'
                            ? 7
                            : listShowsRollColumnGroup
                              ? 9
                              : 6
                        }
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {emptyMessage || '—'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <SplitSaleRow
                        key={row.p.id}
                        row={row}
                        tagLabelById={tagLabelById}
                        listLayout={splitSaleListLayout}
                        expandedRollColumns={listShowsRollColumnGroup}
                        rollColumnTagIds={rollColumnTagIds}
                        boxColumnTagIds={boxColumnTagIds}
                        assignedFolderLabel={assignedSplitSaleFolderLabel(row.p.id, assignments, folders)}
                        onAdjust={() => setStockModalProduct(row.p)}
                        onAddFullRolls={
                          productUsesSplitSaleRollColumns(row.p, rollColumnTagIds)
                            ? () => setAddFullRollsProduct(row.p)
                            : undefined
                        }
                        onUnpackRoll={
                          productUsesSplitSaleRollColumns(row.p, rollColumnTagIds)
                            ? () => setUnpackRollProduct(row.p)
                            : undefined
                        }
                        onUnpackFullBox={
                          productUsesSplitSaleBoxColumns(row.p, boxColumnTagIds) &&
                          isBoxPieceProduct(row.p) &&
                          row.p.piecesPerBox
                            ? () => requestOpenFullBox(row.p, row.p.piecesPerBox!)
                            : undefined
                        }
                        onContextMenuRow={(e) => openContextMenu(e, row)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-slate-50/40 p-3 shadow-inner pos-compact:rounded-xl pos-compact:p-2">
              {rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">{emptyMessage || '—'}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {rows.map((row) => (
                    <SplitSaleCard
                      key={row.p.id}
                      row={row}
                      tagLabelById={tagLabelById}
                      listLayout={splitSaleListLayout}
                      rollColumnTagIds={rollColumnTagIds}
                      boxColumnTagIds={boxColumnTagIds}
                      assignedFolderLabel={assignedSplitSaleFolderLabel(row.p.id, assignments, folders)}
                      onAdjust={() => setStockModalProduct(row.p)}
                      onAddFullRolls={
                        productUsesSplitSaleRollColumns(row.p, rollColumnTagIds)
                          ? () => setAddFullRollsProduct(row.p)
                          : undefined
                      }
                      onUnpackRoll={
                        productUsesSplitSaleRollColumns(row.p, rollColumnTagIds)
                          ? () => setUnpackRollProduct(row.p)
                          : undefined
                      }
                      onUnpackFullBox={
                        productUsesSplitSaleBoxColumns(row.p, boxColumnTagIds) &&
                        isBoxPieceProduct(row.p) &&
                        row.p.piecesPerBox
                          ? () => requestOpenFullBox(row.p, row.p.piecesPerBox!)
                          : undefined
                      }
                      onContextMenuRow={(e) => openContextMenu(e, row)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 pos-compact:text-[10px]">
        คลิกขวาที่หมวดซ้าย — แก้ไข / TAG / ลบ · คลิกขวาที่แถวสินค้า — จัดหมวด / เปิดกล่อง / ปรับสต็อก
        {splitCount > 0 ? (
          <span className="text-slate-600"> · สินค้าแบ่งขาย {splitCount} รายการ</span>
        ) : null}
        {openStockHintCount > 0 ? (
          <span className="text-teal-800"> · มีเศษ/ม้วนเปิด (สรุป) {openStockHintCount} รายการ</span>
        ) : null}
      </p>

      <SmallConfirmModal
        open={Boolean(nutOpenBoxConfirm)}
        title={NUT_STOCK_OPEN_BOX_TITLE}
        message={
          nutOpenBoxConfirm
            ? nutStockOpenBoxMessage(nutOpenBoxConfirm.product.name, nutOpenBoxConfirm.piecesPerBox)
            : ''
        }
        confirmLabel="แกะกล่อง"
        onClose={() => setNutOpenBoxConfirm(null)}
        onConfirm={handleNutOpenBoxConfirm}
        confirmVariant="amber"
      />

      <WarehouseStockAdjustModal
        open={Boolean(stockModalProduct)}
        product={stockModalProduct}
        hideWarehouseThresholds
        compactUi
        onClose={() => setStockModalProduct(null)}
      />

      <AddFullRollsModal
        open={Boolean(addFullRollsProduct)}
        product={addFullRollsProduct}
        defaultNominalPerRoll={
          addFullRollsProduct ? posRollNominalForProduct(addFullRollsProduct) : undefined
        }
        onClose={() => setAddFullRollsProduct(null)}
      />

      <UnpackFullRollModal
        open={Boolean(unpackRollProduct)}
        product={unpackRollProduct}
        nominalPerRoll={
          unpackRollProduct ? posRollNominalForProduct(unpackRollProduct) : 0
        }
        onClose={() => setUnpackRollProduct(null)}
      />

      {ctxMenu ? (
        <div
          ref={ctxMenuRef}
          role="menu"
          className="fixed z-[70] min-w-[8.75rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 text-xs shadow-md"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="mx-1 mb-0.5 flex w-[calc(100%-0.5rem)] items-center justify-center rounded-md border border-amber-700/35 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-amber-950 shadow-[0_1px_2px_rgba(120,83,0,0.18)] outline-none ring-amber-600/25 hover:from-amber-50 hover:via-amber-200 hover:to-amber-400 focus-visible:ring-2"
            onClick={handleCtxAdjust}
          >
            ปรับสต็อก
          </button>
          <div className="mx-1 mb-0.5 border-t border-slate-100" role="presentation" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-2.5 py-1.5 text-left text-slate-800 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            onClick={handleCtxOpenAssignFolder}
          >
            จัดหมวด
          </button>
          {isBoxPieceProduct(ctxMenu.row.p) && ctxMenu.row.b.fullBoxes >= 1 ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-2.5 py-1.5 text-left text-slate-800 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
              onClick={handleCtxOpenBox}
            >
              เปิดกล่อง
            </button>
          ) : null}
        </div>
      ) : null}

      {assignFolderModalRow ? (
        <div
          className="fixed inset-0 z-[76] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="split-assign-folder-title"
          onClick={closeAssignFolderModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id="split-assign-folder-title" className="text-sm font-semibold text-slate-900">
                จัดหมวด
              </h4>
              <button
                type="button"
                onClick={closeAssignFolderModal}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-1 font-mono text-[10px] text-slate-500">{assignFolderModalRow.p.sku}</p>
            <p className="mb-3 text-xs font-medium leading-snug text-slate-900">{assignFolderModalRow.p.name}</p>
            {(() => {
              const allowed = splitSaleAllowedFoldersForProduct(
                assignFolderModalRow.p,
                folders,
                folderMatchTagIdSet,
              )
              return (
                <>
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-0.5">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-xs hover:bg-slate-50">
                      <input
                        type="radio"
                        name="split-assign-folder"
                        className="border-slate-300 text-teal-600"
                        checked={assignFolderDraft === ''}
                        onChange={() => setAssignFolderDraft('')}
                      />
                      <span className="text-slate-800">ยังไม่จัดหมวด</span>
                    </label>
                    {allowed.map((f) => (
                      <label
                        key={f.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-xs hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="split-assign-folder"
                          className="border-slate-300 text-teal-600"
                          checked={assignFolderDraft === f.id}
                          onChange={() => setAssignFolderDraft(f.id)}
                        />
                        <span className="text-slate-800">{f.name}</span>
                      </label>
                    ))}
                  </div>
                  {allowed.length === 0 ? (
                    <p className="mt-2 text-[11px] leading-snug text-amber-800">
                      ยังไม่มีหมวดที่แท็กตรงกับสินค้านี้ — สร้างหมวดในแถบซ้ายแล้วคลิกขวาที่หมวด → TAG
                    </p>
                  ) : null}
                </>
              )
            })()}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAssignFolderModal}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveAssignFolderModal}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {folderTagModal ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="split-folder-tag-title"
          onClick={closeFolderTagModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id="split-folder-tag-title" className="text-sm font-semibold text-slate-900">
                TAG — หมวด «{folderTagModal.name}»
              </h4>
              <button
                type="button"
                onClick={closeFolderTagModal}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-3 text-[11px] leading-snug text-slate-600">
              แท็กที่ติ๊กที่หมวดต้องตรงกับแท็กบนสินค้าในแฟ้มมาสเตอร์พอดี — ไม่ตรงกันจะจัดเข้าหมวดนี้ไม่ได้
            </p>
            {folderMatchTagList.length === 0 ? (
              <p className="text-xs text-slate-500">ยังไม่มีแท็กประเภทจับคู่หมวดในระบบ</p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {folderMatchTagList.map((t) => {
                  const on = folderTagDraft.has(t.id)
                  return (
                    <li key={t.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-2 py-2 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            setFolderTagDraft((prev) => {
                              const next = new Set(prev)
                              if (on) next.delete(t.id)
                              else next.add(t.id)
                              return next
                            })
                          }}
                          className="rounded border-slate-300"
                        />
                        <span className="text-slate-900">{t.label}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeFolderTagModal}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveFolderTagModal}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function SplitSaleFolderSidebar({
  folders,
  activeKey,
  onSelect,
  onAddFolder,
  onRemoveFolder,
  onReorderFolders,
  navCounts,
  onRenameFolder,
  onOpenFolderTags,
}: {
  folders: SplitSaleLocalFolder[]
  activeKey: string
  onSelect: (s: FolderSelection) => void
  onAddFolder: () => void
  onRemoveFolder: (id: string, name: string) => void
  onReorderFolders: (fromIndex: number, toIndex: number) => void
  navCounts: { all: number; unassigned: number; byFolder: Record<string, number> }
  onRenameFolder: (folder: SplitSaleLocalFolder) => void
  onOpenFolderTags: (folder: SplitSaleLocalFolder) => void
}) {
  /** ลากด้วย pointer — ใน WebView/Tauri HTML5 draggable มักไปชนกับการคลุมข้อความ */
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropHover, setDropHover] = useState<number | null>(null)
  const dragFromRef = useRef<number | null>(null)
  const [folderCtx, setFolderCtx] = useState<{ folder: SplitSaleLocalFolder; x: number; y: number } | null>(
    null,
  )
  const folderCtxRef = useRef<HTMLDivElement>(null)

  const closeFolderCtx = useCallback(() => setFolderCtx(null), [])

  useEffect(() => {
    if (!folderCtx) return
    const onDown = (e: MouseEvent) => {
      if (folderCtxRef.current?.contains(e.target as Node)) return
      closeFolderCtx()
    }
    const id = window.requestAnimationFrame(() => {
      document.addEventListener('mousedown', onDown, true)
    })
    return () => {
      window.cancelAnimationFrame(id)
      document.removeEventListener('mousedown', onDown, true)
    }
  }, [folderCtx, closeFolderCtx])

  const onGripPointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragFromRef.current = index
    setDragIndex(index)
    setDropHover(index)
    const grip = e.currentTarget as HTMLElement
    try {
      grip.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }

    const move = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const row = el?.closest('[data-split-folder-row]') as HTMLElement | null
      if (row) {
        const i = parseInt(row.getAttribute('data-split-folder-row') ?? '', 10)
        if (Number.isFinite(i)) setDropHover(i)
      }
    }

    let ended = false
    const end = (ev: PointerEvent) => {
      if (ended) return
      ended = true
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      try {
        grip.releasePointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      const from = dragFromRef.current
      dragFromRef.current = null
      setDragIndex(null)
      setDropHover(null)
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const row = el?.closest('[data-split-folder-row]') as HTMLElement | null
      const to = row ? parseInt(row.getAttribute('data-split-folder-row') ?? '', 10) : NaN
      if (from !== null && Number.isFinite(from) && Number.isFinite(to) && from !== to) {
        onReorderFolders(from, to)
      }
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  return (
    <aside
      className="flex min-h-0 w-[13.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm pos-compact:w-[11.5rem] pos-compact:rounded-xl"
      aria-label="หมวดจัดกลุ่ม (เฉพาะหน้านี้)"
    >
      <div className="shrink-0 border-b border-slate-200/90 bg-white/90 px-2.5 py-2 pos-compact:px-2 pos-compact:py-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 pos-compact:text-[10px]">
          จัดกลุ่มดูสต็อก
        </p>
      </div>
      <div className="min-h-0 max-h-[min(70vh,36rem)] flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 pos-compact:max-h-[min(65vh,28rem)] pos-compact:py-1.5">
        <button
          type="button"
          onClick={() => onSelect({ kind: 'all' })}
          className={clsx(
            'mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium pos-compact:py-1 pos-compact:text-[13px]',
            activeKey === 'all'
              ? 'bg-teal-100 text-teal-900 ring-1 ring-teal-200/80'
              : 'text-slate-800 hover:bg-white',
          )}
        >
          <span className="min-w-0 truncate">ทั้งหมด</span>
          <span className="shrink-0 text-xs tabular-nums text-slate-500 pos-compact:text-[11px]">
            {navCounts.all}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelect({ kind: 'unassigned' })}
          className={clsx(
            'mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm pos-compact:py-1 pos-compact:text-[13px]',
            activeKey === 'unassigned'
              ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
              : 'text-slate-700 hover:bg-white',
          )}
        >
          <span className="min-w-0 truncate">ยังไม่จัดหมวด</span>
          <span className="shrink-0 text-xs tabular-nums text-slate-500 pos-compact:text-[11px]">
            {navCounts.unassigned}
          </span>
        </button>
        <div className="my-1.5 border-t border-slate-200/80" />
        {folders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200/90 bg-white/60 px-2 py-2 text-center text-[11px] leading-snug text-slate-500 pos-compact:text-[10px]">
            ยังไม่มีหมวด — กดปุ่มด้านล่างเพื่อเพิ่ม
          </p>
        ) : (
          <ul className="select-none space-y-0.5">
            {folders.map((f, index) => (
              <li
                key={f.id}
                data-split-folder-row={index}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFolderCtx({ folder: f, x: e.clientX, y: e.clientY })
                }}
                className={clsx(
                  'flex min-w-0 flex-col gap-0.5 rounded-lg transition',
                  dragIndex === index && 'opacity-55',
                  dropHover === index &&
                    dragIndex !== null &&
                    dragIndex !== index &&
                    'bg-teal-50/90 ring-1 ring-teal-200/80',
                )}
              >
                <div className="flex min-w-0 items-center gap-0.5">
                  <button
                    type="button"
                    onPointerDown={(e) => onGripPointerDown(e, index)}
                    className="shrink-0 cursor-grab touch-none rounded-md border-0 bg-transparent p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    title="ลากเพื่อสลับตำแหน่ง"
                    aria-label={`ลากสลับตำแหน่งหมวด ${f.name}`}
                  >
                    <GripVertical className="pointer-events-none size-3.5" strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: 'folder', id: f.id })}
                    className={clsx(
                      'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm pos-compact:py-1 pos-compact:text-[13px]',
                      activeKey === `f:${f.id}`
                        ? 'bg-teal-100 font-medium text-teal-900 ring-1 ring-teal-200/80'
                        : 'text-slate-800 hover:bg-white',
                    )}
                    title={`${f.name} — คลิกขวา: แก้ไข / TAG / ลบ`}
                  >
                    <span className="min-w-0 truncate">{f.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500 pos-compact:text-[11px]">
                      {navCounts.byFolder[f.id] ?? 0}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-slate-200/90 bg-white/80 p-1.5 pos-compact:p-1">
        <button
          type="button"
          onClick={onAddFolder}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal-200/90 bg-teal-50/90 px-2 py-2 text-[12px] font-medium text-teal-900 shadow-sm hover:bg-teal-100/90 pos-compact:py-1.5 pos-compact:text-[11px]"
        >
          <Plus className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          เพิ่มหมวด
        </button>
      </div>

      {folderCtx ? (
        <div
          ref={folderCtxRef}
          role="menu"
          className="fixed z-[72] min-w-[9rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{ left: folderCtx.x, top: folderCtx.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
            onClick={() => {
              const f = folderCtx.folder
              closeFolderCtx()
              onRenameFolder(f)
            }}
          >
            แก้ไข
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-50"
            onClick={() => {
              const f = folderCtx.folder
              closeFolderCtx()
              onOpenFolderTags(f)
            }}
          >
            TAG
          </button>
          <div className="my-0.5 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
            onClick={() => {
              const f = folderCtx.folder
              closeFolderCtx()
              onRemoveFolder(f.id, f.name)
            }}
          >
            ลบรายการ
          </button>
        </div>
      ) : null}
    </aside>
  )
}

function SplitSaleRow({
  row,
  tagLabelById,
  listLayout,
  expandedRollColumns,
  rollColumnTagIds,
  boxColumnTagIds,
  assignedFolderLabel,
  onAdjust,
  onAddFullRolls,
  onUnpackRoll,
  onUnpackFullBox,
  onContextMenuRow,
}: {
  row: SplitSaleTableRow
  tagLabelById: Record<string, string>
  listLayout: 'default' | 'hoseSoft' | 'nutStock'
  expandedRollColumns: boolean
  rollColumnTagIds: Set<string>
  boxColumnTagIds: Set<string>
  assignedFolderLabel: string
  onAdjust: () => void
  onAddFullRolls?: () => void
  onUnpackRoll?: () => void
  onUnpackFullBox?: () => void
  onContextMenuRow: (e: ReactMouseEvent) => void
}) {
  const p = row.p
  const { r, b, openKg, totalPieces, piecesPerBox } = row
  const rollMode = productUsesSplitSaleRollColumns(p, rollColumnTagIds)
  const boxMode = isBoxPieceProduct(p)
  const boxColumnMode = productUsesSplitSaleBoxColumns(p, boxColumnTagIds)
  const inlineRollActions = rollMode && (onAddFullRolls || onUnpackRoll)
  const inlineBoxUnpack = Boolean(onUnpackFullBox)
  const hasInlineNameActions = inlineRollActions || inlineBoxUnpack
  const summary = formatSplitSaleStockSummary(row)
  const openCount = r.openRolls.length
  const highlight =
    (rollMode && openCount > 0) ||
    (boxMode && (b.loosePieces > 0 || b.fullBoxes > 0))
  const tagIds = p.productTagIds ?? []
  const showRollCells = rollMode
  const dashCell = (
    <td className="px-3 py-2 text-right tabular-nums text-slate-400 pos-compact:px-2">—</td>
  )
  const dashCellSpecial = (
    <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-slate-400 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
      —
    </td>
  )

  const adjustStockBtnClass =
    'rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 pos-compact:px-2 pos-compact:py-1 pos-compact:text-[10px]'
  const addFullRollBtnClass =
    'inline-flex items-center gap-0.5 rounded-md border border-teal-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-teal-800 shadow-sm hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 pos-compact:text-[9px]'
  const unpackRollBtnClass =
    'inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-900 shadow-sm hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 pos-compact:text-[9px]'

  if (listLayout === 'hoseSoft') {
    return (
      <tr
        className={clsx(
          'border-b border-slate-100 transition',
          highlight
            ? 'bg-amber-50/40 hover:bg-amber-50/70'
            : 'even:bg-slate-50/40 hover:bg-teal-50/35',
        )}
        title={summary}
        onContextMenu={onContextMenuRow}
      >
        <td className="align-middle px-3 py-2.5 font-mono text-xs text-slate-700 pos-compact:px-2 pos-compact:py-2">
          {p.sku}
        </td>
        <td className="max-w-[min(22rem,32vw)] align-middle px-3 py-2.5 text-slate-900 pos-compact:px-2 pos-compact:py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={clsx(
                'min-w-0 flex-1 text-[13px] font-medium leading-snug pos-compact:text-xs',
                hasInlineNameActions ? 'truncate' : 'line-clamp-2',
              )}
            >
              {p.name}
            </span>
            {hasInlineNameActions ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                {onAddFullRolls ? (
                  <button
                    type="button"
                    className={addFullRollBtnClass}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddFullRolls()
                    }}
                  >
                    <Plus className="size-3 shrink-0" aria-hidden />
                    ม้วนเต็ม
                  </button>
                ) : null}
                {onUnpackRoll ? (
                  <button
                    type="button"
                    className={unpackRollBtnClass}
                    onClick={(e) => {
                      e.stopPropagation()
                      onUnpackRoll()
                    }}
                  >
                    <Scissors className="size-3 shrink-0" aria-hidden />
                    แกะม้วน
                  </button>
                ) : null}
                {onUnpackFullBox ? (
                  <button
                    type="button"
                    className={unpackRollBtnClass}
                    onClick={(e) => {
                      e.stopPropagation()
                      onUnpackFullBox()
                    }}
                  >
                    <Scissors className="size-3 shrink-0" aria-hidden />
                    แกะกล่อง
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex max-w-full min-w-0 items-center rounded-md border border-slate-200/90 bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-600 shadow-sm"
              title={assignedFolderLabel}
            >
              <span className="shrink-0 text-slate-400">หมวด</span>
              <span className="ml-1 truncate font-medium text-slate-700">{assignedFolderLabel}</span>
            </span>
            {rollMode ? (
              <span className="rounded-md bg-teal-100/80 px-1.5 py-0.5 text-[10px] font-medium text-teal-900">
                {splitSaleStockTypeLabel(p)}
              </span>
            ) : boxMode ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                กล่อง+เศษ
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                นับชิ้น
              </span>
            )}
          </div>
        </td>
        {rollMode ? (
          <>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-amber-900 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {openKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-[10px] font-normal text-slate-500">
                {isMeterRollSplitProduct(p) ? 'ม.' : 'กก.'}
              </span>
            </td>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-slate-800 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {openCount}
            </td>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-slate-900 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {countFullRollsOnShelf(r)}
            </td>
            <td
              className="px-2 py-2.5 text-right align-middle pos-compact:px-1.5 pos-compact:py-2"
              title={
                splitSaleShowHoseMeterPlaceholder(p)
                  ? 'เมตรต้องใช้อัตราแปลงต่อรุ่น'
                  : undefined
              }
            >
              <div className="tabular-nums text-sm font-semibold text-slate-900 pos-compact:text-xs">
                {splitSaleMetricSummary(row)}
              </div>
              {splitSaleShowHoseMeterPlaceholder(p) ? (
                <div className="mt-0.5 text-[10px] font-normal leading-tight text-slate-400">
                  เมตร: รออัตราแปลง
                </div>
              ) : null}
            </td>
          </>
        ) : (
          <>
            {dashCellSpecial}
            {dashCellSpecial}
            {dashCellSpecial}
            <td className="px-2 py-2.5 text-right align-middle text-sm text-slate-800 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {splitSaleMetricSummary(row)}
            </td>
          </>
        )}
        <td className="px-2 py-2.5 text-center align-middle pos-compact:px-1.5 pos-compact:py-2">
          <button type="button" onClick={onAdjust} className={adjustStockBtnClass}>
            ปรับสต็อก
          </button>
        </td>
      </tr>
    )
  }

  if (listLayout === 'nutStock') {
    return (
      <tr
        className={clsx(
          'border-b border-slate-100 transition',
          highlight
            ? 'bg-amber-50/45 hover:bg-amber-50/75'
            : 'even:bg-amber-50/15 hover:bg-amber-50/30',
        )}
        title={summary}
        onContextMenu={onContextMenuRow}
      >
        <td className="align-middle px-3 py-2.5 font-mono text-xs text-slate-700 pos-compact:px-2 pos-compact:py-2">
          {p.sku}
        </td>
        <td className="max-w-[min(22rem,32vw)] align-middle px-3 py-2.5 text-slate-900 pos-compact:px-2 pos-compact:py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={clsx(
                'min-w-0 flex-1 text-[13px] font-medium leading-snug pos-compact:text-xs',
                inlineBoxUnpack ? 'truncate' : 'line-clamp-2',
              )}
            >
              {p.name}
            </span>
            {onUnpackFullBox ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                <button
                  type="button"
                  className={unpackRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnpackFullBox()
                  }}
                >
                  <Scissors className="size-3 shrink-0" aria-hidden />
                  แกะกล่อง
                </button>
              </div>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex max-w-full min-w-0 items-center rounded-md border border-slate-200/90 bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-600 shadow-sm"
              title={assignedFolderLabel}
            >
              <span className="shrink-0 text-slate-400">หมวด</span>
              <span className="ml-1 truncate font-medium text-slate-700">{assignedFolderLabel}</span>
            </span>
            {boxColumnMode ? (
              <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
                กล่อง+เศษ
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                {boxMode ? 'กล่อง (ไม่ติดแท็กนอตสต็อก)' : 'นับชิ้น'}
              </span>
            )}
          </div>
        </td>
        {boxColumnMode ? (
          <>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-amber-900 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {b.loosePieces.toLocaleString('th-TH')}
            </td>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-slate-900 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {b.fullBoxes.toLocaleString('th-TH')}
            </td>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm text-slate-700 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {piecesPerBox > 0 ? piecesPerBox.toLocaleString('th-TH') : '—'}
            </td>
            <td className="px-2 py-2.5 text-right align-middle tabular-nums text-sm font-semibold text-slate-900 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {totalPieces.toLocaleString('th-TH')}
            </td>
          </>
        ) : (
          <>
            {dashCellSpecial}
            {dashCellSpecial}
            {dashCellSpecial}
            <td className="px-2 py-2.5 text-right align-middle text-sm text-slate-800 pos-compact:px-1.5 pos-compact:py-2 pos-compact:text-xs">
              {splitSaleMetricSummary(row)}
            </td>
          </>
        )}
        <td className="px-2 py-2.5 text-center align-middle pos-compact:px-1.5 pos-compact:py-2">
          <button type="button" onClick={onAdjust} className={adjustStockBtnClass}>
            ปรับสต็อก
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr
      className={clsx(
        'border-b border-slate-100 transition',
        highlight ? 'bg-amber-50/50 hover:bg-amber-50/80' : 'hover:bg-slate-50/80',
      )}
      title={summary}
      onContextMenu={onContextMenuRow}
    >
      <td className="px-3 py-2 font-mono text-xs text-slate-700 pos-compact:px-2">{p.sku}</td>
      <td className="max-w-[min(20rem,28vw)] px-3 py-2 text-slate-900 pos-compact:px-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={clsx(
              'min-w-0 flex-1',
              hasInlineNameActions ? 'truncate' : 'line-clamp-2',
            )}
          >
            {p.name}
          </span>
          {hasInlineNameActions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              {onAddFullRolls ? (
                <button
                  type="button"
                  className={addFullRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddFullRolls()
                  }}
                >
                  <Plus className="size-3 shrink-0" aria-hidden />
                  ม้วนเต็ม
                </button>
              ) : null}
              {onUnpackRoll ? (
                <button
                  type="button"
                  className={unpackRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnpackRoll()
                  }}
                >
                  <Scissors className="size-3 shrink-0" aria-hidden />
                  แกะม้วน
                </button>
              ) : null}
              {onUnpackFullBox ? (
                <button
                  type="button"
                  className={unpackRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnpackFullBox()
                  }}
                >
                  <Scissors className="size-3 shrink-0" aria-hidden />
                  แกะกล่อง
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500" title={assignedFolderLabel}>
          หมวด: {assignedFolderLabel}
        </p>
        <span className="mt-0.5 block text-[10px] text-slate-500">
          {boxMode ? 'คลิกขวา: จัดหมวด · เปิดกล่อง · ปรับสต็อก' : 'คลิกขวา: จัดหมวด · ปรับสต็อก'}
        </span>
      </td>
      <td className="px-3 py-2 text-left text-[11px] text-slate-700 pos-compact:px-2 pos-compact:text-[10px]">
        {splitSaleStockTypeLabel(p)}
      </td>
      {expandedRollColumns ? (
        showRollCells ? (
          <>
            <td className="px-3 py-2 text-right tabular-nums text-amber-900 pos-compact:px-2">
              {openKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-[10px] text-slate-500">
                {isMeterRollSplitProduct(p) ? 'ม.' : 'กก.'}
              </span>
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-slate-800 pos-compact:px-2">{openCount}</td>
            <td className="px-3 py-2 text-right tabular-nums text-slate-900 pos-compact:px-2">
              {countFullRollsOnShelf(r)}
            </td>
          </>
        ) : (
          <>
            {dashCell}
            {dashCell}
            {dashCell}
          </>
        )
      ) : null}
      <td className="px-3 py-2 align-top pos-compact:px-2">
        <div className="flex flex-wrap gap-1">
          {tagIds.length === 0 ? (
            <span className="text-[11px] text-slate-400">—</span>
          ) : (
            tagIds.map((id) => (
              <span
                key={id}
                className="inline-flex max-w-full min-w-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-800"
                title={id}
              >
                <span className="truncate">{tagLabelById[id] ?? id}</span>
              </span>
            ))
          )}
        </div>
      </td>
      <td
        className="px-3 py-2 text-left text-[11px] leading-snug text-slate-800 pos-compact:px-2 pos-compact:text-[10px]"
        title={
          rollMode && splitSaleShowHoseMeterPlaceholder(p)
            ? 'เมตรต้องใช้อัตราแปลงต่อรุ่น'
            : undefined
        }
      >
        {expandedRollColumns && showRollCells ? (
          <>
            {splitSaleMetricSummary(row)}
            {splitSaleShowHoseMeterPlaceholder(p) ? (
              <span className="ml-1 text-[10px] text-slate-400">เมตร: รออัตราแปลง</span>
            ) : null}
          </>
        ) : (
          splitSaleMetricSummary(row)
        )}
      </td>
      <td className="px-3 py-2 pos-compact:px-2">
        <button type="button" onClick={onAdjust} className={adjustStockBtnClass}>
          ปรับสต็อก
        </button>
      </td>
    </tr>
  )
}

function SplitSaleCard({
  row,
  tagLabelById,
  listLayout,
  rollColumnTagIds,
  boxColumnTagIds,
  assignedFolderLabel,
  onAdjust,
  onAddFullRolls,
  onUnpackRoll,
  onUnpackFullBox,
  onContextMenuRow,
}: {
  row: SplitSaleTableRow
  tagLabelById: Record<string, string>
  listLayout: 'default' | 'hoseSoft' | 'nutStock'
  rollColumnTagIds: Set<string>
  boxColumnTagIds: Set<string>
  assignedFolderLabel: string
  onAdjust: () => void
  onAddFullRolls?: () => void
  onUnpackRoll?: () => void
  onUnpackFullBox?: () => void
  onContextMenuRow: (e: ReactMouseEvent) => void
}) {
  const p = row.p
  const { r, b, totalKg, openKg, totalPieces, piecesPerBox } = row
  const rollMode = productUsesSplitSaleRollColumns(p, rollColumnTagIds)
  const boxMode = isBoxPieceProduct(p)
  const boxColumnMode = productUsesSplitSaleBoxColumns(p, boxColumnTagIds)
  const titleHasRollActions = rollMode && (onAddFullRolls || onUnpackRoll)
  const titleHasBoxUnpack = Boolean(onUnpackFullBox)
  const titleHasInlineActions = titleHasRollActions || titleHasBoxUnpack
  const summary = formatSplitSaleStockSummary(row)
  const openCount = r.openRolls.length
  const highlight =
    (rollMode && openCount > 0) || (boxMode && (b.loosePieces > 0 || b.fullBoxes > 0))
  const tagIds = p.productTagIds ?? []
  const showRollDetailBlock = rollMode && listLayout !== 'nutStock'
  const showNutBoxDetailBlock = listLayout === 'nutStock' && boxColumnMode
  const addFullRollBtnClass =
    'inline-flex items-center gap-0.5 rounded-md border border-teal-200 bg-white px-2 py-1 text-[10px] font-medium text-teal-800 shadow-sm hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400'
  const unpackRollBtnClass =
    'inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-white px-2 py-1 text-[10px] font-medium text-amber-900 shadow-sm hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'

  return (
    <article
      className={clsx(
        'flex flex-col rounded-xl border bg-white p-3 shadow-sm transition pos-compact:p-2.5',
        highlight ? 'border-amber-200/90 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300',
        showRollDetailBlock && !highlight && 'ring-1 ring-teal-100/90',
        showNutBoxDetailBlock && !highlight && 'ring-1 ring-amber-100/90',
      )}
      title={summary}
      onContextMenu={onContextMenuRow}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] text-slate-500 pos-compact:text-[10px]">{p.sku}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <h3
            className={clsx(
              'min-w-0 flex-1 font-semibold leading-snug text-slate-900 pos-compact:text-[13px]',
              titleHasInlineActions ? 'truncate text-sm' : 'line-clamp-3 text-sm',
            )}
          >
            {p.name}
          </h3>
          {titleHasInlineActions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              {onAddFullRolls ? (
                <button
                  type="button"
                  className={addFullRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddFullRolls()
                  }}
                >
                  <Plus className="size-3 shrink-0" aria-hidden />
                  ม้วนเต็ม
                </button>
              ) : null}
              {onUnpackRoll ? (
                <button
                  type="button"
                  className={unpackRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnpackRoll()
                  }}
                >
                  <Scissors className="size-3 shrink-0" aria-hidden />
                  แกะม้วน
                </button>
              ) : null}
              {onUnpackFullBox ? (
                <button
                  type="button"
                  className={unpackRollBtnClass}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnpackFullBox()
                  }}
                >
                  <Scissors className="size-3 shrink-0" aria-hidden />
                  แกะกล่อง
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {tagIds.length === 0 ? (
            <span className="text-[10px] text-slate-400">ไม่มีแท็ก</span>
          ) : (
            tagIds.map((id) => (
              <span
                key={id}
                className="inline-flex max-w-full min-w-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-800"
                title={id}
              >
                <span className="truncate">{tagLabelById[id] ?? id}</span>
              </span>
            ))
          )}
        </div>
        <p className="mt-1 truncate text-[10px] text-slate-500" title={assignedFolderLabel}>
          หมวด: {assignedFolderLabel}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">
          {boxMode ? 'คลิกขวา: จัดหมวด · เปิดกล่อง · ปรับสต็อก' : 'คลิกขวา: จัดหมวด · ปรับสต็อก'}
        </p>
      </div>
      {showNutBoxDetailBlock ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pos-compact:mt-2 pos-compact:gap-y-1 pos-compact:text-[10px]">
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>เศษ (ตัว)</dt>
            <dd className="tabular-nums font-medium text-amber-900">
              {b.loosePieces.toLocaleString('th-TH')}
            </dd>
          </div>
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>กล่องเต็ม</dt>
            <dd className="tabular-nums font-medium text-slate-900">{b.fullBoxes.toLocaleString('th-TH')}</dd>
          </div>
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>ตัว/กล่อง</dt>
            <dd className="tabular-nums text-slate-800">
              {piecesPerBox > 0 ? piecesPerBox.toLocaleString('th-TH') : '—'}
            </dd>
          </div>
          <div className="col-span-2 flex justify-between gap-1 border-t border-amber-100 pt-1.5 text-slate-600 pos-compact:pt-1">
            <dt>รวม (ตัว)</dt>
            <dd className="tabular-nums font-semibold text-slate-900">{totalPieces.toLocaleString('th-TH')}</dd>
          </div>
        </dl>
      ) : showRollDetailBlock ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pos-compact:mt-2 pos-compact:gap-y-1 pos-compact:text-[10px]">
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>{isMeterRollSplitProduct(p) ? 'เศษ (ม.)' : 'เศษ (กก.)'}</dt>
            <dd className="tabular-nums font-medium text-amber-900">
              {openKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>ม้วนเปิด</dt>
            <dd className="tabular-nums font-medium text-slate-900">{openCount}</dd>
          </div>
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>ม้วนเต็ม</dt>
            <dd className="tabular-nums font-medium text-slate-900">{countFullRollsOnShelf(r)}</dd>
          </div>
          <div className="flex justify-between gap-1 text-slate-600">
            <dt>{isMeterRollSplitProduct(p) ? 'รวม (ม.)' : 'รวม (กก.)'}</dt>
            <dd className="tabular-nums font-semibold text-slate-900">
              {totalKg.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div className="col-span-2 flex justify-between gap-1 border-t border-slate-100 pt-1.5 text-slate-600 pos-compact:pt-1">
            <dt>{isMeterRollSplitProduct(p) ? 'ม./ม้วน' : 'กก./ม้วน'}</dt>
            <dd className="tabular-nums text-slate-800">{formatNominalKgCell(p, r)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-[11px] leading-snug text-slate-800 pos-compact:mt-2 pos-compact:text-[10px]">{summary}</p>
      )}
      <div className="mt-3 pos-compact:mt-2">
        <button
          type="button"
          onClick={onAdjust}
          className="w-full rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 pos-compact:py-1.5 pos-compact:text-[11px]"
        >
          ปรับสต็อก
        </button>
      </div>
    </article>
  )
}
