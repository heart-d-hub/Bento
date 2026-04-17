import { useState } from 'react'
import { clsx } from 'clsx'
import { Building2, History, ShoppingCart, TriangleAlert } from 'lucide-react'
import { LowStockWorkspacePage } from '@/features/purchase/LowStockWorkspacePage'
import { PurchaseCartWorkspacePage } from '@/features/purchase/PurchaseCartWorkspacePage'
import { PoHistoryReceiveWorkspacePage } from '@/features/purchase/PoHistoryReceiveWorkspacePage'
import { SuppliersWorkspacePage } from '@/features/purchase/SuppliersWorkspacePage'

type BuyWorkspacePageProps = {
  className?: string
}

type BuyPanel = 'low-stock' | 'purchase-cart' | 'receive-history' | 'suppliers'

export function BuyWorkspacePage({ className }: BuyWorkspacePageProps) {
  const [activePanel, setActivePanel] = useState<BuyPanel>('purchase-cart')

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm',
        className,
      )}
    >
      <aside className="flex w-48 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-2">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">ซื้อ</p>
        <button
          type="button"
          onClick={() => setActivePanel('low-stock')}
          className={clsx(
            'mt-1 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors',
            activePanel === 'low-stock'
              ? 'bg-amber-100 text-amber-900'
              : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <TriangleAlert className="size-4" aria-hidden />
          สินค้าใกล้หมด
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('purchase-cart')}
          className={clsx(
            'mt-1 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors',
            activePanel === 'purchase-cart'
              ? 'bg-amber-100 text-amber-900'
              : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <ShoppingCart className="size-4" aria-hidden />
          ตะกร้าสั่งซื้อ
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('receive-history')}
          className={clsx(
            'mt-1 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors',
            activePanel === 'receive-history'
              ? 'bg-amber-100 text-amber-900'
              : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <History className="size-4" aria-hidden />
          ประวัติ&รับของเข้า
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('suppliers')}
          className={clsx(
            'mt-1 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors',
            activePanel === 'suppliers' ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <Building2 className="size-4" aria-hidden />
          ผู้จัดจำหน่าย
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        {activePanel === 'purchase-cart' ? (
          <PurchaseCartWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        ) : activePanel === 'suppliers' ? (
          <SuppliersWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        ) : activePanel === 'low-stock' ? (
          <LowStockWorkspacePage
            className="h-full rounded-none border-0 shadow-none"
            onOpenPurchaseCart={() => setActivePanel('purchase-cart')}
          />
        ) : (
          <PoHistoryReceiveWorkspacePage className="h-full rounded-none border-0 shadow-none" />
        )}
      </div>
    </div>
  )
}
