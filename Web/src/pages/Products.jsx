import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ChevronDown, PackageSearch, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../api'
import { ProductCard, ProductGridSkeleton } from '../product-ui'
import { Empty, ErrorMsg, useLoad } from '../ui'

/** Every product in stock at a verified shop, with its lowest price. No location needed. */
export function useProducts({ q = '' } = {}) {
  return useLoad(() => api(`/api/catalog/products/nearby${q ? `?q=${encodeURIComponent(q)}` : ''}`), [q])
}

const SORTS = [
  ['relevance', 'Most sellers'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['name', 'Name A–Z'],
]

/** Read all filters from the URL so every filtered view can be shared and bookmarked. */
function useFilterParams() {
  const [params, setParams] = useSearchParams()
  const num = (k) => (params.get(k) ? Number(params.get(k)) : null)
  const f = {
    q: params.get('q') || '',
    cat: num('cat'),
    origins: params.get('origin') ? params.get('origin').split(',') : [],
    min: num('min'),
    max: num('max'),
    multi: params.get('multi') === '1',
    sort: params.get('sort') || 'relevance',
  }
  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      const empty = v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
      if (empty) next.delete(k)
      else next.set(k, Array.isArray(v) ? v.join(',') : v === true ? '1' : String(v))
    })
    setParams(next, { replace: true, preventScrollReset: true })
  }
  return [f, update]
}

/** Left filter column + product grid. Used on the home page (under the hero) and on /products. */
export function Catalog({ title }) {
  const [f, update] = useFilterParams()
  const [sheet, setSheet] = useState(useLocation().state?.filters === true) // Start shopping opens straight on the filters
  const categories = useLoad(() => api('/api/catalog/categories'))
  const products = useProducts({ q: f.q })

  // category tree: groups (no parent) with their child categories
  const tree = useMemo(() => {
    const all = categories.data || []
    return all.filter((c) => !c.parentId).map((g) => ({ ...g, children: all.filter((c) => c.parentId === g.id) }))
  }, [categories.data])
  const catIds = useMemo(() => {
    if (!f.cat) return null
    const group = tree.find((g) => g.id === f.cat)
    return new Set(group ? [group.id, ...group.children.map((c) => c.id)] : [f.cat])
  }, [f.cat, tree])

  const base = products.data || []
  const list = useMemo(() => {
    let rows = base.filter((p) =>
      (!catIds || catIds.has(p.categoryId)) &&
      (f.origins.length === 0 || f.origins.includes(p.originRegion)) &&
      (f.min == null || Number(p.minPrice) >= f.min) && (f.max == null || Number(p.minPrice) <= f.max) &&
      (!f.multi || p.sellerCount >= 2))
    const by = {
      'price-asc': (a, b) => Number(a.minPrice) - Number(b.minPrice),
      'price-desc': (a, b) => Number(b.minPrice) - Number(a.minPrice),
      name: (a, b) => a.name.localeCompare(b.name),
    }[f.sort]
    return by ? [...rows].sort(by) : rows
  }, [base, catIds, f.origins, f.min, f.max, f.multi, f.sort])

  const catName = categories.data?.find((c) => c.id === f.cat)?.name
  const heading = f.q ? `Results for “${f.q}”` : catName || title || 'All products'
  const activeCount = (f.cat ? 1 : 0) + f.origins.length + (f.min != null || f.max != null ? 1 : 0) + (f.multi ? 1 : 0)
  const clearAll = () => update({ cat: null, origin: [], min: null, max: null, multi: false, q: null })

  const filters = <Filters tree={tree} base={base} f={f} update={update} onClear={clearAll} activeCount={activeCount} />

  return (
    <div className="grid items-start gap-6 lg:pointer-fine:grid-cols-[232px_minmax(0,1fr)] lg:gap-6">
      <aside className="sticky top-32 hidden max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain lg:pointer-fine:block" aria-label="Filters">
        {filters}
      </aside>

      <section aria-labelledby="catalog-heading" className="min-w-0 space-y-3">
        <h2 id="catalog-heading" className="sr-only">{heading}</h2>
        <div className="flex items-center gap-2">
          <button className="btn-quiet h-10 min-h-0 px-3 text-sm lg:pointer-fine:hidden" onClick={() => setSheet(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
            {activeCount > 0 && <span className="num rounded-full bg-ink px-1.5 text-xs font-semibold text-white">{activeCount}</span>}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">Sort by</span>
            <select className="input h-10 min-h-0 w-auto py-0 text-sm" aria-label="Sort products" value={f.sort} onChange={(e) => update({ sort: e.target.value === 'relevance' ? null : e.target.value })}>
              {SORTS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
        </div>

        <ActiveChips f={f} update={update} categories={categories.data} onClear={clearAll} />

        <ErrorMsg error={products.error} />
        {products.loading && !products.data && <ProductGridSkeleton count={6} />}
        {products.data && list.length === 0 && (
          <div className="rounded-2xl bg-white ring-1 ring-line">
            <Empty icon={PackageSearch} title="No products match" />
            {activeCount > 0 && <div className="pb-6 text-center"><button className="btn-quiet" onClick={clearAll}>Clear all filters</button></div>}
          </div>
        )}
        {list.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-3 xl:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {sheet && (
        <div className="fixed inset-0 z-40 flex bg-black/45 lg:pointer-fine:hidden" role="dialog" aria-modal="true" aria-label="Filters"
             onClick={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="flex h-full w-1/2 flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-xl motion-safe:animate-drawer-in">
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <Filters tree={tree} base={base} f={f} update={update} onClear={clearAll} activeCount={activeCount} onClose={() => setSheet(false)} />
            </div>
            <div className="border-t border-line p-3">
              <button className="btn w-full text-[13px]" onClick={() => setSheet(false)}>Show <span className="num">{list.length}</span> {list.length === 1 ? 'product' : 'products'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Products() {
  return <Catalog />
}

// ---------------------------------------------------------------- filter column

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
              className="flex min-h-8 w-full items-center justify-between text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
        {title}
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </section>
  )
}

const Count = ({ n }) => <span className="num ml-auto text-[11px] text-muted">{n}</span>

/** onClose: shown in the phone drawer, where the panel is the whole drawer instead of a card. */
function Filters({ tree, base, f, update, onClear, activeCount, onClose }) {
  const [lo, setLo] = useState(f.min ?? '')
  const [hi, setHi] = useState(f.max ?? '')
  const countIn = (ids) => base.filter((p) => ids.includes(p.categoryId)).length
  const origins = useMemo(() => {
    const m = new Map()
    base.forEach((p) => p.originRegion && m.set(p.originRegion, (m.get(p.originRegion) || 0) + 1))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [base])
  const toggleOrigin = (o) => update({ origin: f.origins.includes(o) ? f.origins.filter((x) => x !== o) : [...f.origins, o] })
  const row = (active) => `flex min-h-11 lg:pointer-fine:min-h-8 w-full items-center gap-1.5 rounded-md px-2 text-left text-[13px] transition-colors ${active ? 'bg-ink font-semibold text-white' : 'hover:bg-brand-50'}`

  return (
    <div className={onClose ? 'p-3' : 'rounded-xl bg-white p-3 ring-1 ring-line'}>
      <div className="mb-2 flex min-h-8 items-center gap-2">
        <SlidersHorizontal className="size-3.5" aria-hidden />
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeCount > 0 && <button className="ml-auto min-h-8 text-xs font-medium underline underline-offset-2" onClick={onClear}>Clear all</button>}
        {onClose && (
          <button className={`${activeCount > 0 ? '' : 'ml-auto'} -mr-1 inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50`} onClick={onClose} aria-label="Close filters">
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <ul className="space-y-0.5">
          <li><button className={row(!f.cat)} onClick={() => update({ cat: null })} aria-pressed={!f.cat}>All products <Count n={base.length} /></button></li>
          {tree.map((g) => {
            const ids = [g.id, ...g.children.map((c) => c.id)]
            const open = f.cat === g.id || g.children.some((c) => c.id === f.cat)
            return (
              <li key={g.id}>
                <button className={row(f.cat === g.id)} onClick={() => update({ cat: g.id })} aria-pressed={f.cat === g.id}>
                  <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
                  {g.name} <Count n={countIn(ids)} />
                </button>
                {open && g.children.length > 0 && (
                  <ul className="ml-3.5 mt-0.5 space-y-0.5 border-l border-line pl-1.5">
                    {g.children.map((c) => (
                      <li key={c.id}>
                        <button className={row(f.cat === c.id)} onClick={() => update({ cat: c.id })} aria-pressed={f.cat === c.id}>
                          {c.name} <Count n={countIn([c.id])} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </FilterSection>

      {origins.length > 0 && (
        <FilterSection title="Origin district">
          <div className="space-y-0.5">
            {origins.map(([o, n]) => (
              <label key={o} className="flex min-h-11 lg:pointer-fine:min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] hover:bg-brand-50">
                <input type="checkbox" className="size-3.5 accent-black" checked={f.origins.includes(o)} onChange={() => toggleOrigin(o)} />
                {o} <Count n={n} />
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price (৳)">
        <form className={onClose ? 'grid grid-cols-[1fr_auto_1fr] items-center gap-1.5' : 'flex items-center gap-1.5'} onSubmit={(e) => { e.preventDefault(); update({ min: lo === '' ? null : lo, max: hi === '' ? null : hi }) }}>
          <input className="input num h-11 min-h-0 min-w-0 px-2 text-sm lg:pointer-fine:h-8 lg:pointer-fine:text-[13px]" type="number" inputMode="numeric" min="0" aria-label="Minimum price" placeholder="Min" value={lo} onChange={(e) => setLo(e.target.value)} />
          <span className="text-muted" aria-hidden>–</span>
          <input className="input num h-11 min-h-0 min-w-0 px-2 text-sm lg:pointer-fine:h-8 lg:pointer-fine:text-[13px]" type="number" inputMode="numeric" min="0" aria-label="Maximum price" placeholder="Max" value={hi} onChange={(e) => setHi(e.target.value)} />
          <button className={`btn-quiet h-11 min-h-0 shrink-0 px-2.5 text-sm lg:pointer-fine:h-8 lg:pointer-fine:text-[13px] ${onClose ? 'col-span-3' : ''}`}>Go</button>
        </form>
      </FilterSection>

      <FilterSection title="More">
        <label className={`flex min-h-11 lg:pointer-fine:min-h-8 items-center gap-2 rounded-md px-2 text-[13px] cursor-pointer hover:bg-brand-50`}>
          <input type="checkbox" className="size-3.5 accent-black" checked={f.multi} onChange={(e) => update({ multi: e.target.checked })} />
          Sold by 2+ sellers
        </label>
      </FilterSection>
    </div>
  )
}

function ActiveChips({ f, update, categories, onClear }) {
  const chips = []
  const name = categories?.find((c) => c.id === f.cat)?.name
  if (f.q) chips.push([`“${f.q}”`, () => update({ q: null })])
  if (name) chips.push([name, () => update({ cat: null })])
  f.origins.forEach((o) => chips.push([o, () => update({ origin: f.origins.filter((x) => x !== o) })]))
  if (f.min != null || f.max != null) chips.push([`৳${f.min ?? 0} – ${f.max ?? '∞'}`, () => update({ min: null, max: null })])
  if (f.multi) chips.push(['2+ sellers', () => update({ multi: false })])
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(([label, remove]) => (
        <button key={label} onClick={remove} aria-label={`Remove filter ${label}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-sm font-medium text-white hover:bg-brand-600">
          {label} <X className="size-3.5" aria-hidden />
        </button>
      ))}
      <button onClick={onClear} className="min-h-9 px-2 text-sm font-medium underline underline-offset-2">Clear all</button>
    </div>
  )
}
