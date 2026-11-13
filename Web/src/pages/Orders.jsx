import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageSearch, ShieldAlert, Star, Store } from 'lucide-react'
import { api, money } from '../api'
import { ProductImage } from '../product-ui'
import { Empty, ErrorMsg, Field, PayBadge, Picker, StatusBadge, StitchTrail, Success, timeAgo, useLoad } from '../ui'

const STEPS = ['Placed', 'Accepted', 'Shipped', 'Delivered']
const EVENT = { PLACED: 'Order placed', ACCEPTED: 'Seller accepted', SHIPPED: 'On the way', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' }
const STEP_OF = { PLACED: 1, ACCEPTED: 2, SHIPPED: 3, DELIVERED: 4, CANCELLED: 1 }
const REASONS = [
  ['NOT_ORIGINAL', 'Not original / fake'],
  ['NOT_AS_DESCRIBED', 'Not as described'],
  ['DAMAGED', 'Damaged or spoiled'],
]

export default function Orders() {
  const orders = useLoad(() => api('/api/orders/me'))
  // Orders already reviewed (reviews are public per shop), so the rating form isn't offered twice.
  const reviewed = useLoad(async () => {
    const shops = [...new Set((orders.data || []).filter((d) => d.order.status === 'DELIVERED').map((d) => d.order.sellerId))]
    const lists = await Promise.all(shops.map((id) => api(`/api/reviews/seller/${id}`)))
    return new Set(lists.flat().map((r) => r.orderId))
  }, [orders.data])

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">My orders</h1>
      <ErrorMsg error={orders.error} />
      {orders.loading && !orders.data && <p className="text-sm text-muted">Loading your orders…</p>}
      {orders.data?.length === 0 && (
        <div className="panel">
          <Empty icon={PackageSearch} title="No orders yet">
            Find an original product from a verified seller near you. <Link to="/products" className="font-medium text-ink underline underline-offset-2">Browse products</Link>
          </Empty>
        </div>
      )}
      {orders.data?.map((d) => <OrderCard key={d.order.id} details={d} reviewed={reviewed.data?.has(d.order.id)} onChange={orders.reload} />)}
    </div>
  )
}

function OrderCard({ details, reviewed, onChange }) {
  const { order, shopName, items, payment, claim, events } = details
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)

  const cancel = async () => {
    if (!confirm(`Cancel order #${order.id}?`)) return
    setBusy(true)
    try {
      await api(`/api/orders/${order.id}/cancel`, { method: 'POST' })
      onChange()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="num text-[15px] font-semibold">#{order.id}</h2>
        <StatusBadge status={order.status} />
        <PayBadge payment={payment} />
        <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
        <span className="num ml-auto font-semibold">{money(order.total)}</span>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <Store className="size-3.5 shrink-0" aria-hidden /> <span className="font-medium text-ink">{shopName}</span> · cash on delivery
      </p>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <Link to={`/p/${i.productId}`} className="flex items-center gap-2.5 hover:underline">
              <ProductImage src={i.imageUrl} small className="size-10 shrink-0 rounded-lg" />
              <span className="min-w-0 text-sm">
                <span className="block truncate font-medium">{i.productName}</span>
                <span className="num text-xs text-muted">{i.quantity} × {money(i.unitPrice)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="max-w-sm">
        <StitchTrail steps={STEPS} done={STEP_OF[order.status]} cancelled={order.status === 'CANCELLED'} tone={order.status === 'DELIVERED' ? 'leaf' : 'madder'} />
      </div>
      <details className="text-xs text-muted">
        <summary className="inline-flex min-h-9 cursor-pointer items-center font-medium text-ink underline underline-offset-2">Tracking details</summary>
        <ol className="mt-1 space-y-1">
          {events.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span className="num w-28 shrink-0">{new Date(e.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="font-medium text-ink">{EVENT[e.status]}</span>
            </li>
          ))}
        </ol>
      </details>
      <p className="text-xs text-muted">Deliver to: {order.recipientName && `${order.recipientName}, `}{order.deliveryAddress}</p>
      <ErrorMsg error={error} />

      {order.status === 'PLACED' && (
        <button className="btn-danger" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel order'}</button>
      )}

      {order.status === 'DELIVERED' && (
        <div className="space-y-3 border-t border-line pt-3">
          {claim ? <ClaimStatus claim={claim} /> : reporting ? (
            <ClaimForm orderId={order.id} onDone={onChange} onCancel={() => setReporting(false)} />
          ) : (
            <>
              {reviewed ? <p className="text-sm text-muted">Thanks, you reviewed this order.</p> : <ReviewForm orderId={order.id} />}
              <button className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline underline-offset-2" onClick={() => setReporting(true)}>
                <ShieldAlert className="size-4" aria-hidden /> Not original or not as described? Report it
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function ClaimStatus({ claim }) {
  const label = REASONS.find(([r]) => r === claim.reason)?.[1]
  if (claim.status === 'OPEN') {
    return (
      <div className="rounded-lg bg-cotton px-3 py-2.5 text-sm">
        <p className="font-semibold">Problem reported: {label}</p>
        <p className="mt-0.5 text-muted">Our team is checking it. If the product isn't original, you get a full refund.</p>
      </div>
    )
  }
  return claim.status === 'REFUNDED'
    ? <Success>Refund approved{claim.resolutionNote ? `: ${claim.resolutionNote}` : '.'} Your money is on its way back.</Success>
    : <ErrorMsg error={`Your report was not accepted${claim.resolutionNote ? `: ${claim.resolutionNote}` : '.'}`} />
}

function ClaimForm({ orderId, onDone, onCancel }) {
  const [form, setForm] = useState({ reason: 'NOT_ORIGINAL', details: '', evidenceUrl: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/claims', { method: 'POST', body: { orderId, ...form, evidenceUrl: form.evidenceUrl.trim() || null } })
      onDone()
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <p className="font-semibold">Report a problem</p>
        <p className="text-sm text-muted">If the product isn't original, we refund you in full. Keep the product until our team has checked.</p>
      </div>
      <Picker label="Problem" value={form.reason} options={REASONS.map(([value, label]) => ({ value, label }))} onChange={(v) => setForm({ ...form, reason: v })} />
      <Field label="Details">
        <textarea className="input" rows={3} required maxLength={1000} autoComplete="off" value={form.details} onChange={set('details')}
                  placeholder="The box has no hologram, and the smell is different from the original…" />
      </Field>
      <Field label="Photo link" hint="Upload photos to Google Drive or similar and paste the link.">
        <input className="input" type="url" maxLength={500} autoComplete="off" spellCheck={false} placeholder="https://…" value={form.evidenceUrl} onChange={set('evidenceUrl')} />
      </Field>
      <ErrorMsg error={error} />
      <div className="flex gap-2">
        <button type="button" className="btn-quiet" onClick={onCancel}>Back</button>
        <button className="btn flex-1" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
      </div>
    </form>
  )
}

function ReviewForm({ orderId }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/reviews', { method: 'POST', body: { orderId, rating, comment } })
      setDone(true)
    } catch (err) {
      setError(err.status === 409 ? 'You have already reviewed this order.' : err)
    } finally {
      setBusy(false)
    }
  }

  if (done) return <Success>Thanks for your review!</Success>
  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-medium">Rate this order</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`}
                  onClick={() => setRating(n)}
                  className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-brand-50">
            <Star className={`size-6 ${n <= rating ? 'fill-ink text-ink' : 'text-line'}`} aria-hidden />
          </button>
        ))}
      </div>
      <textarea className="input" rows={2} maxLength={1000} aria-label="Review" placeholder="Was the product original and as described?"
                value={comment} onChange={(e) => setComment(e.target.value)} />
      <ErrorMsg error={error} />
      <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Submit review'}</button>
    </form>
  )
}
