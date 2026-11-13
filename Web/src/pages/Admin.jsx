import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Banknote, BookOpen, ClipboardList, ShieldAlert, ExternalLink, FileText, LayoutDashboard, MapPin, Pencil, Phone, Plus, Search, ShieldCheck, Store, Tags, Trash2, X } from 'lucide-react'
import { ProductImage, Rating } from '../product-ui'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { Console, Drawer, Empty, Fab, ErrorMsg, Field, PayBadge, Picker, Segmented, StatTile, StatusBadge, Success, initials, timeAgo, useLoad } from '../ui'

const OPEN = ['PLACED', 'ACCEPTED', 'SHIPPED']

export default function Admin() {
  const { user } = useAuth()
  const isAdmin = user.role === 'ADMIN'
  const tabs = [
    isAdmin && { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard },
    { id: 'queue', label: 'Verification', short: 'Verify', icon: ShieldCheck },
    isAdmin && { id: 'issues', label: 'Issues', icon: ShieldAlert },
    { id: 'sellers', label: 'Sellers', icon: Store },
    isAdmin && { id: 'orders', label: 'Orders', icon: ClipboardList },
    isAdmin && { id: 'catalog', label: 'Catalogue', icon: BookOpen },
  ].filter(Boolean)
  const [params, setParams] = useSearchParams()
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0].id
  const setTab = (t) => { setParams({ tab: t }, { replace: true }); window.scrollTo({ top: 0 }) }

  const sellers = useLoad(() => api('/api/sellers'))
  const queue = useLoad(() => api('/api/verifications/pending'))
  const orders = useLoad(() => (isAdmin ? api('/api/orders') : Promise.resolve([])), [isAdmin])
  const claims = useLoad(() => (isAdmin ? api('/api/claims') : Promise.resolve([])), [isAdmin])
  const openClaims = claims.data?.filter((c) => c.status === 'OPEN').length
  const sellerById = useMemo(() => new Map((sellers.data || []).map((s) => [s.id, s])), [sellers.data])
  const queueCount = queue.data?.length || undefined
  tabs.find((t) => t.id === 'queue').count = queueCount
  if (isAdmin) tabs.find((t) => t.id === 'issues').count = openClaims || undefined

  const identity = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white"><ShieldCheck className="size-5" aria-hidden /></span>
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{isAdmin ? 'Admin' : 'Verification'}</p>
        {!isAdmin && <p className="truncate text-xs text-muted">Verifier</p>}
      </div>
    </div>
  )

  return (
    <Console identity={identity} tabs={tabs} value={tab} onChange={setTab}>
      {tab === 'overview' && <Overview sellers={sellers} queue={queue} orders={orders} openClaims={openClaims} sellerById={sellerById} go={setTab} />}
      {tab === 'issues' && <Claims claims={claims} orders={orders} onDecided={() => { claims.reload(); orders.reload() }} />}
      {tab === 'queue' && <Queue queue={queue} sellerById={sellerById} onDecided={sellers.reload} />}
      {tab === 'sellers' && <Sellers sellers={sellers} canSuspend={isAdmin} />}
      {tab === 'overview' && isAdmin && <AuditTrail />}
      {tab === 'orders' && <Orders orders={orders} sellerById={sellerById} />}
      {tab === 'catalog' && <Catalog />}
    </Console>
  )
}

function SectionHead({ title, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="mr-auto text-lg font-semibold sm:text-xl">{title}</h1>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------- overview

function Overview({ sellers, queue, orders, openClaims, sellerById, go }) {
  const s = sellers.data || []
  const o = orders.data || []
  const count = (st) => s.filter((x) => x.status === st).length
  const delivered = o.filter(({ order }) => order.status === 'DELIVERED')
  const gmv = delivered.reduce((sum, { order }) => sum + Number(order.total), 0)
  const open = o.filter(({ order }) => OPEN.includes(order.status))
  const ready = sellers.data && orders.data

  return (
    <div className="space-y-4">
      <SectionHead title="Overview" />
      <ErrorMsg error={sellers.error || orders.error || queue.error} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile icon={Store} label="Verified shops" value={ready && count('VERIFIED')} hint={`${count('SUSPENDED')} suspended`} onClick={() => go('sellers')} />
        <StatTile icon={ShieldCheck} label="Waiting verification" value={queue.data?.length} onClick={() => go('queue')} />
        <StatTile icon={ShieldAlert} label="Open issues" value={openClaims} onClick={() => go('issues')} />
        <StatTile icon={Banknote} label="Delivered sales" value={ready && money(gmv)} hint={`${delivered.length} delivered · ${open.length} open`} onClick={() => go('orders')} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="panel" aria-labelledby="ov-queue">
          <div className="flex items-center border-b border-line px-4 py-2.5">
            <h2 id="ov-queue" className="text-sm font-semibold">Waiting verification</h2>
            <button className="ml-auto min-h-9 text-sm font-medium underline underline-offset-2" onClick={() => go('queue')}>Review</button>
          </div>
          {queue.data?.length === 0 && <Empty icon={ShieldCheck} title="The queue is clear" />}
          <ul className="divide-y divide-line">
            {queue.data?.slice(0, 5).map((r) => {
              const shop = sellerById.get(r.sellerId)
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={shop?.shopName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{shop?.shopName || `Shop #${r.sellerId}`}</span>
                    <span className="block truncate text-xs text-muted">{shop?.address}</span>
                  </span>
                  <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="panel" aria-labelledby="ov-orders">
          <div className="flex items-center border-b border-line px-4 py-2.5">
            <h2 id="ov-orders" className="text-sm font-semibold">Latest orders</h2>
            <button className="ml-auto min-h-9 text-sm font-medium underline underline-offset-2" onClick={() => go('orders')}>All orders</button>
          </div>
          {orders.data?.length === 0 && <Empty icon={ClipboardList} title="No orders yet" />}
          <ul className="divide-y divide-line">
            {o.slice(0, 5).map(({ order, customer }) => (
              <li key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">#{order.id} · {sellerById.get(order.sellerId)?.shopName || 'Shop'}</span>
                  <span className="block truncate text-xs text-muted">{customer?.name} · {timeAgo(order.createdAt)}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="num text-sm font-semibold">{money(order.total)}</span>
                  <StatusBadge status={order.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

const Avatar = ({ name }) => (
  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-semibold text-ink">{initials(name || '?')}</span>
)

// ---------------------------------------------------------------- claims

const REASON = { NOT_ORIGINAL: 'Not original', NOT_AS_DESCRIBED: 'Not as described', DAMAGED: 'Damaged or spoiled' }

/** "Not original? Full refund": staff check the evidence and refund or reject. */
function Claims({ claims, orders, onDecided }) {
  const [filter, setFilter] = useState('OPEN')
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const all = claims.data || []
  const orderOf = useMemo(() => new Map((orders.data || []).map((d) => [d.order.id, d])), [orders.data])
  const list = all.filter((c) => filter === 'all' || c.status === filter)

  const decide = async (c, refund) => {
    const note = notes[c.id]?.trim()
    if (!note) return setError(new Error('Write a note first. The customer and the seller both see it.'))
    if (!confirm(refund
      ? `Refund order #${c.orderId} in full? This can't be undone.`
      : `Reject the claim on order #${c.orderId}? The customer will see your note.`)) return
    setError(null)
    setBusyId(c.id)
    try {
      await api(`/api/claims/${c.id}/decision`, { method: 'POST', body: { refund, note } })
      setDone(`Order #${c.orderId}: ${refund ? 'refunded' : 'issue rejected'}.`)
      onDecided()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3" aria-label="Issues">
      <SectionHead title="Issues" />
      <Segmented label="Filter issues" value={filter} onChange={setFilter}
                 options={[['OPEN', 'Open'], ['REFUNDED', 'Refunded'], ['REJECTED', 'Rejected'], ['all', 'All']].map(([id, l]) => [id, l, id === 'all' ? all.length : all.filter((c) => c.status === id).length])} />
      <Success>{done}</Success>
      <ErrorMsg error={claims.error || error} />
      {claims.data && list.length === 0 && <div className="panel"><Empty icon={ShieldAlert} title={filter === 'OPEN' ? 'No open issues' : 'Nothing here'} /></div>}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {list.map((c) => {
          const d = orderOf.get(c.orderId)
          return (
            <article key={c.id} className="panel flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-semibold">{REASON[c.reason]}</h2>
                <span className={`badge ${c.status === 'OPEN' ? 'bg-ink text-white' : 'bg-cotton text-muted ring-1 ring-line'}`}>{c.status === 'OPEN' ? 'Open' : c.status === 'REFUNDED' ? 'Refunded' : 'Rejected'}</span>
                <span className="num ml-auto text-xs text-muted">Order #{c.orderId} · {timeAgo(c.createdAt)}</span>
              </div>
              {d && (
                <p className="text-sm">
                  <span className="font-medium">{d.shopName}</span>
                  <span className="text-muted"> → {d.customer?.name} · <span className="num">{money(d.order.total)}</span> · {d.items.map((i) => i.productName).join(', ')}</span>
                </p>
              )}
              <p className="rounded-lg bg-cotton px-3 py-2 text-sm">“{c.details}”</p>
              {c.evidenceUrl && (
                <a href={c.evidenceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline underline-offset-2">
                  <FileText className="size-4" aria-hidden /> Open customer's photos <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
              {c.status === 'OPEN' ? (
                <>
                  <Field label="Note" hint="Shown to the customer and the seller.">
                    <textarea className="input" rows={2} maxLength={500} autoComplete="off" value={notes[c.id] || ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <button className="btn-quiet" onClick={() => decide(c, false)} disabled={busyId === c.id}>Reject</button>
                    <button className="btn" onClick={() => decide(c, true)} disabled={busyId === c.id}>{busyId === c.id ? 'Saving…' : 'Refund in full'}</button>
                  </div>
                </>
              ) : c.resolutionNote && <p className="text-sm text-muted">Decision: {c.resolutionNote}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- sellers

/** NID + where the seller is paid. Staff only. */
function SellerIdentity({ s }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      <dt className="text-muted">NID</dt><dd className="num">{s.nidNumber}</dd>
      {s.mobileBankingNumber && <><dt className="text-muted">{({ BKASH: 'bKash', NAGAD: 'Nagad', ROCKET: 'Rocket' })[s.mobileBankingProvider]}</dt><dd className="num">{s.mobileBankingNumber}</dd></>}
      {s.bankAccountNumber && <><dt className="text-muted">Bank</dt><dd><span className="num">{s.bankAccountNumber}</span> · {s.bankName}{s.bankBranch && `, ${s.bankBranch}`} · {s.bankAccountName}</dd></>}
    </dl>
  )
}

function Sellers({ sellers, canSuspend }) {
  const balances = useLoad(() => (canSuspend ? api('/api/orders/balances') : Promise.resolve([])), [canSuspend])
  const balanceOf = (id) => balances.data?.find((b) => b.sellerId === id)
  const settle = async (s, b) => {
    const owes = Number(b.amount) < 0
    const reference = prompt(`${owes ? `${s.shopName} pays the platform` : `Platform pays ${s.shopName}`} ${money(Math.abs(Number(b.amount)))} for ${b.orderCount} orders.\n\nEnter the payment reference (bKash TrxID, bank reference or receipt number) once the money has moved:`)
    if (!reference?.trim()) return
    setError(null)
    setBusyId(s.id)
    try {
      await api('/api/orders/settlements', { method: 'POST', body: { sellerId: s.id, reference: reference.trim() } })
      setDone(`Settlement with ${s.shopName} recorded.`)
      await balances.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const all = sellers.data || []
  const FILTERS = [['all', 'All'], ['VERIFIED', 'Verified'], ['PENDING', 'Pending'], ['SUSPENDED', 'Suspended']]
  const needle = q.trim().toLowerCase()
  const list = all.filter((s) => (filter === 'all' || s.status === filter)
    && (!needle || s.shopName.toLowerCase().includes(needle) || s.address.toLowerCase().includes(needle)))

  const toggle = async (s) => {
    const suspend = s.status === 'VERIFIED'
    if (!confirm(suspend
      ? `Suspend ${s.shopName}? Customers will stop seeing its products right away.`
      : `Reinstate ${s.shopName}? Its products become visible again.`)) return
    setError(null)
    setBusyId(s.id)
    try {
      await api(`/api/sellers/${s.id}/suspension`, { method: 'POST', body: { suspended: suspend } })
      setDone(`${s.shopName} ${suspend ? 'suspended' : 'reinstated'}.`)
      await sellers.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3" aria-label="Sellers">
      <SectionHead title="Sellers" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Segmented label="Filter sellers" value={filter} onChange={setFilter}
                   options={FILTERS.map(([id, label]) => [id, label, id === 'all' ? all.length : all.filter((s) => s.status === id).length])} />
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" type="search" autoComplete="off" aria-label="Search sellers" placeholder="Shop name or area…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <Success>{done}</Success>
      <ErrorMsg error={sellers.error || error} />
      <div className="panel divide-y divide-line">
        {sellers.data && list.length === 0 && <Empty icon={Store} title="No shops found" />}
        {list.map((s) => (
          <article key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar name={s.shopName} />
            <div className="min-w-0 flex-1 basis-52">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 className="truncate text-sm font-semibold">{s.shopName}</h2>
                <StatusBadge status={s.status} />
                <Rating score={s.qualityScore} className="text-xs" />
              </div>
              <p className="truncate text-xs text-muted">
                {s.address} · delivers <span className="num">{(s.deliveryRadiusM / 1000).toFixed(0)}</span> km
              </p>
              <details className="mt-1">
                <summary className="inline-flex min-h-9 cursor-pointer items-center text-xs font-medium underline underline-offset-2">NID and payout account</summary>
                <SellerIdentity s={s} />
              </details>
              {balanceOf(s.id) && Number(balanceOf(s.id).amount) !== 0 && (
                <p className="mt-1 text-xs">
                  <span className="font-semibold">{Number(balanceOf(s.id).amount) < 0 ? 'Owes us' : 'We owe'} <span className="num">{money(Math.abs(Number(balanceOf(s.id).amount)))}</span></span>
                  <span className="text-muted"> · {balanceOf(s.id).orderCount} delivered {balanceOf(s.id).orderCount === 1 ? 'order' : 'orders'} · commission <span className="num">{money(balanceOf(s.id).commission)}</span></span>
                </p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <a className="btn-quiet px-3" target="_blank" rel="noreferrer noopener" href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} aria-label={`${s.shopName} on the map`}>
                <MapPin className="size-4" aria-hidden />
              </a>
              {canSuspend && balanceOf(s.id) && (
                <button className="btn-quiet" onClick={() => settle(s, balanceOf(s.id))} disabled={busyId === s.id}>Settle</button>
              )}
              {canSuspend && s.status !== 'PENDING' && (
                <button className={s.status === 'VERIFIED' ? 'btn-danger' : 'btn'} onClick={() => toggle(s)} disabled={busyId === s.id}>
                  {busyId === s.id ? 'Saving…' : s.status === 'VERIFIED' ? 'Suspend' : 'Reinstate'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- orders

function Orders({ orders, sellerById }) {
  const [filter, setFilter] = useState('open')
  const [q, setQ] = useState('')
  const all = orders.data || []
  const FILTERS = [
    ['open', 'Open', (o) => OPEN.includes(o.status)],
    ['DELIVERED', 'Delivered', (o) => o.status === 'DELIVERED'],
    ['CANCELLED', 'Cancelled', (o) => o.status === 'CANCELLED'],
    ['all', 'All', () => true],
  ]
  const test = FILTERS.find(([id]) => id === filter)[2]
  const needle = q.trim().toLowerCase().replace('#', '')
  const list = all.filter(({ order, customer }) => test(order) && (!needle || String(order.id).includes(needle)
    || sellerById.get(order.sellerId)?.shopName.toLowerCase().includes(needle)
    || customer?.name?.toLowerCase().includes(needle) || customer?.phone?.includes(needle)))

  return (
    <section className="space-y-3" aria-label="Orders">
      <SectionHead title="Orders">
        <span className="text-xs text-muted">Latest 300</span>
      </SectionHead>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Segmented label="Filter orders" value={filter} onChange={setFilter}
                   options={FILTERS.map(([id, label, t]) => [id, label, all.filter(({ order }) => t(order)).length])} />
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" type="search" autoComplete="off" aria-label="Search orders" placeholder="Order #, shop or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <ErrorMsg error={orders.error} />
      <div className="panel divide-y divide-line">
        {orders.data && list.length === 0 && <Empty icon={ClipboardList} title="No orders here" />}
        {list.map(({ order, items, payment, customer }) => (
          <article key={order.id} className="grid gap-1.5 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="num text-sm font-semibold">#{order.id}</h2>
                <StatusBadge status={order.status} />
                <PayBadge payment={payment} />
                <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
              </div>
              <p className="mt-1 truncate text-sm">
                <span className="font-medium">{sellerById.get(order.sellerId)?.shopName || `Shop #${order.sellerId}`}</span>
                <span className="text-muted"> → {customer?.name || 'Customer'}, {order.deliveryAddress}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              {customer && (
                <a href={`tel:${customer.phone}`} className="inline-flex min-h-9 items-center gap-1 text-xs text-muted hover:text-ink">
                  <Phone className="size-3.5" aria-hidden /><span className="num">{customer.phone}</span>
                </a>
              )}
              <span className="num ml-auto text-sm font-semibold sm:ml-0">{money(order.total)}<span className="block text-right text-xs font-normal text-muted">{items.length} {items.length === 1 ? 'item' : 'items'}</span></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- verification queue

function Queue({ queue, sellerById, onDecided }) {
  const [notes, setNotes] = useState({})
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [last, setLast] = useState(null)
  const [opened, setOpened] = useState({}) // request id -> documents link opened

  const decide = async (r, approve) => {
    if (approve && !confirm(opened[r.id]
      ? `Approve ${r.seller.shopName}? It will be able to sell immediately.`
      : `You haven't opened ${r.seller.shopName}'s documents yet. Approve anyway?`)) return
    if (!approve && !notes[r.id]?.trim()) {
      setError(new Error('Write a note before rejecting, so the seller knows what to fix.'))
      return
    }
    if (!approve && !confirm(`Reject ${r.seller.shopName}? The seller will see your note.`)) return
    setError(null)
    setBusyId(r.id)
    try {
      await api(`/api/verifications/${r.id}/decision`, { method: 'POST', body: { approve, note: notes[r.id]?.trim() || null } })
      setLast(`${r.seller.shopName} ${approve ? 'approved — it can now list products' : 'rejected'}.`)
      await queue.reload()
      onDecided()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }
  const requests = (queue.data || []).map((r) => ({ ...r, seller: sellerById.get(r.sellerId) })).filter((r) => r.seller)

  return (
    <section className="space-y-3" aria-label="Verification queue">
      <SectionHead title="Verification" />
      <Success>{last}</Success>
      <ErrorMsg error={queue.error || error} />
      {queue.loading && !queue.data && <p className="text-muted">Loading requests…</p>}
      {queue.data?.length === 0 && (
        <div className="panel">
          <Empty icon={ShieldCheck} title="The queue is clear" />
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {requests.map((r) => (
          <article key={r.id} className="panel flex flex-col gap-3.5 p-4">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold">{r.seller.shopName}</h2>
                <span className="num ml-auto text-sm text-muted">Request #{r.id}</span>
              </div>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {r.seller.address}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Location</dt>
                <dd>
                  <a className="inline-flex items-center gap-1 font-medium text-brand-800 underline" target="_blank" rel="noreferrer noopener"
                     href={`https://www.google.com/maps?q=${r.seller.lat},${r.seller.lng}`}>
                    Open map <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Delivers within</dt>
                <dd className="num font-medium">{(r.seller.deliveryRadiusM / 1000).toFixed(1)} km</dd>
              </div>
            </dl>
            <SellerIdentity s={r.seller} />
            <a href={r.documentUrl} target="_blank" rel="noreferrer noopener" onClick={() => setOpened({ ...opened, [r.id]: true })}
               className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-cotton px-3 text-[15px] font-medium text-brand-900 hover:border-brand-200 hover:bg-brand-50">
              <FileText className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">Review documents</span>
              <ExternalLink className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
            </a>
            <Field label="Note" hint="Required when rejecting.">
              <textarea className="input" rows={2} maxLength={500} autoComplete="off" value={notes[r.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
            </Field>
            <div className="flex items-center justify-end gap-2">
              <button className="btn-danger" onClick={() => decide(r, false)} disabled={busyId === r.id}>Reject</button>
              <button className="btn" onClick={() => decide(r, true)} disabled={busyId === r.id}>
                <ShieldCheck className="size-4" aria-hidden /> {busyId === r.id ? 'Saving…' : 'Approve shop'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- catalogue

/** Pick a group and a product; edit or remove it, and add, edit or remove its varieties. */
function Catalog() {
  const categories = useLoad(() => api('/api/catalog/categories'))
  const products = useLoad(() => api('/api/catalog/products'))
  const [picked, setPicked] = useState('')
  const [pid, setPid] = useState('')
  const [panel, setPanel] = useState(null) // { kind: 'product', product?, parent? } | { kind: 'categories' }
  const [variety, setVariety] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const cats = categories.data || []
  const all = products.data || []
  const groups = cats.filter((c) => !c.parentId).sort(byName)
  const group = picked || String(groups[0]?.id || '')
  const inGroup = all.filter((p) => !p.parentId && String(p.categoryId) === group).sort(byName)
  const product = all.find((p) => String(p.id) === pid)
  const varieties = product ? all.filter((p) => p.parentId === product.id).sort(byName) : []
  const short = (v) => (v.name.startsWith(`${product.name} - `) ? v.name.slice(product.name.length + 3) : v.name)

  const remove = async (p, label) => {
    if (!window.confirm(`Remove ${label}? This can't be undone.`)) return
    setError(null)
    setBusy(p.id)
    try {
      await api(`/api/catalog/products/${p.id}`, { method: 'DELETE' })
      if (p.id === product?.id) setPid('')
      await products.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  const addVariety = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy('add')
    try {
      await api('/api/catalog/products', { method: 'POST', body: { categoryId: product.categoryId, parentId: product.id, name: variety.trim() } })
      setVariety('')
      await products.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  const iconBtn = 'inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink disabled:opacity-40'

  return (
    <div className="space-y-4">
      <SectionHead title="Catalogue">
        <button className="btn-outline" onClick={() => setPanel({ kind: 'categories' })}><Tags className="size-4" aria-hidden /> Groups</button>
        <button className="btn max-sm:hidden" onClick={() => setPanel({ kind: 'product' })}><Plus className="size-4" aria-hidden /> Add product</button>
        <Fab label="Product" onClick={() => setPanel({ kind: 'product' })} />
      </SectionHead>
      <ProductRequests categories={cats} onApproved={products.reload} />

      <section className="panel mx-auto max-w-2xl" aria-label="Product">
        <div className="grid grid-cols-2 gap-2 p-4">
          <Picker label="Group" value={String(group)} options={groups.map((g) => ({ value: String(g.id), label: g.name }))} onChange={(v) => { setPicked(v); setPid('') }} />
          <Picker label="Product" value={String(pid)} disabled={!inGroup.length} placeholder={inGroup.length ? `Choose (${inGroup.length})` : 'None yet'}
                  options={inGroup.map((p) => ({ value: String(p.id), label: p.name }))} onChange={(v) => { setPid(v); setError(null) }} />
        </div>
        <div className="px-4 empty:hidden"><ErrorMsg error={error || products.error || categories.error} /></div>

        {product && (
          <>
            <div className="flex items-center gap-3 border-t border-line px-4 py-3">
              <ProductImage src={product.imageUrl} small className="size-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{product.name}</p>
                {product.originRegion && <p className="truncate text-xs text-muted">{product.originRegion}</p>}
              </div>
              <button className={iconBtn} aria-label={`Edit ${product.name}`} onClick={() => setPanel({ kind: 'product', product })}><Pencil className="size-4" aria-hidden /></button>
              <button className={iconBtn} aria-label={`Remove ${product.name}`} disabled={busy === product.id} onClick={() => remove(product, product.name)}><Trash2 className="size-4" aria-hidden /></button>
            </div>

            <div className="border-t border-line">
              <h3 className="flex items-baseline gap-2 px-4 pt-3 text-sm font-semibold">Varieties <span className="num font-normal text-muted">{varieties.length}</span></h3>
              <ul className="mt-1 divide-y divide-line">
                {varieties.map((v) => (
                  <li key={v.id} className="flex items-center gap-2 py-0.5 pl-4 pr-2">
                    <span className="min-w-0 flex-1 truncate text-[15px]">{short(v)}</span>
                    <button className={iconBtn} aria-label={`Edit ${v.name}`} onClick={() => setPanel({ kind: 'product', product: v })}><Pencil className="size-4" aria-hidden /></button>
                    <button className={iconBtn} aria-label={`Remove ${v.name}`} disabled={busy === v.id} onClick={() => remove(v, short(v))}><Trash2 className="size-4" aria-hidden /></button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addVariety} className="flex gap-2 border-t border-line p-4">
                <input className="input" required maxLength={150} autoComplete="off" aria-label={`New variety of ${product.name}`}
                       placeholder="New variety, e.g. হিমসাগর" value={variety} onChange={(e) => setVariety(e.target.value)} />
                <button className="btn shrink-0" disabled={busy === 'add'}>{busy === 'add' ? 'Adding…' : 'Add'}</button>
              </form>
            </div>
          </>
        )}
      </section>

      {panel?.kind === 'product' && (
        <Drawer title={panel.product ? `Edit ${panel.product.parentId ? 'variety' : 'product'}` : 'Add product'} onClose={() => setPanel(null)}>
          <ProductForm product={panel.product} group={group} categories={cats} products={all}
                       onSaved={() => { setPanel(null); products.reload() }} />
        </Drawer>
      )}
      {panel?.kind === 'categories' && (
        <Drawer title="Groups" onClose={() => { setPanel(null); categories.reload() }}>
          <Categories categories={categories} />
        </Drawer>
      )}
    </div>
  )
}

const byName = (a, b) => a.name.localeCompare(b.name)

/** Right-hand panel on desktop, bottom sheet on phones. */
/** Products sellers asked for. Approve = it is added to the catalogue and the seller is told. */
function ProductRequests({ categories, onApproved }) {
  const requests = useLoad(() => api('/api/product-requests'))
  const [picked, setPicked] = useState({}) // request id -> category id
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const pending = (requests.data || []).filter((r) => r.status === 'PENDING')
  const leaf = [...(categories || [])].sort(byName)

  const decide = async (r, approve) => {
    const note = approve ? null : prompt(`Why can't “${r.name}” be added? The seller sees this.`)
    if (!approve && !note?.trim()) return
    setError(null)
    setBusyId(r.id)
    try {
      await api(`/api/product-requests/${r.id}/decision`, { method: 'POST', body: { approve, categoryId: Number(picked[r.id] || r.categoryId) || null, note } })
      await requests.reload()
      if (approve) onApproved()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (pending.length === 0 && !requests.error) return null
  return (
    <section className="panel" aria-labelledby="requests-heading">
      <h2 id="requests-heading" className="border-b border-line px-4 py-2.5 text-sm font-semibold">Products sellers asked for <span className="num text-muted">{pending.length}</span></h2>
      <div className="px-4 empty:hidden"><ErrorMsg error={requests.error || error} /></div>
      <ul className="divide-y divide-line">
        {pending.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <span className="min-w-0 flex-1 basis-40 text-sm font-medium">{r.name}{r.note && <span className="block text-xs font-normal text-muted">{r.note}</span>}</span>
            <select className="input w-auto" aria-label={`Category for ${r.name}`} value={picked[r.id] ?? r.categoryId ?? ''} onChange={(e) => setPicked({ ...picked, [r.id]: e.target.value })}>
              <option value="">Group…</option>
              {leaf.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-quiet" onClick={() => decide(r, false)} disabled={busyId === r.id}>Reject</button>
            <button className="btn" onClick={() => decide(r, true)} disabled={busyId === r.id || !(picked[r.id] || r.categoryId)}>{busyId === r.id ? 'Saving…' : 'Add to catalogue'}</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const ACTION = {
  SELLER_VERIFIED: 'verified a shop', VERIFICATION_REJECTED: 'rejected a verification', SELLER_SUSPENDED: 'suspended a shop', SELLER_REINSTATED: 'reinstated a shop',
  CLAIM_REFUNDED: 'refunded an order', CLAIM_REJECTED: 'rejected an issue', SETTLED: 'recorded a settlement', PAYOUT_ACCOUNT_CHANGED: 'changed a payout account',
}

/** Who did what: approvals, suspensions, refunds, settlements, payout-account changes. */
function AuditTrail() {
  const log = useLoad(() => api('/api/audit'))
  if (!log.data?.length) return null
  return (
    <section className="panel" aria-labelledby="audit-heading">
      <h2 id="audit-heading" className="border-b border-line px-4 py-2.5 text-sm font-semibold">Recent staff and account actions</h2>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto text-sm">
        {log.data.slice(0, 30).map((a) => (
          <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2">
            <span>User #{a.actorId} {ACTION[a.action] || a.action.toLowerCase()} <span className="text-muted">· {a.entity} #{a.entityId}</span></span>
            {a.details && <span className="text-xs text-muted">{a.details}</span>}
            <span className="ml-auto text-xs text-muted">{timeAgo(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const IMAGE_PATTERN = '(https?://|/).+'

function Categories({ categories }) {
  const EMPTY_CAT = { id: null, name: '', imageUrl: '', parentId: '', commissionRate: 8 }
  const [form, setForm] = useState(EMPTY_CAT)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const cats = categories.data || []
  const groups = cats.filter((c) => !c.parentId).sort(byName)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const edit = (c) => { setError(null); setForm({ id: c.id, name: c.name, imageUrl: c.imageUrl || '', parentId: c.parentId ? String(c.parentId) : '', commissionRate: c.commissionRate }) }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const body = { name: form.name.trim(), imageUrl: form.imageUrl.trim() || null, parentId: form.parentId ? Number(form.parentId) : null, commissionRate: Number(form.commissionRate) }
      await api(form.id ? `/api/catalog/categories/${form.id}` : '/api/catalog/categories', { method: form.id ? 'PUT' : 'POST', body })
      setForm(EMPTY_CAT)
      categories.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-xl bg-cotton p-4">
        <p className="text-sm font-semibold">{form.id ? `Edit ${form.name || 'group'}` : 'New group'}</p>
        <Field label="Name"><input className="input" required maxLength={100} autoComplete="off" value={form.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <Field label="Commission %">
            <input className="input num" type="number" inputMode="decimal" min="0" max="30" step="0.5" required value={form.commissionRate} onChange={set('commissionRate')} />
          </Field>
          <Field label="Image">
            <input className="input" maxLength={500} autoComplete="off" spellCheck={false} placeholder="/products/…" pattern={IMAGE_PATTERN}
                   title="A link starting with https:// or /" value={form.imageUrl} onChange={set('imageUrl')} />
          </Field>
        </div>
        <ErrorMsg error={error} />
        <div className="flex gap-2">
          {form.id && <button type="button" className="btn-outline flex-1" onClick={() => setForm(EMPTY_CAT)}>Cancel</button>}
          <button className="btn flex-1" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save' : 'Add'}</button>
        </div>
      </form>

      <ul className="space-y-0.5">
        {groups.map((g) => (
          <li key={g.id}>
            <CategoryRow c={g} active={form.id === g.id} onEdit={() => edit(g)} />
            <ul className="ml-5 border-l border-line pl-3">
              {cats.filter((c) => c.parentId === g.id).sort(byName).map((c) => (
                <li key={c.id}><CategoryRow c={c} active={form.id === c.id} onEdit={() => edit(c)} /></li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryRow({ c, strong, active, onEdit }) {
  return (
    <button onClick={onEdit} aria-label={`Edit ${c.name}`}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-brand-50 ${active ? 'bg-brand-50 ring-1 ring-ink' : ''}`}>
      <ProductImage src={c.imageUrl} small className="size-8 shrink-0 rounded-md" />
      <span className={`min-w-0 flex-1 truncate ${strong ? 'font-semibold' : 'text-sm'}`}>{c.name}</span>
      {!strong && <span className="num text-xs text-muted">{Number(c.commissionRate)}%</span>}
      <Pencil className="size-3.5 text-muted" aria-hidden />
    </button>
  )
}

const EMPTY = { group: '', categoryId: '', kind: 'product', parentId: '', name: '', description: '', originRegion: '', imageUrl: '' }

/** Group → category → product, or a variety of an existing product. */
function ProductForm({ product, parent, group, categories, products, onSaved }) {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const byId = new Map(products.map((p) => [p.id, p]))
  const groupOf = (cid) => { const c = catById.get(cid); return c ? String(c.parentId ?? c.id) : '' }
  const base = product?.parentId ? byId.get(product.parentId) : parent
  const strip = (name) => (base && name.startsWith(`${base.name} - `) ? name.slice(base.name.length + 3) : name)
  const [form, setForm] = useState(() => {
    const cid = product?.categoryId ?? base?.categoryId
    return {
      ...EMPTY, group: cid ? groupOf(cid) : group || '', categoryId: cid ? String(cid) : '',
      kind: base ? 'variety' : 'product', parentId: base ? String(base.id) : '',
      ...(product && { name: strip(product.name), description: product.description || '', originRegion: product.originRegion || '', imageUrl: product.imageUrl || '' }),
    }
  })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const groups = categories.filter((c) => !c.parentId).sort(byName)
  const subs = categories.filter((c) => String(c.parentId) === form.group).sort(byName)
  const inCat = products.filter((p) => !p.parentId && String(p.categoryId) === (form.categoryId || form.group) && p.id !== product?.id).sort(byName)
  const chosen = byId.get(Number(form.parentId))
  const siblings = products.filter((p) => chosen && p.parentId === chosen.id && p.id !== product?.id)
  const hasVarieties = product && products.some((p) => p.parentId === product.id)
  const variety = form.kind === 'variety'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const body = {
        categoryId: Number(form.categoryId || form.group), parentId: variety ? Number(form.parentId) : null, name: form.name.trim(),
        description: form.description.trim() || null, originRegion: form.originRegion.trim() || null, imageUrl: form.imageUrl.trim() || null,
      }
      await api(product ? `/api/catalog/products/${product.id}` : '/api/catalog/products', { method: product ? 'PUT' : 'POST', body })
      onSaved()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={`grid gap-2 ${subs.length ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Picker label="Group" required value={String(form.group)} options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                onChange={(v) => setForm({ ...form, group: v, categoryId: '', parentId: '' })} />
        {subs.length > 0 && (
          <Picker label="Category" required value={String(form.categoryId)} options={subs.map((c) => ({ value: String(c.id), label: c.name }))}
                  onChange={(v) => setForm({ ...form, categoryId: v, parentId: '' })} />
        )}
      </div>

      {!hasVarieties && (
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-0.5" role="group" aria-label="Type">
          {[['product', 'Product'], ['variety', 'Variety of a product']].map(([id, text]) => (
            <button key={id} type="button" aria-pressed={form.kind === id} onClick={() => setForm({ ...form, kind: id, parentId: id === 'product' ? '' : form.parentId })}
                    className={`min-h-10 rounded-md text-sm font-medium ${form.kind === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{text}</button>
          ))}
        </div>
      )}

      {variety && (
        <Picker label="Product" required disabled={!form.group || (subs.length > 0 && !form.categoryId) || !inCat.length} value={String(form.parentId)}
                placeholder={inCat.length ? `Choose (${inCat.length})` : 'No products in this category'}
                options={inCat.map((p) => ({ value: String(p.id), label: p.name }))} onChange={(v) => setForm({ ...form, parentId: v })} />
      )}
      {variety && siblings.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Existing varieties">
          {siblings.sort(byName).map((v) => (
            <span key={v.id} className="rounded-full bg-cotton px-2.5 py-1 text-xs ring-1 ring-line">{v.name.slice(chosen.name.length + 3) || v.name}</span>
          ))}
        </div>
      )}

      <Field label={variety ? 'Variety' : 'Name'}>
        <input className="input" required maxLength={200} autoComplete="off" placeholder={variety ? 'হিমসাগর' : 'আম'} value={form.name} onChange={set('name')} />
      </Field>
      {variety && chosen && form.name.trim() && <p className="-mt-2 text-sm text-muted">Saved as <span className="font-medium text-ink">{chosen.name} - {form.name.trim()}</span></p>}

      <div className="flex items-end gap-3">
        <ProductImage src={form.imageUrl.trim() || null} className="size-16 shrink-0 rounded-xl" />
        <Field label="Photo">
          <input className="input" maxLength={500} autoComplete="off" spellCheck={false} placeholder="https://… or /products/…" pattern={IMAGE_PATTERN}
                 title="A link starting with https:// or /" value={form.imageUrl} onChange={set('imageUrl')} />
        </Field>
      </div>
      <Field label="Origin"><input className="input" maxLength={100} autoComplete="off" placeholder="Rajshahi" value={form.originRegion} onChange={set('originRegion')} /></Field>
      <Field label="Description"><textarea className="input" rows={3} maxLength={2000} value={form.description} onChange={set('description')} /></Field>
      <ErrorMsg error={error} />
      <button className="btn w-full" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : variety ? 'Add variety' : 'Add product'}</button>
    </form>
  )
}
