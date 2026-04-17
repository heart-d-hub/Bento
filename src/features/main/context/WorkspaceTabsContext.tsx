/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

export type WorkspaceTab = {
  id: string
  label: string
}

export type BranchStockPanel =
  | 'stock'
  | 'split-sale'
  | 'product-file'
  | 'categories'
  | 'product-tags'

/** มุมมองย่อยในคลังกลาง (รวมโอนข้ามสาขา) */
export type CentralWarehousePanel = 'hub-stock' | 'transfer'

/** มุมมองย่อยในลูกหนี้/เจ้าหนี้ */
export type ReceivablesPayablesPanel = 'ar' | 'ap'

/** มุมมองย่อยในหน้ารถ (ค้นหา / จัดการแคตตาล็อก) */
export type VehicleWorkspacePanel = 'search' | 'manage'

/** แถบบนของหน้าพิมพ์ป้าย / ใบเสร็จ / ฟอร์มใบกำกับ */
export type LabelPrintTopSection = 'barcode' | 'receipt' | 'tax-invoice'

type State = {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  /** แท็บย่อยภายในหน้าคลังสินค้า — แสดงในแถบนำทางด้านบน */
  branchStockPanel: BranchStockPanel
  /** มุมมองย่อยในคลังกลาง */
  centralWarehousePanel: CentralWarehousePanel
  receivablesPayablesPanel: ReceivablesPayablesPanel
  vehicleWorkspacePanel: VehicleWorkspacePanel
  labelPrintTopSection: LabelPrintTopSection
}

type Action =
  | {
      type: 'OPEN'
      id: string
      label: string
      vehicleWorkspacePanel?: VehicleWorkspacePanel
      labelPrintTopSection?: LabelPrintTopSection
    }
  | { type: 'CLOSE'; id: string }
  | { type: 'SET_ACTIVE'; id: string | null }
  /** กลับแดชบอร์ด แต่ยังคงแท็บไว้ในแถบ (ปุ่ม HOME) */
  | { type: 'HOME' }
  /** ล้างแท็บทั้งหมด (เรียกจากโค้ด — ไม่ใช่ปุ่มย้อนกลับ) */
  | { type: 'CLEAR_TABS' }
  | { type: 'SET_BRANCH_STOCK_PANEL'; panel: BranchStockPanel }
  | { type: 'SET_CENTRAL_WAREHOUSE_PANEL'; panel: CentralWarehousePanel }
  | { type: 'SET_RECEIVABLES_PAYABLES_PANEL'; panel: ReceivablesPayablesPanel }
  | { type: 'SET_VEHICLE_WORKSPACE_PANEL'; panel: VehicleWorkspacePanel }
  | { type: 'SET_LABEL_PRINT_TOP_SECTION'; section: LabelPrintTopSection }
  /** ปิดแท็บจากปุ่มย้อนกลับที่ราก — กลับแดชบอร์ด ไม่สลับไปแท็บอื่นในแถบ */
  | { type: 'CLOSE_TAB_TO_HOME'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN': {
      const exists = state.tabs.some((t) => t.id === action.id)
      let nextVehicle = state.vehicleWorkspacePanel
      if (action.id === 'car-model' && action.vehicleWorkspacePanel) {
        nextVehicle = action.vehicleWorkspacePanel
      }
      let nextLabelPrint = state.labelPrintTopSection
      if (action.id === 'label-print') {
        nextLabelPrint = action.labelPrintTopSection ?? 'barcode'
      }
      return {
        ...state,
        tabs: exists
          ? state.tabs
          : [...state.tabs, { id: action.id, label: action.label }],
        activeTabId: action.id,
        vehicleWorkspacePanel: nextVehicle,
        labelPrintTopSection: nextLabelPrint,
      }
    }
    case 'CLOSE': {
      const nextTabs = state.tabs.filter((t) => t.id !== action.id)
      let nextActive = state.activeTabId
      if (state.activeTabId === action.id) {
        nextActive = nextTabs.length ? nextTabs[nextTabs.length - 1].id : null
      }
      return { ...state, tabs: nextTabs, activeTabId: nextActive }
    }
    case 'SET_ACTIVE':
      return { ...state, activeTabId: action.id }
    case 'HOME':
      return { ...state, activeTabId: null }
    case 'CLEAR_TABS':
      return {
        tabs: [],
        activeTabId: null,
        branchStockPanel: 'stock',
        centralWarehousePanel: 'hub-stock',
        receivablesPayablesPanel: 'ar',
        vehicleWorkspacePanel: 'search',
        labelPrintTopSection: 'barcode',
      }
    case 'SET_BRANCH_STOCK_PANEL':
      return { ...state, branchStockPanel: action.panel }
    case 'SET_CENTRAL_WAREHOUSE_PANEL':
      return { ...state, centralWarehousePanel: action.panel }
    case 'SET_RECEIVABLES_PAYABLES_PANEL':
      return { ...state, receivablesPayablesPanel: action.panel }
    case 'SET_VEHICLE_WORKSPACE_PANEL':
      return { ...state, vehicleWorkspacePanel: action.panel }
    case 'SET_LABEL_PRINT_TOP_SECTION':
      return { ...state, labelPrintTopSection: action.section }
    case 'CLOSE_TAB_TO_HOME': {
      const nextTabs = state.tabs.filter((t) => t.id !== action.id)
      return {
        ...state,
        tabs: nextTabs,
        activeTabId: null,
      }
    }
    default:
      return state
  }
}

const initialState: State = {
  tabs: [],
  activeTabId: null,
  branchStockPanel: 'stock',
  centralWarehousePanel: 'hub-stock',
  receivablesPayablesPanel: 'ar',
  vehicleWorkspacePanel: 'search',
  labelPrintTopSection: 'barcode',
}

type WorkspaceTabsContextValue = {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  branchStockPanel: BranchStockPanel
  setBranchStockPanel: (panel: BranchStockPanel) => void
  centralWarehousePanel: CentralWarehousePanel
  setCentralWarehousePanel: (panel: CentralWarehousePanel) => void
  receivablesPayablesPanel: ReceivablesPayablesPanel
  setReceivablesPayablesPanel: (panel: ReceivablesPayablesPanel) => void
  vehicleWorkspacePanel: VehicleWorkspacePanel
  setVehicleWorkspacePanel: (panel: VehicleWorkspacePanel) => void
  labelPrintTopSection: LabelPrintTopSection
  setLabelPrintTopSection: (section: LabelPrintTopSection) => void
  openTab: (
    id: string,
    label: string,
    options?: { vehicleWorkspacePanel?: VehicleWorkspacePanel; labelPrintTopSection?: LabelPrintTopSection },
  ) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string | null) => void
  /** แสดงแดชบอร์ด แต่เก็บแท็บในแถบไว้ */
  goHome: () => void
  /** ถอยมุมมองย่อย → ที่รากแล้วปิดแท็บนี้และกลับแดชบอร์ด (แท็บอื่นยังอยู่ในแถบ ไม่โฟกัสไปแท็บเก่า) */
  goBack: () => void
  /** แสดงแดชบอร์ดและล้างแท็บทั้งหมด */
  clearAllTabs: () => void
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null)

export function WorkspaceTabsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const openTab = useCallback(
    (
      id: string,
      label: string,
      options?: { vehicleWorkspacePanel?: VehicleWorkspacePanel; labelPrintTopSection?: LabelPrintTopSection },
    ) => {
      dispatch({
        type: 'OPEN',
        id,
        label,
        vehicleWorkspacePanel: options?.vehicleWorkspacePanel,
        labelPrintTopSection: options?.labelPrintTopSection,
      })
    },
    [],
  )

  const closeTab = useCallback((id: string) => {
    dispatch({ type: 'CLOSE', id })
  }, [])

  const setActiveTab = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', id })
  }, [])

  const goHome = useCallback(() => {
    dispatch({ type: 'HOME' })
  }, [])

  const clearAllTabs = useCallback(() => {
    dispatch({ type: 'CLEAR_TABS' })
  }, [])

  const setBranchStockPanel = useCallback((panel: BranchStockPanel) => {
    dispatch({ type: 'SET_BRANCH_STOCK_PANEL', panel })
  }, [])

  const setCentralWarehousePanel = useCallback((panel: CentralWarehousePanel) => {
    dispatch({ type: 'SET_CENTRAL_WAREHOUSE_PANEL', panel })
  }, [])

  const setReceivablesPayablesPanel = useCallback((panel: ReceivablesPayablesPanel) => {
    dispatch({ type: 'SET_RECEIVABLES_PAYABLES_PANEL', panel })
  }, [])

  const setVehicleWorkspacePanel = useCallback((panel: VehicleWorkspacePanel) => {
    dispatch({ type: 'SET_VEHICLE_WORKSPACE_PANEL', panel })
  }, [])

  const setLabelPrintTopSection = useCallback((section: LabelPrintTopSection) => {
    dispatch({ type: 'SET_LABEL_PRINT_TOP_SECTION', section })
  }, [])

  const goBack = useCallback(() => {
    if (state.activeTabId === null) {
      return
    }
    if (state.activeTabId === 'branch-stock') {
      if (state.branchStockPanel === 'categories') {
        setBranchStockPanel('product-tags')
        return
      }
      if (state.branchStockPanel === 'product-tags') {
        setBranchStockPanel('product-file')
        return
      }
      if (state.branchStockPanel === 'product-file') {
        setBranchStockPanel('split-sale')
        return
      }
      if (state.branchStockPanel === 'split-sale') {
        setBranchStockPanel('stock')
        return
      }
    }
    if (state.activeTabId === 'central' && state.centralWarehousePanel !== 'hub-stock') {
      setCentralWarehousePanel('hub-stock')
      return
    }
    if (state.activeTabId === 'ar-ap' && state.receivablesPayablesPanel !== 'ar') {
      setReceivablesPayablesPanel('ar')
      return
    }
    if (state.activeTabId === 'car-model' && state.vehicleWorkspacePanel === 'manage') {
      setVehicleWorkspacePanel('search')
      return
    }
    // ปิดแท็บปัจจุบันแล้วกลับไปแท็บก่อนหน้า (ถ้ามี) — ถ้าไม่มีแท็บเหลือจะกลับแดชบอร์ดเอง
    dispatch({ type: 'CLOSE', id: state.activeTabId })
  }, [
    state.activeTabId,
    state.branchStockPanel,
    state.centralWarehousePanel,
    state.receivablesPayablesPanel,
    state.vehicleWorkspacePanel,
    setBranchStockPanel,
    setCentralWarehousePanel,
    setReceivablesPayablesPanel,
    setVehicleWorkspacePanel,
  ])

  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      branchStockPanel: state.branchStockPanel,
      setBranchStockPanel,
      centralWarehousePanel: state.centralWarehousePanel,
      setCentralWarehousePanel,
      receivablesPayablesPanel: state.receivablesPayablesPanel,
      setReceivablesPayablesPanel,
      vehicleWorkspacePanel: state.vehicleWorkspacePanel,
      setVehicleWorkspacePanel,
      labelPrintTopSection: state.labelPrintTopSection,
      setLabelPrintTopSection,
      openTab,
      closeTab,
      setActiveTab,
      goHome,
      goBack,
      clearAllTabs,
    }),
    [
      state.tabs,
      state.activeTabId,
      state.branchStockPanel,
      setBranchStockPanel,
      state.centralWarehousePanel,
      setCentralWarehousePanel,
      state.receivablesPayablesPanel,
      setReceivablesPayablesPanel,
      state.vehicleWorkspacePanel,
      setVehicleWorkspacePanel,
      state.labelPrintTopSection,
      setLabelPrintTopSection,
      openTab,
      closeTab,
      setActiveTab,
      goHome,
      goBack,
      clearAllTabs,
    ],
  )

  return <WorkspaceTabsContext.Provider value={value}>{children}</WorkspaceTabsContext.Provider>
}

export function useWorkspaceTabs() {
  const ctx = useContext(WorkspaceTabsContext)
  if (!ctx) {
    throw new Error('useWorkspaceTabs must be used within WorkspaceTabsProvider')
  }
  return ctx
}
