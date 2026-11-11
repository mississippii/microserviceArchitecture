import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Check, ChevronDown, MoreVertical, Pencil, ReceiptText, Trash2, Users, UserRound, Banknote, Wallet, ClipboardList, ExternalLink, Inbox, LayoutDashboard, MapPin, MessageSquare, Package,
  Copy, Minus, PackagePlus, Phone, Plus, Receipt, RefreshCw, Search, Share2, ShieldCheck, Star, Store, X,
} from 'lucide-react'
import { ProductImage, Rating } from '../product-ui'
import { Accounts, Customers, DayBook, EXPENSE, METHODS, METHOD_LABEL, SectionHead } from './Books'
import { UNITS, api, isLoose, money, per, qty } from '../api'
import {
  Console, Drawer, Empty, ErrorMsg, Fab, Field, FormSection, Picker, LocateButton, PayBadge, Segmented, StatusBadge, StitchTrail, Success, initials, timeAgo, useLoad,
} from '../ui'

const ORDER_STEPS = ['Placed', 'Accepted', 'Shipped', 'Delivered']
const STEP_OF = { PLACED: 1, ACCEPTED: 2, SHIPPED: 3, DELIVERED: 4, CANCELLED: 1 }
const NEXT = { PLACED: 'ACCEPTED', ACCEPTED: 'SHIPPED', SHIPPED: 'DELIVERED' }
const NEXT_LABEL = { ACCEPTED: 'Accept', SHIPPED: 'Mark shipped', DELIVERED: 'Mark delivered' }
const CANCELLABLE = ['PLACED', 'ACCEPTED']
const LOW_STOCK = 5
const isLow = (l) => Number(l.stock) <= Number(l.reorderLevel ?? LOW_STOCK)
const CLAIM_LABEL = { OPEN: 'under review', REFUNDED: 'refunded', REJECTED: 'rejected' }
const RADII = [2000, 3000, 5000, 8000, 10000, 15000, 25000]

const notFoundAsNull = (e) => (e.status === 404 ? null : Promise.reject(e))
const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()

export default function Seller() {
  const shop = useLoad(() => api('/api/sellers/me').catch(notFoundAsNull))

  if (shop.loading && shop.data === null && !shop.error) return <p className="text-muted">Loading your shop…</p>
  if (shop.error) return <ErrorMsg error={shop.error} />
  if (!shop.data) {
    return (
      <Onboarding step={0}>
        <ShopForm onSaved={shop.reload} />
      </Onboarding>
    )
  }
  if (shop.data.status === 'PENDING') {
    return (
      <Onboarding step={1} shop={shop.data}>
        <Verification />
      </Onboarding>
    )
  }
  return <Workspace shop={shop.data} onShopChange={shop.reload} />
}

// ---------------------------------------------------------------- onboarding

function Onboarding({ step, shop, children }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold sm:text-2xl">{shop ? shop.shopName : 'Open your shop'}</h1>
      <div className="mt-4 px-1">
        <StitchTrail steps={['Shop details', 'Documents', 'Verified']} done={step} tone="leaf" />
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

/** Create a shop (no `shop`) or edit the existing one. */
function ShopForm({ shop, onSaved }) {
  const [form, setForm] = useState(shop
    ? {
      shopName: shop.shopName, address: shop.address, lat: shop.lat, lng: shop.lng, deliveryRadiusM: shop.deliveryRadiusM,
      nidNumber: shop.nidNumber, mobileBankingProvider: shop.mobileBankingProvider || 'BKASH', mobileBankingNumber: shop.mobileBankingNumber || '',
      bankName: shop.bankName || '', bankAccountName: shop.bankAccountName || '', bankAccountNumber: shop.bankAccountNumber || '', bankBranch: shop.bankBranch || '',
    }
    : {
      shopName: '', address: '', lat: '', lng: '', deliveryRadiusM: 5000, nidNumber: '',
      mobileBankingProvider: 'BKASH', mobileBankingNumber: '', bankName: '', bankAccountName: '', bankAccountNumber: '', bankBranch: '',
    })
  const nidLocked = shop && shop.status !== 'PENDING'
  const hasPayout = form.mobileBankingNumber.trim() || form.bankAccountNumber.trim()
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setSaved(false); setForm({ ...form, [k]: e.target.value }) }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api(shop ? '/api/sellers/me' : '/api/sellers', {
        method: shop ? 'PUT' : 'POST',
        body: {
          ...form, lat: Number(form.lat), lng: Number(form.lng), deliveryRadiusM: Number(form.deliveryRadiusM),
          mobileBankingProvider: form.mobileBankingNumber.trim() ? form.mobileBankingProvider : null,
        },
      })
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-3 sm:p-4">
      {shop && <h2 className="font-semibold">Shop details</h2>}
      <Field label="Shop name"><input className="input" name="organization" autoComplete="organization" required maxLength={150} value={form.shopName} onChange={set('shopName')} /></Field>
      <Field label="Address">
        <input className="input" name="street-address" autoComplete="street-address" required maxLength={300} value={form.address} onChange={set('address')} />
      </Field>
      <fieldset>
        <legend className="label">Shop location</legend>
        <div className="flex flex-wrap items-start gap-2">
          <input className="input num w-32" aria-label="Latitude" autoComplete="off" placeholder="Latitude…" type="number" step="any" min="-90" max="90" required value={form.lat} onChange={set('lat')} />
          <input className="input num w-32" aria-label="Longitude" autoComplete="off" placeholder="Longitude…" type="number" step="any" min="-180" max="180" required value={form.lng} onChange={set('lng')} />
          <LocateButton onPick={({ lat, lng }) => { setSaved(false); setForm({ ...form, lat, lng }) }} />
        </div>
        <span className="hint">Tap “Use my location” while you are at the shop.</span>
      </fieldset>
      <Field label="Delivery">
        <select className="input" value={form.deliveryRadiusM} onChange={set('deliveryRadiusM')}>
          {RADII.map((m) => <option key={m} value={m}>{m / 1000} km</option>)}
        </select>
      </Field>
      <Field label="NID" hint={nidLocked ? 'Verified by our team. Contact support to correct it.' : 'Your national ID: 10, 13 or 17 digits. Only our verification team sees it.'}>
        <input className="input num" inputMode="numeric" autoComplete="off" required pattern="[0-9]{10}|[0-9]{13}|[0-9]{17}" title="10, 13 or 17 digits"
               disabled={nidLocked} value={form.nidNumber} onChange={set('nidNumber')} />
      </Field>

      <fieldset className="space-y-3 border-t border-line pt-4">
        <legend className="float-left w-full text-sm font-semibold">How we pay you</legend>
        <p className="clear-both text-xs text-muted">Add a mobile banking number, a bank account, or both. Customers never see this.</p>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <Field label="Mobile banking">
            <select className="input" value={form.mobileBankingProvider} onChange={set('mobileBankingProvider')}>
              <option value="BKASH">bKash</option><option value="NAGAD">Nagad</option><option value="ROCKET">Rocket</option>
            </select>
          </Field>
          <Field label="Account no.">
            <input className="input num" type="tel" inputMode="numeric" autoComplete="off" placeholder="01712345678…" pattern="01[3-9][0-9]{8}" title="Bangladeshi mobile number, e.g. 01712345678"
                   required={!hasPayout} value={form.mobileBankingNumber} onChange={set('mobileBankingNumber')} />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Bank name"><input className="input" autoComplete="off" maxLength={100} required={!!form.bankAccountNumber.trim()} value={form.bankName} onChange={set('bankName')} /></Field>
          <Field label="Account no."><input className="input num" inputMode="numeric" autoComplete="off" pattern="[0-9]{0,30}" title="Digits only" value={form.bankAccountNumber} onChange={set('bankAccountNumber')} /></Field>
          <Field label="Holder"><input className="input" autoComplete="off" maxLength={100} required={!!form.bankAccountNumber.trim()} value={form.bankAccountName} onChange={set('bankAccountName')} /></Field>
          <Field label="Branch"><input className="input" autoComplete="off" maxLength={100} value={form.bankBranch} onChange={set('bankBranch')} /></Field>
        </div>
      </fieldset>
      <ErrorMsg error={error} />
      {shop && saved && <Success>Shop details saved.</Success>}
      <button className="btn w-full sm:w-auto" disabled={busy}>
        {busy ? 'Saving…' : shop ? 'Save changes' : 'Create shop'}
      </button>
    </form>
  )
}

/** Shows the latest verification request; lets the seller (re)send documents. */
function Verification() {
  const latest = useLoad(() => api('/api/verifications/me').catch(notFoundAsNull))
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const req = latest.data

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/verifications', { method: 'POST', body: { documentUrl: url } })
      await latest.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (latest.loading && !req) return <p className="text-muted">Loading…</p>
  if (req?.status === 'PENDING') {
    return (
      <div className="panel space-y-2 p-4 sm:p-5">
        <Success>Documents sent. Our team will check them and may visit your shop. This page shows “Verified” when you're approved.</Success>
        <a href={req.documentUrl} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline underline-offset-2">
          View what you sent <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="panel space-y-3 p-3 sm:p-4">
      {req?.status === 'REJECTED' && (
        <ErrorMsg error={`Your documents were not accepted${req.note ? `: “${req.note}”` : '.'} Fix this and send them again.`} />
      )}
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <h2 className="font-semibold">Send your documents</h2>
          <p className="mt-0.5 text-sm text-muted">
            Put your NID, trade licence and proof of where your products come from in one shared folder (for example Google Drive), and paste the link.
          </p>
        </div>
      </div>
      <Field label="Documents">
        <input className="input" type="url" autoComplete="off" spellCheck={false} required maxLength={500} placeholder="https://drive.google.com/…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <ErrorMsg error={error || latest.error} />
      <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'Send for verification'}</button>
    </form>
  )
}

// ---------------------------------------------------------------- workspace

const TABS = ['home', 'sell', 'orders', 'stock', 'customers', 'accounts', 'daybook']

function Workspace({ shop, onShopChange }) {
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'home'
  const setTab = (t, product) => { setParams(product ? { tab: t, product } : { tab: t }, { replace: true }); window.scrollTo({ top: 0 }) }
  const products = useLoad(() => api('/api/catalog/products'))
  const listings = useLoad(() => api('/api/listings/me'))
  const orders = useLoad(() => api('/api/orders/seller'))
  const shopSales = useLoad(() => api('/api/shop-sales'))
  const [saleMsg, setSaleMsg] = useState(null)
  const [selling, setSelling] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const productById = useMemo(() => new Map((products.data || []).map((p) => [p.id, p])), [products.data])
  const productOfListing = useMemo(() => {
    const m = new Map((listings.data || []).map((l) => [l.id, productById.get(l.productId) || { name: `Product #${l.productId}` }]))
    return (listingId) => m.get(listingId) || { name: `Listing #${listingId}` }
  }, [listings.data, productById])

  const all = orders.data || []
  const openCount = all.filter(({ order }) => NEXT[order.status]).length

  const identity = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-sm font-semibold text-white">{initials(shop.shopName)}</span>
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{shop.shopName}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          {shop.status === 'VERIFIED' ? <><ShieldCheck className="size-3.5" aria-hidden /> Verified shop</> : <StatusBadge status={shop.status} />}
        </p>
      </div>
    </div>
  )

  return (
    <Console identity={identity} value={tab} onChange={setTab} tabs={[
      { id: 'home', label: 'Home', icon: LayoutDashboard },
      { id: 'sell', label: 'Sells', icon: Receipt },
      { id: 'orders', label: 'Orders', icon: ClipboardList, count: openCount || undefined },
      { id: 'stock', label: 'Stock', icon: Package },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'accounts', label: 'Accounts', icon: Wallet },
      { id: 'daybook', label: 'Day book', icon: BookOpen },
    ]}>
      {shop.status === 'SUSPENDED' && (
        <ErrorMsg error="Your shop is suspended, so customers can't see your products. Finish your open orders and contact support to resolve it." />
      )}
      {tab === 'home' && <Inventory listings={listings} productById={productById} go={setTab} onSell={(l) => { setSaleMsg(null); setSelling(l) }} />}
      {tab === 'sell' && <SalesLog sales={shopSales} orders={orders} listings={listings} done={saleMsg} onNew={() => { setSaleMsg(null); setSelling(true) }} />}
      {selling && (
        <Counter key={selling === true ? 'new' : selling.id} preset={selling === true ? null : selling} listings={listings} productById={productById} sales={shopSales}
                 onClose={() => setSelling(false)} onDone={(msg) => { setSaleMsg(msg); setSelling(false); if (tab !== 'sell') setTab('sell') }} />
      )}
      {tab === 'orders' && <SellerOrders orders={orders} productOfListing={productOfListing} onStockChange={listings.reload} />}
      {tab === 'stock' && listings.data && products.data && (
        <StockIn key={params.get('product') || ''} preset={params.get('product') || ''} products={products} listings={listings} productById={productById} />
      )}
      {tab === 'customers' && <Customers />}
      {tab === 'daybook' && <DayBook />}
      {tab === 'accounts' && (
        <>
          <Accounts onShop={() => setShopOpen(true)} go={setTab} />
          {shopOpen && (
            <Drawer title="My shop" wide onClose={() => setShopOpen(false)}>
              <ShopTab shop={shop} onShopChange={onShopChange} />
            </Drawer>
          )}
        </>
      )}
    </Console>
  )
}

// ---------------------------------------------------------------- sell in shop


/** Counter sale for walk-in customers: takes stock from the same products customers see online. */
function Counter({ preset, listings, productById, sales, onClose, onDone }) {
  const [q, setQ] = useState('')
  const [lines, setLines] = useState(preset ? [{ listingId: preset.id, quantity: 1, unitPrice: preset.price }] : []) // { listingId, quantity, unitPrice }
  const [method, setMethod] = useState('CASH')
  const [channel, setChannel] = useState('OFFLINE') // walk-in by default; online = a known buyer, name and phone required
  const [buyer, setBuyer] = useState({ buyerName: '', buyerPhone: '' })
  const [known, setKnown] = useState(null) // name the system filled in from the phone
  const [discount, setDiscount] = useState('')
  const [paid, setPaid] = useState('') // empty = paid in full
  const online = channel === 'ONLINE'
  const setPhone = async (phone) => {
    setBuyer((b) => ({ ...b, buyerPhone: phone }))
    setKnown(null)
    if (!/^01[3-9]\d{8}$/.test(phone)) return
    const found = await api(`/api/shop-sales/buyer?phone=${phone}`).catch(() => null)
    if (found?.name) { setKnown(found); setBuyer((b) => (b.buyerPhone === phone ? { ...b, buyerName: found.name } : b)) }
  }
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const name = (l) => productById.get(l.productId)?.name || `Product #${l.productId}`
  const byId = new Map((listings.data || []).map((l) => [l.id, l]))
  const inCart = (id) => lines.find((x) => x.listingId === id)
  const found = (listings.data || []).filter((l) => name(l).toLowerCase().includes(q.trim().toLowerCase()))
  const gross = lines.reduce((s, x) => s + Number(x.quantity || 0) * Number(x.unitPrice || 0), 0)
  const total = Math.max(gross - Number(discount || 0), 0)
  const due = paid === '' ? 0 : Math.max(Math.round((total - Number(paid)) * 100) / 100, 0)
  const needBuyer = online || due > 0 // a due goes on the customer's account, so we need who they are
  const update = (id, patch) => setLines(lines.map((x) => (x.listingId === id ? { ...x, ...patch } : x)))
  const add = (l) => {
    const x = inCart(l.id)
    if (x) update(l.id, { quantity: Math.min(Number(x.quantity) + 1, Number(l.stock)) })
    else setLines([...lines, { listingId: l.id, quantity: 1, unitPrice: l.price }])
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/shop-sales', {
        method: 'POST',
        body: {
          ...buyer, channel, paymentMethod: method, customerId: known?.customerId ?? null,
          discount: Number(discount || 0), paid: paid === '' ? null : Number(paid),
          items: lines.map((x) => ({ listingId: x.listingId, quantity: Number(x.quantity), unitPrice: Number(x.unitPrice) })),
        },
      })
      onDone(due > 0 ? `Sale recorded: ${money(total)}, ${money(total - due)} paid, ${money(due)} on ${buyer.buyerName}'s due.` : `Sale recorded: ${money(total)} by ${METHOD_LABEL[method]}.`)
      setLines([])
      setDiscount('')
      setPaid('')
      setBuyer({ buyerName: '', buyerPhone: '' })
      setKnown(null)
      listings.reload()
      sales.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer title="New sale" wide onClose={onClose} footer={(
      <div className="space-y-2">
        {lines.length > 0 && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{lines.length} {lines.length === 1 ? 'item' : 'items'} · {due > 0 ? <span className="num font-semibold text-ink">due {money(due)}</span> : METHOD_LABEL[method]}</span>
            <span className="num text-xl font-semibold">{money(total)}</span>
          </div>
        )}
        <ErrorMsg error={error} />
        <button form="sale-form" className="btn w-full" disabled={busy || lines.length === 0}>{busy ? 'Saving…' : 'Record sale'}</button>
      </div>
    )}>
      <form id="sale-form" onSubmit={submit} className="divide-y divide-line" aria-label="New sale">
        <ErrorMsg error={listings.error || sales.error} />
        {preset && <SellingInfo listing={byId.get(preset.id) || preset} product={productById.get(preset.productId)} />}
        <FormSection icon={UserRound} title="Buyer"
                     aside={<Segmented label="Sale type" value={channel} onChange={setChannel} options={[['OFFLINE', 'Offline'], ['ONLINE', 'Online']]} />}>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Phone">
              <input className="input num" type="tel" inputMode="numeric" pattern="01[3-9][0-9]{8}" maxLength={11} placeholder="01XXXXXXXXX" autoComplete="off"
                     required={needBuyer} value={buyer.buyerPhone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Name">
              <input className="input" maxLength={100} autoComplete="off" required={needBuyer} placeholder={needBuyer ? '' : 'Walk-in'} value={buyer.buyerName}
                     onChange={(e) => { setKnown(null); setBuyer({ ...buyer, buyerName: e.target.value }) }} />
            </Field>
          </div>
          {known && <p className="hint -mt-1.5">{known.customerId ? 'Your customer' : known.registered ? 'Registered customer' : 'Bought here before'}</p>}
        </FormSection>

        <FormSection icon={Package} title="Products">
          <div className="overflow-hidden rounded-lg border border-line">
            <label className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">Find a product</span>
              <input className="min-h-11 w-full bg-transparent text-[15px] outline-none" type="search" placeholder="Search…" autoComplete="off"
                     value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
            </label>
            {listings.data && found.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted">{listings.data.length ? 'No match' : 'No stock yet'}</p>}
            <ul className="max-h-56 divide-y divide-line overflow-y-auto">
              {found.map((l) => {
                const x = inCart(l.id)
                const full = Number(l.stock) === 0 || (x && Number(x.quantity) >= Number(l.stock))
                return (
                  <li key={l.id}>
                    <button type="button" disabled={full} onClick={() => add(l)}
                            className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50 disabled:opacity-50">
                      <ProductImage src={productById.get(l.productId)?.imageUrl} small className="size-9 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{name(l)}</span>
                        <span className="num block text-xs text-muted">{money(l.price)}{per(l.unit)} · {Number(l.stock) === 0 ? 'Out' : `${qty(l.stock, l.unit)} left`}</span>
                      </span>
                      {x ? <span className="num badge bg-ink text-white">{x.quantity}</span> : <Plus className="size-4 text-muted" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </FormSection>

        {lines.length > 0 && (
          <FormSection icon={Receipt} title="Items">
            <ul className="space-y-3">
              {lines.map((x) => {
                const l = byId.get(x.listingId)
                return (
                  <li key={x.listingId} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{l ? name(l) : `Listing #${x.listingId}`}</span>
                      <span className="num text-sm font-semibold">{money(Number(x.quantity || 0) * Number(x.unitPrice || 0))}</span>
                      <button type="button" className="-mr-2 inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-brand-50"
                              aria-label="Remove from sale" onClick={() => setLines(lines.filter((y) => y !== x))}>
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 items-end gap-2">
                      <div className="flex h-11 items-center rounded-lg border border-line">
                        <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center" aria-label="One less"
                                disabled={Number(x.quantity) <= 1} onClick={() => update(x.listingId, { quantity: Number(x.quantity) - 1 })}>
                          <Minus className="size-4" aria-hidden />
                        </button>
                        <input className="num w-full min-w-0 bg-transparent text-center outline-none" type="number" inputMode="decimal" step={isLoose(l?.unit) ? '0.001' : '1'} min={isLoose(l?.unit) ? '0.001' : '1'} max={l?.stock} required
                               aria-label={`Quantity in ${l ? UNITS[l.unit][1] : 'units'}`} value={x.quantity} onChange={(e) => update(x.listingId, { quantity: e.target.value })} />
                        <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center" aria-label="One more"
                                disabled={l && Number(x.quantity) + 1 > Number(l.stock)} onClick={() => update(x.listingId, { quantity: Number(x.quantity) + 1 })}>
                          <Plus className="size-4" aria-hidden />
                        </button>
                      </div>
                      <Field label="Price" prefix="৳" suffix={l ? per(l.unit) : ''}>
                        <input className="input num" type="number" inputMode="decimal" min="0" step="0.01" required value={x.unitPrice}
                               onChange={(e) => update(x.listingId, { unitPrice: e.target.value })} />
                      </Field>
                    </div>
                  </li>
                )
              })}
            </ul>
          </FormSection>
        )}

        {lines.length > 0 && (
          <FormSection icon={Banknote} title="Payment">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-line p-0.5 sm:grid-cols-6" role="group" aria-label="Paid by">
              {METHODS.map(([id, text]) => (
                <button key={id} type="button" aria-pressed={method === id} onClick={() => setMethod(id)}
                        className={`min-h-10 rounded-md text-xs font-medium sm:text-sm ${method === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{text}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Discount" prefix="৳">
                <input className="input num" type="number" inputMode="decimal" min="0" max={gross} step="0.01" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Paid" prefix="৳">
                <input className="input num" type="number" inputMode="decimal" min="0" max={total} step="0.01" placeholder={String(Math.round(total * 100) / 100)}
                       value={paid} onChange={(e) => setPaid(e.target.value)} />
              </Field>
            </div>
            {due > 0 && <p className="hint -mt-1.5">Phone and name are required to leave a due.</p>}
          </FormSection>
        )}
      </form>
    </Drawer>
  )
}

/** What the seller is about to sell: price, average cost, stock, and the shipments it came in. */
function SellingInfo({ listing: l, product }) {
  const purchases = useLoad(() => api('/api/books/purchases'))
  const came = (purchases.data || []).flatMap((v) => v.items.filter((i) => i.listingId === l.id).map((i) => ({ ...i, purchase: v.purchase, shipment: shipmentName(v) }))).slice(0, 3)
  const m = pct(l.costPrice, l.price)
  return (
    <section aria-label="Product" className="space-y-2 pb-3">
      <div className="flex items-center gap-3">
        <ProductImage src={product?.imageUrl} className="size-16 shrink-0 rounded-lg ring-1 ring-line" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{product?.name}</p>
          <p className="num text-sm"><span className="font-semibold">{money(l.price)}{per(l.unit)}</span> <span className="text-muted">· {qty(l.stock, l.unit)} in stock</span></p>
          <p className="num text-xs text-muted">Avg cost {l.costPrice == null ? '–' : `${money(l.costPrice)}${per(l.unit)}`}{m != null && ` · ${m}% margin`}</p>
        </div>
      </div>
      {came.length > 0 && (
        <ul className="divide-y divide-line rounded-lg bg-cotton text-xs">
          {came.map((i) => (
            <li key={i.id} className="num flex items-baseline gap-2 px-3 py-1.5">
              <span className="truncate font-semibold">{i.shipment}</span>
              <span className="ml-auto">{qty(i.quantity, i.unit)} × {money(i.unitCost)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** A small dropdown card under its button: All products, then each product the shop holds. */
function ProductFilter({ value, onChange, choices }) {
  const [open, setOpen] = useState(false)
  const label = choices.find(([id]) => id === value)?.[1] || 'All products'
  const pick = (id) => { onChange(id); setOpen(false) }
  return (
    <div className="relative max-w-[45%] shrink-0">
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`Show: ${label}`}
              className={`flex h-10 w-full items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${value ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
        <span className="truncate">{label}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Close filter" tabIndex={-1} onClick={() => setOpen(false)} />
          <ul role="menu" aria-label="Show product" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              className="absolute top-12 right-0 z-30 max-h-72 w-48 overflow-y-auto rounded-xl bg-white p-1 shadow-[0_8px_24px_rgb(0_0_0/0.18)] ring-1 ring-line">
            {[['', 'All products'], ...choices].map(([id, text], n) => (
              <li key={id || 'all'} role="none">
                <button type="button" role="menuitemradio" aria-checked={value === id} autoFocus={n === 0} onClick={() => pick(id)}
                        className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-brand-50 focus-visible:bg-brand-50 ${value === id ? 'font-semibold' : ''}`}>
                  <span className="min-w-0 flex-1 truncate">{text}</span>
                  {value === id && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** A product's varieties in this shop (আম → হিমসাগর, ল্যাংড়া…): tap one in stock to sell it, or restock it. */
function Varieties({ title, items, productById, onSell, onRestock, onClose }) {
  const short = (name) => (name.startsWith(`${title} - `) ? name.slice(title.length + 3) : name)
  const sorted = [...items].sort((a, b) => Number(Number(b.stock) > 0) - Number(Number(a.stock) > 0))
  return (
    <Drawer title={title} onClose={onClose}>
      <ul className="divide-y divide-line rounded-lg ring-1 ring-line">
        {sorted.map((l) => {
          const p = productById.get(l.productId)
          const out = Number(l.stock) === 0
          return (
            <li key={l.id} className="flex items-center gap-1 pr-1">
              <button type="button" onClick={() => (out ? onRestock(l) : onSell(l))} aria-label={out ? `Restock ${p?.name}` : `Sell ${p?.name}`}
                      className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pl-2.5 text-left">
                <ProductImage src={p?.imageUrl} className={`size-12 shrink-0 rounded-lg ${out ? 'grayscale' : ''}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{short(p?.name || `Product #${l.productId}`)}</span>
                  <span className="num block text-sm"><span className="font-semibold">{money(l.price)}{per(l.unit)}</span>
                    <span className={out || isLow(l) ? 'font-semibold' : 'text-muted'}> · {out ? 'Out of stock' : `${qty(l.stock, l.unit)} left`}</span></span>
                </span>
                {!out && <span className="badge shrink-0 bg-ink text-white">Sell</span>}
              </button>
              <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink"
                      aria-label={`Add stock or edit ${p?.name}`} onClick={() => onRestock(l)}><PackagePlus className="size-4" aria-hidden /></button>
            </li>
          )
        })}
      </ul>
    </Drawer>
  )
}

/** Every sale, both channels: shop sales (voidable) and online orders. */
function SalesLog({ sales, orders, listings, done, onNew }) {
  const [channel, setChannel] = useState('all')
  const [voiding, setVoiding] = useState(null)
  const [error, setError] = useState(null)
  const everything = [
    ...(sales.data || []).map(({ sale, items }) => ({
      key: `s${sale.id}`, at: sale.createdAt, total: sale.total, items, shop: true, sale, done: !sale.voidedAt,
      meta: `${sale.channel === 'ONLINE' ? 'Online buyer' : 'In shop'} · ${METHOD_LABEL[sale.paymentMethod]}${sale.buyerName ? ` · ${sale.buyerName}` : ''}${Number(sale.total) > Number(sale.paid) ? ` · due ${money(sale.total - sale.paid)}` : ''}${sale.voidedAt ? ' · Voided' : ''}`,
    })),
    ...(orders.data || []).map(({ order, items, customer }) => ({
      key: `o${order.id}`, at: order.createdAt, total: order.total, items, status: order.status, done: order.status !== 'CANCELLED',
      meta: `Online #${order.id}${customer?.name ? ` · ${customer.name}` : ''}`,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at))
  const rows = everything.filter((r) => channel === 'all' || (channel === 'shop') === !!r.shop)
  const todays = everything.filter((r) => r.done && isToday(r.at))
  const sum = (list) => list.reduce((n, r) => n + Number(r.total), 0)

  const voidSale = async (sale) => {
    if (!window.confirm(`Void shop sale #${sale.id} (${money(sale.total)})? Its stock goes back.`)) return
    setVoiding(sale.id)
    setError(null)
    try {
      await api(`/api/shop-sales/${sale.id}/void`, { method: 'POST' })
      listings.reload()
      sales.reload()
    } catch (err) {
      setError(err)
    } finally {
      setVoiding(null)
    }
  }

  return (
    <div className="space-y-4">
    <SectionHead title="Sells">
      <button type="button" className="btn max-sm:hidden" onClick={onNew}><Plus className="size-4" aria-hidden /> Sale</button>
    </SectionHead>
    <Success>{done}</Success>
    <Fab label="Sale" onClick={onNew} />
    {/* Today at a glance (tradebazaar's Today panel) */}
    <section className="panel grid grid-cols-3 divide-x divide-line py-3 text-center" aria-label="Today">
      {[['Today', sum(todays)], ['In shop', sum(todays.filter((r) => r.shop))], ['Online', sum(todays.filter((r) => !r.shop))]].map(([label, value], i) => (
        <div key={label} className="min-w-0 px-2">
          <p className="text-xs text-muted">{label}{i === 0 && <span className="num"> · {todays.length}</span>}</p>
          <p className={`num truncate font-semibold ${i === 0 ? 'text-lg' : 'text-[15px]'}`}>{money(value)}</p>
        </div>
      ))}
    </section>
    <section className="panel" aria-labelledby="sales-log">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <h2 id="sales-log" className="mr-auto text-sm font-semibold">All sales</h2>
        <Segmented label="Sales channel" value={channel} onChange={setChannel} options={CHANNELS} />
      </div>
      <ErrorMsg error={error || orders.error} />
      {sales.data && orders.data && rows.length === 0 && <Empty icon={Receipt} title="No sales yet" />}
      <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
        {rows.slice(0, 100).map((r) => (
          <li key={r.key} className={`flex items-center gap-3 px-4 py-2.5 ${r.done ? '' : 'text-muted'}`}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{r.items.map((i) => (i.unit ? `${qty(i.quantity, i.unit)} ${i.productName}` : `${i.quantity} × ${i.productName}`)).join(', ')}</span>
              <span className="block truncate text-xs text-muted">{r.meta} · {timeAgo(r.at)}</span>
            </span>
            {r.status && <StatusBadge status={r.status} />}
            <span className={`num text-sm font-semibold ${r.done ? '' : 'line-through'}`}>{money(r.total)}</span>
            {r.shop && r.done && (
              <button className="min-h-11 rounded-lg px-2 text-sm font-medium text-muted hover:bg-brand-50 hover:text-ink" disabled={voiding === r.sale.id} onClick={() => voidSale(r.sale)}>
                {voiding === r.sale.id ? 'Voiding…' : 'Void'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
    </div>
  )
}

// ---------------------------------------------------------------- orders

function SellerOrders({ orders, productOfListing, onStockChange }) {
  const [filter, setFilter] = useState('open')
  const [q, setQ] = useState('')
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [stitched, setStitched] = useState(null) // {id, index}: segment to animate after an advance

  const move = async (id, status) => {
    if (status === 'CANCELLED' && !confirm(`Cancel order #${id}? The stock goes back to your products.`)) return
    setError(null)
    setBusyId(id)
    try {
      await api(`/api/orders/${id}/status`, { method: 'POST', body: { status } })
      if (status !== 'CANCELLED') setStitched({ id, index: STEP_OF[status] - 2 })
      await orders.reload()
      if (status === 'CANCELLED') onStockChange()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  const all = orders.data || []
  const FILTERS = [
    ['open', 'Open', (o) => NEXT[o.status]],
    ['delivered', 'Delivered', (o) => o.status === 'DELIVERED'],
    ['cancelled', 'Cancelled', (o) => o.status === 'CANCELLED'],
    ['all', 'All', () => true],
  ]
  const test = FILTERS.find(([id]) => id === filter)[2]
  const needle = q.trim().toLowerCase()
  const matches = ({ order, customer }) => !needle || String(order.id).includes(needle.replace('#', ''))
    || customer?.name?.toLowerCase().includes(needle) || customer?.phone?.includes(needle)
  // An order the seller just advanced stays visible until they change filter or refresh, so the new stitch is seen.
  const list = all.filter((d) => (test(d.order) || d.order.id === stitched?.id) && matches(d))

  return (
    <section className="space-y-3" aria-labelledby="orders-heading">
      <SectionHead title="Orders">
        <button className="btn-quiet" onClick={() => { setStitched(null); orders.reload() }} disabled={orders.loading} aria-label="Refresh orders">
          <RefreshCw className={`size-4 ${orders.loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
          <span className="hidden sm:inline">{orders.loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </SectionHead>
      <h2 id="orders-heading" className="sr-only">Orders</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Segmented label="Filter orders" value={filter} onChange={(id) => { setStitched(null); setFilter(id) }}
                   options={FILTERS.map(([id, label, t]) => [id, label, all.filter(({ order }) => t(order)).length])} />
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" type="search" autoComplete="off" aria-label="Search orders" placeholder="Order #, name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <ErrorMsg error={orders.error || error} />

      <div className="panel divide-y divide-line">
        {orders.data && list.length === 0 && (
          <Empty icon={Inbox} title={filter === 'open' && !needle ? 'No orders waiting' : 'Nothing here'}>
            {filter === 'open' && !needle ? 'New orders show up here. Keep your stock up to date so nearby customers can find you.' : 'Try another filter or search.'}
          </Empty>
        )}
        {list.map(({ order, items, payment, customer: buyer, claim }) => {
          const next = NEXT[order.status]
          const customer = order.recipientPhone ? { name: order.recipientName, phone: order.recipientPhone } : buyer
          return (
            <article key={order.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="num text-[15px] font-semibold">#{order.id}</h3>
                  <StatusBadge status={order.status} />
                  <PayBadge payment={payment} />
                  {claim && <span className="badge bg-white text-ink ring-1 ring-ink">Claim {CLAIM_LABEL[claim.status]}</span>}
                  <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
                </div>
                {claim && (
                  <p className="rounded-lg bg-cotton px-3 py-2 text-sm">
                    <span className="font-semibold">Customer reported a problem:</span> {claim.details}
                    {claim.resolutionNote && <span className="block text-muted">Decision: {claim.resolutionNote}</span>}
                  </p>
                )}
                <ul className="space-y-1.5">
                  {items.map((i) => {
                    const p = productOfListing(i.listingId)
                    return (
                      <li key={i.id} className="flex items-center gap-2.5">
                        <ProductImage src={p.imageUrl} small className="size-10 shrink-0 rounded-lg" />
                        <span className="min-w-0 text-sm">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="num text-xs text-muted">{i.quantity} × {money(i.unitPrice)}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {customer && (
                    <a href={`tel:${customer.phone}`} className="inline-flex min-h-9 items-center gap-1.5 font-medium">
                      <Phone className="size-3.5" aria-hidden /> {customer.name} <span className="num text-muted">{customer.phone}</span>
                    </a>
                  )}
                  <span className="flex items-start gap-1.5 text-muted"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {order.deliveryAddress}</span>
                </div>
                <div className="max-w-sm">
                  <StitchTrail steps={ORDER_STEPS} done={STEP_OF[order.status]} cancelled={order.status === 'CANCELLED'} tone={order.status === 'DELIVERED' ? 'leaf' : 'madder'}
                               animateIndex={stitched?.id === order.id ? stitched.index : -1} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-start">
                <p className="num text-base font-semibold">{money(order.total)}<span className="block text-right text-xs font-normal text-muted">Cash on delivery</span></p>
                {next && (
                  <div className="flex items-center gap-1.5">
                    {CANCELLABLE.includes(order.status) && (
                      <button className="btn-danger" onClick={() => move(order.id, 'CANCELLED')} disabled={busyId === order.id}>Cancel</button>
                    )}
                    <button className="btn" onClick={() => move(order.id, next)} disabled={busyId === order.id}>
                      {busyId === order.id ? 'Saving…' : NEXT_LABEL[next]}
                    </button>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- home: inventory


/** Everything the shop holds: totals at cost and at price, and each product's stock. */
function Inventory({ listings, productById, go, onSell }) {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState('') // one product (with all its varieties), or '' for all
  const [group, setGroup] = useState(null) // the product whose varieties are open
  const all = listings.data || []
  const name = (l) => productById.get(l.productId)?.name || `Product #${l.productId}`
  // a variety sits under its product: হিমসাগর and ল্যাংড়া both open আম
  const parentOf = (l) => productById.get(l.productId)?.parentId ?? l.productId
  const shown = all.filter((l) => (!only || String(parentOf(l)) === only) && name(l).toLowerCase().includes(q.trim().toLowerCase()))
  const productIds = [...new Set(all.map(parentOf))]
  const groups = []
  for (const l of shown) {
    const g = groups.find((x) => x.id === parentOf(l))
    if (g) g.items.push(l)
    else groups.push({ id: parentOf(l), items: [l] })
  }
  const groupName = (id) => productById.get(id)?.name || `Product #${id}`
  const choices = productIds.map((id) => [String(id), groupName(id)]).sort((a, b) => a[1].localeCompare(b[1]))
  const open = group != null && all.filter((l) => parentOf(l) === group)

  return (
    <section className="space-y-3" aria-label="Inventory">
      <SectionHead title="Inventory">
        <button className="btn max-sm:hidden" onClick={() => go('stock', 'new')}><Plus className="size-4" aria-hidden /> Stock</button>
      </SectionHead>
      <Fab label="Stock" onClick={() => go('stock', 'new')} />
      <ErrorMsg error={listings.error} />

      <div className="panel">
        <div className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-4">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="sr-only">Find a product</span>
            <input className="min-h-11 w-full bg-transparent text-[15px] outline-none" type="search" placeholder="Find a product…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <ProductFilter value={only} onChange={setOnly} choices={choices} />
        </div>
        {listings.data && shown.length === 0 && (
          <Empty icon={Store} title={all.length ? 'Nothing here' : 'No stock yet'}>
            {all.length ? 'Try another name.' : 'Add your first products in Stock, with price and quantity.'}
          </Empty>
        )}
        {/* phones: photo tiles, two across (as tradebazaar); tap one to restock or edit it */}
        {shown.length > 0 && (
          <ul className="grid grid-cols-2 gap-2.5 p-3 sm:hidden">
            {groups.map((g) => {
              const stocked = g.items.filter((l) => Number(l.stock) > 0)
              const out = stocked.length === 0
              const low = !out && g.items.some(isLow)
              const prices = g.items.map((l) => Number(l.price))
              const unit = g.items[0].unit
              const sameUnit = g.items.every((l) => l.unit === unit)
              const total = g.items.reduce((n, l) => n + Number(l.stock), 0)
              return (
                <li key={g.id}>
                  <button type="button" onClick={() => setGroup(g.id)} aria-label={`Open ${groupName(g.id)}`}
                          className={`block w-full overflow-hidden rounded-xl border border-line bg-white text-left ${out ? 'opacity-60' : ''}`}>
                    <span className="relative block">
                      <ProductImage src={productById.get(g.id)?.imageUrl || productById.get(g.items[0].productId)?.imageUrl} className={`aspect-[4/3] w-full ${out ? 'grayscale' : ''}`} />
                      {(out || low) && <span className="absolute top-2 right-2 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">{out ? 'Out' : 'Low'}</span>}
                      {g.items.length > 1 && <span className="num absolute top-2 left-2 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold">{g.items.length} varieties</span>}
                    </span>
                    <span className="block p-2">
                      <span className="block truncate text-[13px] font-semibold">{g.items.length > 1 ? groupName(g.id) : name(g.items[0])}</span>
                      <span className="mt-0.5 flex items-baseline justify-between gap-1 text-xs">
                        <span className="num font-semibold">{money(Math.min(...prices))}{Math.max(...prices) > Math.min(...prices) && '+'}{sameUnit && per(unit)}</span>
                        <span className="num truncate text-muted">{sameUnit ? qty(total, unit) : `${stocked.length} in stock`}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {shown.length > 0 && (
          <table className="hidden w-full text-left text-sm sm:table">
            <thead className="hidden border-b border-line bg-cotton text-xs font-semibold uppercase tracking-wide text-muted sm:table-header-group">
              <tr>
                <th className="px-4 py-2 font-semibold">Product</th>
                <th className="px-4 py-2 text-right font-semibold">Cost</th>
                <th className="px-4 py-2 text-right font-semibold">Price</th>
                <th className="px-4 py-2 text-right font-semibold">Stock</th>
                <th className="w-12 px-2 py-2"><span className="sr-only">Add stock</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((l) => {
                const out = Number(l.stock) === 0
                const low = !out && isLow(l)
                const stockText = out ? 'Out of stock' : `${qty(l.stock, l.unit)} left`
                return (
                  <tr key={l.id} className="flex items-center gap-3 px-4 py-2.5 sm:table-row sm:p-0">
                    <td className="min-w-0 flex-1 sm:px-4 sm:py-2.5">
                      <button type="button" onClick={() => setGroup(parentOf(l))} className="flex items-center gap-2.5 text-left hover:underline" aria-label={`Open ${name(l)}`}>
                        <ProductImage src={productById.get(l.productId)?.imageUrl} small className="size-10 shrink-0 rounded-lg" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{name(l)}</span>
                          <span className="block truncate text-xs text-muted">
                            <span className="num font-semibold text-ink sm:hidden">{money(l.price)}{per(l.unit)} · </span>
                            <span className={`sm:hidden ${out || low ? 'font-semibold text-ink' : ''}`}>{stockText}</span>
                            {!l.active && ' · Shop only'}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="num hidden text-muted sm:table-cell sm:px-4 sm:py-2.5 sm:text-right">{l.costPrice == null ? '–' : `${money(l.costPrice)}${per(l.unit)}`}</td>
                    <td className="num hidden font-semibold sm:table-cell sm:px-4 sm:py-2.5 sm:text-right">{money(l.price)}{per(l.unit)}</td>
                    <td className="num hidden sm:table-cell sm:px-4 sm:py-2.5 sm:text-right">
                      <span className={out || low ? 'font-semibold' : ''}>{stockText}</span>
                      {low && <span className="ml-1.5 inline-block size-2 rounded-full bg-ink align-middle" aria-label="low stock" />}
                    </td>
                    <td className="sm:px-2 sm:py-2.5">
                      <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink"
                              aria-label={`Add stock or edit ${name(l)}`} onClick={() => go('stock', l.productId)}>
                        <PackagePlus className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Varieties title={groupName(group)} items={open} productById={productById} onClose={() => setGroup(null)}
                   onSell={(l) => { setGroup(null); onSell(l) }} onRestock={(l) => { setGroup(null); go('stock', l.productId) }} />
      )}
    </section>
  )
}

// ---------------------------------------------------------------- stock

const UNIT_NAMES = { PCS: 'Piece', KG: 'Kilogram', LITRE: 'Litre', DOZEN: 'Dozen', BOX: 'Box', CRATE: 'Crate', BAG: 'Bag', PACK: 'Pack' }
const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
/** A shipment's name: its product and the day it came, e.g. আম_11_Nov; two products: আম+লিচু_11_Nov. */
const shipmentName = (v) => {
  const names = [...new Set(v.items.map((i) => i.productName.split(' - ')[0]))]
  const d = new Date(v.purchase.createdAt)
  return `${names.join('+') || 'Shipment'}_${d.getDate()}_${d.toLocaleDateString('en-GB', { month: 'short' })}`
}
const varietyOf = (name) => name.split(' - ').slice(1).join(' - ')
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const pct = (cost, price) => (cost == null || !Number(price) ? null : Math.round(((Number(price) - Number(cost)) / Number(price)) * 100))

/** The stock workplace: what is on the shelf, what was bought, and every movement. Everything can be edited or removed. */
function StockIn({ products, listings, productById, preset }) {
  const [entry, setEntry] = useState(preset && preset !== 'new' ? { pid: preset, mode: 'add' } : null) // restock / correct one product
  const [receiving, setReceiving] = useState(preset === 'new') // a new shipment, one or more varieties
  const [editing, setEditing] = useState(null) // a purchase being edited
  // an open shipment is its own page (?shipment=id), so the phone's back gesture returns to the list
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const shipment = Number(params.get('shipment')) || null
  const openShipment = (id) => { setParams({ tab: 'stock', shipment: id }); window.scrollTo({ top: 0 }) }
  const closeShipment = () => (location.key !== 'default' ? navigate(-1) : setParams({ tab: 'stock' }, { replace: true }))
  const [asking, setAsking] = useState(false)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const categories = useLoad(() => api('/api/catalog/categories'))
  const purchases = useLoad(() => api('/api/books/purchases'))
  const name = (pid) => productById.get(Number(pid))?.name || `Product #${pid}`
  const reloadAll = () => { listings.reload(); purchases.reload() }


  const act = async (key, fn, msg) => {
    setBusy(key)
    setError(null)
    setSaved(null)
    try { await fn(); setSaved(msg); reloadAll() } catch (err) { setError(err) } finally { setBusy(null) }
  }
  const removeProduct = (l) => {
    const left = Number(l.stock) > 0 ? ` The ${qty(l.stock, l.unit)} left count as written off.` : ''
    if (!window.confirm(`Remove ${name(l.productId)} from your shop?${left} Past sales stay in your books.`)) return
    act(`l${l.id}`, () => api(`/api/listings/${l.id}`, { method: 'DELETE' }), `${name(l.productId)} removed.`)
  }
  const deletePurchase = (v) => {
    if (!window.confirm(`Delete ${shipmentName(v)} (${money(v.purchase.total)})? Its goods come off stock and its costs are removed.`)) return
    closeShipment()
    act(`p${v.purchase.id}`, () => api(`/api/books/purchases/${v.purchase.id}`, { method: 'DELETE' }), 'Shipment deleted.')
  }
  const open = purchases.data?.find((v) => v.purchase.id === shipment)

  if (shipment && !purchases.data) return null
  if (open) {
    return (
      <>
        <ShipmentDetail view={open} onBack={closeShipment} onEdit={() => setEditing(open)} onDelete={() => deletePurchase(open)} onChanged={reloadAll} />
        {editing && <PurchaseEdit view={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadAll() }} />}
      </>
    )
  }

  return (
    <section className="space-y-4" aria-label="Stock">
      <SectionHead title="Stock">
        <button type="button" className="btn max-sm:hidden" onClick={() => { setSaved(null); setReceiving(true) }}><Plus className="size-4" aria-hidden /> Stock</button>
      </SectionHead>
      <Fab label="Stock" onClick={() => { setSaved(null); setReceiving(true) }} />


      <Success>{saved}</Success>
      <ErrorMsg error={error} />

      <ShipmentList purchases={purchases} onOpen={(v) => { setSaved(null); openShipment(v.purchase.id) }} />

      {entry && (
        <StockEntry key={`${entry.pid}-${entry.mode}`} products={products} listings={listings} productById={productById} categories={categories}
                    pid={entry.pid} initialMode={entry.mode} onClose={() => setEntry(null)}
                    onRemove={(l) => { setEntry(null); removeProduct(l) }} onRequest={() => setAsking(true)}
                    onSaved={(msg) => { setEntry(null); setSaved(msg); reloadAll() }} />
      )}
      {editing && <PurchaseEdit view={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadAll() }} />}
      {receiving && (
        <ReceiveShipment products={products.data} listings={listings.data} categories={categories} onRequest={() => setAsking(true)}
                         onClose={() => setReceiving(false)} onSaved={(id) => { setReceiving(false); reloadAll(); openShipment(id) }} />
      )}
      {asking && (
        <Drawer title="Request a product" onClose={() => setAsking(false)}>
          <ProductRequests categories={categories.data} />
        </Drawer>
      )}
    </section>
  )
}

/**
 * A new shipment: pick the product, then one line per variety received (হিমসাগর 20 kg, ল্যাংড়া 15 kg…), each with its cost and selling price.
 * It is saved as one purchase; a new selling price on a product already in the shop is applied after.
 */
function ReceiveShipment({ products, listings, categories, onRequest, onClose, onSaved }) {
  const [cat, setCat] = useState('')
  const [base, setBase] = useState('')
  const [lines, setLines] = useState([])
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const mine = (id) => listings.find((l) => String(l.productId) === String(id))
  const withProducts = new Set(products.map((p) => p.categoryId))
  const cats = (categories.data || []).filter((c) => withProducts.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  const inCat = products.filter((p) => String(p.categoryId) === cat && !p.parentId)
  const baseP = products.find((p) => String(p.id) === base)
  const varieties = products.filter((p) => String(p.parentId) === base)
  const short = (p) => (baseP && p.name.startsWith(`${baseP.name} - `) ? p.name.slice(baseP.name.length + 3) : p.name)
  const line = (id) => { const l = mine(id); return { key: Math.random(), productId: String(id), qty: '', unit: l?.unit || 'KG', cost: '', price: l ? String(Number(l.price)) : '' } }
  const choose = (v) => { setBase(v); const vs = products.filter((p) => String(p.parentId) === v); setLines([line(vs.length ? vs[0].id : v)]) }
  const unused = varieties.filter((p) => !lines.some((x) => x.productId === String(p.id)))
  const update = (key, patch) => setLines(lines.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const total = lines.reduce((n, x) => n + Number(x.qty || 0) * Number(x.cost || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await api('/api/books/purchases', {
        method: 'POST',
        body: {
          paymentMethod: method, note: note.trim() || null,
          items: lines.map((x) => ({ productId: Number(x.productId), quantity: Number(x.qty), unitCost: Number(x.cost), price: Number(x.price), unit: x.unit })),
        },
      })
      // products already in the shop keep their old price unless it was changed here
      const changed = res.items.filter((i) => { const x = lines.find((y) => Number(y.productId) === i.productId); return x && Number(x.price) !== Number(i.price) })
      if (changed.length) {
        await api(`/api/books/purchases/${res.purchase.id}/prices`, {
          method: 'PUT', body: changed.map((i) => ({ listingId: i.listingId, price: Number(lines.find((y) => Number(y.productId) === i.productId).price) })),
        })
      }
      onSaved(res.purchase.id)
    } catch (err) { setError(err); setBusy(false) }
  }

  return (
    <Drawer wide title="Receive stock" onClose={onClose} footer={(
      <div className="space-y-2">
        {lines.length > 0 && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{lines.length} {lines.length === 1 ? 'item' : 'items'}</span>
            <span className="num text-xl font-semibold">{money(total)}</span>
          </div>
        )}
        <ErrorMsg error={error} />
        <button form="receive-form" className="btn w-full" disabled={busy || lines.length === 0}>{busy ? 'Saving…' : 'Receive'}</button>
      </div>
    )}>
      <form id="receive-form" onSubmit={submit} className="divide-y divide-line" aria-label="Receive stock">
        <FormSection icon={Package} title="Product">
          <div className="grid grid-cols-2 gap-2">
            <Picker label="Group" required value={cat} options={cats.map((c) => ({ value: String(c.id), label: c.name }))}
                    onChange={(v) => { setCat(v); setBase(''); setLines([]) }} />
            <Picker label="Product" required disabled={!cat} value={base} options={inCat.map((p) => ({ value: String(p.id), label: p.name }))} onChange={choose} />
          </div>
          <button type="button" className="-mt-1 min-h-9 text-xs font-medium text-muted underline underline-offset-2 hover:text-ink" onClick={onRequest}>Product missing? Request it</button>
        </FormSection>

        {lines.length > 0 && (
          <FormSection icon={PackagePlus} title={varieties.length ? 'Varieties' : 'Received'}>
            <ul className="space-y-3">
              {lines.map((x, n) => {
                const l = mine(x.productId)
                const m = pct(x.cost === '' ? null : x.cost, x.price)
                return (
                  <li key={x.key} className="space-y-2 rounded-lg p-2.5 ring-1 ring-line">
                    {varieties.length > 0 && (
                      <div className="flex items-end gap-1">
                        <div className="min-w-0 flex-1">
                          <Picker label={`Variety ${n + 1}`} required value={x.productId} onChange={(v) => update(x.key, { ...line(v), key: x.key, qty: x.qty, cost: x.cost })}
                                  options={varieties.filter((p) => String(p.id) === x.productId || !lines.some((y) => y.productId === String(p.id)))
                                    .map((p) => ({ value: String(p.id), label: short(p), hint: mine(p.id) ? qty(mine(p.id).stock, mine(p.id).unit) : '' }))} />
                        </div>
                        {lines.length > 1 && (
                          <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink"
                                  aria-label={`Remove variety ${n + 1}`} onClick={() => setLines(lines.filter((y) => y !== x))}><X className="size-4" aria-hidden /></button>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Qty" suffix={UNITS[x.unit][1]}>
                        <input className="input num" type="number" inputMode="decimal" placeholder="0" min={isLoose(x.unit) ? '0.001' : '1'} step={isLoose(x.unit) ? '0.001' : '1'} required
                               value={x.qty} onChange={(e) => update(x.key, { qty: e.target.value })} />
                      </Field>
                      <Picker label="Unit" value={x.unit} disabled={!!l && Number(l.stock) !== 0} onChange={(v) => update(x.key, { unit: v })}
                              options={Object.entries(UNIT_NAMES).map(([value, label]) => ({ value, label }))} />
                      <Field label="Cost" prefix="৳" suffix={per(x.unit)}>
                        <input className="input num" type="number" inputMode="decimal" placeholder="0" min="0" step="0.01" required value={x.cost} onChange={(e) => update(x.key, { cost: e.target.value })} />
                      </Field>
                      <Field label="Price" prefix="৳" suffix={per(x.unit)}>
                        <input className="input num" type="number" inputMode="decimal" placeholder="0" min="0.01" step="0.01" required value={x.price} onChange={(e) => update(x.key, { price: e.target.value })} />
                      </Field>
                    </div>
                    {(Number(x.qty) > 0 && x.cost !== '') && (
                      <p className="num text-xs text-muted">{money(Number(x.qty) * Number(x.cost))}{m != null && <> · <span className={m < 0 ? 'font-semibold text-ink' : ''}>{m}% margin</span></>}</p>
                    )}
                  </li>
                )
              })}
            </ul>
            {unused.length > 0 && (
              <button type="button" className="btn-quiet w-full border-dashed" onClick={() => setLines([...lines, line(unused[0].id)])}>
                <Plus className="size-4" aria-hidden /> Add variety
              </button>
            )}
          </FormSection>
        )}

        {lines.length > 0 && (
          <FormSection icon={Banknote} title="Payment">
            <div className="grid grid-cols-2 gap-2">
              <Picker label="Paid by" value={method} onChange={setMethod} options={METHODS.map(([value, label]) => ({ value, label }))} />
              <Field label="Note"><input className="input" maxLength={200} autoComplete="off" placeholder="Invoice no…" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </div>
          </FormSection>
        )}
      </form>
    </Drawer>
  )
}

/** Every shipment of stock as a photo tile, newest first; a tap opens it. */
function ShipmentList({ purchases, onOpen }) {
  return (
    <div className="space-y-3">
      <ErrorMsg error={purchases.error} />
      {purchases.data && purchases.data.length === 0 && <div className="panel"><Empty icon={ReceiptText} title="No shipments yet" /></div>}
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {(purchases.data || []).map((v) => {
          const costs = v.costs.reduce((n, c) => n + Number(c.amount), 0)
          return (
            <li key={v.purchase.id}>
              <button type="button" onClick={() => onOpen(v)} className="block w-full overflow-hidden rounded-xl bg-white text-left ring-1 ring-line transition-shadow hover:shadow-[0_6px_20px_rgb(0_0_0/0.10)]">
                <span className="relative block aspect-[4/3] bg-white">
                  <ProductImage src={v.items[0]?.imageUrl} className="size-full" />
                  {v.items.length > 1 && <span className="badge num absolute top-2 right-2 bg-ink text-white">+{v.items.length - 1}</span>}
                </span>
                <span className="block border-t border-line p-2.5">
                  <span className="block truncate text-sm font-medium">{shipmentName(v)}</span>
                  <span className="block truncate text-xs text-muted">{v.items.map((i) => varietyOf(i.productName) || qty(i.quantity, i.unit)).join(', ')}</span>
                  <span className="num mt-1 block text-[15px] font-semibold">{money(Number(v.purchase.total) + costs)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One shipment: what it cost with its extra costs, what it is worth at today's prices, and everything that can change it. */
function ShipmentDetail({ view: v, onBack, onEdit, onDelete, onChanged }) {
  const [sheet, setSheet] = useState(null) // 'menu' | 'cost' | 'prices'
  const goods = Number(v.purchase.total)
  const extra = v.costs.reduce((n, c) => n + Number(c.amount), 0)
  const worth = v.items.reduce((n, i) => n + Number(i.quantity) * Number(i.price), 0)

  return (
    <section aria-labelledby="shipment-title" className="space-y-4">
      {/* the goods' photos fill the header; the shipment's name and bill sit on a dark band over them */}
      <header className="relative h-52 bg-white ring-line max-sm:-mx-3 sm:h-60 sm:rounded-xl sm:ring-1">
        <div className="flex size-full overflow-hidden sm:rounded-xl">
          {v.items.slice(0, 3).map((i) => <ProductImage key={i.id} src={i.imageUrl} loading="eager" className="h-full min-w-0 flex-1" />)}
        </div>
        <button type="button" onClick={onBack} aria-label="Back to shipments"
                className="absolute top-2 left-2 inline-flex size-11 items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(0_0_0/0.2)] hover:bg-white">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={() => setSheet(sheet === 'menu' ? null : 'menu')} aria-label="Shipment actions" aria-haspopup="menu" aria-expanded={sheet === 'menu'}
                className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgb(0_0_0/0.2)] hover:bg-white">
          <MoreVertical className="size-5" aria-hidden />
        </button>
        {v.items.length > 3 && <span className="badge num absolute top-3 right-16 bg-ink text-white">+{v.items.length - 3}</span>}
        {sheet === 'menu' && (
          <>
            <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" tabIndex={-1} onClick={() => setSheet(null)} />
            <ul role="menu" aria-label="Shipment actions" onKeyDown={(e) => e.key === 'Escape' && setSheet(null)}
                className="absolute top-14 right-2 z-30 w-48 rounded-xl bg-white p-1 shadow-[0_8px_24px_rgb(0_0_0/0.18)] ring-1 ring-line">
              {[[Plus, 'Add cost', () => setSheet('cost')], [Banknote, 'Change prices', () => setSheet('prices')],
                [Pencil, 'Edit', () => { setSheet(null); onEdit() }], [Trash2, 'Delete', () => { setSheet(null); onDelete() }]].map(([Icon, label, go], n) => (
                <li key={label} role="none">
                  <button type="button" role="menuitem" autoFocus={n === 0} onClick={go}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium hover:bg-brand-50 focus-visible:bg-brand-50">
                    <Icon className="size-4 text-muted" aria-hidden /> {label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-black/70 px-4 py-2.5 text-white sm:rounded-b-xl">
          <div className="min-w-0 flex-1">
            <h1 id="shipment-title" className="truncate text-base font-semibold">{shipmentName(v)}</h1>
            <p className="num truncate text-xs text-white/75">{fmtDate(v.purchase.createdAt)} · {METHOD_LABEL[v.purchase.paymentMethod]}{v.purchase.note && ` · ${v.purchase.note}`}</p>
          </div>
          <p className="num shrink-0 text-lg font-semibold">{money(goods + extra)}</p>
        </div>
      </header>
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-2">
          {[['Goods', goods], ['Extra costs', extra], ['Total cost', goods + extra], ['Worth at price', worth]].map(([k, n]) => (
            <div key={k} className="rounded-lg bg-white px-3 py-2 ring-1 ring-line">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="num text-[15px] font-semibold">{money(n)}</dd>
            </div>
          ))}
        </dl>

        <section aria-label="Products" className="space-y-1.5">
          <h3 className="text-sm font-semibold">Products <span className="num font-normal text-muted">{v.items.length}</span></h3>
          <ul className="divide-y divide-line rounded-lg bg-white ring-1 ring-line">
            {v.items.map((i) => {
              const m = pct(i.unitCost, i.price)
              return (
                <li key={i.id} className="flex items-center gap-3 p-2.5">
                  <ProductImage src={i.imageUrl} small className="size-11 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{i.productName}</span>
                    <span className="num block truncate text-xs text-muted">{qty(i.quantity, i.unit)} × {money(i.unitCost)} · sell {money(i.price)}{per(i.unit)}{m != null && ` · ${m}%`}</span>
                    <span className="num block text-xs text-muted">{qty(i.stock, i.unit)} in stock now</span>
                  </span>
                  <span className="num shrink-0 text-sm font-semibold">{money(Number(i.quantity) * Number(i.unitCost))}</span>
                </li>
              )
            })}
          </ul>
        </section>

      </div>
      {sheet === 'cost' && <ShipmentCost view={v} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); onChanged() }} />}
      {sheet === 'prices' && <ShipmentPrices view={v} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); onChanged() }} />}
    </section>
  )
}

const COST_KINDS = ['TRANSPORT', 'PACKAGING', 'SALARY', 'OTHER']

/** A cost paid for this shipment. It is also an expense in the accounts. */
function ShipmentCost({ view, onClose, onSaved }) {
  const [category, setCategory] = useState('TRANSPORT')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/api/books/purchases/${view.purchase.id}/costs`, { method: 'POST', body: { category, amount: Number(amount), paymentMethod: method, note: note.trim() || null } })
      onSaved()
    } catch (err) { setError(err); setBusy(false) }
  }
  return (
    <Drawer title="Add cost" onClose={onClose} footer={(
      <div className="space-y-2">
        <ErrorMsg error={error} />
        <button form="shipment-cost" className="btn w-full" disabled={busy}>{busy ? 'Saving…' : 'Add cost'}</button>
      </div>
    )}>
      <form id="shipment-cost" onSubmit={submit} className="space-y-3">
        <Segmented label="Cost type" value={category} onChange={setCategory} options={COST_KINDS.map((k) => [k, k === 'SALARY' ? 'Labour' : EXPENSE[k]])} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Amount" prefix="৳">
            <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Picker label="Paid by" value={method} onChange={setMethod} options={METHODS.map(([value, label]) => ({ value, label }))} />
        </div>
        <Field label="Note"><input className="input" maxLength={200} autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </form>
    </Drawer>
  )
}

/** New selling prices for the shipment's products, with the margin on what this shipment cost. */
function ShipmentPrices({ view, onClose, onSaved }) {
  const [prices, setPrices] = useState(() => Object.fromEntries(view.items.map((i) => [i.listingId, String(Number(i.price))])))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const items = view.items.filter((i, n, all) => all.findIndex((x) => x.listingId === i.listingId) === n)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/api/books/purchases/${view.purchase.id}/prices`, { method: 'PUT', body: items.map((i) => ({ listingId: i.listingId, price: Number(prices[i.listingId]) })) })
      onSaved()
    } catch (err) { setError(err); setBusy(false) }
  }
  return (
    <Drawer title="Selling prices" onClose={onClose} footer={(
      <div className="space-y-2">
        <ErrorMsg error={error} />
        <button form="shipment-prices" className="btn w-full" disabled={busy}>{busy ? 'Saving…' : 'Save prices'}</button>
      </div>
    )}>
      <form id="shipment-prices" onSubmit={submit} className="space-y-3">
        {items.map((i) => {
          const m = pct(i.unitCost, prices[i.listingId])
          return (
            <div key={i.listingId} className="flex items-end gap-3">
              <ProductImage src={i.imageUrl} small className="mb-0.5 size-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.productName}</p>
                <p className="num text-xs text-muted">cost {money(i.unitCost)}{per(i.unit)}{m != null && <> · <span className={m < 0 ? 'font-semibold text-ink' : ''}>{m}% margin</span></>}</p>
              </div>
              <div className="w-36 shrink-0">
                <Field label="Price" prefix="৳" suffix={per(i.unit)}>
                  <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" required value={prices[i.listingId]} onChange={(e) => setPrices({ ...prices, [i.listingId]: e.target.value })} />
                </Field>
              </div>
            </div>
          )
        })}
      </form>
    </Drawer>
  )
}

/** Change what a purchase says: quantities, costs, how it was paid. Stock and average cost follow. */
function PurchaseEdit({ view, onClose, onSaved }) {
  const [lines, setLines] = useState(view.items.map((i) => ({ ...i, quantity: String(Number(i.quantity)), unitCost: String(Number(i.unitCost)) })))
  const [method, setMethod] = useState(view.purchase.paymentMethod)
  const [note, setNote] = useState(view.purchase.note || '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const total = lines.reduce((n, i) => n + Number(i.quantity || 0) * Number(i.unitCost || 0), 0)
  const set = (id, k, v) => setLines(lines.map((i) => (i.id === id ? { ...i, [k]: v } : i)))
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/api/books/purchases/${view.purchase.id}`, {
        method: 'PUT',
        body: { paymentMethod: method, note: note.trim() || null, items: lines.map((i) => ({ id: i.id, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })) },
      })
      onSaved()
    } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return (
    <Drawer title={`Edit ${shipmentName(view)}`} onClose={onClose} footer={(
      <div className="space-y-2">
        <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Total</span><span className="num text-xl font-semibold">{money(total)}</span></div>
        <ErrorMsg error={error} />
        <button form="purchase-edit" className="btn w-full" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    )}>
      <form id="purchase-edit" onSubmit={submit} className="divide-y divide-line">
        <FormSection icon={Package} title="Products">
          {lines.map((i) => (
            <div key={i.id} className="space-y-1">
              <p className="truncate text-sm font-medium">{i.productName}</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Qty" suffix={UNITS[i.unit][1]}>
                  <input className="input num" type="number" inputMode="decimal" min="0" step={isLoose(i.unit) ? '0.001' : '1'} required value={i.quantity} onChange={(e) => set(i.id, 'quantity', e.target.value)} />
                </Field>
                <Field label="Cost" prefix="৳" suffix={per(i.unit)}>
                  <input className="input num" type="number" inputMode="decimal" min="0" step="0.01" required value={i.unitCost} onChange={(e) => set(i.id, 'unitCost', e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </FormSection>
        <FormSection icon={Banknote} title="Payment">
          <div className="grid grid-cols-2 gap-2">
            <Picker label="Paid by" value={method} onChange={setMethod} options={METHODS.map(([value, label]) => ({ value, label }))} />
            <Field label="Note"><input className="input" maxLength={200} autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
        </FormSection>
      </form>
    </Drawer>
  )
}

/** Receive goods (a purchase: stock up, cost averages in, money out) or correct a product's count, price and settings. */
function StockEntry({ products, listings, productById, categories, pid, initialMode, onClose, onSaved, onRemove, onRequest }) {
  const mine = (id) => listings.data.find((l) => String(l.productId) === String(id))
  const blank = (id) => {
    const l = mine(id)
    return {
      productId: String(id || ''), qty: '', unit: l?.unit || 'PCS', recv: l?.unit || 'PCS', pack: '', price: l?.price ?? '', costPrice: '',
      reorderLevel: l?.reorderLevel ?? '', note: '', sourceNote: l?.sourceNote || '', active: l?.active ?? true, method: 'CASH',
    }
  }
  const [form, setForm] = useState(() => {
    const f = blank(pid)
    const l = mine(pid)
    return initialMode === 'set' && l ? { ...f, qty: String(Number(l.stock)), costPrice: l.costPrice ?? '' } : f
  })
  const [mode, setMode] = useState(initialMode)
  const presetP = products.data.find((p) => String(p.id) === String(pid))
  const [cat, setCat] = useState(String(presetP?.categoryId || ''))
  const [base, setBase] = useState(String(presetP?.parentId || presetP?.id || '')) // the product; form.productId may be one of its varieties
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const pick = (id) => { setError(null); setMode('add'); setForm(blank(id)) }
  const switchMode = (m) => {
    const l = mine(form.productId)
    setMode(m)
    setForm({ ...form, qty: m === 'set' && l ? String(Number(l.stock)) : '', costPrice: m === 'set' && l ? l.costPrice ?? '' : '' })
  }
  const current = mine(form.productId)
  const adding = !current || mode === 'add'
  const repack = adding && form.recv !== form.unit // bought by the crate, sold by the kg
  const factor = repack ? Number(form.pack || 0) : 1 // sell units in one received unit
  const amount = Number(form.qty || 0) * factor // always in the sell unit
  const unitCost = form.costPrice === '' || !factor ? null : Number(form.costPrice) / factor
  const cost2 = unitCost == null ? null : Math.round(unitCost * 100) / 100
  const after = adding ? Number(current?.stock || 0) + amount : amount
  const unitLocked = current && Number(current.stock) !== 0
  const step = isLoose(form.unit) ? '0.001' : '1'
  const bill = adding && amount > 0 && cost2 != null ? Math.round(amount * cost2 * 100) / 100 : 0
  const m = pct(adding && cost2 != null && current?.costPrice != null && amount > 0
    ? (Number(current.stock) * Number(current.costPrice) + amount * cost2) / (Number(current.stock) + amount) : (cost2 ?? current?.costPrice), form.price)
  const name = productById.get(Number(form.productId))?.name

  // only categories that have products, A–Z; then that category's products
  const withProducts = new Set(products.data.map((p) => p.categoryId))
  const cats = (categories.data || []).filter((c) => withProducts.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  const inCat = products.data.filter((p) => String(p.categoryId) === cat && !p.parentId)
  const baseP = products.data.find((p) => String(p.id) === base)
  const varieties = products.data.filter((p) => String(p.parentId) === base)
  const shortName = (p) => (baseP && p.name.startsWith(`${baseP.name} - `) ? p.name.slice(baseP.name.length + 3) : p.name)
  const stockNote = (id) => { const l = mine(id); return l ? qty(l.stock, l.unit) : '' }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const note = [repack && amount > 0 && `${qty(form.qty, form.recv)} × ${qty(form.pack, form.unit)}`, form.note.trim()].filter(Boolean).join(' · ') || null
      const settings = {
        productId: Number(form.productId), unit: form.unit, price: Number(form.price),
        reorderLevel: form.reorderLevel === '' ? null : Number(form.reorderLevel), sourceNote: form.sourceNote, active: form.active,
      }
      if (!adding) {
        const res = await api('/api/listings', { method: 'PUT', body: { ...settings, stock: amount, costPrice: cost2, note } })
        onSaved(`${name}: ${qty(res.stock, res.unit)} in stock.`)
      } else {
        // Settings first (adds the product to the shop if it's new), then the goods arrive as a purchase: stock up, cost averages in, money out.
        await api('/api/listings', { method: 'PUT', body: settings })
        if (amount > 0) {
          await api('/api/books/purchases', {
            method: 'POST',
            body: { items: [{ productId: Number(form.productId), quantity: amount, unitCost: cost2 }], paymentMethod: form.method, note },
          })
        }
        onSaved(amount > 0 ? `${name}: received ${qty(amount, form.unit)} for ${money(bill)}.` : `${name} saved.`)
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer title={adding ? 'Receive stock' : `Edit ${name || 'product'}`} onClose={onClose} footer={(
      <div className="space-y-2">
        {form.productId && (
          <dl className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
            <div className="flex gap-1"><dt>Stock</dt><dd className="num font-semibold text-ink">{qty(current?.stock || 0, form.unit)} → {qty(after, form.unit)}</dd></div>
            {bill > 0 && <div className="flex gap-1"><dt>Bill</dt><dd className="num font-semibold text-ink">{money(bill)}</dd></div>}
            {m != null && <div className="flex gap-1"><dt>Margin</dt><dd className="num font-semibold text-ink">{m}%</dd></div>}
          </dl>
        )}
        <ErrorMsg error={error} />
        <button form="stock-form" className="btn w-full" disabled={busy}>
          {busy ? 'Saving…' : !adding ? 'Save' : amount > 0 ? `Receive ${qty(amount, form.unit)}` : current ? 'Save changes' : 'Add to stock'}
        </button>
        {current && (
          <button type="button" className="btn-danger w-full" onClick={() => onRemove(current)}>
            <Trash2 className="size-4" aria-hidden /> Remove from shop
          </button>
        )}
      </div>
    )}>
      <form id="stock-form" onSubmit={submit} className="divide-y divide-line" aria-label="Stock entry">
        <FormSection icon={Package} title="Product"
                     aside={current && <Segmented label="Entry type" value={mode} onChange={switchMode} options={[['add', 'Receive'], ['set', 'Edit']]} />}>
          <div className="grid grid-cols-2 gap-2">
            <Picker label="Group" required value={cat} options={cats.map((c) => ({ value: String(c.id), label: c.name }))}
                    onChange={(v) => { setCat(v); setBase(''); pick('') }} />
            <Picker label="Product" required disabled={!cat} value={base}
                    options={inCat.map((p) => ({ value: String(p.id), label: p.name, hint: stockNote(p.id) }))}
                    onChange={(v) => { setBase(v); pick(v) }} />
          </div>
          {!current && <button type="button" className="-mt-1 min-h-9 text-xs font-medium text-muted underline underline-offset-2 hover:text-ink" onClick={onRequest}>Product missing? Request it</button>}
          {varieties.length > 0 && (
            <Picker label="Variety" value={form.productId} onChange={pick}
                    options={[{ value: base, label: 'Any', hint: stockNote(base) }, ...varieties.map((p) => ({ value: String(p.id), label: shortName(p), hint: stockNote(p.id) }))]} />
          )}
        </FormSection>

        <FormSection icon={PackagePlus} title={adding ? 'Received' : 'Count'}>
          <div className="grid grid-cols-2 gap-2">
            <Field label={adding ? 'Qty' : 'Count'} suffix={UNITS[adding ? form.recv : form.unit][1]}>
              <input className="input num" type="number" inputMode="decimal" placeholder="0" step={isLoose(adding ? form.recv : form.unit) ? '0.001' : '1'} min={adding && !current ? step : 0}
                     required={!current || !adding} value={form.qty} onChange={set('qty')} />
            </Field>
            {adding
              ? <Picker label="Unit" value={form.recv} onChange={(v) => setForm({ ...form, recv: v, costPrice: '' })} options={Object.entries(UNIT_NAMES).map(([value, label]) => ({ value, label }))} />
              : <Field label="Avg cost" prefix="৳" suffix={per(form.unit)}>
                  <input className="input num" type="number" inputMode="decimal" placeholder="0" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} />
                </Field>}
            {repack && (
              <Field label={`${UNITS[form.unit][0]} per ${UNITS[form.recv][0]}`} suffix={UNITS[form.unit][0]}>
                <input className="input num" type="number" inputMode="decimal" placeholder="0" min={step} step={step} required value={form.pack} onChange={set('pack')} />
              </Field>
            )}
            {adding && (
              <>
                <Field label="Cost" prefix="৳" suffix={per(repack ? form.recv : form.unit)}>
                  <input className="input num" type="number" inputMode="decimal" placeholder="0" min="0" step="0.01" required={Number(form.qty) > 0} value={form.costPrice} onChange={set('costPrice')} />
                </Field>
                {Number(form.qty) > 0 && <Picker label="Paid by" value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={METHODS.map(([value, label]) => ({ value, label }))} />}
              </>
            )}
          </div>
        </FormSection>

        <FormSection icon={Banknote} title="Selling">
          <div className="grid grid-cols-2 gap-2">
            <Picker label="Sell unit" value={form.unit} disabled={unitLocked} onChange={(v) => setForm({ ...form, unit: v, recv: current ? form.recv : v })}
                    options={Object.entries(UNIT_NAMES).map(([value, label]) => ({ value, label }))} />
            <Field label="Price" prefix="৳" suffix={per(form.unit)}>
              <input className="input num" type="number" inputMode="decimal" placeholder="0" min="0.01" step="0.01" required value={form.price} onChange={set('price')} />
            </Field>
          </div>
          {unitLocked && <p className="hint -mt-1.5">Counted in {UNITS[current.unit][1]}. Set the count to 0 to change it.</p>}
        </FormSection>

        <FormSection icon={MessageSquare} title="Note">
          <Field label={adding ? 'Note' : 'Reason'}>
            <input className="input" maxLength={200} autoComplete="off" required={!adding && current && amount !== Number(current.stock)}
                   placeholder={adding ? 'Invoice no…' : 'Damaged, recount…'} value={form.note} onChange={set('note')} />
          </Field>
          <details>
            <summary className="flex min-h-9 cursor-pointer items-center text-sm font-medium">More settings</summary>
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Low stock at" suffix={UNITS[form.unit][1]}>
                  <input className="input num" type="number" inputMode="decimal" min="0" step={step} placeholder={String(LOW_STOCK)} value={form.reorderLevel} onChange={set('reorderLevel')} />
                </Field>
                <Field label="Origin">
                  <input className="input" maxLength={500} autoComplete="off" placeholder="Rajshahi…" value={form.sourceNote} onChange={set('sourceNote')} />
                </Field>
              </div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" className="size-5 accent-black" checked={form.active} onChange={set('active')} />
                Sell online
              </label>
            </div>
          </details>
        </FormSection>
      </form>
    </Drawer>
  )
}

function ProductRequests({ categories }) {
  const mine = useLoad(() => api('/api/product-requests/me'))
  const [form, setForm] = useState({ name: '', categoryId: '', note: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const leaf = categories || []

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/product-requests', { method: 'POST', body: { name: form.name, categoryId: form.categoryId ? Number(form.categoryId) : null, note: form.note.trim() || null } })
      setForm({ name: '', categoryId: '', note: '' })
      mine.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Product requests">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Product">
          <input className="input" required maxLength={200} autoComplete="off" placeholder="Khejur Gur 500g…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Group">
          <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Not sure</option>
            {leaf.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
      </form>
      <div className="mt-2"><ErrorMsg error={error || mine.error} /></div>
      {mine.data?.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
          {mine.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2">
              <span className="font-medium">{r.name}</span>
              <span className={`badge ${r.status === 'PENDING' ? 'bg-white text-ink ring-1 ring-line' : r.status === 'APPROVED' ? 'bg-ink text-white' : 'bg-cotton text-muted ring-1 ring-line'}`}>
                {r.status === 'PENDING' ? 'Waiting' : r.status === 'APPROVED' ? 'Added' : 'Not accepted'}
              </span>
              {r.adminNote && <span className="w-full text-xs text-muted">{r.adminNote}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- sales

const CHANNELS = [['all', 'All'], ['online', 'Online'], ['shop', 'In shop']]

// ---------------------------------------------------------------- shop & reviews

/** Public shop link sellers post on Facebook / WhatsApp. */
function ShareLink({ shopId }) {
  const url = `${window.location.origin}/s/${shopId}`
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'My shop', url })
      else { await navigator.clipboard.writeText(url); setCopied(true) }
    } catch { /* share sheet closed */ }
  }
  return (
    <section className="panel flex flex-wrap items-center gap-3 p-4" aria-label="Share your shop">
      <Share2 className="size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-semibold">Your shop link</p>
        <a href={url} target="_blank" rel="noreferrer noopener" className="block truncate text-sm text-muted underline underline-offset-2">{url}</a>
      </div>
      <button className="btn" onClick={copy}><Copy className="size-4" aria-hidden /> {copied ? 'Copied' : 'Share link'}</button>
    </section>
  )
}

function ShopTab({ shop, onShopChange }) {
  const reviews = useLoad(() => api(`/api/reviews/seller/${shop.id}`), [shop.id])
  const list = reviews.data || []
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0

  return (
    <div className="space-y-5 [&_.panel]:mx-0 [&_.panel]:rounded-none [&_.panel]:border-0 [&_.panel]:p-0">
      {shop.status === 'VERIFIED' && <ShareLink shopId={shop.id} />}
      <div className="space-y-5 divide-y divide-line">
        <ShopForm shop={shop} onSaved={onShopChange} />

        <section className="panel" aria-labelledby="reviews-heading">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <h2 id="reviews-heading" className="font-semibold">Customer reviews</h2>
            {list.length > 0 && (
              <span className="ml-auto flex items-center gap-1 text-sm">
                <Star className="size-4 fill-ink" aria-hidden />
                <span className="num font-semibold">{avg.toFixed(1)}</span>
                <span className="text-muted">· <span className="num">{list.length}</span></span>
              </span>
            )}
          </div>
          <ErrorMsg error={reviews.error} />
          {reviews.data && list.length === 0 && <Empty icon={MessageSquare} title="No reviews yet" />}
          <ul className="divide-y divide-line">
            {list.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex" aria-label={`${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-3.5 ${n <= r.rating ? 'fill-ink text-ink' : 'text-line'}`} aria-hidden />)}
                  </span>
                  <span className="num text-xs text-muted">Order #{r.orderId} · {timeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Quality score <span className="num font-semibold text-ink">{Number(shop.qualityScore).toFixed(0)}</span>/100, from ratings on delivered orders.
          </p>
        </section>
      </div>
    </div>
  )
}
