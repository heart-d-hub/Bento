import {
  loadCategoryTree,
  newId,
  resolveProductFormFieldVisibility,
  resolveProductTagsInMasterForm,
  saveCategoryTree,
  type CategoryPaperField,
  type CategoryStatus,
  type MainCategory,
  type ProductFormFieldVisibility,
  type SubCategory,
  type SubSubCategory,
} from '@/features/inventory/data/inventoryCategories'
import {
  loadProductTagsRegistry,
  PRODUCT_TAGS_CHANGED_EVENT,
  type ProductTagDefinition,
} from '@/features/inventory/data/productTagsRegistry'
import {
  getProductMasterList,
  PRODUCT_MASTER_LIST_CHANGED_EVENT,
  type ProductMasterDetail,
} from '@/features/inventory/data/productMasterData'
import { clsx } from 'clsx'
import {
  ChevronRight,
  FolderTree,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { useEffect, useMemo, useState } from 'react'

type PendingDelete =
  | { kind: 'main'; mainId: string }
  | { kind: 'sub'; mainId: string; subId: string }
  | { kind: 'subsub'; mainId: string; subId: string; subSubId: string }

type EditCategoryTarget =
  | { kind: 'main'; mainId: string }
  | { kind: 'sub'; mainId: string; subId: string }
  | { kind: 'subsub'; mainId: string; subId: string; subSubId: string }

/** ลากสลับลำดับ — payload ต้องตรงกับ `data-category-drop` บนแถว (m| / s| / t|) */
function CategoryReorderGrip({
  disabled,
  label,
  payload,
  onReorderPair,
  onDragHighlight,
}: {
  disabled?: boolean
  label: string
  payload: string
  onReorderPair: (fromPayload: string, toPayload: string) => void
  /** ไฮไลต์แถวปลายทางขณะลาก (สีชมพู) — ส่ง null เมื่อปล่อยเมาส์ */
  onDragHighlight?: (state: { from: string; over: string | null } | null) => void
}) {
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const grip = e.currentTarget as HTMLElement
    try {
      grip.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const from = payload
    onDragHighlight?.({ from, over: from })

    const move = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const row = el?.closest('[data-category-drop]') as HTMLElement | null
      const raw = row?.getAttribute('data-category-drop')?.trim()
      const over = raw && raw.length > 0 ? raw : null
      onDragHighlight?.({ from, over })
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
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const row = el?.closest('[data-category-drop]') as HTMLElement | null
      const to = row?.getAttribute('data-category-drop')?.trim() ?? ''
      onDragHighlight?.(null)
      if (to && from !== to) onReorderPair(from, to)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onPointerDown}
      className="shrink-0 cursor-grab touch-none rounded-md border-0 bg-transparent p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
      style={{ touchAction: 'none' }}
      title={label}
      aria-label={label}
    >
      <GripVertical className="pointer-events-none size-3.5" strokeWidth={2} aria-hidden />
    </button>
  )
}

function BoltHeadGroupBadge() {
  return (
    <span
      className="shrink-0 rounded border border-violet-200 bg-violet-50 px-1 py-px text-[9px] font-medium text-violet-900"
      title="จัดกลุ่มตัวผู้ตามไซส์ — หัวตัวเมียร่วมกันตามเบอร์ (ใช้กับคู่น็อตในแฟ้มสินค้า / POS)"
    >
      คู่หัวตามไซส์
    </span>
  )
}

function LevelBadge({
  label,
  tone,
}: {
  label: string
  tone: 'slate' | 'amber' | 'violet'
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'violet'
        ? 'border-violet-200 bg-violet-50 text-violet-900'
        : 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <span className={clsx('inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium', toneClass)}>
      {label}
    </span>
  )
}

function StatusSelect({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: CategoryStatus
  onChange: (v: CategoryStatus) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <div className="inline-flex min-w-0 max-w-full items-center gap-1">
      <span
        className={clsx(
          'size-1.5 shrink-0 rounded-full',
          value === 'active' ? 'bg-emerald-500' : 'bg-slate-300',
        )}
        aria-hidden
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CategoryStatus)}
        className={clsx(
          'w-max max-w-full min-w-0 rounded-md border border-slate-200 bg-white text-[11px] text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50',
          compact ? 'py-0.5 pl-1 pr-4' : 'py-1 pl-1 pr-4',
        )}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  )
}

function normCatName(s: string) {
  return s.trim().toLowerCase()
}

function countProductsForMain(mainName: string, products: ProductMasterDetail[]): number {
  const nm = normCatName(mainName)
  return products.filter((p) => normCatName(p.category) === nm).length
}

function countProductsForSub(
  mainName: string,
  subName: string,
  products: ProductMasterDetail[],
): number {
  const nm = normCatName(mainName)
  const sn = normCatName(subName)
  return products.filter(
    (p) => normCatName(p.category) === nm && normCatName(p.subCategory ?? '') === sn,
  ).length
}

function countProductsForSubSub(
  mainName: string,
  subName: string,
  subSubName: string,
  products: ProductMasterDetail[],
): number {
  const nm = normCatName(mainName)
  const sn = normCatName(subName)
  const ss = normCatName(subSubName)
  return products.filter(
    (p) =>
      normCatName(p.category) === nm &&
      normCatName(p.subCategory ?? '') === sn &&
      normCatName(p.subSubCategory ?? '') === ss,
  ).length
}

export function InventoryCategoryManageView() {
  const { setBranchStockPanel } = useWorkspaceTabs()
  const [tree, setTree] = useState<MainCategory[]>(() => loadCategoryTree())
  const [mainDraft, setMainDraft] = useState('')
  const [subDraft, setSubDraft] = useState<Record<string, string>>({})
  /** key = `${mainId}:${subId}` */
  const [subSubDraft, setSubSubDraft] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [mainComposerOpen, setMainComposerOpen] = useState(false)
  /** ร่างตอนเพิ่มหมวดหลัก — มิติ */
  const [mainComposerPaperFields, setMainComposerPaperFields] = useState<CategoryPaperField[]>([])
  /** ติ๊กเดียวกับรายการมิติ: แสดงบล็อกมิติในฟอร์มสินค้า + กำหนดป้ายชื่อได้ */
  const [mainComposerShowPhysicalDimensions, setMainComposerShowPhysicalDimensions] = useState(true)
  const [mainComposerShowBrand, setMainComposerShowBrand] = useState(false)
  /** ป๊อปอัปแก้ไขหมวด (ชื่อ + มิติ + แสดงแบรนด์) — หลัก / ย่อย1 / ย่อย2 */
  const [editTarget, setEditTarget] = useState<EditCategoryTarget | null>(null)
  const [editName, setEditName] = useState('')
  const [editPaperFields, setEditPaperFields] = useState<CategoryPaperField[]>([])
  const [editShowBrand, setEditShowBrand] = useState(false)
  /** แสดงแท็กในฟอร์มแฟ้มข้อมูล — false = ไม่แสดงตอนเพิ่มสินค้า */
  const [editTagsInMasterForm, setEditTagsInMasterForm] = useState(true)
  /** จำกัดเฉพาะแท็กที่เลือก — ใช้เมื่อเปิดแท็กในแฟ้มแล้ว */
  const [editRestrictTags, setEditRestrictTags] = useState(false)
  const [editAllowedTagIds, setEditAllowedTagIds] = useState<string[]>([])
  /** หมวดน็อต — จัดกลุ่มตัวผู้ตามไซส์ (หัวร่วมกัน) */
  const [editBoltHeadGroup, setEditBoltHeadGroup] = useState(false)
  /** แสดงฟิลด์เสริมในฟอร์มเพิ่มสินค้า — ติ๊ก = แสดง */
  const [editProductFormFields, setEditProductFormFields] = useState<ProductFormFieldVisibility>(() => ({
    showOemTags: true,
    showCrossRef: true,
    showFactoryNo: true,
    showVehicleFitment: true,
    showPhysicalDimensions: true,
  }))
  const [tagRegistryList, setTagRegistryList] = useState<ProductTagDefinition[]>(() =>
    loadProductTagsRegistry(),
  )
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [expandedMain, setExpandedMain] = useState<Set<string>>(() => new Set())
  const [productListTick, setProductListTick] = useState(0)
  const [categoryDragHighlight, setCategoryDragHighlight] = useState<{
    from: string
    over: string | null
  } | null>(null)

  useEffect(() => {
    saveCategoryTree(tree)
  }, [tree])

  useEffect(() => {
    const on = () => setProductListTick((n) => n + 1)
    window.addEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_MASTER_LIST_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    const on = () => setTagRegistryList(loadProductTagsRegistry())
    window.addEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
    return () => window.removeEventListener(PRODUCT_TAGS_CHANGED_EVENT, on)
  }, [])

  const products = useMemo(() => getProductMasterList(), [productListTick])

  function toggleExpand(mainId: string) {
    setExpandedMain((prev) => {
      const next = new Set(prev)
      if (next.has(mainId)) next.delete(mainId)
      else next.add(mainId)
      return next
    })
  }

  function addMainCategory() {
    const name = mainDraft.trim()
    if (!name) return
    if (tree.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setMainDraft('')
      return
    }
    const mainId = newId('main')
    const cleanedPaper = mainComposerShowPhysicalDimensions
      ? mainComposerPaperFields
          .map((f) => ({ id: newId('pf'), label: f.label.trim() }))
          .filter((f) => f.label.length > 0)
      : []
    const next: MainCategory = {
      id: mainId,
      name,
      status: 'active',
      subcategories: [],
      paperFields: cleanedPaper,
      showProductBrand: mainComposerShowBrand,
      productFormShowPhysicalDimensions: mainComposerShowPhysicalDimensions,
    }
    setTree((prev) => [...prev, next])
    setMainDraft('')
    setMainComposerPaperFields([])
    setMainComposerShowPhysicalDimensions(true)
    setMainComposerShowBrand(false)
    setMainComposerOpen(false)
    setExpandedMain((s) => new Set(s).add(next.id))
  }

  function openEditCategoryDialog(target: EditCategoryTarget) {
    if (target.kind === 'main') {
      const m = tree.find((x) => x.id === target.mainId)
      if (!m) return
      setEditTarget(target)
      setEditName(m.name)
      setEditPaperFields(m.paperFields?.map((x) => ({ ...x })) ?? [])
      setEditShowBrand(m.showProductBrand === true)
      const allowed = m.allowedProductTagIds
      setEditRestrictTags(Boolean(allowed && allowed.length > 0))
      setEditAllowedTagIds(allowed?.length ? [...allowed] : [])
      setEditBoltHeadGroup(m.boltHeadGroupBySize ?? false)
      setEditProductFormFields(resolveProductFormFieldVisibility(tree, m.name))
      setEditTagsInMasterForm(resolveProductTagsInMasterForm(tree, m.name))
      return
    }
    if (target.kind === 'sub') {
      const main = tree.find((x) => x.id === target.mainId)
      const sub = main?.subcategories.find((s) => s.id === target.subId)
      if (!main || !sub) return
      setEditTarget(target)
      setEditName(sub.name)
      setEditPaperFields(sub.paperFields?.map((x) => ({ ...x })) ?? [])
      setEditShowBrand(sub.showProductBrand === true)
      const allowed = sub.allowedProductTagIds
      setEditRestrictTags(Boolean(allowed && allowed.length > 0))
      setEditAllowedTagIds(allowed?.length ? [...allowed] : [])
      setEditBoltHeadGroup(sub.boltHeadGroupBySize ?? false)
      setEditProductFormFields(resolveProductFormFieldVisibility(tree, main.name, sub.name))
      setEditTagsInMasterForm(resolveProductTagsInMasterForm(tree, main.name, sub.name))
      return
    }
    const main = tree.find((x) => x.id === target.mainId)
    const sub = main?.subcategories.find((s) => s.id === target.subId)
    const ss = sub?.subSubcategories.find((x) => x.id === target.subSubId)
    if (!main || !sub || !ss) return
    setEditTarget(target)
    setEditName(ss.name)
    setEditPaperFields(ss.paperFields?.map((x) => ({ ...x })) ?? [])
    setEditShowBrand(ss.showProductBrand === true)
    const allowed = ss.allowedProductTagIds
    setEditRestrictTags(Boolean(allowed && allowed.length > 0))
    setEditAllowedTagIds(allowed?.length ? [...allowed] : [])
    setEditBoltHeadGroup(ss.boltHeadGroupBySize ?? false)
    setEditProductFormFields(resolveProductFormFieldVisibility(tree, main.name, sub.name, ss.name))
    setEditTagsInMasterForm(resolveProductTagsInMasterForm(tree, main.name, sub.name, ss.name))
  }

  function closeEditCategoryDialog() {
    setEditTarget(null)
  }

  function saveEditCategoryDialog() {
    if (!editTarget) return
    const name = editName.trim()
    if (!name) {
      window.alert('กรุณากรอกชื่อหมวด')
      return
    }
    const cleaned = editPaperFields
      .map((f, i) => ({
        id: f.id.trim() || `pf-${i}-${Date.now()}`,
        label: f.label.trim(),
      }))
      .filter((f) => f.label.length > 0)
    const paperFieldsPayload = editProductFormFields.showPhysicalDimensions ? cleaned : []

    const allowedTagPayload =
      editTagsInMasterForm && editRestrictTags && editAllowedTagIds.length > 0
        ? [...editAllowedTagIds]
        : undefined
    if (editTagsInMasterForm && editRestrictTags && editAllowedTagIds.length === 0) {
      window.alert('เลือกจำกัดแท็ก — ต้องเลือกอย่างน้อย 1 แท็ก หรือปิดการจำกัด')
      return
    }

    const productFormPayload = {
      productFormShowOemTags: editProductFormFields.showOemTags,
      productFormShowCrossRef: editProductFormFields.showCrossRef,
      productFormShowFactoryNo: editProductFormFields.showFactoryNo,
      productFormShowVehicleFitment: editProductFormFields.showVehicleFitment,
      productFormShowPhysicalDimensions: editProductFormFields.showPhysicalDimensions,
      productTagsInMasterForm: editTagsInMasterForm,
    }

    if (editTarget.kind === 'main') {
      const { mainId } = editTarget
      if (tree.some((m) => m.id !== mainId && m.name.toLowerCase() === name.toLowerCase())) {
        window.alert('มีชื่อหมวดหลักนี้แล้ว')
        return
      }
      setTree((prev) =>
        prev.map((m) =>
          m.id === mainId
            ? {
                ...m,
                name,
                paperFields: paperFieldsPayload,
                showProductBrand: editShowBrand,
                allowedProductTagIds: editTagsInMasterForm ? allowedTagPayload : undefined,
                boltHeadGroupBySize: editBoltHeadGroup,
                ...productFormPayload,
              }
            : m,
        ),
      )
    } else if (editTarget.kind === 'sub') {
      const { mainId, subId } = editTarget
      const main = tree.find((m) => m.id === mainId)
      if (!main) return
      if (main.subcategories.some((s) => s.id !== subId && s.name.toLowerCase() === name.toLowerCase())) {
        window.alert('มีชื่อย่อย 1 นี้แล้วภายใต้หมวดหลักนี้')
        return
      }
      setTree((prev) =>
        prev.map((m) =>
          m.id !== mainId
            ? m
            : {
                ...m,
                subcategories: m.subcategories.map((s) =>
                  s.id === subId
                    ? {
                        ...s,
                        name,
                        paperFields: paperFieldsPayload,
                        showProductBrand: editShowBrand,
                        allowedProductTagIds: editTagsInMasterForm ? allowedTagPayload : undefined,
                        boltHeadGroupBySize: editBoltHeadGroup,
                        ...productFormPayload,
                      }
                    : s,
                ),
              },
        ),
      )
    } else {
      const { mainId, subId, subSubId } = editTarget
      const sub = tree.find((m) => m.id === mainId)?.subcategories.find((s) => s.id === subId)
      if (!sub) return
      if (sub.subSubcategories.some((ss) => ss.id !== subSubId && ss.name.toLowerCase() === name.toLowerCase())) {
        window.alert('มีชื่อย่อย 2 นี้แล้วภายใต้ย่อย 1 นี้')
        return
      }
      setTree((prev) =>
        prev.map((m) =>
          m.id !== mainId
            ? m
            : {
                ...m,
                subcategories: m.subcategories.map((s) =>
                  s.id !== subId
                    ? s
                    : {
                        ...s,
                        subSubcategories: s.subSubcategories.map((ss) =>
                          ss.id === subSubId
                            ? {
                                ...ss,
                                name,
                                paperFields: paperFieldsPayload,
                                showProductBrand: editShowBrand,
                                allowedProductTagIds: editTagsInMasterForm ? allowedTagPayload : undefined,
                                boltHeadGroupBySize: editBoltHeadGroup,
                                ...productFormPayload,
                              }
                            : ss,
                        ),
                      },
                ),
              },
        ),
      )
    }
    closeEditCategoryDialog()
  }

  function updatePaperFieldLabel(
    list: CategoryPaperField[],
    fieldId: string,
    label: string,
    setList: (v: CategoryPaperField[]) => void,
  ) {
    setList(list.map((f) => (f.id === fieldId ? { ...f, label } : f)))
  }

  function addPaperFieldRow(setList: (v: CategoryPaperField[]) => void, current: CategoryPaperField[]) {
    setList([...current, { id: newId('pf'), label: '' }])
  }

  function removePaperFieldRow(setList: (v: CategoryPaperField[]) => void, current: CategoryPaperField[], fieldId: string) {
    setList(current.filter((f) => f.id !== fieldId))
  }

  function addSubCategory(mainId: string) {
    const raw = (subDraft[mainId] ?? '').trim()
    if (!raw) return
    setTree((prev) =>
      prev.map((m) => {
        if (m.id !== mainId) return m
        if (m.subcategories.some((s) => s.name.toLowerCase() === raw.toLowerCase())) {
          return m
        }
        const sub: SubCategory = {
          id: newId('sub'),
          name: raw,
          status: 'active',
          subSubcategories: [],
          paperFields: [],
          showProductBrand: false,
        }
        return {
          ...m,
          subcategories: [...m.subcategories, sub],
        }
      }),
    )
    setSubDraft((d) => ({ ...d, [mainId]: '' }))
  }

  function requestDeleteMain(mainId: string) {
    setPendingDelete({ kind: 'main', mainId })
  }

  function requestDeleteSub(mainId: string, subId: string) {
    setPendingDelete({ kind: 'sub', mainId, subId })
  }

  function subSubDraftKey(mainId: string, subId: string) {
    return `${mainId}:${subId}`
  }

  function addSubSubCategory(mainId: string, subId: string) {
    const key = subSubDraftKey(mainId, subId)
    const raw = (subSubDraft[key] ?? '').trim()
    if (!raw) return
    setTree((prev) =>
      prev.map((m) => {
        if (m.id !== mainId) return m
        return {
          ...m,
          subcategories: m.subcategories.map((s) => {
            if (s.id !== subId) return s
            if (s.subSubcategories.some((ss) => ss.name.toLowerCase() === raw.toLowerCase())) {
              return s
            }
            const item: SubSubCategory = {
              id: newId('subsub'),
              name: raw,
              status: 'active',
              paperFields: [],
              showProductBrand: false,
            }
            return {
              ...s,
              subSubcategories: [...s.subSubcategories, item],
            }
          }),
        }
      }),
    )
    setSubSubDraft((d) => ({ ...d, [key]: '' }))
  }

  function requestDeleteSubSub(mainId: string, subId: string, subSubId: string) {
    setPendingDelete({ kind: 'subsub', mainId, subId, subSubId })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'main') {
      setTree((prev) => prev.filter((m) => m.id !== pendingDelete.mainId))
      setExpandedMain((s) => {
        const next = new Set(s)
        next.delete(pendingDelete.mainId)
        return next
      })
    } else if (pendingDelete.kind === 'sub') {
      const { mainId, subId } = pendingDelete
      setTree((prev) =>
        prev.map((m) =>
          m.id !== mainId
            ? m
            : { ...m, subcategories: m.subcategories.filter((s) => s.id !== subId) },
        ),
      )
    } else {
      const { mainId, subId, subSubId } = pendingDelete
      setTree((prev) =>
        prev.map((m) => {
          if (m.id !== mainId) return m
          return {
            ...m,
            subcategories: m.subcategories.map((s) =>
              s.id !== subId
                ? s
                : { ...s, subSubcategories: s.subSubcategories.filter((ss) => ss.id !== subSubId) },
            ),
          }
        }),
      )
    }
    setPendingDelete(null)
  }

  function cancelPendingDelete() {
    setPendingDelete(null)
  }

  function reorderMainCategory(fromIndex: number, toIndex: number) {
    setTree((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev
      }
      const next = [...prev]
      const [item] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, item)
      return next
    })
  }

  function reorderSubCategory(mainId: string, fromIndex: number, toIndex: number) {
    setTree((prev) =>
      prev.map((m) => {
        if (m.id !== mainId) return m
        const subs = m.subcategories
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= subs.length ||
          toIndex >= subs.length
        ) {
          return m
        }
        const next = [...subs]
        const [item] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, item)
        return { ...m, subcategories: next }
      }),
    )
  }

  function reorderSubSubCategory(mainId: string, subId: string, fromIndex: number, toIndex: number) {
    setTree((prev) =>
      prev.map((m) => {
        if (m.id !== mainId) return m
        return {
          ...m,
          subcategories: m.subcategories.map((s) => {
            if (s.id !== subId) return s
            const arr = s.subSubcategories
            if (
              fromIndex === toIndex ||
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= arr.length ||
              toIndex >= arr.length
            ) {
              return s
            }
            const next = [...arr]
            const [item] = next.splice(fromIndex, 1)
            next.splice(toIndex, 0, item)
            return { ...s, subSubcategories: next }
          }),
        }
      }),
    )
  }

  function applyMainReorder(from: string, to: string) {
    if (!from.startsWith('m|') || !to.startsWith('m|')) return
    const fromI = parseInt(from.slice(2), 10)
    const toI = parseInt(to.slice(2), 10)
    if (!Number.isFinite(fromI) || !Number.isFinite(toI) || fromI === toI) return
    reorderMainCategory(fromI, toI)
  }

  function applySubReorder(from: string, to: string) {
    if (!from.startsWith('s|') || !to.startsWith('s|')) return
    const pf = from.split('|')
    const pt = to.split('|')
    if (pf.length !== 3 || pt.length !== 3) return
    if (pf[1] !== pt[1]) return
    const mainId = pf[1]!
    const fromI = parseInt(pf[2]!, 10)
    const toI = parseInt(pt[2]!, 10)
    if (!Number.isFinite(fromI) || !Number.isFinite(toI) || fromI === toI) return
    reorderSubCategory(mainId, fromI, toI)
  }

  function applySubSubReorder(from: string, to: string) {
    if (!from.startsWith('t|') || !to.startsWith('t|')) return
    const pf = from.split('|')
    const pt = to.split('|')
    if (pf.length !== 4 || pt.length !== 4) return
    if (pf[1] !== pt[1] || pf[2] !== pt[2]) return
    const mainId = pf[1]!
    const subId = pf[2]!
    const fromI = parseInt(pf[3]!, 10)
    const toI = parseInt(pt[3]!, 10)
    if (!Number.isFinite(fromI) || !Number.isFinite(toI) || fromI === toI) return
    reorderSubSubCategory(mainId, subId, fromI, toI)
  }

  function setMainStatus(mainId: string, status: CategoryStatus) {
    setTree((prev) => prev.map((m) => (m.id === mainId ? { ...m, status } : m)))
  }

  function setSubStatus(mainId: string, subId: string, status: CategoryStatus) {
    setTree((prev) =>
      prev.map((m) =>
        m.id !== mainId
          ? m
          : {
              ...m,
              subcategories: m.subcategories.map((s) => (s.id === subId ? { ...s, status } : s)),
            },
      ),
    )
  }

  function setSubSubStatus(mainId: string, subId: string, subSubId: string, status: CategoryStatus) {
    setTree((prev) =>
      prev.map((m) =>
        m.id !== mainId
          ? m
          : {
              ...m,
              subcategories: m.subcategories.map((s) =>
                s.id !== subId
                  ? s
                  : {
                      ...s,
                      subSubcategories: s.subSubcategories.map((ss) =>
                        ss.id === subSubId ? { ...ss, status } : ss,
                      ),
                    },
              ),
            },
      ),
    )
  }

  const isPendingMain = (mainId: string) =>
    pendingDelete?.kind === 'main' && pendingDelete.mainId === mainId

  const isPendingSub = (mainId: string, subId: string) =>
    pendingDelete?.kind === 'sub' &&
    pendingDelete.mainId === mainId &&
    pendingDelete.subId === subId

  const isPendingSubSub = (mainId: string, subId: string, subSubId: string) =>
    pendingDelete?.kind === 'subsub' &&
    pendingDelete.mainId === mainId &&
    pendingDelete.subId === subId &&
    pendingDelete.subSubId === subSubId

  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tree
    return tree.filter(
      (main) =>
        main.name.toLowerCase().includes(q) ||
        main.subcategories.some(
          (sub) =>
            sub.name.toLowerCase().includes(q) ||
            sub.subSubcategories.some((ss) => ss.name.toLowerCase().includes(q)),
        ),
    )
  }, [tree, query])

  const inputClass =
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] leading-tight text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200'
  const iconEditBtnClass =
    'inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'
  const iconDeleteBtnClass =
    'inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40'
  /** คอลัมน์ให้ตรงกับหัวตาราง: ชื่อ | จำนวนสินค้า | Status | จัดการ */
  const gridClass =
    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,4.75rem)_5rem] sm:items-center sm:gap-x-3 sm:gap-y-0'

  return (
    <section className="flex w-full min-w-0 flex-1 flex-col gap-3 pos-compact:gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <FolderTree className="size-4 text-amber-700" strokeWidth={1.75} aria-hidden />
            จัดการหมวดหมู่
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            หลัก → ย่อย 1 → ย่อย 2 · ลากไอคอนขีดซ้ายเพื่อสลับลำดับ · ใหม่อยู่ท้าย · ลบต้องยืนยัน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTagRegistryList(loadProductTagsRegistry())
              setBranchStockPanel('product-tags')
            }}
            className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-900 hover:bg-violet-100"
          >
            แท็กสินค้า
          </button>
          <LevelBadge label="3 ระดับ" tone="slate" />
          <LevelBadge label="Custom Order" tone="slate" />
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm selection:bg-pink-200 selection:text-pink-950 pos-compact:rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 pos-compact:px-2.5 pos-compact:py-2">
          <div>
            <h4 className="text-lg font-semibold text-slate-900 pos-compact:text-base">Categories</h4>
            <p className="text-[11px] text-slate-500">จัดหมวดสินค้าให้พร้อมสำหรับแฟ้มข้อมูลและเว็บในอนาคต</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMainComposerOpen((prev) => {
                const next = !prev
                if (!prev && next) {
                  setMainComposerPaperFields([])
                  setMainComposerShowBrand(false)
                }
                if (prev && !next) setMainDraft('')
                return next
              })
            }}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            New Category
          </button>
        </div>

        <div className="space-y-2 border-b border-slate-100 bg-slate-50/40 px-3 py-2.5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
            </label>
            <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1">ลากสลับลำดับ</span>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1">Nested Tree</span>
            </div>
          </div>

          {mainComposerOpen ? (
            <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    เพิ่มหมวดหลัก
                  </span>
                  <input
                    type="text"
                    value={mainDraft}
                    onChange={(e) => setMainDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMainCategory())}
                    placeholder="ชื่อหมวด เช่น เครื่องยนต์"
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={addMainCategory}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    <Plus className="size-3.5" />
                    เพิ่ม
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMainComposerOpen(false)
                      setMainDraft('')
                      setMainComposerPaperFields([])
                      setMainComposerShowPhysicalDimensions(true)
                      setMainComposerShowBrand(false)
                    }}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
              <div className="rounded-md border border-indigo-200/80 bg-white/90 p-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  หมวดนี้เก็บอะไร (ใช้กับทั้งหมวดหลักนี้)
                </p>
                <label className="mb-1.5 flex cursor-pointer items-start gap-2 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={mainComposerShowPhysicalDimensions}
                    onChange={(e) => setMainComposerShowPhysicalDimensions(e.target.checked)}
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span className="min-w-0">
                    <span className="font-medium">มิติอ้างอิง (กระดาษ)</span>
                    <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">
                      ติ๊ก = แสดงบล็อกมิติในฟอร์มสินค้า + กำหนดป้ายช่องด้านล่าง · ไม่ติ๊ก = ไม่ใช้มิติในหมวดนี้
                    </span>
                  </span>
                </label>
                {mainComposerShowPhysicalDimensions ? (
                  <>
                    <p className="mb-1 text-[10px] font-medium text-slate-600">ป้ายช่องมิติ (ว่างได้)</p>
                    {mainComposerPaperFields.length === 0 ? (
                      <p className="mb-1 text-[10px] text-slate-400">ยังไม่ระบุ — ใช้ป้ายเริ่มต้นแคตตาล็อกเมื่อเพิ่มสินค้า</p>
                    ) : null}
                    <ul className="space-y-1">
                      {mainComposerPaperFields.map((f) => (
                        <li key={f.id} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) =>
                              updatePaperFieldLabel(mainComposerPaperFields, f.id, e.target.value, setMainComposerPaperFields)
                            }
                            placeholder="เช่น กว้าง"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => removePaperFieldRow(setMainComposerPaperFields, mainComposerPaperFields, f.id)}
                            className="shrink-0 rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                            title="ลบมิติ"
                            aria-label="ลบมิติ"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={mainComposerPaperFields.length >= 8}
                      onClick={() => addPaperFieldRow(setMainComposerPaperFields, mainComposerPaperFields)}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Plus className="size-3" />
                      เพิ่มมิติ
                    </button>
                  </>
                ) : null}
                <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={mainComposerShowBrand}
                    onChange={(e) => setMainComposerShowBrand(e.target.checked)}
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>แสดงแบรนด์สินค้าในช่องนี้</span>
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={clsx(
            gridClass,
            'border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500',
          )}
        >
          <div>ชื่อ</div>
          <div className="hidden text-center sm:block">จำนวนสินค้า</div>
          <div className="hidden text-center sm:block">Status</div>
          <div className="text-center">จัดการ</div>
        </div>

        {filteredTree.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-500">
            {tree.length === 0 ? 'ยังไม่มีหมวดหลัก' : 'ไม่พบหมวดที่ค้นหา'}
          </p>
        ) : (
          <ul className="select-none divide-y divide-slate-100">
            {filteredTree.map((main) => {
              const actualMainIndex = tree.findIndex((item) => item.id === main.id)
              const open = expandedMain.has(main.id)
              const subCount = main.subcategories.length
              const mainProductCount = countProductsForMain(main.name, products)

              return (
                <li
                  key={main.id}
                  data-category-drop={`m|${actualMainIndex}`}
                  className={clsx(
                    isPendingMain(main.id) && 'bg-rose-50/30',
                    categoryDragHighlight?.from === `m|${actualMainIndex}` && 'opacity-[0.68]',
                    categoryDragHighlight?.over === `m|${actualMainIndex}` &&
                      categoryDragHighlight.from !== categoryDragHighlight.over &&
                      'bg-pink-100/90 ring-1 ring-pink-300/80',
                  )}
                >
                  <div className={clsx(gridClass, 'px-3 py-2.5', isPendingMain(main.id) && 'bg-rose-50/80')}>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        {!isPendingMain(main.id) ? (
                          <CategoryReorderGrip
                            label={`ลากสลับตำแหน่งหมวดหลัก ${main.name}`}
                            payload={`m|${actualMainIndex}`}
                            onReorderPair={applyMainReorder}
                            onDragHighlight={setCategoryDragHighlight}
                          />
                        ) : null}

                        <button
                          type="button"
                          onClick={() => toggleExpand(main.id)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                          aria-expanded={open}
                        >
                          <ChevronRight
                            className={clsx('size-3.5 shrink-0 text-slate-400 transition', open && 'rotate-90')}
                          />
                          <span className="text-[10px] tabular-nums text-slate-400">{actualMainIndex + 1}</span>
                          <span className="truncate text-[13px] font-medium text-slate-900">{main.name}</span>
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 sm:hidden">
                            {mainProductCount} สินค้า
                          </span>
                        </button>
                      </div>
                      <div className="ml-7 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                        {main.paperFields && main.paperFields.length > 0 ? (
                          <span className="truncate" title={main.paperFields.map((f) => f.label).join(' · ')}>
                            มิติ: {main.paperFields.map((f) => f.label).join(' · ')}
                          </span>
                        ) : null}
                        {main.showProductBrand ? (
                          <span className="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-1 py-px text-[9px] font-medium text-indigo-800">
                            แสดงแบรนด์
                          </span>
                        ) : null}
                        {main.boltHeadGroupBySize ? <BoltHeadGroupBadge /> : null}
                      </div>
                      <div className="mt-1 sm:hidden">
                        <StatusSelect
                          value={main.status}
                          onChange={(v) => setMainStatus(main.id, v)}
                          disabled={isPendingMain(main.id)}
                          compact
                        />
                      </div>
                    </div>

                    <div className="hidden text-center text-xs tabular-nums text-slate-500 sm:block">
                      {mainProductCount}
                    </div>
                    <div className="hidden min-w-0 justify-self-center sm:flex sm:justify-center">
                      <StatusSelect
                        value={main.status}
                        onChange={(v) => setMainStatus(main.id, v)}
                        disabled={isPendingMain(main.id)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                      {!isPendingMain(main.id) ? (
                        <>
                          <button
                            type="button"
                            className={iconEditBtnClass}
                            title="แก้ไขหมวดหลัก"
                            aria-label="แก้ไขหมวดหลัก"
                            onClick={() => openEditCategoryDialog({ kind: 'main', mainId: main.id })}
                          >
                            <Pencil className="size-3.5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className={iconDeleteBtnClass}
                            title="ลบ"
                            aria-label="ลบหมวดหลัก"
                            onClick={() => requestDeleteMain(main.id)}
                          >
                            <Trash2 className="size-3.5" strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-rose-700">
                            {subCount > 0 ? `ลบหลักนี้จะลบย่อย ${subCount}` : 'ลบหมวดหลัก?'}
                          </span>
                          <button type="button" onClick={confirmDelete} className="rounded bg-rose-600 px-1.5 py-0.5 text-[11px] text-white">
                            ยืนยัน
                          </button>
                          <button
                            type="button"
                            onClick={cancelPendingDelete}
                            className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600"
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {open ? (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="border-b border-slate-100 px-3 py-2 pl-12">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
                          <label className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-[10px] text-slate-500">เพิ่มย่อย 1 ใต้ &quot;{main.name}&quot;</span>
                            <input
                              type="text"
                              value={subDraft[main.id] ?? ''}
                              onChange={(e) => setSubDraft((d) => ({ ...d, [main.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubCategory(main.id))}
                              placeholder="ชื่อหมวดย่อย 1"
                              className={inputClass}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => addSubCategory(main.id)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                          >
                            <Plus className="size-3.5" />
                            เพิ่ม
                          </button>
                        </div>
                      </div>

                      {main.subcategories.length === 0 ? (
                        <p className="px-3 py-4 text-center text-[11px] text-slate-400">ยังไม่มีย่อย 1</p>
                      ) : (
                        <ul className="select-none divide-y divide-slate-100">
                          {main.subcategories.map((sub, si) => {
                            const subProductCount = countProductsForSub(main.name, sub.name, products)

                            return (
                              <li
                                key={sub.id}
                                data-category-drop={`s|${main.id}|${si}`}
                                className={clsx(
                                  categoryDragHighlight?.from === `s|${main.id}|${si}` && 'opacity-[0.68]',
                                  categoryDragHighlight?.over === `s|${main.id}|${si}` &&
                                    categoryDragHighlight.from !== categoryDragHighlight.over &&
                                    'bg-pink-100/90 ring-1 ring-pink-300/80',
                                )}
                              >
                                <div className={clsx(gridClass, 'px-3 py-2 pl-12', isPendingSub(main.id, sub.id) && 'bg-rose-50/80')}>
                                  <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2">
                                      {!isPendingSub(main.id, sub.id) ? (
                                        <CategoryReorderGrip
                                          label={`ลากสลับตำแหน่งหมวดย่อย 1 ${sub.name}`}
                                          payload={`s|${main.id}|${si}`}
                                          onReorderPair={applySubReorder}
                                          onDragHighlight={setCategoryDragHighlight}
                                        />
                                      ) : null}

                                      <span className="min-w-0 flex-1 text-[13px] text-slate-800">
                                        <span className="mr-1.5 tabular-nums text-slate-400">
                                          {actualMainIndex + 1}.{si + 1}
                                        </span>
                                        <span className="font-medium">{sub.name}</span>
                                        <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 sm:hidden">
                                          {subProductCount} สินค้า
                                        </span>
                                      </span>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-7 text-[10px] text-slate-500 sm:pl-8">
                                      {sub.paperFields && sub.paperFields.length > 0 ? (
                                        <span className="truncate" title={sub.paperFields.map((f) => f.label).join(' · ')}>
                                          มิติ: {sub.paperFields.map((f) => f.label).join(' · ')}
                                        </span>
                                      ) : null}
                                      {sub.showProductBrand ? (
                                        <span className="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-1 py-px text-[9px] font-medium text-indigo-800">
                                          แสดงแบรนด์
                                        </span>
                                      ) : null}
                                      {sub.boltHeadGroupBySize ? <BoltHeadGroupBadge /> : null}
                                    </div>
                                    <div className="mt-1 sm:hidden">
                                      <StatusSelect
                                        value={sub.status}
                                        onChange={(v) => setSubStatus(main.id, sub.id, v)}
                                        disabled={isPendingSub(main.id, sub.id)}
                                        compact
                                      />
                                    </div>
                                  </div>

                                  <div className="hidden text-center text-xs tabular-nums text-slate-500 sm:block">
                                    {subProductCount}
                                  </div>
                                  <div className="hidden min-w-0 justify-self-center sm:flex sm:justify-center">
                                    <StatusSelect
                                      value={sub.status}
                                      onChange={(v) => setSubStatus(main.id, sub.id, v)}
                                      disabled={isPendingSub(main.id, sub.id)}
                                    />
                                  </div>
                                  <div className="flex flex-wrap items-center justify-center gap-0.5">
                                    {!isPendingSub(main.id, sub.id) ? (
                                      <>
                                        <button
                                          type="button"
                                          className={iconEditBtnClass}
                                          title="แก้ไขหมวดย่อย 1"
                                          aria-label="แก้ไขหมวดย่อย 1"
                                          onClick={() =>
                                            openEditCategoryDialog({ kind: 'sub', mainId: main.id, subId: sub.id })
                                          }
                                        >
                                          <Pencil className="size-3.5" strokeWidth={2} />
                                        </button>
                                        <button
                                          type="button"
                                          className={iconDeleteBtnClass}
                                          title="ลบ"
                                          aria-label="ลบหมวดย่อย 1"
                                          onClick={() => requestDeleteSub(main.id, sub.id)}
                                        >
                                          <Trash2 className="size-3.5" strokeWidth={2} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[11px] text-rose-700">ลบย่อย 1 + ย่อย 2?</span>
                                        <button type="button" onClick={confirmDelete} className="rounded bg-rose-600 px-1.5 py-0.5 text-[11px] text-white">
                                          ยืนยัน
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelPendingDelete}
                                          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600"
                                        >
                                          ยกเลิก
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="border-t border-slate-100 bg-white/70 px-3 py-2 pl-16">
                                  <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-end">
                                    <label className="min-w-0 flex-1">
                                      <span className="mb-0.5 block text-[10px] text-slate-500">เพิ่มย่อย 2 ใต้ &quot;{sub.name}&quot;</span>
                                      <input
                                        type="text"
                                        value={subSubDraft[subSubDraftKey(main.id, sub.id)] ?? ''}
                                        onChange={(e) =>
                                          setSubSubDraft((d) => ({
                                            ...d,
                                            [subSubDraftKey(main.id, sub.id)]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) =>
                                          e.key === 'Enter' && (e.preventDefault(), addSubSubCategory(main.id, sub.id))
                                        }
                                        placeholder="ชื่อหมวดย่อย 2"
                                        className={inputClass}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addSubSubCategory(main.id, sub.id)}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-300 bg-violet-50 px-2 py-1.5 text-[11px] font-medium text-violet-900 hover:bg-violet-100"
                                    >
                                      <Plus className="size-3" />
                                      เพิ่ม
                                    </button>
                                  </div>

                                  {sub.subSubcategories.length > 0 ? (
                                    <ul className="select-none space-y-1">
                                      {sub.subSubcategories.map((ss, ssi) => {
                                        const subSubProductCount = countProductsForSubSub(
                                          main.name,
                                          sub.name,
                                          ss.name,
                                          products,
                                        )
                                        return (
                                        <li
                                          key={ss.id}
                                          data-category-drop={`t|${main.id}|${sub.id}|${ssi}`}
                                          className={clsx(
                                            'rounded-md border border-slate-100 bg-white',
                                            isPendingSubSub(main.id, sub.id, ss.id) && 'border-rose-200 bg-rose-50/80',
                                            categoryDragHighlight?.from === `t|${main.id}|${sub.id}|${ssi}` &&
                                              'opacity-[0.68]',
                                            categoryDragHighlight?.over === `t|${main.id}|${sub.id}|${ssi}` &&
                                              categoryDragHighlight.from !== categoryDragHighlight.over &&
                                              'bg-pink-100/90 ring-1 ring-pink-300/80',
                                          )}
                                        >
                                          <div className={clsx(gridClass, 'px-2 py-1.5')}>
                                            <div className="min-w-0">
                                              <div className="flex min-w-0 items-center gap-1.5">
                                                {!isPendingSubSub(main.id, sub.id, ss.id) ? (
                                                  <CategoryReorderGrip
                                                    label={`ลากสลับตำแหน่งหมวดย่อย 2 ${ss.name}`}
                                                    payload={`t|${main.id}|${sub.id}|${ssi}`}
                                                    onReorderPair={applySubSubReorder}
                                                    onDragHighlight={setCategoryDragHighlight}
                                                  />
                                                ) : null}

                                                <span className="min-w-0 text-[11px] text-slate-700">
                                                  <span className="mr-1 tabular-nums text-slate-400">
                                                    {actualMainIndex + 1}.{si + 1}.{ssi + 1}
                                                  </span>
                                                  <span className="font-medium">{ss.name}</span>
                                                </span>
                                              </div>
                                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6 text-[9px] text-slate-500">
                                                {ss.paperFields && ss.paperFields.length > 0 ? (
                                                  <span className="truncate" title={ss.paperFields.map((f) => f.label).join(' · ')}>
                                                    มิติ: {ss.paperFields.map((f) => f.label).join(' · ')}
                                                  </span>
                                                ) : null}
                                                {ss.showProductBrand ? (
                                                  <span className="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-1 py-px text-[8px] font-medium text-indigo-800">
                                                    แสดงแบรนด์
                                                  </span>
                                                ) : null}
                                                {ss.boltHeadGroupBySize ? <BoltHeadGroupBadge /> : null}
                                              </div>
                                              <div className="mt-1 sm:hidden">
                                                <StatusSelect
                                                  value={ss.status}
                                                  onChange={(v) => setSubSubStatus(main.id, sub.id, ss.id, v)}
                                                  disabled={isPendingSubSub(main.id, sub.id, ss.id)}
                                                  compact
                                                />
                                              </div>
                                            </div>

                                            <div className="hidden text-center text-xs tabular-nums text-slate-500 sm:block">
                                              {subSubProductCount}
                                            </div>
                                            <div className="hidden min-w-0 justify-self-center sm:flex sm:justify-center">
                                              <StatusSelect
                                                value={ss.status}
                                                onChange={(v) => setSubSubStatus(main.id, sub.id, ss.id, v)}
                                                disabled={isPendingSubSub(main.id, sub.id, ss.id)}
                                              />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-0.5">
                                              {!isPendingSubSub(main.id, sub.id, ss.id) ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    className={iconEditBtnClass}
                                                    title="แก้ไขหมวดย่อย 2"
                                                    aria-label="แก้ไขหมวดย่อย 2"
                                                    onClick={() =>
                                                      openEditCategoryDialog({
                                                        kind: 'subsub',
                                                        mainId: main.id,
                                                        subId: sub.id,
                                                        subSubId: ss.id,
                                                      })
                                                    }
                                                  >
                                                    <Pencil className="size-3.5" strokeWidth={2} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className={iconDeleteBtnClass}
                                                    title="ลบ"
                                                    aria-label="ลบหมวดย่อย 2"
                                                    onClick={() => requestDeleteSubSub(main.id, sub.id, ss.id)}
                                                  >
                                                    <Trash2 className="size-3.5" strokeWidth={2} />
                                                  </button>
                                                </>
                                              ) : (
                                                <>
                                                  <span className="text-[10px] text-rose-700">ลบ?</span>
                                                  <button
                                                    type="button"
                                                    onClick={confirmDelete}
                                                    className="rounded bg-rose-600 px-1 py-0.5 text-[10px] text-white"
                                                  >
                                                    ยืนยัน
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={cancelPendingDelete}
                                                    className="rounded border border-slate-200 px-1 py-0.5 text-[10px] text-slate-600"
                                                  >
                                                    ยกเลิก
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </li>
                                        )
                                      })}
                                    </ul>
                                  ) : (
                                    <p className="py-1 text-center text-[10px] text-slate-400">ยังไม่มีย่อย 2</p>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-[10px] text-slate-400">
        บันทึกในเครื่องนี้ (โครงสร้าง + มิติ/แสดงแบรนด์/โหมดคู่หัวตามไซส์ + ฟิลเตอร์ฟอร์มเพิ่มสินค้า ต่อหมวดหลัก · ย่อย 1 · ย่อย 2)
      </p>

      {editTarget ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-title"
          onClick={closeEditCategoryDialog}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 id="edit-category-title" className="text-sm font-semibold text-slate-900">
                {editTarget.kind === 'main'
                  ? 'แก้ไขหมวดหลัก'
                  : editTarget.kind === 'sub'
                    ? 'แก้ไขหมวดย่อย 1'
                    : 'แก้ไขหมวดย่อย 2'}
              </h4>
              <button
                type="button"
                onClick={closeEditCategoryDialog}
                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mb-2 block">
              <span className="mb-0.5 block text-[10px] font-medium text-slate-600">ชื่อ</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </label>
            <label className="mb-1.5 flex cursor-pointer items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
              <input
                type="checkbox"
                checked={editProductFormFields.showPhysicalDimensions}
                onChange={(e) =>
                  setEditProductFormFields((p) => ({ ...p, showPhysicalDimensions: e.target.checked }))
                }
                className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
              />
              <span className="min-w-0">
                <span className="font-medium text-slate-800">มิติอ้างอิง</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">
                  เปิดใช้งานหน่วยวัดต่างๆ
                </span>
              </span>
            </label>
            {editProductFormFields.showPhysicalDimensions ? (
              <>
                <p className="mb-0.5 text-[10px] font-medium text-slate-600">กำหนดชื่อมิติ</p>
                <p className="mb-1.5 text-[10px] leading-snug text-slate-500">
                  ไม่ใส่ = ป้ายเริ่มต้น 4 ช่อง (แคตตาล็อก) · 2 ชื่อ = ฟอร์มสินค้ามี 2 ช่องวัด (คู่ B/C) · 3 ชื่อ = A·B·C · 4 ชื่อ = A·B·C·A₂ ตามลำดับในรายการ
                </p>
                {editPaperFields.length === 0 ? (
                  <p className="mb-1 text-[10px] text-slate-400">ยังไม่ระบุ — กดเพิ่มมิติได้ด้านล่าง</p>
                ) : null}
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {editPaperFields.map((f) => (
                    <li key={f.id} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) =>
                          updatePaperFieldLabel(editPaperFields, f.id, e.target.value, setEditPaperFields)
                        }
                        placeholder="เช่น กว้าง"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removePaperFieldRow(setEditPaperFields, editPaperFields, f.id)}
                        className="shrink-0 rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                        title="ลบมิติ"
                        aria-label="ลบมิติ"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={editPaperFields.length >= 8}
                  onClick={() => addPaperFieldRow(setEditPaperFields, editPaperFields)}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus className="size-3" />
                  เพิ่มมิติ
                </button>
              </>
            ) : null}
            <label className="mt-2 flex cursor-pointer items-start gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={editShowBrand}
                onChange={(e) => setEditShowBrand(e.target.checked)}
                className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>แสดงแบรนด์สินค้าในช่องนี้</span>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={editBoltHeadGroup}
                onChange={(e) => setEditBoltHeadGroup(e.target.checked)}
                className="mt-0.5 size-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="min-w-0">
                <span className="font-medium text-slate-800">จัดกลุ่มตัวผู้ตามไซส์ (หัวน็อตร่วมกัน)</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">
                  เปิดเมื่อหมวดนี้เป็นตัวผู้หลายความยาวที่ใช้หัวตัวเมียตามเบอร์เดียวกัน — ใช้ร่วมกับการตั้งคู่น็อตในแฟ้มสินค้าและปุ่ม +หัว ที่ POS
                </span>
              </span>
            </label>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="mb-1 text-[10px] font-semibold text-slate-800">ฟิลเตอร์ฟอร์ม «เพิ่มสินค้า» (แฟ้มข้อมูล)</p>
              <p className="mb-2 text-[10px] leading-snug text-slate-500">
                ไม่ติ๊ก = ซ่อนฟิลด์นั้นในหน้าเพิ่ม/แก้ไขสินค้า — ลดความรก · สืบทอดจาก ย่อย 2 → ย่อย 1 → หลัก (ถ้าระดับล่างไม่กำหนด) · ตัวเลือกแบ่งขายแสดงเสมอ
                — แท็กสินค้าตั้งด้านล่างนี้
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={editProductFormFields.showOemTags}
                    onChange={(e) =>
                      setEditProductFormFields((p) => ({ ...p, showOemTags: e.target.checked }))
                    }
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span>เบอร์ OEM</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={editProductFormFields.showCrossRef}
                    onChange={(e) =>
                      setEditProductFormFields((p) => ({ ...p, showCrossRef: e.target.checked }))
                    }
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span>เบอร์เทียบ (Cross ref.)</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={editProductFormFields.showFactoryNo}
                    onChange={(e) =>
                      setEditProductFormFields((p) => ({ ...p, showFactoryNo: e.target.checked }))
                    }
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span>เบอร์โรงงาน</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={editProductFormFields.showVehicleFitment}
                    onChange={(e) =>
                      setEditProductFormFields((p) => ({ ...p, showVehicleFitment: e.target.checked }))
                    }
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span>ผูกรถ / รุ่น / เครื่อง-ปี</span>
                </label>
              </div>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="mb-1 text-[10px] font-medium text-slate-600">แท็กที่เลือกได้ในสินค้า (แฟ้มข้อมูล)</p>
              <label className="mb-1.5 flex cursor-pointer items-start gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  checked={editTagsInMasterForm}
                  onChange={(e) => {
                    const v = e.target.checked
                    setEditTagsInMasterForm(v)
                    if (!v) {
                      setEditRestrictTags(false)
                      setEditAllowedTagIds([])
                    }
                  }}
                  className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <span className="font-medium text-slate-800">เปิดใช้ TAG ในแฟ้มข้อมูล</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">
                    ไม่ติ๊ก = ไม่ใช้ TAG สินค้า
                  </span>
                </span>
              </label>
              {editTagsInMasterForm ? (
                <>
                  <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={editRestrictTags}
                      onChange={(e) => {
                        const v = e.target.checked
                        setEditRestrictTags(v)
                        if (!v) setEditAllowedTagIds([])
                      }}
                      className="size-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span>จำกัด TAG ที่เลือก (ไม่ติ๊ก = ใช้ได้ทุก TAG)</span>
                  </label>
                  {editRestrictTags ? (
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-slate-100 bg-slate-50/80 p-1.5">
                      {tagRegistryList.map((t) => {
                        const on = editAllowedTagIds.includes(t.id)
                        return (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[11px] text-slate-800 hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={(e) => {
                                setEditAllowedTagIds((prev) =>
                                  e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                                )
                              }}
                              className="size-3 rounded border-slate-300 text-violet-600"
                            />
                            <span className="min-w-0 flex-1">{t.label}</span>
                            {t.group ? (
                              <span className="shrink-0 text-[9px] text-slate-400">{t.group}</span>
                            ) : null}
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-slate-500">
                  ไม่มีบล็อก TAG ในฟอร์มเพิ่มสินค้า
                </p>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditCategoryDialog}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveEditCategoryDialog}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
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
