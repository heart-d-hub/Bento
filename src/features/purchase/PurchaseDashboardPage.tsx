import { loadPurchaseOrders, PURCHASE_ORDERS_CHANGED_EVENT } from '@/features/purchase/data/poStore'
import { loadSupplierDirectory, SUPPLIER_DIRECTORY_CHANGED_EVENT } from '@/features/purchase/data/supplierDirectoryStore'
import {
  loadCatalogCart,
  addToCatalogCart,
  CATALOG_CART_CHANGED,
  type CatalogCartItem,
} from '@/features/purchase/data/catalogCartStore'
import type { PurchaseOrder } from '@/features/purchase/data/poTypes'
import { clsx } from 'clsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  AlertCircle, AlertTriangle, Building2, ClipboardList, PackageCheck,
  Plus, ShoppingCart, TrendingUp, FileEdit,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type PurchaseDashboardPageProps = {
  className?: string
  onGoToCart?: () => void
  onGoToCatalog?: () => void
  onGoToReceive?: () => void
  onGoToPurchaseOrders?: () => void
}

function poAmount(po: PurchaseOrder): number {
  let received = 0
  for (const b of po.receiveBatches) {
    for (const l of b.lines) received += l.qty * l.unitCost
  }
  return received > 0
    ? Math.round(received * 100) / 100
    : Math.round(po.lines.reduce((s, l) => s + l.orderedQty * l.unitCostOrder, 0) * 100) / 100
}

function monthKey(iso: string): string { return iso.slice(0, 7) }

function thMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  const names = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const idx = Number(m) - 1
  return `${names[idx] ?? m}${y ? ` '${String(y).slice(2)}` : ''}`
}

const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 })
const fmt2 = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function StatCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; onClick?: () => void
}) {
  return (
    <div
      className={clsx('flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      onClick={onClick}
    >
      <div className={clsx('flex size-9 shrink-0 items-center justify-center rounded-lg', color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black text-slate-900 tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

export function PurchaseDashboardPage({ className, onGoToCart, onGoToCatalog, onGoToReceive, onGoToPurchaseOrders }: PurchaseDashboardPageProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => loadPurchaseOrders())
  const [suppliers, setSuppliers] = useState(() => loadSupplierDirectory())
  const [cartItems, setCartItems] = useState<CatalogCartItem[]>(() => loadCatalogCart())

  useEffect(() => {
    const refresh = () => setOrders(loadPurchaseOrders())
    window.addEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PURCHASE_ORDERS_CHANGED_EVENT, refresh)
  }, [])

  useEffect(() => {
    const refresh = () => setSuppliers(loadSupplierDirectory())
    window.addEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(SUPPLIER_DIRECTORY_CHANGED_EVENT, refresh)
  }, [])

  useEffect(() => {
    const refresh = () => setCartItems(loadCatalogCart())
    window.addEventListener(CATALOG_CART_CHANGED, refresh)
    return () => window.removeEventListener(CATALOG_CART_CHANGED, refresh)
  }, [])

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers])
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const confirmedOrders = useMemo(
    () => orders.filter((o) => o.status !== 'draft'),
    [orders],
  )

  const thisMonthSpend = useMemo(() => {
    return confirmedOrders
      .filter((o) => monthKey(o.orderedAt ?? o.createdAt) === thisMonth)
      .reduce((s, o) => s + poAmount(o), 0)
  }, [confirmedOrders, thisMonth])

  const openPoCount = useMemo(() => orders.filter((o) => o.status === 'ordered').length, [orders])
  const draftPoCount = useMemo(() => orders.filter((o) => o.status === 'draft').length, [orders])

  const pendingReceiveCount = useMemo(
    () => orders.filter((o) => o.status === 'ordered' && o.lines.some((l) => l.receivedQtyTotal < l.orderedQty)).length,
    [orders],
  )

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return orders.filter(
      (o) => o.status === 'ordered' && o.expectedDeliveryAt && o.expectedDeliveryAt < today &&
        o.lines.some((l) => l.receivedQtyTotal < l.orderedQty),
    ).length
  }, [orders])

  const monthlyData = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months.map((mk) => ({
      month: thMonthLabel(mk),
      spend: confirmedOrders
        .filter((o) => monthKey(o.orderedAt ?? o.createdAt) === mk)
        .reduce((s, o) => s + poAmount(o), 0),
    }))
  }, [confirmedOrders])

  const topSuppliers = useMemo(() => {
    const map = new Map<string, { name: string; spend: number; count: number }>()
    for (const o of confirmedOrders) {
      const key = o.supplierId || '__none__'
      const name = (supplierMap.get(key) ?? o.supplierName) || 'ไม่ระบุ'
      const cur = map.get(key) ?? { name, spend: 0, count: 0 }
      cur.spend += poAmount(o)
      cur.count += 1
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, 5)
  }, [confirmedOrders, supplierMap])

  const maxSupplierSpend = Math.max(...topSuppliers.map((s) => s.spend), 1)

  const topProducts = useMemo(() => {
    const map = new Map<string, { productId: string; name: string; sku: string; qty: number; spend: number }>()
    for (const o of confirmedOrders) {
      for (const l of o.lines) {
        const cur = map.get(l.productId) ?? { productId: l.productId, name: l.name, sku: l.sku, qty: 0, spend: 0 }
        cur.qty += l.orderedQty
        cur.spend += l.orderedQty * l.unitCostOrder
        map.set(l.productId, cur)
      }
    }
    return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, 8)
  }, [confirmedOrders])

  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.unitCost, 0)
  const cartInSet = useMemo(() => new Set(cartItems.map((i) => i.productId)), [cartItems])

  const quickAddToCart = (p: typeof topProducts[number]) => {
    const avgCost = p.qty > 0 ? p.spend / p.qty : 0
    addToCatalogCart({ productId: p.productId, sku: p.sku, name: p.name, qty: 1, unitCost: avgCost })
  }

  const COLORS = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7']

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-100 p-4', className)}>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<TrendingUp className="size-4 text-amber-700" />}
          label="ยอดซื้อเดือนนี้"
          value={`฿${fmt(thisMonthSpend)}`}
          color="bg-amber-100"
        />
        <StatCard
          icon={<FileEdit className="size-4 text-slate-600" />}
          label="Draft PO"
          value={String(draftPoCount)}
          sub="รอยืนยันสั่งซื้อ"
          color="bg-slate-100"
          onClick={draftPoCount > 0 ? onGoToPurchaseOrders : undefined}
        />
        <StatCard
          icon={<ClipboardList className="size-4 text-blue-700" />}
          label="PO ที่เปิดอยู่"
          value={String(openPoCount)}
          sub="สถานะ Ordered"
          color="bg-blue-100"
          onClick={openPoCount > 0 ? onGoToPurchaseOrders : undefined}
        />
        <StatCard
          icon={<AlertCircle className="size-4 text-rose-700" />}
          label="รอรับสินค้า"
          value={String(pendingReceiveCount)}
          sub={overdueCount > 0 ? `เกินกำหนด ${overdueCount} รายการ` : 'ค้างรับอย่างน้อย 1 แถว'}
          color={overdueCount > 0 ? 'bg-rose-200' : 'bg-rose-100'}
          onClick={pendingReceiveCount > 0 ? onGoToReceive : undefined}
        />
        <StatCard
          icon={<Building2 className="size-4 text-emerald-700" />}
          label="ซัพพลายเออร์"
          value={String(suppliers.length)}
          color="bg-emerald-100"
        />
        <StatCard
          icon={<ShoppingCart className="size-4 text-indigo-700" />}
          label="ตะกร้าซื้อ"
          value={cartItems.length > 0 ? `฿${fmt(cartTotal)}` : '—'}
          sub={cartItems.length > 0 ? `${cartItems.length} รายการ` : 'ตะกร้าว่าง'}
          color="bg-indigo-100"
          onClick={onGoToCart}
        />
      </div>

      {/* ── Overdue alert banner ── */}
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={onGoToReceive}
          className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"
        >
          <AlertTriangle className="size-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-800">มี {overdueCount} PO เกินกำหนดรับสินค้าแล้ว</p>
            <p className="text-xs text-rose-600">กดเพื่อไปรับสินค้า</p>
          </div>
        </button>
      )}

      <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Monthly trend chart */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            ยอดซื้อ 6 เดือนย้อนหลัง (บาท)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip
                formatter={(v: number) => [`฿${v.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, 'ยอดซื้อ']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {monthlyData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.month === thMonthLabel(thisMonth) ? '#f59e0b' : '#fcd34d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top suppliers */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            ซื้อสูงสุด (ตาม PO)
          </h2>
          {topSuppliers.length === 0 ? (
            <p className="text-xs text-slate-400">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2.5">
              {topSuppliers.map((s, i) => (
                <div key={i}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[11px] font-semibold text-slate-700">{s.name}</p>
                    <p className="shrink-0 text-[11px] font-bold tabular-nums text-amber-700">฿{fmt(s.spend)}</p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.spend / maxSupplierSpend) * 100}%`, backgroundColor: COLORS[i] ?? '#fef3c7' }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px] text-slate-400">{s.count} PO</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top products + quick add ── */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <PackageCheck className="size-4 text-amber-600" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            สินค้าที่สั่งซื้อสูงสุด (ตามมูลค่า PO)
          </h2>
          {onGoToCatalog && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              <Plus className="size-3" />สั่งซื้อสินค้า
            </button>
          )}
        </div>
        {topProducts.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">ยังไม่มีข้อมูล PO ที่ยืนยันแล้ว</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">SKU</th>
                <th className="px-2 py-2 text-left">ชื่อ</th>
                <th className="px-2 py-2 text-right">จำนวนสั่ง</th>
                <th className="px-2 py-2 text-right">ราคาเฉลี่ย</th>
                <th className="px-4 py-2 text-right">มูลค่า</th>
                <th className="px-3 py-2 text-center">ใส่ตะกร้า</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => {
                const inCart = cartInSet.has(p.productId)
                const avgCost = p.qty > 0 ? p.spend / p.qty : 0
                return (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-amber-50/30">
                    <td className="px-4 py-2 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-2 py-2 font-mono text-slate-600">{p.sku}</td>
                    <td className="max-w-0 px-2 py-2">
                      <p className="truncate font-medium text-slate-800">{p.name}</p>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-700">{p.qty.toLocaleString('th-TH')}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                      {avgCost > 0 ? `฿${fmt2(avgCost)}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-amber-700">
                      ฿{fmt(p.spend)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => quickAddToCart(p)}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition',
                          inCart
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700',
                        )}
                      >
                        <Plus className="size-3" />
                        {inCart ? 'เพิ่ม' : 'ใส่'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
