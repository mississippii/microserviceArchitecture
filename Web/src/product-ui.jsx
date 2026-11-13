import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, MapPin, Star, Store } from 'lucide-react'
import { money } from './api'


/** Bundled product photos (/products/*.webp) are cut-outs: shown whole on white, not cropped. */
export const isCutout = (src) => typeof src === 'string' && src.startsWith('/products/')

/** Photo with a graceful fallback when the link is missing or broken. */
export function ProductImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-brand-50 text-brand-200 ${className}`} aria-hidden={!alt}>
        <ImageOff className="size-1/4 max-h-10 max-w-10" aria-hidden />
      </div>
    )
  }
  return <img src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailed(true)}
              className={`${isCutout(src) ? 'bg-white object-contain' : 'object-cover'} ${className}`} />
}

/** Quality score (0–100) shown as a 5-star rating; new sellers have no rating yet. */
export function Rating({ score, className = '' }) {
  const s = Number(score)
  if (!s) return <span className={`text-sm text-muted ${className}`}>New seller</span>
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold text-ink ${className}`}>
      <Star className="size-4 fill-turmeric-500 text-turmeric-500" aria-hidden />
      <span className="num">{(s / 20).toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  )
}

/** Marketplace product card. `p` comes from /products/nearby (with minPrice) or /products (no price). */
export function ProductCard({ p }) {
  const hasPrice = p.minPrice != null
  return (
    <Link to={`/p/${p.id}`}
          className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-shadow hover:shadow-[0_6px_20px_rgb(0_0_0/0.10)]">
      <div className="relative aspect-square overflow-hidden bg-brand-50">
        <ProductImage src={p.imageUrl} small className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
        {p.originRegion && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-brand-900 shadow-sm">
            <MapPin className="size-3" aria-hidden /> {p.originRegion}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</h3>
        {hasPrice ? (
          <>
            <p className="mt-auto pt-1 text-base font-semibold text-ink">
              <span className="text-xs font-medium text-muted">from </span><span className="num">{money(p.minPrice)}</span>
            </p>
            <p className="flex items-center gap-1 text-xs text-muted">
              {!p.varieties && <Store className="size-3.5" aria-hidden />}
              {p.varieties
                ? <><span className="num">{p.varieties}</span> {p.varieties === 1 ? 'variety' : 'varieties'}</>
                : <><span className="num">{p.sellerCount}</span> {p.sellerCount === 1 ? 'seller' : 'sellers'}</>}
            </p>
          </>
        ) : (
          <p className="mt-auto pt-1 text-xs text-muted">Not in stock</p>
        )}
      </div>
    </Link>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-line">
          <div className="aspect-square animate-pulse bg-brand-50" />
          <div className="space-y-2 p-3"><div className="h-4 w-4/5 rounded bg-brand-50" /><div className="h-5 w-1/2 rounded bg-brand-50" /></div>
        </div>
      ))}
    </div>
  )
}
