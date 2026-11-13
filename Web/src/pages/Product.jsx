import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Check, ChevronDown, MapPin, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, X } from 'lucide-react'
import { api, money, per } from '../api'
import { useAuth } from '../auth'
import { ProductImage, Rating } from '../product-ui'
import { Empty, ErrorMsg, Field, Success, useLoad } from '../ui'

const SORTS = [['PRICE', 'Lowest price'], ['QUALITY', 'Best rated']]

export default function ProductPage() {
  const { id } = useParams()
  const [sort, setSort] = useState('PRICE')
  const [buying, setBuying] = useState(null)
  const [open, setOpen] = useState(null) // the offer whose seller details are shown
  const product = useLoad(() => api(`/api/catalog/products/${id}`), [id])
  const offers = useLoad(() => api(`/api/catalog/products/${id}/offers?sort=${sort}`), [id, sort])

  // A product with varieties (আম → হিমসাগর, ল্যাংড়া): the ones in stock are listed here, each opens its own sellers.
  const catalogue = useLoad(() => api('/api/catalog/products'))
  const stocked = useLoad(() => api('/api/catalog/products/nearby'))

  if (product.error) return <ErrorMsg error={product.error} />
  const p = product.data
  const inStock = new Map((stocked.data || []).map((x) => [x.id, x]))
  const varieties = (catalogue.data || []).filter((c) => String(c.parentId) === String(id) && inStock.has(c.id))
  const parent = p?.parentId ? catalogue.data?.find((c) => c.id === p.parentId) : null
  const short = (name) => (p && name.startsWith(`${p.name} - `) ? name.slice(p.name.length + 3) : name)
  const prices = [...(offers.data || []).map((o) => Number(o.price)), ...varieties.map((v) => Number(inStock.get(v.id).minPrice))]
  const best = prices.length ? Math.min(...prices) : null

  return (
    <div className="space-y-5">
      <Link to={parent ? `/p/${parent.id}` : '/'} className="inline-flex min-h-11 items-center gap-1 text-[15px] font-medium text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {parent ? parent.name : 'Back to shop'}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
        <div className="-mx-3 sm:mx-0">
          <ProductImage src={p?.imageUrl} alt={p?.name || ''} loading="eager" className="aspect-[4/3] w-full sm:rounded-3xl lg:aspect-square" />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            {p?.originRegion && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
                <MapPin className="size-3.5" aria-hidden /> From {p.originRegion}
              </span>
            )}
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{p?.name || ' '}</h1>
            {best != null && (
              <p className="text-2xl font-semibold text-ink"><span className="text-sm font-medium text-muted">from </span><span className="num">{money(best)}</span></p>
            )}
            {p?.description && <p className="max-w-prose text-[15px] leading-relaxed text-muted">{p.description}</p>}
          </div>

          <ul className="grid gap-2 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 sm:grid-cols-2">
            <li className="flex items-center gap-2"><BadgeCheck className="size-5 shrink-0 text-brand-700" aria-hidden /> Sold only by verified sellers</li>
            <li className="flex items-center gap-2"><RotateCcw className="size-5 shrink-0 text-brand-700" aria-hidden /> Not original? Full refund</li>
          </ul>

          {varieties.length > 0 && (
            <section aria-labelledby="varieties-heading" className="space-y-3">
              <h2 id="varieties-heading" className="text-lg font-semibold">Varieties</h2>
              <ul className="grid grid-cols-2 gap-2">
                {varieties.map((v) => (
                  <li key={v.id}>
                    <Link to={`/p/${v.id}`} className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-line hover:bg-brand-50">
                      <span className="min-w-0 truncate text-sm font-medium">{short(v.name)}</span>
                      <span className="num shrink-0 text-sm font-semibold"><span className="text-xs font-medium text-muted">from </span>{money(inStock.get(v.id).minPrice)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!(varieties.length > 0 && offers.data?.length === 0) && (
          <section aria-labelledby="offers-heading" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="offers-heading" className="mr-auto text-lg font-semibold">
                Sellers
              </h2>
              {offers.data?.length > 1 && (
                <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-line" role="group" aria-label="Sort sellers">
                  {SORTS.map(([v, label]) => (
                    <button key={v} onClick={() => setSort(v)} aria-pressed={sort === v}
                            className={`min-h-10 rounded-lg px-3 text-sm font-medium ${sort === v ? 'bg-brand-700 text-white' : 'text-muted hover:text-ink'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ErrorMsg error={offers.error} />
            {offers.data?.length === 0 && (
              <div className="rounded-2xl bg-white ring-1 ring-line">
                <Empty title="No seller has this in stock yet" />
              </div>
            )}
            <ul className="space-y-3">
              {offers.data?.map((o) => (
                <li key={o.listingId} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link to={`/s/${o.sellerId}`} className="font-semibold underline-offset-2 hover:underline">{o.shopName}</Link>
                        <span className="badge bg-leaf-100 text-leaf-800"><ShieldCheck className="size-3.5" aria-hidden /> Verified</span>
                        {Number(o.price) === best && offers.data.length > 1 && <span className="badge bg-turmeric-100 text-turmeric-800">Lowest price</span>}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <Rating score={o.qualityScore} />
                        <span><span className="num">{o.stock}</span> in stock</span>
                      </p>
                      {o.sourceNote && <p className="mt-1.5 text-xs text-muted">Source: {o.sourceNote}</p>}
                      {o.hasDetails && (
                        <button type="button" className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
                                aria-expanded={open === o.listingId} onClick={() => setOpen(open === o.listingId ? null : o.listingId)}>
                          Details <ChevronDown className={`size-4 transition-transform motion-reduce:transition-none ${open === o.listingId ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="num text-xl font-semibold text-ink">{money(o.price)}<span className="text-sm font-normal text-muted">{per(o.unit)}</span></p>
                      <div className="flex gap-1.5">
                        <AddToCart listingId={o.listingId} shopName={o.shopName} />
                        <button className="btn min-h-10 px-5" onClick={() => setBuying(o)}>Buy</button>
                      </div>
                    </div>
                  </div>
                  {open === o.listingId && <OfferDetails listingId={o.listingId} shopName={o.shopName} />}
                </li>
              ))}
            </ul>
          </section>
          )}
        </div>
      </div>

      {buying && p && <BuySheet offer={buying} product={p} onClose={() => { setBuying(null); offers.reload() }} />}
    </div>
  )
}

/** What this seller says about their own goods: photos, a video, a description, the ingredients. */
function OfferDetails({ listingId, shopName }) {
  const d = useLoad(() => api(`/api/catalog/listings/${listingId}`), [listingId])
  if (d.error) return <ErrorMsg error={d.error} />
  if (!d.data) return null
  const { imageUrls, videoUrl, description, ingredients } = d.data
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {imageUrls.length > 0 && (
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4" aria-label={`Photos from ${shopName}`}>
          {imageUrls.map((url, n) => (
            <li key={url} className="shrink-0 snap-start">
              <ProductImage src={url} alt={`Photo ${n + 1} from ${shopName}`} className="size-28 rounded-xl ring-1 ring-line sm:size-36" />
            </li>
          ))}
        </ul>
      )}
      {videoUrl && <video src={videoUrl} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-ink" aria-label={`Video from ${shopName}`} />}
      {description && <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed">{description}</p>}
      {ingredients && (
        <div>
          <h3 className="text-sm font-semibold">Ingredients</h3>
          <p className="max-w-prose whitespace-pre-line text-sm text-muted">{ingredients}</p>
        </div>
      )}
    </div>
  )
}

/** Adds one of this offer to the cart; customers only (others are sent to log in). */
function AddToCart({ listingId, shopName }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState('idle') // idle | busy | added | error message
  const add = async () => {
    if (!user) return navigate('/login')
    setState('busy')
    try {
      await api('/api/cart', { method: 'POST', body: { listingId, quantity: 1 } })
      window.dispatchEvent(new Event('cart-changed'))
      setState('added')
    } catch (err) {
      setState(err.message)
    }
  }
  if (user && user.role !== 'CUSTOMER') return null
  return (
    <span className="flex flex-col items-end">
      <button className="btn-quiet min-h-10 px-3" onClick={add} disabled={state === 'busy'} aria-label={`Add to cart from ${shopName}`}>
        {state === 'added' ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
        <span className="hidden sm:inline">{state === 'added' ? 'Added' : 'Add to cart'}</span>
      </button>
      {!['idle', 'busy', 'added'].includes(state) && <span role="alert" className="mt-1 max-w-40 text-right text-xs text-madder-700">{state}</span>}
    </span>
  )
}

function BuySheet({ offer, product, onClose }) {
  const { user } = useAuth()
  const [qty, setQty] = useState(1)
  const [address, setAddress] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  const total = Number(offer.price) * qty

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api('/api/orders', {
        method: 'POST',
        body: { items: [{ listingId: offer.listingId, quantity: qty }], deliveryAddress: address, paymentMethod: 'COD' },
      })
      setDone(res.order)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Buy ${product.name}`}
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <ProductImage src={product.imageUrl} small className="size-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{product.name}</p>
            <p className="truncate text-sm text-muted">{offer.shopName} · <span className="num">{money(offer.price)}{per(offer.unit)}</span></p>
          </div>
          <button className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-brand-50" onClick={onClose} aria-label="Close">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="p-5">
          {user?.role !== 'CUSTOMER' ? (
            <div className="space-y-3 text-center">
              <p className="text-[15px]">Log in with a customer account to place your order.</p>
              <Link to="/login" className="btn w-full">Log in</Link>
              <Link to="/register" className="btn-quiet w-full">Create an account</Link>
            </div>
          ) : done ? (
            <div className="space-y-3">
              <Success>Order #{done.id} placed. Total {money(done.total)}, paid in cash on delivery.</Success>
              <Link to="/orders" className="btn w-full">Track my order</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="label mb-0">Quantity</span>
                <div className="inline-flex items-center rounded-xl ring-1 ring-line">
                  <button type="button" className="inline-flex size-11 items-center justify-center text-brand-800 disabled:opacity-40" onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity"><Minus className="size-4" aria-hidden /></button>
                  <output className="num w-10 text-center text-lg font-semibold" aria-live="polite">{qty}</output>
                  <button type="button" className="inline-flex size-11 items-center justify-center text-brand-800 disabled:opacity-40" onClick={() => setQty(qty + 1)} disabled={qty >= offer.stock} aria-label="Increase quantity"><Plus className="size-4" aria-hidden /></button>
                </div>
              </div>
              <Field label="Address">
                <textarea className="input" name="street-address" autoComplete="street-address" required maxLength={300} rows={2}
                          placeholder="House, road, area…" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <div className="flex items-center justify-between rounded-xl bg-cotton px-4 py-3">
                <span className="text-sm text-muted">Cash on delivery</span>
                <span className="text-lg font-semibold">Total <span className="num text-ink">{money(total)}</span></span>
              </div>
              <ErrorMsg error={error} />
              <button className="btn w-full" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
