import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { BarChart2, Building2, History, Truck } from 'lucide-react'
import { PurchaseCartWorkspacePage } from '@/features/purchase/PurchaseCartWorkspacePage'
import { PurchaseOrdersWorkspacePage } from '@/features/purchase/PurchaseOrdersWorkspacePage'
import { PoHistoryReceiveWorkspacePage } from '@/features/purchase/PoHistoryReceiveWorkspacePage'
import { SuppliersWorkspacePage } from '@/features/purchase/SuppliersWorkspacePage'
import { PurchaseCatalogPage } from '@/features/purchase/PurchaseCatalogPage'
import { PurchaseDashboardPage } from '@/features/purchase/PurchaseDashboardPage'
import { CustomerOrderWorkspacePage } from '@/features/purchase/CustomerOrderWorkspacePage'
import { CATALOG_CART_CHANGED, loadCatalogCart } from '@/features/purchase/data/catalogCartStore'
import { loadPurchaseOrders, PURCHASE_ORDERS_CHANGED_EVENT } from '@/features/purchase/data/poStore'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'

type BuyWorkspacePageProps = { className?: string }
type BuyPanel = 'catalog' | 'purchase-cart' | 'purchase-orders' | 'receive-history' | 'suppliers' | 'dashboard' | 'customer-order'

const isPaid = (o: PurchaseOrder) =>
  (o.paymentMode === 'paid_cash' || o.paymentMode === 'paid_transfer' || o.paymentMode === 'payable') && !!o.paidAt

export function BuyWorkspacePage({ className }: BuyWorkspacePageProps) {
  const [activePanel, setActivePanel] = useState<BuyPanel>('catalog')
  const [cartCount, setCartCount] = useState(() => loadCatalogCart().length)
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())

  const refreshOrders = useCallback(() => setOrders(loadPurchaseOrders()), [])

  useEffect(() => {
    const h = () => setCartCount(loadCatalogCart().length)
    window.addEventListener(CATALOG_CART_CHANGED, h)
    return () => window.removeEventListener(CATALOG_CART_CHANGED, h)
  }, [])

  useEffect(() => {
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refreshOrders)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refreshOrders)
  }, [refreshOrders])

  const draftCount    = orders.filter((o) => o.status === 'draft').length
  const orderedCount  = orders.filter((o) => o.status === 'ordered' && !isPaid(o)).length
  const paidCount     = orders.filter((o) => isPaid(o) && o.receiveBatches.length === 0).length
  const receivedCount = orders.filter((o) => o.receiveBatches.length > 0 && o.status !== 'closed').length
  const activePOCount = draftCount + orderedCount + paidCount + receivedCount

  const flowSteps: Array<{
    panel: BuyPanel
    label: string
    sub: string
    badge: number
    dot: string; ring: string; activeBg: string; activeText: string; badgeCls: string
  }> = [
    {
      panel: 'catalog',
      label: 'เลือกสินค้า',
      sub: 'ค้นหาและเพิ่มลงตะกร้า',
      badge: 0,
      dot: 'bg-emerald-500', ring: 'border-emerald-400', activeBg: 'bg-emerald-50', activeText: 'text-emerald-800', badgeCls: 'bg-emerald-600',
    },
    {
      panel: 'purchase-cart',
      label: 'ตะกร้า',
      sub: 'ยืนยันและสร้างใบสั่งซื้อ',
      badge: cartCount,
      dot: 'bg-amber-500', ring: 'border-amber-400', activeBg: 'bg-amber-50', activeText: 'text-amber-800', badgeCls: 'bg-amber-500',
    },
    {
      panel: 'purchase-orders',
      label: 'ใบสั่งซื้อ (PO)',
      sub: 'ติดตาม · ชำระ · รับของ',
      badge: activePOCount,
      dot: 'bg-blue-500', ring: 'border-blue-400', activeBg: 'bg-blue-50', activeText: 'text-blue-800', badgeCls: 'bg-blue-500',
    },
    {
      panel: 'receive-history',
      label: 'ประวัติรับของ',
      sub: 'บันทึกการรับทั้งหมด',
      badge: 0,
      dot: 'bg-sky-500', ring: 'border-sky-400', activeBg: 'bg-sky-50', activeText: 'text-sky-800', badgeCls: 'bg-sky-500',
    },
  ]

  return (
    <div className={clsx('flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm', className)}>
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-3">

        {/* ── Purchasing pipeline ── */}
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          ขั้นตอนการสั่งซื้อ
        </p>
        <div className="flex flex-col">
          {flowSteps.map((step, i) => {
            const active = activePanel === step.panel
            const hasItems = step.badge > 0
            return (
              <div key={step.panel}>
                <button
                  type="button"
                  onClick={() => setActivePanel(step.panel)}
                  className={clsx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors',
                    active ? step.activeBg : 'hover:bg-slate-100',
                  )}
                >
                  {/* Circle node */}
                  <div className={clsx(
                    'size-3 shrink-0 rounded-full border-2 transition-all',
                    active
                      ? `${step.dot} border-transparent`
                      : hasItems ? `${step.ring} bg-white` : 'border-slate-300 bg-white',
                  )} />
                  {/* Label + sub */}
                  <div className="min-w-0 flex-1">
                    <p className={clsx(
                      'truncate text-[11px] font-bold leading-tight',
                      active ? step.activeText : hasItems ? 'text-slate-700' : 'text-slate-500',
                    )}>{step.label}</p>
                    <p className={clsx(
                      'truncate text-[9px] leading-tight',
                      active ? 'opacity-70 ' + step.activeText : 'text-slate-400',
                    )}>{step.sub}</p>
                  </div>
                  {/* Badge */}
                  {step.badge > 0 && (
                    <span className={clsx(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white',
                      active ? step.badgeCls : 'bg-slate-400',
                    )}>{step.badge}</span>
                  )}
                </button>
                {/* Connector line */}
                {i < flowSteps.length - 1 && (
                  <div className="ml-[13px] h-2.5 w-0.5 bg-slate-200" />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Utilities ── */}
        <div className="mt-4 space-y-0.5 border-t border-slate-200 pt-3">
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">อื่นๆ</p>
          {([
            { panel: 'suppliers'      as BuyPanel, label: 'ผู้จัดจำหน่าย',  Icon: Building2 },
            { panel: 'dashboard'      as BuyPanel, label: 'ภาพรวมการซื้อ',   Icon: BarChart2  },
            { panel: 'customer-order' as BuyPanel, label: 'สั่งให้ลูกค้า',   Icon: Truck      },
          ]).map(({ panel, label, Icon }) => (
            <button
              key={panel}
              type="button"
              onClick={() => setActivePanel(panel)}
              className={clsx(
                'inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors',
                activePanel === panel ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Panel content ── */}
      <div className="min-w-0 flex-1">
        {activePanel === 'dashboard' ? (
          <PurchaseDashboardPage
            className="h-full"
            onGoToCart={() => setActivePanel('purchase-cart')}
            onGoToCatalog={() => setActivePanel('catalog')}
            onGoToReceive={() => setActivePanel('receive-history')}
            onGoToPurchaseOrders={() => setActivePanel('purchase-orders')}
          />
        ) : activePanel === 'catalog' ? (
          <PurchaseCatalogPage
            className="h-full"
            onGoToPurchaseCart={() => setActivePanel('purchase-cart')}
            onGoToPurchaseOrders={() => setActivePanel('purchase-orders')}
          />
        ) : activePanel === 'purchase-cart' ? (
          <PurchaseCartWorkspacePage
            className="h-full rounded-none border-0 shadow-none"
            onGoToCatalog={() => setActivePanel('catalog')}
            onGoToPurchaseOrders={() => setActivePanel('purchase-orders')}
          />
        ) : activePanel === 'purchase-orders' ? (
          <PurchaseOrdersWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        ) : activePanel === 'suppliers' ? (
          <SuppliersWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        ) : activePanel === 'customer-order' ? (
          <CustomerOrderWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        ) : (
          <PoHistoryReceiveWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        )}
      </div>
    </div>
  )
}
