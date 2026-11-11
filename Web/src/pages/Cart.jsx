import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react'
import { api, money, per } from '../api'
import { ProductImage } from '../product-ui'
import { Empty, ErrorMsg, useLoad } from '../ui'

/** Cart: lines grouped by shop (each shop becomes its own order), then checkout to a saved address. */
export default function Cart() {
  const cart = useLoad(() => api('/api/cart'))
  const addresses = useLoad(() => api('/api/addresses'))
  const navigate = useNavigate()
  const [lines, setLines] = useState(null) // latest server answer after a change
  const [addressId, setAddressId] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const list = lines ?? cart.data ?? []
  const chosen = addressId ?? addresses.data?.find((a) => a.default)?.id ?? addresses.data?.[0]?.id
  const shops = [...new Map(list.map((l) => [l.sellerId, l.shopName])).entries()]
  const total = list.reduce((s, l) => s + Number(l.price) * l.quantity, 0)
  const blocked = list.some((l) => !l.available)

  const change = async (path, options) => {
    setError(null)
    try {
      setLines(await api(path, options))
      window.dispatchEvent(new Event('cart-changed'))
    } catch (err) {
      setError(err)
    }
  }

  const checkout = async () => {
    setError(null)
    setBusy(true)
    try {
      await api('/api/cart/checkout', { method: 'POST', body: { addressId: chosen, paymentMethod: 'COD' } })
      window.dispatchEvent(new Event('cart-changed'))
      navigate('/orders')
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  if (cart.loading && !cart.data) return <p className="text-sm text-muted">Loading your cart…</p>
  if (list.length === 0) {
    return (
      <div className="panel mx-auto max-w-md">
        <Empty icon={ShoppingCart} title="Your cart is empty">
          Add products from verified sellers near you. <Link to="/products" className="font-medium text-ink underline underline-offset-2">Browse products</Link>
        </Empty>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Cart</h1>
        <ErrorMsg error={cart.error || error} />
        {shops.map(([sellerId, shopName]) => (
          <section key={sellerId} className="panel" aria-label={`Items from ${shopName}`}>
            <h2 className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-sm font-semibold">
              <Store className="size-4" aria-hidden /> <Link to={`/s/${sellerId}`} className="hover:underline">{shopName}</Link>
            </h2>
            <ul className="divide-y divide-line">
              {list.filter((l) => l.sellerId === sellerId).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <ProductImage src={l.imageUrl} small className="size-14 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/p/${l.productId}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">{l.productName}</Link>
                    <p className="num text-sm font-semibold">{money(l.price)}<span className="font-normal text-muted">{per(l.unit)}</span></p>
                    {!l.available && <p className="text-xs font-semibold text-madder-700">{l.stock === 0 ? 'Out of stock. Remove it to continue.' : l.stock < l.quantity ? `Only ${l.stock} left. Lower the quantity.` : 'Not available right now. Remove it to continue.'}</p>}
                  </div>
                  <div className="flex items-center rounded-lg border border-line">
                    <button className="inline-flex size-10 items-center justify-center disabled:opacity-40" aria-label="One less" disabled={l.quantity <= 1}
                            onClick={() => change(`/api/cart/${l.id}`, { method: 'PUT', body: { quantity: l.quantity - 1 } })}><Minus className="size-4" aria-hidden /></button>
                    <span className="num w-7 text-center text-sm font-semibold" aria-label="Quantity">{l.quantity}</span>
                    <button className="inline-flex size-10 items-center justify-center disabled:opacity-40" aria-label="One more" disabled={l.quantity >= l.stock}
                            onClick={() => change(`/api/cart/${l.id}`, { method: 'PUT', body: { quantity: l.quantity + 1 } })}><Plus className="size-4" aria-hidden /></button>
                  </div>
                  <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink" aria-label={`Remove ${l.productName}`}
                          onClick={() => change(`/api/cart/${l.id}`, { method: 'DELETE' })}><Trash2 className="size-4" aria-hidden /></button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="panel space-y-3 p-4 lg:sticky lg:top-40" aria-label="Checkout">
        <h2 className="font-semibold">Deliver to</h2>
        {addresses.data?.length === 0 && (
          <p className="text-sm text-muted">You have no saved address yet. <Link to="/account" className="font-medium text-ink underline underline-offset-2">Add an address</Link></p>
        )}
        <div className="space-y-1.5">
          {addresses.data?.map((a) => (
            <label key={a.id} className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 text-sm ${chosen === a.id ? 'border-ink' : 'border-line'}`}>
              <input type="radio" name="address" className="mt-1 size-4 accent-black" checked={chosen === a.id} onChange={() => setAddressId(a.id)} />
              <span className="min-w-0">
                <span className="font-semibold">{a.label}</span> · {a.recipientName} <span className="num text-muted">{a.phone}</span>
                <span className="block text-muted">{a.address}</span>
              </span>
            </label>
          ))}
        </div>
        {addresses.data?.length > 0 && <Link to="/account" className="inline-flex min-h-9 items-center text-sm font-medium underline underline-offset-2">Manage addresses</Link>}
        <dl className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd className="num">{list.reduce((s, l) => s + l.quantity, 0)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="num">{money(total)}</dd></div>
        </dl>
        <p className="text-xs text-muted">
          Cash on delivery. {shops.length > 1 && `Your items come from ${shops.length} shops, so you get ${shops.length} separate orders and deliveries.`}
        </p>
        <button className="btn w-full" disabled={busy || blocked || !chosen} onClick={checkout}>
          {busy ? 'Placing order…' : shops.length > 1 ? `Place ${shops.length} orders` : 'Place order'}
        </button>
      </aside>
    </div>
  )
}
