import { Link, useParams } from 'react-router-dom'
import { MapPin, ShieldCheck, Store } from 'lucide-react'
import { api, money, per } from '../api'
import { ProductImage, Rating } from '../product-ui'
import { Empty, ErrorMsg, initials, useLoad } from '../ui'

/** Public, shareable shop page (/s/:id). Shows no address or coordinates. */
export default function ShopPage() {
  const { id } = useParams()
  const shop = useLoad(() => api(`/api/catalog/shops/${id}`), [id])
  const s = shop.data

  if (shop.error) {
    return (
      <div className="panel mx-auto max-w-md">
        <Empty icon={Store} title="Shop not found">
          This shop doesn't exist or isn't verified right now. <Link to="/products" className="font-medium text-ink underline underline-offset-2">Browse products</Link>
        </Empty>
      </div>
    )
  }
  if (!s) return <p className="text-muted">Loading shop…</p>

  return (
    <div className="space-y-5">
      <section className="-mx-3 -mt-3 flex items-center gap-3 bg-white px-3 py-5 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:px-6 sm:ring-1 sm:ring-line">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-lg font-semibold text-white">{initials(s.shopName)}</span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{s.shopName}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-ink"><ShieldCheck className="size-4" aria-hidden /> Verified seller</span>
            <Rating score={s.qualityScore} />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> Delivers within <span className="num">{Math.round(s.deliveryRadiusM / 1000)}</span> km</span>
          </p>
        </div>
      </section>

      <section aria-labelledby="shop-products" className="space-y-3">
        <h2 id="shop-products" className="text-lg font-semibold">
          Products <span className="num text-sm font-normal text-muted">{s.items.length}</span>
        </h2>
        <ErrorMsg error={shop.error} />
        {s.items.length === 0 && <div className="panel"><Empty icon={Store} title="No products listed yet" /></div>}
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
          {s.items.map((i) => (
            <li key={i.listingId}>
              <Link to={`/p/${i.productId}`} className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line hover:shadow-[0_6px_20px_rgb(0_0_0/0.10)]">
                <ProductImage src={i.imageUrl} small className="aspect-square w-full" />
                <span className="flex flex-1 flex-col gap-0.5 p-2.5">
                  <span className="line-clamp-2 text-sm font-medium leading-snug">{i.name}</span>
                  {i.sourceNote && <span className="line-clamp-1 text-xs text-muted">Source: {i.sourceNote}</span>}
                  <span className="mt-auto flex items-baseline justify-between pt-1">
                    <span className="num text-base font-semibold">{money(i.price)}<span className="text-sm font-normal text-muted">{per(i.unit)}</span></span>
                    <span className="text-xs text-muted">{i.stock > 0 ? 'In stock' : 'Out of stock'}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">Prices are this shop's. Open a product to compare with other verified sellers near you.</p>
      </section>
    </div>
  )
}
