import { useState } from 'react'
import { ClipboardList, Send, TrendingUp } from 'lucide-react'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'
import { TopSellersModal } from '@/features/inventory/components/TopSellersModal'

export function InventoryFooterActions() {
  const { setActiveTab, setCentralWarehousePanel } = useWorkspaceTabs()
  const [showTopSellers, setShowTopSellers] = useState(false)

  const handleStockCount = () => {
    window.alert(
      'ระบบตรวจนับสต็อกอยู่ระหว่างพัฒนา\n\nระหว่างนี้ใช้ "ปรับสต็อก" รายแถวในตารางคลังได้ — กดปุ่มในคอลัมน์ "การดำเนินการ"',
    )
  }

  const handleTransfer = () => {
    setActiveTab('central')
    setCentralWarehousePanel('transfer')
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleStockCount}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ClipboardList className="size-4 text-slate-500" aria-hidden />
          สร้างรายการตรวจนับสต็อก
        </button>
        <button
          type="button"
          onClick={handleTransfer}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <Send className="size-4 text-blue-600" aria-hidden />
          โอนย้ายสินค้าระหว่างสาขา
        </button>
        <button
          type="button"
          onClick={() => setShowTopSellers(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        >
          <TrendingUp className="size-4 text-emerald-600" aria-hidden />
          ดูสินค้าขายดี
        </button>
      </div>
      <TopSellersModal open={showTopSellers} onClose={() => setShowTopSellers(false)} />
    </>
  )
}
