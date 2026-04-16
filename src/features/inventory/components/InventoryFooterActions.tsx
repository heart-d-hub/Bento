const actions = [
  { id: 'count', label: 'สร้างรายการตรวจนับสต็อก' },
  { id: 'transfer', label: 'โอนย้ายสินค้าระหว่างสาขา' },
  { id: 'bestsell', label: 'ดูสินค้าขายดี' },
] as const

export function InventoryFooterActions() {
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          onClick={() => window.alert('ฟีเจอร์นี้จะเชื่อมในขั้นถัดไป')}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
