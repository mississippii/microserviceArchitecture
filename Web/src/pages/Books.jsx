import { Children, useMemo, useState } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, Phone, Plus, ReceiptText, Search, Store, UserRound, Users, X } from 'lucide-react'
import { api, money, qty } from '../api'
import { Drawer, Empty, ErrorMsg, Fab, Field, Picker, Segmented, StatTile, Success, timeAgo, useLoad } from '../ui'

// The seller's books: customers who buy on due, purchases, the day book and the accounts summary.
// Every figure comes from the server, worked out from sales, purchases, payments and expenses.

export const METHODS = [['CASH', 'Cash'], ['BKASH', 'bKash'], ['NAGAD', 'Nagad'], ['ROCKET', 'Rocket'], ['CARD', 'Card'], ['BANK', 'Bank']]
export const METHOD_LABEL = { ...Object.fromEntries(METHODS), PLATFORM: 'Platform' }
const METHOD_OPTIONS = METHODS.map(([value, label]) => ({ value, label }))

const KIND = { SALE: 'Shop sale', ORDER: 'Online order', RECEIVED: 'Due collected', PURCHASE: 'Stock bought', EXPENSE: 'Expense', SETTLEMENT: 'Platform settlement' }
export const EXPENSE = { RENT: 'Rent', TRANSPORT: 'Transport', PACKAGING: 'Packaging', SALARY: 'Salary', UTILITIES: 'Utilities', MARKETING: 'Marketing', OTHER: 'Other' }

/** yyyy-mm-dd in the phone's own time zone. */
export const isoDay = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoDay(d) }
const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const dateTime = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const signed = (n) => (Number(n) < 0 ? `− ${money(-Number(n))}` : money(Math.abs(Number(n))))
const label = (e) => (e.kind === 'EXPENSE' ? EXPENSE[e.label] || e.label : e.label)

// Actions that are all desktop-only (phones get a floating button instead) leave no empty row on phones.
const phoneHidden = (children) => Children.toArray(children).every((c) => String(c.props?.className).includes('max-sm:hidden'))

/** The tab already names the page, so the title is for screen readers only; the actions sit on the right. */
export function SectionHead({ title, children }) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {children && (
        <div className={`flex flex-wrap items-center justify-end gap-2 ${phoneHidden(children) ? 'max-sm:hidden' : ''}`}>{children}</div>
      )}
    </>
  )
}

/** Async action helper: disables while pending and keeps the error. */
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try { return await fn() } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return { busy, error, run, setError }
}

// ---------------------------------------------------------------- customers

/** Customers who buy on due: what each owes, and a statement per customer. */
export function Customers() {
  const list = useLoad(() => api('/api/books/customers'))
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null) // customer id
  const [editing, setEditing] = useState(null) // {} = new
  const all = list.data || []
  const shown = all.filter((p) => `${p.name} ${p.phone || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  const owing = all.filter((p) => Number(p.balance) > 0)
  const total = owing.reduce((n, p) => n + Number(p.balance), 0)
  const ahead = all.filter((p) => Number(p.balance) < 0).reduce((n, p) => n - Number(p.balance), 0)

  return (
    <section className="space-y-4" aria-label="Customers">
      <SectionHead title="Customers">
        <button type="button" className="btn max-sm:hidden" onClick={() => setEditing({})}><Plus className="size-4" aria-hidden /> Customer</button>
      </SectionHead>
      <Fab label="Customer" onClick={() => setEditing({})} />
      <ErrorMsg error={list.error} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile icon={Users} label="Owe you" value={list.data && money(total)} hint={`${owing.length} of ${all.length}`} />
        <StatTile label="Advance" value={list.data && money(ahead)} />
      </div>

      <div className="panel overflow-hidden">
        <label className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Find</span>
          <input className="min-h-11 w-full bg-transparent text-[15px] outline-none" type="search" placeholder="Name or phone…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {list.data && shown.length === 0 && <Empty icon={UserRound} title={all.length ? 'No match' : 'No customers yet'} />}
        <ul className="divide-y divide-line">
          {shown.map((p) => {
            const b = Number(p.balance)
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setOpen(p.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="num block truncate text-xs text-muted">{[p.phone, p.lastActivity && timeAgo(p.lastActivity)].filter(Boolean).join(' · ') || ' '}</span>
                  </span>
                  <span className="text-right">
                    <span className={`num block font-semibold ${b === 0 ? 'text-muted' : ''}`}>{money(Math.abs(b))}</span>
                    <span className="block text-xs text-muted">{b > 0 ? 'Owes you' : b < 0 ? 'Advance' : 'Settled'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {open && <Account id={open} onClose={() => setOpen(null)} onChange={list.reload} onEdit={(p) => { setOpen(null); setEditing(p) }} />}
      {editing && <CustomerForm customer={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload() }} />}
    </section>
  )
}

function CustomerForm({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({ name: customer.name || '', phone: customer.phone || '', address: customer.address || '', openingBalance: customer.openingBalance ?? '' })
  const act = useAction()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    act.run(async () => {
      const body = { name: form.name, phone: form.phone || null, address: form.address || null, openingBalance: form.openingBalance === '' ? 0 : Number(form.openingBalance) }
      await api(customer.id ? `/api/books/customers/${customer.id}` : '/api/books/customers', { method: customer.id ? 'PUT' : 'POST', body })
      onSaved()
    })
  }
  return (
    <Drawer title={customer.id ? `Edit ${customer.name}` : 'New customer'} onClose={onClose} footer={(
      <div className="space-y-2">
        <ErrorMsg error={act.error} />
        <button form="party-form" className="btn w-full" disabled={act.busy}>{act.busy ? 'Saving…' : 'Save'}</button>
      </div>
    )}>
      <form id="party-form" onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className="input" required maxLength={100} autoComplete="off" value={form.name} onChange={set('name')} /></Field>
        <Field label="Phone">
          <input className="input num" type="tel" inputMode="numeric" pattern="01[3-9][0-9]{8}" maxLength={11} placeholder="01XXXXXXXXX" autoComplete="off"
                 value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Address"><input className="input" maxLength={300} autoComplete="off" value={form.address} onChange={set('address')} /></Field>
        <Field label="Old due" prefix="৳"><input className="input num" type="number" inputMode="decimal" step="0.01" placeholder="0" value={form.openingBalance} onChange={set('openingBalance')} /></Field>
      </form>
    </Drawer>
  )
}

/** One customer: what they owe, take a payment, and every sale and payment with the due after it. */
function Account({ id, onClose, onChange, onEdit }) {
  const st = useLoad(() => api(`/api/books/customers/${id}`), [id])
  const [pay, setPay] = useState({ amount: '', paymentMethod: 'CASH', note: '' })
  const [done, setDone] = useState(null)
  const act = useAction()
  const p = st.data?.customer
  const b = Number(p?.balance || 0)
  const reload = () => { st.reload(); onChange() }

  const submit = (e) => {
    e.preventDefault()
    act.run(async () => {
      await api(`/api/books/customers/${id}/payments`, { method: 'POST', body: { ...pay, amount: Number(pay.amount), note: pay.note.trim() || null } })
      setDone(`Collected ${money(pay.amount)} by ${METHOD_LABEL[pay.paymentMethod]}.`)
      setPay({ ...pay, amount: '', note: '' })
      reload()
    })
  }
  const voidPayment = (e) => {
    if (!window.confirm(`Void this payment of ${money(e.amount)}? The due goes back up by the same amount.`)) return
    act.run(async () => { await api(`/api/books/payments/${e.refId}/void`, { method: 'POST' }); setDone(null); reload() })
  }

  return (
    <Drawer title={p?.name || 'Customer'} wide onClose={onClose}>
      <ErrorMsg error={st.error} />
      {p && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">{b > 0 ? 'Owes you' : b < 0 ? 'Advance' : 'Settled'}</p>
              <p className="num text-2xl font-semibold">{money(Math.abs(b))}</p>
              {(p.phone || p.address) && <p className="truncate text-xs text-muted">{[p.phone, p.address].filter(Boolean).join(' · ')}</p>}
            </div>
            {p.phone && <a href={`tel:${p.phone}`} className="btn-quiet px-3" aria-label={`Call ${p.name}`}><Phone className="size-4" aria-hidden /></a>}
            <button type="button" className="btn-quiet" onClick={() => onEdit({ ...p })}>Edit</button>
          </div>

          <form onSubmit={submit} className="space-y-2 rounded-xl bg-cotton p-3" aria-label="Take payment">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Amount" prefix="৳">
                <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder={b > 0 ? String(b) : '0'}
                       value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
              </Field>
              <Picker label="Method" value={pay.paymentMethod} options={METHOD_OPTIONS} onChange={(v) => setPay({ ...pay, paymentMethod: v })} />
            </div>
            <Field label={pay.paymentMethod === 'CASH' ? 'Note' : 'TrxID / Note'}>
              <input className="input" maxLength={200} autoComplete="off" required={pay.paymentMethod !== 'CASH'} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              {b > 0 && <button type="button" className="btn-quiet flex-1" onClick={() => setPay({ ...pay, amount: String(b) })}>Full {money(b)}</button>}
              <button className="btn flex-1" disabled={act.busy}>{act.busy ? 'Saving…' : 'Take payment'}</button>
            </div>
            <ErrorMsg error={act.error} />
          </form>
          <Success>{done}</Success>

          <section aria-labelledby="statement">
            <h3 id="statement" className="mb-1 text-sm font-semibold">Statement</h3>
            {st.data.lines.length === 0 && <p className="py-4 text-sm text-muted">Nothing yet</p>}
            <ul className="divide-y divide-line">
              {st.data.lines.map(({ entry: e, balance }) => {
                const isPayment = e.kind === 'RECEIVED'
                const moved = Number(e.moneyIn)
                return (
                  <li key={`${e.kind}${e.refId}`} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{isPayment ? 'Paid' : 'Bought'} <span className="num">{money(isPayment ? moved : e.amount)}</span></span>
                      <span className="num block truncate text-xs text-muted">
                        {dateTime(e.at)}{!isPayment && moved > 0 && ` · paid ${money(moved)}`}{e.method && moved > 0 && ` · ${METHOD_LABEL[e.method]}`}
                      </span>
                    </span>
                    <span className="num text-right text-xs text-muted">Bal<span className="block text-sm font-semibold text-ink">{signed(balance)}</span></span>
                    {isPayment && (
                      <button type="button" className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink"
                              aria-label="Void payment" disabled={act.busy} onClick={() => voidPayment(e)}>
                        <X className="size-4" aria-hidden />
                      </button>
                    )}
                  </li>
                )
              })}
              {Number(p.openingBalance) !== 0 && (
                <li className="flex items-center justify-between py-2 text-sm text-muted"><span>Old due</span><span className="num">{signed(p.openingBalance)}</span></li>
              )}
            </ul>
          </section>
        </div>
      )}
    </Drawer>
  )
}

// ---------------------------------------------------------------- money by method

function MethodTable({ rows }) {
  const total = (k) => rows.reduce((n, r) => n + Number(r[k]), 0)
  const cell = (v) => <td className={`num px-4 py-2 text-right ${Number(v) === 0 ? 'text-muted' : 'font-semibold'}`}>{Number(v) === 0 ? '–' : money(v)}</td>
  return (
    <table className="w-full table-fixed text-sm">
      <thead className="bg-cotton text-xs text-muted">
        <tr><th className="px-4 py-2 text-left font-medium">Method</th><th className="px-4 py-2 text-right font-medium">In</th><th className="px-4 py-2 text-right font-medium">Out</th></tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => <tr key={r.method}><td className="px-4 py-2">{METHOD_LABEL[r.method] || r.method}</td>{cell(r.moneyIn)}{cell(r.moneyOut)}</tr>)}
        <tr className="bg-cotton font-semibold"><td className="px-4 py-2">Total</td>{cell(total('moneyIn'))}{cell(total('moneyOut'))}</tr>
      </tbody>
    </table>
  )
}

const byMethodOf = (entries) => {
  const m = new Map(METHODS.map(([id]) => [id, { method: id, moneyIn: 0, moneyOut: 0 }]))
  entries.forEach((e) => {
    const key = e.method || 'PLATFORM'
    const r = m.get(key) || m.set(key, { method: key, moneyIn: 0, moneyOut: 0 }).get(key)
    r.moneyIn += Number(e.moneyIn)
    r.moneyOut += Number(e.moneyOut)
  })
  return [...m.values()].filter((r) => r.method === 'CASH' || r.moneyIn || r.moneyOut)
}

// ---------------------------------------------------------------- day book

/** One day's money, every event in order: count the drawer against the cash row. */
export function DayBook() {
  const [day, setDay] = useState(isoDay())
  const book = useLoad(() => api(`/api/books/ledger?from=${day}&to=${day}`), [day])
  const entries = book.data || []
  const rows = byMethodOf(entries)
  const moneyIn = rows.reduce((n, r) => n + r.moneyIn, 0)
  const moneyOut = rows.reduce((n, r) => n + r.moneyOut, 0)
  const isToday = day === isoDay()

  return (
    <section className="space-y-4" aria-label="Day book">
      <SectionHead title="Day book" />
      <div className="panel flex items-center">
        <button type="button" className="inline-flex size-12 items-center justify-center" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <label className="relative min-w-0 flex-1 text-center">
          <span className="block font-semibold">{isToday ? 'Today' : dayLabel(day)}</span>
          <input type="date" className="absolute inset-0 opacity-0" aria-label="Choose a day" max={isoDay()} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
        </label>
        <button type="button" className="inline-flex size-12 items-center justify-center disabled:opacity-30" aria-label="Next day" disabled={isToday} onClick={() => setDay(addDays(day, 1))}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <ErrorMsg error={book.error} />
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile label="In" value={book.data && money(moneyIn)} />
        <StatTile label="Out" value={book.data && money(moneyOut)} />
        <StatTile label="Net" value={book.data && signed(moneyIn - moneyOut)} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden" aria-label="By method"><MethodTable rows={rows} /></section>
        <section className="panel" aria-labelledby="entries-heading">
          <h2 id="entries-heading" className="border-b border-line px-4 py-2.5 text-sm font-semibold">Entries</h2>
          {book.data && entries.length === 0 && <Empty icon={ReceiptText} title="Nothing on this day" />}
          <ul className="divide-y divide-line">
            {entries.map((e) => {
              const moved = Number(e.moneyIn) - Number(e.moneyOut)
              return (
                <li key={`${e.kind}${e.refId}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="num w-11 shrink-0 text-xs text-muted">{e.kind === 'EXPENSE' ? '' : timeOf(e.at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{KIND[e.kind]}</span>
                    <span className="block truncate text-xs text-muted">
                      {label(e)}{e.method && moved !== 0 && ` · ${METHOD_LABEL[e.method]}`}
                      {(e.kind === 'SALE' || e.kind === 'PURCHASE') && Number(e.amount) !== Math.abs(moved) && ` · bill ${money(e.amount)}`}
                    </span>
                  </span>
                  <span className="num font-semibold">{moved === 0 ? <span className="text-muted">{money(0)}</span> : moved > 0 ? `+ ${money(moved)}` : `− ${money(-moved)}`}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- accounts summary

const RANGES = [['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['365', '1 year']]

/** Profit and loss, money by method, dues, platform balance and expenses, for a period. */
export function Accounts({ onShop, go }) {
  const [range, setRange] = useState('30')
  const to = isoDay()
  const from = addDays(to, 1 - Number(range))
  const sum = useLoad(() => api(`/api/books/summary?from=${from}&to=${to}`), [from, to])
  const book = useLoad(() => api(`/api/books/ledger?from=${from}&to=${to}`), [from, to])
  const platform = useLoad(() => api('/api/orders/seller/money'))
  const expenses = useLoad(() => api('/api/sellers/me/expenses'))
  const s = sum.data
  const reload = () => { sum.reload(); book.reload(); expenses.reload() }

  const bars = useMemo(() => {
    if (!book.data || range === '1') return null
    const days = Math.min(Number(range), 30)
    const total = new Map()
    book.data.filter((e) => e.kind === 'SALE' || e.kind === 'ORDER')
      .forEach((e) => { const d = isoDay(new Date(e.at)); total.set(d, (total.get(d) || 0) + Number(e.amount)) })
    return Array.from({ length: days }, (_, i) => { const d = addDays(to, i - days + 1); return { d, total: total.get(d) || 0 } })
  }, [book.data, range, to])
  const max = bars ? Math.max(...bars.map((b) => b.total), 1) : 1

  const pnl = s && [
    ['Sales', s.sales],
    ['Product cost', -s.costOfGoods],
    ['Gross profit', s.grossProfit, true],
    ['Platform commission', -s.commission],
    ['Expenses', -s.expenses],
    ['Stock lost or damaged', -s.stockLoss],
  ]

  return (
    <section className="space-y-4" aria-label="Accounts">
      <SectionHead title="Accounts">
        <button type="button" className="btn-quiet" onClick={onShop}><Store className="size-4" aria-hidden /> My shop</button>
      </SectionHead>
      <Segmented label="Time range" value={range} onChange={setRange} options={RANGES} />
      <ErrorMsg error={sum.error} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile label="Sales" value={s && money(s.sales)} hint={s && `${s.saleCount} ${s.saleCount === 1 ? 'sale' : 'sales'}`} />
        <StatTile label="Profit" value={s && signed(s.netProfit)} hint={s && Number(s.sales) > 0 ? `${Math.round((s.netProfit / s.sales) * 100)}% of sales` : undefined} />
        <StatTile icon={Users} label="Customers owe you" value={s && money(s.customersOwe)} onClick={() => go('customers')} />
        <StatTile label="Stock at cost" value={s && money(s.stockAtCost)} onClick={() => go('home')} />
      </div>

      {bars?.some((b) => b.total) && (
        <figure className="panel p-4">
          <figcaption className="text-sm font-semibold">Sales per day</figcaption>
          <div className="mt-4 flex h-36 items-end gap-0.5 border-b border-line" role="img" aria-label={`Daily sales, highest ${money(max === 1 ? 0 : max)}`}>
            {bars.map(({ d, total }) => (
              <div key={d} className="group relative flex h-full flex-1 items-end justify-center">
                <div className={`w-full max-w-8 rounded-t ${total ? 'bg-ink group-hover:bg-brand-600' : 'bg-line'}`} style={{ height: total ? `${Math.max((total / max) * 100, 3)}%` : '2px' }} />
                <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {dayLabel(d)} · <span className="num">{money(total)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>{dayLabel(bars[0].d)}</span><span>Today</span></div>
        </figure>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="panel p-4" aria-labelledby="profit-heading">
          <h2 id="profit-heading" className="text-sm font-semibold">Profit</h2>
          {s && (
            <dl className="mt-2 space-y-1.5 text-sm">
              {pnl.map(([k, v, sub]) => (
                <div key={k} className={`flex justify-between ${sub ? 'border-t border-line pt-1.5 font-medium' : ''}`}>
                  <dt className={sub ? '' : 'text-muted'}>{k}</dt><dd className="num">{signed(v)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Profit</dt><dd className="num">{signed(s.netProfit)}</dd></div>
              {Number(s.discounts) > 0 && <div className="flex justify-between text-xs text-muted"><dt>Discounts given</dt><dd className="num">{money(s.discounts)}</dd></div>}
            </dl>
          )}
          {s?.costMissing && <p className="hint">Some sold products have no cost, so profit is too high. Add their cost in Stock.</p>}
        </section>

        <section className="panel overflow-hidden" aria-labelledby="money-heading">
          <h2 id="money-heading" className="px-4 pt-4 pb-2 text-sm font-semibold">Money</h2>
          {s && <MethodTable rows={s.byMethod} />}
          {s && (
            <dl className="space-y-1.5 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sold on due</dt><dd className="num">{money(s.soldOnCredit)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Stock bought</dt><dd className="num">{money(s.purchases)}</dd></div>
            </dl>
          )}
        </section>

        <Settlement money={platform} />
        <Expenses expenses={expenses} from={from} onChange={reload} />
      </div>

      <section className="panel" aria-labelledby="top-products">
        <h2 id="top-products" className="border-b border-line px-4 py-2.5 text-sm font-semibold">Products</h2>
        {s && s.products.length === 0 && <Empty icon={BarChart3} title="No sales yet" />}
        {s?.products.length > 0 && (
          <table className="w-full table-fixed text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 pt-2 text-left font-medium">Product</th>
                <th className="w-20 px-2 pt-2 text-right font-medium">Sold</th>
                <th className="w-24 px-2 pt-2 text-right font-medium">Sales</th>
                <th className="w-24 py-2 pr-4 pl-2 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {s.products.slice(0, 20).map((p) => (
                <tr key={p.productId}>
                  <td className="truncate px-4 py-2">{p.name}</td>
                  <td className="num truncate px-2 py-2 text-right text-muted">{qty(p.quantity, p.unit)}</td>
                  <td className="num px-2 py-2 text-right">{money(p.sales)}</td>
                  <td className="num py-2 pr-4 pl-2 text-right font-semibold">{signed(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  )
}

/** What the seller and the platform owe each other, and past settlements. */
function Settlement({ money: m }) {
  const b = m.data?.balance
  const owes = b && Number(b.amount) < 0
  return (
    <section className="panel p-4" aria-labelledby="settle-heading">
      <h2 id="settle-heading" className="text-sm font-semibold">Balance with the platform</h2>
      <ErrorMsg error={m.error} />
      {b && (
        <>
          <p className="num mt-2 text-xl font-semibold">{money(Math.abs(Number(b.amount)))}</p>
          <p className="text-sm text-muted">
            {Number(b.amount) === 0 ? 'Nothing to settle right now.'
              : owes ? `You owe this for ${b.orderCount} delivered ${b.orderCount === 1 ? 'order' : 'orders'}: you collected the cash, so the commission (and any refunded order) is due to us.`
                : `We owe you this for ${b.orderCount} delivered ${b.orderCount === 1 ? 'order' : 'orders'}.`}
          </p>
        </>
      )}
      {m.data?.payouts.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
          {m.data.payouts.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{Number(p.amount) < 0 ? 'You paid' : 'We paid you'} <span className="num">{money(Math.abs(Number(p.amount)))}</span></span>
                <span className="block truncate text-xs text-muted">{p.orderCount} orders · ref {p.reference}</span>
              </span>
              <span className="text-xs text-muted">{timeAgo(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Expenses({ expenses, from, onChange }) {
  const [form, setForm] = useState({ category: 'TRANSPORT', amount: '', note: '', spentOn: isoDay(), paymentMethod: 'CASH' })
  const [adding, setAdding] = useState(false)
  const act = useAction()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const shown = (expenses.data || []).filter((e) => e.spentOn >= from)

  const submit = (e) => {
    e.preventDefault()
    act.run(async () => {
      await api('/api/sellers/me/expenses', { method: 'POST', body: { ...form, amount: Number(form.amount), note: form.note.trim() || null } })
      setForm({ ...form, amount: '', note: '' })
      setAdding(false)
      onChange()
    })
  }
  const remove = (x) => {
    if (!window.confirm(`Delete this ${EXPENSE[x.category].toLowerCase()} expense of ${money(x.amount)}?`)) return
    act.run(async () => { await api(`/api/sellers/me/expenses/${x.id}`, { method: 'DELETE' }); onChange() })
  }

  return (
    <section className="panel" aria-labelledby="expenses-heading">
      <div className="flex items-center gap-2 border-b border-line py-1.5 pr-2 pl-4">
        <h2 id="expenses-heading" className="mr-auto text-sm font-semibold">Expenses</h2>
        <button type="button" className="btn-quiet" onClick={() => { act.setError(null); setAdding(true) }}><Plus className="size-4" aria-hidden /> Expense</button>
      </div>
      {!adding && <div className="px-4"><ErrorMsg error={act.error || expenses.error} /></div>}
      {expenses.data && shown.length === 0 && <p className="px-4 py-4 text-sm text-muted">No expenses in this period</p>}
      <ul className="max-h-80 divide-y divide-line overflow-y-auto">
        {shown.map((x) => (
          <li key={x.id} className="flex items-center gap-3 py-1.5 pr-1 pl-4 text-sm">
            <span className="min-w-0 flex-1">
              <span className="font-medium">{EXPENSE[x.category]}</span>
              <span className="block truncate text-xs text-muted">
                {new Date(x.spentOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {METHOD_LABEL[x.paymentMethod]}{x.note && ` · ${x.note}`}
              </span>
            </span>
            <span className="num font-semibold">{money(x.amount)}</span>
            <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink" aria-label={`Delete ${EXPENSE[x.category]} expense`} onClick={() => remove(x)}>
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {adding && (
        <Drawer title="Add expense" onClose={() => setAdding(false)} footer={(
          <div className="space-y-2">
            <ErrorMsg error={act.error} />
            <button form="expense-form" className="btn w-full" disabled={act.busy}>{act.busy ? 'Saving…' : 'Save expense'}</button>
          </div>
        )}>
          <form id="expense-form" onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Picker label="Type" value={form.category} onChange={(v) => setForm({ ...form, category: v })}
                      options={Object.entries(EXPENSE).map(([value, text]) => ({ value, label: text }))} />
              <Field label="Amount" prefix="৳">
                <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder="0" value={form.amount} onChange={set('amount')} />
              </Field>
              <Field label="Date"><input className="input" type="date" required max={isoDay()} value={form.spentOn} onChange={set('spentOn')} /></Field>
              <Picker label="Paid by" value={form.paymentMethod} options={METHOD_OPTIONS} onChange={(v) => setForm({ ...form, paymentMethod: v })} />
            </div>
            <Field label="Note"><input className="input" maxLength={200} autoComplete="off" value={form.note} onChange={set('note')} /></Field>
          </form>
        </Drawer>
      )}
    </section>
  )
}
