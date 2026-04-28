import {
  addBankAccount,
  addDeposit,
  closeShift,
  deleteBankAccount,
  deleteDeposit,
  getActiveShift,
  getDefaultBankAccount,
  getDepositsForDate,
  loadBankAccounts,
  loadShifts,
  openShift,
  updateBankAccount,
  BANK_CHANGED_EVENT,
  BANK_NAMES,
  type BankAccountRecord,
  type DepositRecord,
  type ShiftRecord,
} from '@/features/bank/bankStore'
import { loadRecentSales, POS_SALE_RECORDED_EVENT } from '@/features/pos/data/posSalesHistory'
import { clsx } from 'clsx'
import {
  Banknote,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  History,
  Landmark,
  ListPlus,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function todayStr() {
  return new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}
function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/* ── Today's sales by payment method ──────────────────────────── */
function useTodaySales() {
  const compute = useCallback(() => {
    const today = new Date()
    const sales = loadRecentSales().filter((s) => !s.voidedAt && isSameLocalDay(s.at, today))
    let cash = 0, transfer = 0, account = 0, mixed = 0
    for (const s of sales) {
      if (s.paymentId === 'cash') cash += s.total
      else if (s.paymentId === 'transfer') transfer += s.total
      else if (s.paymentId === 'account') account += s.total
      else if (s.paymentId === 'mixed') mixed += s.total
    }
    return { cash, transfer, account, mixed, total: cash + transfer + account + mixed, count: sales.length }
  }, [])
  const [sales, setSales] = useState(compute)
  useEffect(() => {
    const refresh = () => setSales(compute())
    window.addEventListener(POS_SALE_RECORDED_EVENT, refresh)
    return () => window.removeEventListener(POS_SALE_RECORDED_EVENT, refresh)
  }, [compute])
  return sales
}

/* ── KPI card ──────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: typeof Wallet; color: string
}) {
  return (
    <div className={clsx('rounded-2xl border p-4 shadow-sm flex flex-col gap-2', color)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 opacity-70" />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-black tabular-nums leading-none">฿{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  )
}

/* ── Open shift form ───────────────────────────────────────────── */
function OpenShiftForm({ date, onDone }: { date: string; onDone: () => void }) {
  const [float, setFloat] = useState('')
  const handle = () => {
    const n = Number(float)
    if (isNaN(n) || n < 0) return
    openShift(date, n)
    onDone()
  }
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <LogIn className="size-4" />เปิดกะใหม่ — {todayStr()}
      </h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">เงินลอย (Float) เปิดกะ</label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-500">฿</span>
            <input
              autoFocus type="number" min="0" step="100"
              value={float} onChange={(e) => setFloat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              placeholder="0.00"
              className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
          </div>
        </div>
        <button type="button" onClick={handle}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <LogIn className="size-4" />เปิดกะ
        </button>
      </div>
      <p className="mt-3 text-xs text-emerald-700/70">ใส่ยอดเงินที่มีในเก๊ะตอนเปิดร้าน — ถ้าไม่มีลอยให้ใส่ 0</p>
    </div>
  )
}

/* ── Close shift form ──────────────────────────────────────────── */
function CloseShiftForm({ shift, expectedCash, onDone }: {
  shift: ShiftRecord; expectedCash: number; onDone: () => void
}) {
  const [count, setCount] = useState(String(expectedCash.toFixed(2)))
  const [notes, setNotes] = useState('')
  const countNum = Number(count) || 0
  const diff = countNum - expectedCash

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-rose-800">
        <LogOut className="size-4" />ปิดกะ — เปิดมาตั้งแต่ {fmtTime(shift.openedAt)}
      </h3>
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-white/70 p-3 text-slate-700">
          <p className="opacity-60 mb-0.5">ยอดที่ควรมี</p>
          <p className="text-base font-bold tabular-nums text-slate-900">฿{fmt(expectedCash)}</p>
        </div>
        <div className={clsx('rounded-xl p-3',
          Math.abs(diff) < 1 ? 'bg-emerald-100/80 text-emerald-800'
            : diff < 0 ? 'bg-rose-100/80 text-rose-800'
            : 'bg-amber-100/80 text-amber-800')}>
          <p className="opacity-60 mb-0.5">ผลต่าง</p>
          <p className="text-base font-bold tabular-nums">{diff >= 0 ? '+' : ''}฿{fmt(diff)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">นับเงินจริง (฿)</label>
          <input autoFocus type="number" min="0" step="0.01" value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">หมายเหตุ</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="(ไม่บังคับ)"
            className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400" />
        </div>
        <button type="button" onClick={() => { closeShift(shift.id, countNum, notes); onDone() }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          <LogOut className="size-4" />ปิดกะ
        </button>
      </div>
    </div>
  )
}

/* ── Add deposit form ──────────────────────────────────────────── */
function AddDepositForm({ shiftId, date, onDone }: { shiftId: string; date: string; onDone: () => void }) {
  const accounts = useMemo(() => loadBankAccounts(), [])
  const defaultAcc = useMemo(() => getDefaultBankAccount(), [])

  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(defaultAcc?.id ?? '')
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const bankLabel = selectedAccount
    ? `${selectedAccount.bankName} · ${selectedAccount.accountNo} (${selectedAccount.accountName})`
    : '—'

  const handle = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    addDeposit({
      shiftId, date, amount: n,
      bank: selectedAccount ? `${selectedAccount.bankName} · ${selectedAccount.accountNo}` : 'ไม่ระบุ',
      ref, note,
    })
    setAmount(''); setRef(''); setNote('')
    onDone()
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-800">
        <Plus className="size-3.5" />บันทึกการฝากธนาคาร
      </h3>

      {accounts.length === 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ยังไม่มีบัญชีธนาคาร — กรุณาเพิ่มบัญชีใน แท็บ "บัญชีธนาคาร" ก่อน
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-600">บัญชีรับเงิน</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 max-w-xs">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} · {a.accountNo} ({a.accountName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-600">จำนวนเงิน (฿)</label>
            <input autoFocus type="number" min="1" step="100" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              placeholder="0"
              className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-600">เลขอ้างอิง / สลิป</label>
            <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="(ถ้ามี)"
              className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-600">หมายเหตุ</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="(ถ้ามี)"
              className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
          </div>
          <button type="button" onClick={handle} disabled={!amount || Number(amount) <= 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            บันทึก
          </button>
          <button type="button" onClick={onDone}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Today tab ─────────────────────────────────────────────────── */
function TodayTab() {
  const date = localDateKey()
  const sales = useTodaySales()
  const [, setTick] = useState(0)
  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    window.addEventListener(BANK_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BANK_CHANGED_EVENT, refresh)
  }, [refresh])

  const shift    = useMemo(() => getActiveShift(date), [date])
  const deposits = useMemo(() => getDepositsForDate(date), [date])
  const totalDeposited = useMemo(() => deposits.reduce((s, d) => s + d.amount, 0), [deposits])
  const expectedCash = (shift?.openingFloat ?? 0) + sales.cash - totalDeposited

  const [showOpenForm,    setShowOpenForm]    = useState(false)
  const [showCloseForm,   setShowCloseForm]   = useState(false)
  const [showDepositForm, setShowDepositForm] = useState(false)

  return (
    <div className="space-y-5">
      {/* shift status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          {shift ? (
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-800">กะเปิดอยู่ — เปิดตั้งแต่ {fmtTime(shift.openedAt)}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">เปิดกะ</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <span className="size-2.5 rounded-full bg-slate-300" />
              <span className="text-sm">ยังไม่ได้เปิดกะวันนี้</span>
            </div>
          )}
          <p className="mt-0.5 text-xs text-slate-400">{todayStr()}</p>
        </div>
        <div className="flex gap-2">
          {!shift && !showOpenForm && (
            <button type="button" onClick={() => setShowOpenForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              <LogIn className="size-3.5" />เปิดกะ
            </button>
          )}
          {shift && (
            <>
              <button type="button" onClick={() => setShowCloseForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                <LogOut className="size-3.5" />ปิดกะ
              </button>
              <button type="button" onClick={() => setShowDepositForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                <ListPlus className="size-3.5" />ฝากธนาคาร
              </button>
            </>
          )}
        </div>
      </div>

      {showOpenForm  && <OpenShiftForm date={date} onDone={() => { setShowOpenForm(false); refresh() }} />}
      {showCloseForm && shift && <CloseShiftForm shift={shift} expectedCash={expectedCash} onDone={() => { setShowCloseForm(false); refresh() }} />}
      {showDepositForm && shift && <AddDepositForm shiftId={shift.id} date={date} onDone={() => setShowDepositForm(false)} />}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="เงินเปิดกะ" value={fmt(shift?.openingFloat ?? 0)}
          sub={shift ? `เปิด ${fmtTime(shift.openedAt)}` : 'ยังไม่เปิดกะ'}
          icon={Wallet} color="border-slate-200 bg-white text-slate-800" />
        <KpiCard label="ยอดขายเงินสด" value={fmt(sales.cash)}
          sub={`${sales.count} บิลทั้งหมด · โอน ฿${fmt(sales.transfer)}`}
          icon={Banknote} color="border-emerald-200 bg-emerald-50 text-emerald-900" />
        <KpiCard label="ฝากธนาคารแล้ว" value={fmt(totalDeposited)}
          sub={`${deposits.length} ครั้ง`}
          icon={Landmark} color="border-indigo-200 bg-indigo-50 text-indigo-900" />
        <KpiCard label="เงินสดคงเหลือ" value={fmt(Math.max(0, expectedCash))}
          sub="เปิดกะ + ยอดสด − ฝาก"
          icon={CircleDollarSign}
          color={expectedCash < 0 ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'} />
      </div>

      {/* sales breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <TrendingUp className="size-3.5" />ยอดขายวันนี้ แยกช่องทาง
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'เงินสด',   value: sales.cash,     color: 'text-emerald-700 bg-emerald-50' },
            { label: 'โอน / QR', value: sales.transfer, color: 'text-indigo-700 bg-indigo-50' },
            { label: 'ลงบัญชี', value: sales.account,  color: 'text-amber-700 bg-amber-50' },
            { label: 'ผสม',      value: sales.mixed,    color: 'text-purple-700 bg-purple-50' },
          ].map((r) => (
            <div key={r.label} className={clsx('rounded-xl px-3 py-2.5', r.color)}>
              <p className="text-[10px] font-semibold opacity-60 mb-0.5">{r.label}</p>
              <p className="text-base font-bold tabular-nums">฿{fmt(r.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* deposit list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Landmark className="size-3.5" />การฝากธนาคารวันนี้
          </h3>
          {deposits.length > 0 && <span className="text-xs font-semibold text-indigo-600">รวม ฿{fmt(totalDeposited)}</span>}
        </div>
        {deposits.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">ยังไม่มีการฝากธนาคารวันนี้</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 text-left">เวลา</th>
                <th className="px-4 py-2 text-left">บัญชี</th>
                <th className="px-4 py-2 text-left">อ้างอิง</th>
                <th className="px-4 py-2 text-left">หมายเหตุ</th>
                <th className="px-4 py-2 text-right">จำนวน</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 text-slate-500">{fmtTime(d.createdAt)}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{d.bank}</td>
                  <td className="px-4 py-2.5 text-slate-500">{d.ref || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{d.note || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-indigo-700">฿{fmt(d.amount)}</td>
                  <td className="px-4 py-2.5">
                    <button type="button" onClick={() => { deleteDeposit(d.id); refresh() }}
                      className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ── Bank accounts tab ─────────────────────────────────────────── */
const BLANK_FORM = { bankName: BANK_NAMES[0], accountNo: '', accountName: '', branch: '', note: '', isDefault: false, promptPayId: '' }

function AccountForm({ initial, onSave, onCancel }: {
  initial: typeof BLANK_FORM
  onSave: (v: typeof BLANK_FORM) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof BLANK_FORM, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.accountNo.trim() && form.accountName.trim()

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">ธนาคาร</label>
          <select value={form.bankName} onChange={(e) => set('bankName', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400">
            {BANK_NAMES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">เลขบัญชี <span className="text-rose-500">*</span></label>
          <input autoFocus type="text" value={form.accountNo}
            onChange={(e) => set('accountNo', e.target.value)}
            placeholder="000-0-00000-0"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">ชื่อบัญชี <span className="text-rose-500">*</span></label>
          <input type="text" value={form.accountName}
            onChange={(e) => set('accountName', e.target.value)}
            placeholder="ชื่อ นามสกุล / ชื่อบริษัท"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">สาขา</label>
          <input type="text" value={form.branch}
            onChange={(e) => set('branch', e.target.value)}
            placeholder="(ถ้ามี)"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">หมายเหตุ</label>
          <input type="text" value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="(ถ้ามี)"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-slate-600">
            PromptPay ID
            <span className="ml-1 text-slate-400">(เบอร์โทร / เลขประชาชน / นิติบุคคล)</span>
          </label>
          <input type="text" value={form.promptPayId ?? ''}
            onChange={(e) => set('promptPayId', e.target.value)}
            placeholder="0812345678 หรือ 1234567890123"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400" />
          <p className="mt-0.5 text-[10px] text-slate-400">ใส่เพื่อแสดง QR PromptPay ในหน้าจ่ายเงิน</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)}
              className="rounded" />
            <span className="text-sm text-slate-700">ตั้งเป็นบัญชีหลัก</span>
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => valid && onSave(form)} disabled={!valid}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          <Check className="size-3.5" />บันทึก
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <X className="size-3.5 inline mr-1" />ยกเลิก
        </button>
      </div>
    </div>
  )
}

function BankAccountsTab() {
  const [accounts, setAccounts] = useState(() => loadBankAccounts())
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const refresh = useCallback(() => setAccounts(loadBankAccounts()), [])
  useEffect(() => {
    window.addEventListener(BANK_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BANK_CHANGED_EVENT, refresh)
  }, [refresh])

  const handleAdd = (form: typeof BLANK_FORM) => {
    addBankAccount(form)
    setShowAdd(false)
  }

  const handleEdit = (id: string, form: typeof BLANK_FORM) => {
    updateBankAccount(id, form)
    setEditId(null)
  }

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">บัญชีธนาคารของร้าน</h2>
          <p className="text-xs text-slate-500">{accounts.length} บัญชี · ใช้เลือกเมื่อบันทึกฝากธนาคาร</p>
        </div>
        <button type="button" onClick={() => { setShowAdd(true); setEditId(null) }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
          <Plus className="size-3.5" />เพิ่มบัญชี
        </button>
      </div>

      {showAdd && (
        <AccountForm
          initial={BLANK_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* accounts list */}
      {accounts.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-400">
          <CreditCard className="size-10 opacity-30" />
          <p className="text-sm">ยังไม่มีบัญชีธนาคาร</p>
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
            <Plus className="size-3.5" />เพิ่มบัญชีแรก
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 text-left">ธนาคาร</th>
                <th className="px-4 py-2.5 text-left">เลขบัญชี</th>
                <th className="px-4 py-2.5 text-left">ชื่อบัญชี</th>
                <th className="px-4 py-2.5 text-left">สาขา</th>
                <th className="px-4 py-2.5 text-left">หมายเหตุ</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <>
                  {editId === a.id ? (
                    <tr key={`${a.id}-edit`}>
                      <td colSpan={6} className="p-3">
                        <AccountForm
                          initial={{ bankName: a.bankName, accountNo: a.accountNo, accountName: a.accountName, branch: a.branch, note: a.note, isDefault: a.isDefault, promptPayId: a.promptPayId ?? '' }}
                          onSave={(form) => handleEdit(a.id, form)}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {a.isDefault && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />}
                          <span className="font-medium text-slate-800">{a.bankName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">{a.accountNo}</td>
                      <td className="px-4 py-2.5 text-slate-700">{a.accountName}</td>
                      <td className="px-4 py-2.5 text-slate-500">{a.branch || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{a.note || '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {!a.isDefault && (
                            <button type="button" title="ตั้งเป็นบัญชีหลัก"
                              onClick={() => { updateBankAccount(a.id, { isDefault: true }); refresh() }}
                              className="rounded-md p-1 text-slate-300 hover:bg-amber-50 hover:text-amber-500">
                              <Star className="size-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => setEditId(a.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => { deleteBankAccount(a.id); refresh() }}
                            className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Shift history tab ─────────────────────────────────────────── */
function HistoryTab() {
  const [shifts, setShifts] = useState(() => loadShifts().slice(0, 60))
  useEffect(() => {
    const refresh = () => setShifts(loadShifts().slice(0, 60))
    window.addEventListener(BANK_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(BANK_CHANGED_EVENT, refresh)
  }, [])

  if (shifts.length === 0) return <p className="py-12 text-center text-sm text-slate-400">ยังไม่มีประวัติกะ</p>

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5 text-left">วันที่</th>
            <th className="px-4 py-2.5 text-left">เปิด</th>
            <th className="px-4 py-2.5 text-left">ปิด</th>
            <th className="px-4 py-2.5 text-right">เงินลอย</th>
            <th className="px-4 py-2.5 text-right">นับได้จริง</th>
            <th className="px-4 py-2.5 text-right">ผลต่าง</th>
            <th className="px-4 py-2.5 text-left">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shifts.map((s) => {
            const diff = s.closingCount != null ? s.closingCount - s.openingFloat : null
            return (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium text-slate-800">{s.date}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmtTime(s.openedAt)}</td>
                <td className="px-4 py-2.5 text-slate-500">{s.closedAt ? fmtTime(s.closedAt) : <span className="text-emerald-600 font-medium">เปิดอยู่</span>}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">฿{fmt(s.openingFloat)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{s.closingCount != null ? `฿${fmt(s.closingCount)}` : '—'}</td>
                <td className={clsx('px-4 py-2.5 text-right tabular-nums font-semibold',
                  diff == null ? 'text-slate-400'
                    : Math.abs(diff) < 1 ? 'text-emerald-600'
                    : diff < 0 ? 'text-rose-600' : 'text-amber-600')}>
                  {diff != null ? `${diff >= 0 ? '+' : ''}฿${fmt(diff)}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-slate-400">{s.notes || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Page root ─────────────────────────────────────────────────── */
type Tab = 'today' | 'accounts' | 'history'

export function BankWorkspacePage({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>('today')

  const TABS: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: 'today',    label: 'วันนี้',         icon: Clock },
    { id: 'accounts', label: 'บัญชีธนาคาร',   icon: CreditCard },
    { id: 'history',  label: 'ประวัติกะ',      icon: History },
  ]

  return (
    <div className={clsx(
      'flex min-h-[min(85vh,56rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
      className,
    )}>
      {/* header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white text-emerald-700 shadow-sm">
            <Landmark className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900 lg:text-lg">เปิด/ปิดกะ · ธนาคาร</h1>
            <p className="text-xs text-slate-500">จัดการเงินสด · บัญชีธนาคาร · ฝากธนาคาร · สรุปยอดตามช่องทาง</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                    tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60',
                  )}>
                  <Icon className="size-3.5" />{t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-5">
        {tab === 'today'    && <TodayTab />}
        {tab === 'accounts' && <BankAccountsTab />}
        {tab === 'history'  && <HistoryTab />}
      </div>
    </div>
  )
}
