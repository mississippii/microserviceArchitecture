import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, ShoppingBasket } from 'lucide-react'
import { api } from '../api'
import { ProductCard, ProductGridSkeleton } from '../product-ui'
import { ErrorMsg, useLoad } from '../ui'
import { useProducts } from './Products'

/**
 * The landing page: the categories, then a row of in-stock products per category group; on phones a floating Start shopping.
 * No sort or filter here; those live on /products once a visitor picks what to browse.
 */
export default function Shop() {
  const categories = useLoad(() => api('/api/catalog/categories'))
  const catalogue = useLoad(() => api('/api/catalog/products'))
  const inStock = useProducts()
  const groups = useMemo(() => {
    const all = categories.data || []
    // One card per product: its varieties (আম - হিমসাগর, আম - ল্যাংড়া) fold into আম, with the lowest price; they show after a tap.
    const byId = new Map((catalogue.data || []).map((p) => [p.id, p]))
    const folded = (items) => {
      const cards = new Map()
      items.forEach((p) => {
        const parent = byId.get(byId.get(p.id)?.parentId)
        const key = parent?.id ?? p.id
        const card = cards.get(key)
        if (card) {
          card.minPrice = Math.min(Number(card.minPrice), Number(p.minPrice))
          card.sellerCount = Math.max(card.sellerCount, p.sellerCount)
          if (parent) card.varieties = (card.varieties || 0) + 1
        } else {
          cards.set(key, parent ? { ...p, id: parent.id, name: parent.name, imageUrl: parent.imageUrl || p.imageUrl, originRegion: parent.originRegion, varieties: 1 } : { ...p })
        }
      })
      return [...cards.values()]
    }
    return all.filter((c) => !c.parentId).map((g) => {
      const ids = new Set([g.id, ...all.filter((c) => c.parentId === g.id).map((c) => c.id)])
      return {
        ...g,
        listed: (catalogue.data || []).some((p) => ids.has(p.categoryId)),
        items: folded((inStock.data || []).filter((p) => ids.has(p.categoryId))),
      }
    }).sort((a, b) => Number(b.items.length > 0) - Number(a.items.length > 0)) // groups with stock first
  }, [categories.data, catalogue.data, inStock.data])
  const ready = categories.data && catalogue.data && inStock.data

  return (
    <div className="space-y-7 sm:space-y-10">
      <h1 className="sr-only">Original products from verified sellers</h1>
      <StartShopping />
      <ErrorMsg error={categories.error || catalogue.error || inStock.error} />
      {/* a group shows once it has products in the catalogue, or a photo of its own (a new group waiting for its first products) */}
      <Categories groups={groups.filter((g) => g.listed || g.imageUrl)} loading={!ready} />
      {!inStock.data ? <ProductGridSkeleton count={4} /> : groups.filter((g) => g.items.length > 0).map((g) => <GroupRow key={g.id} group={g} />)}
      <SellerBand />
    </div>
  )
}

/**
 * Phones: a floating way into the full catalogue, bottom right where the thumb is. It slides in and keeps sending
 * out a ripple to be noticed; it only steps aside when the footer reaches it, so it never covers footer links.
 */
function StartShopping() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return undefined
    const watch = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { rootMargin: '-88% 0px 0px 0px' }) // the bottom strip, where the button sits
    watch.observe(footer)
    return () => watch.disconnect()
  }, [])
  return (
    <div className={`fixed right-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 rounded-full transition-all duration-200 motion-safe:animate-fab-nudge sm:hidden ${hidden ? 'pointer-events-none translate-y-4 opacity-0' : ''}`}>
      <Link to="/products" state={{ filters: true }} aria-hidden={hidden} tabIndex={hidden ? -1 : undefined}
            className="btn m-0 h-10 min-h-0 gap-1.5 rounded-full bg-accent px-3.5 text-sm shadow-[0_6px_16px_rgb(8_102_255/0.35)] ring-1 ring-white hover:bg-accent-hover active:bg-accent-hover motion-safe:animate-fab-in">
        <ShoppingBasket className="size-4" aria-hidden /> Start shopping
      </Link>
    </div>
  )
}

function SectionTitle({ id, title, to }) {
  return (
    <div className="flex items-center gap-2">
      <h2 id={id} className="text-base font-semibold sm:text-xl">{title}</h2>
      <Link to={to} className="ml-auto inline-flex min-h-11 items-center gap-0.5 text-sm font-medium hover:underline">
        See all <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}

/** One photo tile per category group, four across on phones. */
function Categories({ groups, loading }) {
  return (
    <section aria-labelledby="categories" className="space-y-2">
      <SectionTitle id="categories" title="Shop by category" to="/products" />
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 sm:gap-3">
        {(loading ? Array.from({ length: 6 }, (_, i) => ({ id: i, skeleton: true })) : groups).map((g) => (
          <li key={g.id}>
            {g.skeleton ? <div className="aspect-square animate-pulse rounded-xl bg-brand-50" /> : (
              <Link to={`/products?cat=${g.id}`} className="group block text-center">
                <span className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line transition-shadow group-hover:shadow-[0_6px_20px_rgb(0_0_0/0.10)]">
                  {g.imageUrl
                    ? <img src={g.imageUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                    : <ShoppingBasket className="size-1/3 text-muted" aria-hidden />}
                </span>
                <span className="mt-1.5 block truncate text-xs font-medium sm:text-sm">{g.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A category group's in-stock products: a sideways row on phones, a grid of eight on wider screens. */
function GroupRow({ group: g }) {
  return (
    <section aria-labelledby={`group-${g.id}`} className="space-y-2">
      <SectionTitle id={`group-${g.id}`} title={g.name} to={`/products?cat=${g.id}`} />
      <ul className="-mx-3 flex snap-x gap-2.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-3">
        {g.items.map((p, i) => (
          <li key={p.id} className={`w-[40%] shrink-0 snap-start sm:w-auto ${i >= 8 ? 'sm:hidden' : ''}`}><ProductCard p={p} /></li>
        ))}
      </ul>
    </section>
  )
}

function SellerBand() {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-brand-800 p-4 text-white sm:flex-row sm:items-center sm:gap-4 sm:p-7">
      <div className="flex-1">
        <h2 className="text-base font-semibold sm:text-xl">Sell your original products online</h2>
        <p className="mt-1 max-w-lg text-sm text-brand-100">Get verified, reach more customers, and manage orders and stock for free.</p>
      </div>
      <Link to="/register" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[15px] font-semibold text-ink hover:bg-brand-50">
        Open your shop <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}
