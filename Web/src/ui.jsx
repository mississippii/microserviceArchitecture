import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check, CheckCircle2, ChevronDown, LayoutGrid, LocateFixed, Plus, Search, X } from 'lucide-react'

/** Load data on mount / when deps change. Returns { data, error, loading, reload }. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps)
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    return load()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }))
  }, [load])
  useEffect(() => {
    reload()
  }, [reload])
  return { ...state, reload }
}

export function ErrorMsg({ error }) {
  if (!error) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-madder-50 px-3 py-2.5 text-sm text-madder-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{error.message || String(error)}</span>
    </p>
  )
}

export function Success({ children }) {
  if (!children) return null
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-leaf-100 px-3 py-2.5 text-sm text-leaf-800">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

/**
 * Compact outlined field (as tradebazaar): the label rides the top border; the split background hides the line under it.
 * prefix/suffix sit inside the box: ৳ before money, the unit after a quantity.
 */
export function Field({ label, hint, prefix, suffix, children }) {
  return (
    <label className={`group relative block pt-2 ${prefix ? '[&_.input]:pl-7' : ''} ${suffix ? '[&_.input]:pr-14' : ''}`}>
      <span className="relative block">
        {children}
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-muted">{prefix}</span>}
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted">{suffix}</span>}
      </span>
      <span className="pointer-events-none absolute top-0 left-2.5 max-w-[calc(100%-1.25rem)] truncate bg-linear-to-b from-transparent from-50% to-white to-50% px-1 text-xs leading-4 font-medium text-muted group-has-disabled:to-cotton">{label}</span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

/** A form section: small icon chip + title, then its fields (tradebazaar SectionCard, flat). */
export function FormSection({ icon: Icon, title, aside, children }) {
  return (
    <section className="space-y-3 py-3 first:pt-0" aria-label={title}>
      <div className="flex min-h-7 items-center gap-2.5">
        {Icon && <span className="grid size-7 shrink-0 place-items-center rounded-md bg-cotton"><Icon className="size-3.5" aria-hidden /></span>}
        <h3 className="mr-auto text-sm font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/**
 * Pick one from a list in a sheet instead of a native dropdown (tradebazaar OptionPickerSheet).
 * options: [{ value, label, hint? }]. A search box shows when the list is long.
 */
export function Picker({ label, value, options, onChange, placeholder = 'Select', disabled, required }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [at, setAt] = useState(null) // desktop: where the dropdown sits, next to its field
  const button = useRef(null)
  const cur = options.find((o) => String(o.value) === String(value ?? ''))
  const list = q ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options
  const show = () => {
    setQ('')
    // Phones get a bottom sheet. From sm it is a dropdown under the field (above it when there is no room below).
    if (window.matchMedia('(min-width: 640px)').matches) {
      const r = button.current.getBoundingClientRect()
      const below = window.innerHeight - r.bottom - 12
      const up = below < 200 && r.top > below
      setAt({ left: Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8), width: Math.max(r.width, 200), maxHeight: Math.min(300, up ? r.top - 12 : below),
        ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) })
    } else setAt(null)
    setOpen(true)
  }
  const close = () => { setOpen(false); button.current?.focus() }
  const choices = (compact) => (
    <>
      {options.length > 8 && (
        <div className={`relative ${compact ? 'mb-1' : 'mb-2'}`}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className={`input pl-9 ${compact ? 'min-h-9 py-1 text-sm' : ''}`} type="search" autoFocus placeholder="Search…" aria-label={`Search ${label}`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}
      <ul className={compact ? '' : '-mx-3 divide-y divide-line sm:-mx-4'} role="listbox" aria-label={label}>
        {list.map((o, n) => {
          const on = String(o.value) === String(value ?? '')
          return (
            <li key={o.value}>
              <button type="button" role="option" aria-selected={on} autoFocus={compact && options.length <= 8 && (cur ? on : n === 0)} onClick={() => { onChange(o.value); close() }}
                      className={`flex w-full items-center gap-3 text-left hover:bg-brand-50 focus-visible:bg-brand-50 ${compact ? 'min-h-9 rounded-md px-2.5' : 'min-h-12 px-4'} ${on ? 'font-semibold' : ''}`}>
                <span className={`min-w-0 flex-1 truncate ${compact ? 'text-sm' : 'text-[15px]'}`}>{o.label}</span>
                {o.hint && <span className="num shrink-0 text-xs text-muted">{o.hint}</span>}
                {on && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
            </li>
          )
        })}
        {list.length === 0 && <li className={`text-center text-sm text-muted ${compact ? 'px-2 py-3' : 'px-4 py-6'}`}>No match</li>}
      </ul>
    </>
  )
  return (
    <Field label={label}>
      <button ref={button} type="button" disabled={disabled} onClick={show} aria-haspopup="listbox" aria-expanded={open}
              className="input flex items-center gap-2 pr-2 text-left">
        <span className={`min-w-0 flex-1 truncate ${cur ? '' : 'text-muted/80'}`}>{cur?.label ?? placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
      </button>
      {/* keeps native "please fill in" on submit */}
      {required && <input tabIndex={-1} aria-hidden required value={value ?? ''} onChange={() => {}} className="pointer-events-none absolute bottom-0 left-1/2 size-px opacity-0" />}
      {open && !at && <Drawer compact title={label} onClose={close}>{choices(false)}</Drawer>}
      {open && at && <Dropdown at={at} onClose={close}>{choices(true)}</Dropdown>}
    </Field>
  )
}

/** Desktop dropdown: a small list fixed next to its field, above everything (so a form's scroll area can't clip it). */
function Dropdown({ at, onClose, children }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const me = {}
    openDrawers.push(me) // Escape closes this list, not the form sheet under it
    const esc = (e) => { if (e.key === 'Escape' && openDrawers.at(-1) === me) close.current() }
    const away = () => close.current() // the field moved: a stale position is worse than a closed list
    document.addEventListener('keydown', esc)
    window.addEventListener('resize', away)
    return () => {
      document.removeEventListener('keydown', esc)
      window.removeEventListener('resize', away)
      openDrawers.splice(openDrawers.indexOf(me), 1)
    }
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); onClose() }} onWheel={(e) => e.target === e.currentTarget && onClose()}>
      <div style={at} onClick={(e) => e.stopPropagation()}
           className="fixed overflow-y-auto overscroll-contain rounded-xl bg-white p-1 shadow-[0_8px_24px_rgb(0_0_0/0.18)] ring-1 ring-line">
        {children}
      </div>
    </div>,
    document.body,
  )
}

const TONES = {
  PLACED: 'bg-turmeric-100 text-turmeric-800',
  ACCEPTED: 'bg-brand-100 text-brand-900',
  SHIPPED: 'bg-brand-100 text-brand-900',
  DELIVERED: 'bg-leaf-100 text-leaf-800',
  CANCELLED: 'bg-cotton text-muted ring-1 ring-line',
  PENDING: 'bg-turmeric-100 text-turmeric-800',
  VERIFIED: 'bg-leaf-100 text-leaf-800',
  SUSPENDED: 'bg-madder-100 text-madder-800',
}
const LABELS = { PLACED: 'New', ACCEPTED: 'Accepted', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', PENDING: 'Pending', VERIFIED: 'Verified', SUSPENDED: 'Suspended' }

export function StatusBadge({ status }) {
  return <span className={`badge ${TONES[status] || 'bg-cotton text-muted'}`}>{LABELS[status] || status}</span>
}

/**
 * Running-stitch trail: knots for steps, dashed thread between them.
 * `done` = number of completed steps (0..steps.length). `animateIndex` = segment that just got stitched.
 */
export function StitchTrail({ steps, done, tone = 'madder', cancelled = false, animateIndex = -1, compact = false }) {
  const color = cancelled ? 'var(--color-muted)' : tone === 'leaf' ? 'var(--color-leaf-600)' : 'var(--color-ink)'
  const pending = 'var(--color-brand-200)'
  return (
    <ol className="flex w-full items-start" aria-label="Progress">
      {steps.map((label, i) => {
        const reached = i < done
        const current = i === done - 1
        return (
          <li key={label} className={`flex min-w-0 items-start ${i < steps.length - 1 ? 'flex-1' : ''}`}
              aria-current={current ? 'step' : undefined}>
            <span className={`flex w-2.5 shrink-0 flex-col ${i === 0 ? 'items-start' : i === steps.length - 1 ? 'items-end' : 'items-center'}`}>
              <span className="mt-[3px] block size-2.5 rounded-full"
                    style={{ background: reached ? color : 'white', boxShadow: `inset 0 0 0 2px ${reached ? color : pending}` }} />
              {!compact && (
                <span className={`mt-1.5 whitespace-nowrap text-[11px] leading-none ${reached ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {label}
                </span>
              )}
              {compact && <span className="sr-only">{label}{reached ? ' (done)' : ''}</span>}
            </span>
            {i < steps.length - 1 && (
              <svg className="mx-1.5 mt-[5px] h-1.5 w-0 grow overflow-visible" aria-hidden>
                <line x1="2" y1="3" x2="100%" y2="3" stroke={pending} strokeWidth="2" strokeLinecap="round" strokeDasharray="6 5" />
                {i < done - 1 && (
                  <line x1="2" y1="3" x2="100%" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 5"
                        className={i === animateIndex ? 'stitch-in' : undefined} />
                )}
              </svg>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Section tabs. On phones they become a fixed bottom bar within thumb reach (tabs need an `icon`);
 * from `sm` up they are a standard top tab row.
 */
export function Tabs({ tabs, value, onChange }) {
  const [more, setMore] = useState(false)
  // Phones: at most five cells. With more sections, the fifth is "More" and opens the rest as a sheet.
  const overflow = tabs.length > 5
  const bar = overflow ? tabs.slice(0, 4) : tabs
  const rest = overflow ? tabs.slice(4) : []
  const hiddenActive = rest.find((t) => t.id === value)
  const restCount = rest.reduce((n, t) => n + (t.count || 0), 0)
  const go = (id) => { setMore(false); onChange(id) }

  return (
    <>
      <nav aria-label="Sections"
           className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="mx-auto flex max-w-md">
          {bar.map((t) => <BarCell key={t.id} t={t} active={t.id === value && !more} onClick={() => go(t.id)} />)}
          {overflow && (
            <BarCell active={!!hiddenActive || more} onClick={() => setMore(!more)} expanded={more}
                     t={hiddenActive && !more ? hiddenActive : { label: 'More', icon: LayoutGrid, count: restCount || undefined }} />
          )}
        </div>
      </nav>
      {more && (
        <div className="fixed inset-0 z-[25] bg-black/45 sm:hidden" onClick={() => setMore(false)}>
          <div role="dialog" aria-label="More sections" onClick={(e) => e.stopPropagation()}
               className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] rounded-t-2xl bg-white p-3">
            <div className="grid grid-cols-3 gap-2">
              {rest.map((t) => {
                const Icon = t.icon
                const active = t.id === value
                return (
                  <button key={t.id} onClick={() => go(t.id)} aria-current={active ? 'page' : undefined}
                          className={`relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl text-sm font-medium ${active ? 'bg-ink text-white' : 'bg-cotton text-ink'}`}>
                    {Icon && <Icon className="size-6" aria-hidden />}
                    {t.label}
                    {t.count != null && <span className="num absolute right-2 top-2 min-w-5 rounded-full bg-brand-900 px-1 text-center text-[11px] font-semibold leading-5 text-white">{t.count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <TopTabs tabs={tabs} value={value} onChange={onChange} />
    </>
  )
}

function BarCell({ t, active, onClick, expanded }) {
  const Icon = t.icon
  return (
    <button onClick={onClick} aria-current={active && expanded == null ? 'page' : undefined} aria-expanded={expanded}
            className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? 'text-brand-900' : 'text-muted'}`}>
      {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand-900" />}
      <span className="relative">
        {Icon && <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden />}
        {t.count != null && (
          <span className={`num absolute -right-2.5 -top-1.5 min-w-5 rounded-full px-1 text-center text-[11px] font-semibold leading-5 ${t.tone === 'turmeric' ? 'bg-white text-ink ring-1 ring-ink' : 'bg-brand-900 text-white'}`}>
            {t.count}
          </span>
        )}
      </span>
      {t.short || t.label}
    </button>
  )
}

function TopTabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="hidden gap-1 overflow-x-auto border-b border-line sm:flex">
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button key={t.id} role="tab" aria-selected={active} onClick={() => onChange(t.id)}
                  className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 px-3 text-[15px] font-medium transition-colors ${active ? 'text-brand-900' : 'text-muted hover:text-ink'}`}>
            {t.label}
            {t.count != null && (
              <span className={`num rounded-full px-1.5 text-xs font-semibold ${active ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-900'}`}>
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-900" />}
          </button>
        )
      })}
    </div>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 size-6 text-brand-700" aria-hidden />}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  )
}

/** Browser geolocation → calls onPick({lat, lng}). */
export function LocateButton({ onPick, className = 'btn-quiet' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const locate = () => {
    if (!navigator.geolocation) return setErr('This browser cannot share location. Enter it manually.')
    setBusy(true)
    setErr(null)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false)
        onPick({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) })
      },
      () => {
        setBusy(false)
        setErr('Location permission denied or unavailable. Enter it manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  return (
    <span className={`flex-col ${className.includes('w-full') ? 'flex' : 'inline-flex'}`}>
      <button type="button" className={className} onClick={locate} disabled={busy}>
        <LocateFixed className="size-4" aria-hidden />
        {busy ? 'Finding you…' : 'Use my location'}
      </button>
      {err && <span role="alert" className="mt-1 text-xs text-madder-700">{err}</span>}
    </span>
  )
}

export const timeAgo = (iso) => {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Seller Centre / Admin shell. Desktop: sticky left sidebar (identity + sections).
 * Phones: compact identity row, sections in the fixed bottom bar. Tablets: top tabs.
 */
export function Console({ identity, tabs, value, onChange, children }) {
  return (
    <div className="max-sm:-mt-3 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">{/* phones: content starts right under the header */}
      <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Sections">
        <div className="panel p-2.5">
          <div className="border-b border-line px-1.5 pb-3 pt-1">{identity}</div>
          <nav className="mt-2 space-y-0.5" role="tablist" aria-orientation="vertical">
            {tabs.map((t) => {
              const active = t.id === value
              const Icon = t.icon
              return (
                <button key={t.id} role="tab" aria-selected={active} onClick={() => onChange(t.id)}
                        className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium transition-colors ${active ? 'bg-ink text-white' : 'text-muted hover:bg-brand-50 hover:text-ink'}`}>
                  {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
                  {t.label}
                  {t.count != null && (
                    <span className={`num ml-auto rounded-full px-1.5 text-xs font-semibold ${active ? 'bg-white text-ink' : 'bg-brand-100 text-ink'}`}>{t.count}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="mb-0 lg:hidden"><Tabs tabs={tabs} value={value} onChange={onChange} /></div>
        {children}
        {/* room for the fixed bottom bar on phones */}
        <div className="h-16 sm:hidden" aria-hidden />
      </div>
    </div>
  )
}

/** Small KPI tile. Pass onClick to make it a shortcut into a section. */
export function StatTile({ label, value, hint, icon: Icon, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`flex w-full flex-col gap-1 rounded-xl bg-white p-3 text-left ring-1 ring-line sm:p-3.5 ${onClick ? 'hover:ring-ink' : ''}`}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {Icon && <Icon className="size-3.5" aria-hidden />}{label}
      </span>
      <span className="num truncate text-lg font-semibold leading-tight sm:text-xl">{value ?? '–'}</span>
      {hint && <span className="truncate text-xs text-muted">{hint}</span>}
    </Tag>
  )
}

const PAY = { PENDING: ['To collect', 'bg-white text-ink ring-1 ring-line'], HELD: ['Held', 'bg-brand-100 text-ink'], RELEASED: ['Paid', 'bg-ink text-white'], REFUNDED: ['Refunded', 'bg-cotton text-muted ring-1 ring-line'] }

/** Payment state of an order (COD is "To collect" until delivered). */
export function PayBadge({ payment }) {
  if (!payment) return null
  const [label, tone] = PAY[payment.status] || [payment.status, 'bg-cotton text-muted']
  return <span className={`badge ${tone}`}>{label}</span>
}

/** Segmented filter with counts, e.g. Open 3 · Delivered 10. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
      <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label={label}>
        {options.map(([id, text, count]) => (
          <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={value === id}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${value === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
            {text}{count != null && <span className={`num text-xs ${value === id ? 'text-white/70' : ''}`}>{count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** Brand mark: a mango-yellow knot and a running stitch on white. */
// The brand mark: the owner's bird logo (Pictures/site images/Logo.pdf), traced to vectors. No letter, so it survives a change of name.
const BIRD_VIEWBOX = '174.0 172.0 676.1 676.1'
const BIRD_INK = 'M666.7 815.4C668.3 786.7 652.7 753.0 626.3 728.0C604.6 707.5 591.1 699.1 550.6 681.0C520.2 667.4 495.5 655.2 483.7 647.9C452.7 628.7 427.7 599.7 413.7 567.0C406.1 549.1 404.4 542.7 397.4 506.5C388.5 460.1 364.5 426.5 330.6 413.0C306.0 403.1 281.2 405.8 262.6 420.4L258.6 423.5 L261.5 418.2C268.4 405.4 283.6 391.6 298.0 384.7C303.8 382.0 305.2 380.9 306.7 377.5C309.6 371.0 319.5 361.8 328.0 357.6C357.1 343.4 394.4 353.1 423.5 382.4C431.1 390.1 447.6 411.7 444.2 409.6C443.6 409.3 438.9 405.8 433.8 401.9C404.5 379.8 368.7 373.2 340.3 384.8C332.7 387.9 322.0 394.4 322.0 396.0C322.0 396.6 325.9 397.0 331.9 397.0C354.0 397.0 377.4 404.1 395.2 416.1C416.0 430.2 434.2 456.4 440.3 481.0L442.7 490.5 L444.0 483.0C451.7 437.2 472.7 396.5 505.4 363.7C538.8 330.1 574.8 309.7 641.0 286.8C704.2 264.9 745.9 236.9 761.7 205.5L766.2 196.5 L765.7 217.0C764.3 270.2 745.8 306.0 701.9 340.2C683.3 354.7 669.1 362.2 638.8 373.4C597.8 388.6 579.8 398.2 558.0 416.4C517.2 450.5 497.0 490.4 497.0 537.0C497.0 589.3 524.7 638.9 571.7 670.8C577.1 674.5 596.1 685.0 595.0 683.8C594.7 683.4 591.6 680.9 588.0 678.0C578.5 670.5 561.5 653.4 556.4 646.3C544.2 629.5 537.8 603.3 540.1 580.7C541.0 571.9 543.7 559.5 543.9 563.3C544.2 568.3 551.5 587.5 556.2 595.5C563.4 607.7 578.6 623.0 593.5 633.0C617.8 649.3 628.9 657.7 639.1 667.9C675.5 704.4 686.0 750.8 670.8 809.5C666.8 825.2 666.1 826.2 666.7 815.4Z'
const BIRD_WING = 'M516.8 548.2C516.1 537.9 517.5 521.7 520.1 511.1C532.6 460.2 572.8 420.4 635.0 397.5C663.5 387.0 676.6 381.4 690.4 373.5C709.4 362.7 717.7 356.5 733.9 340.3C751.7 322.8 752.4 322.8 749.5 341.0C745.2 367.7 732.7 391.7 714.0 409.2C698.0 424.2 680.9 434.0 651.1 445.0C625.9 454.3 603.3 463.7 593.1 469.0C560.0 486.5 532.7 517.6 524.0 547.8C522.0 554.8 521.3 556.0 519.4 556.0C517.4 556.0 517.2 555.4 516.8 548.2Z'

/** The brand mark: the bird in its own black and grey on a white disc, inside a thin black ring. inverse (black grounds, the footer): thin white ring, white bird. */
export function Mark({ className = 'size-8', inverse = false }) {
  return (
    <svg viewBox={BIRD_VIEWBOX} className={className} aria-hidden>
      <circle cx="512.0" cy="510.1" r="324.5" fill={inverse ? 'none' : '#fff'} stroke={inverse ? '#fff' : 'var(--color-ink)'} strokeWidth="27.0" />
      <g transform="translate(512.0 510.1) scale(0.68) translate(-512.0 -510.1)">
        <path fillRule="evenodd" fill={inverse ? '#fff' : 'var(--color-ink)'} d={BIRD_INK} />
        <path fillRule="evenodd" fill="var(--color-fold)" d={BIRD_WING} />
      </g>
    </svg>
  )
}

const openDrawers = [] // Esc closes only the top sheet (a picker opened from a form)

/**
 * A form opened over the page: bottom sheet on phones, side panel from sm. Esc or the backdrop closes it.
 * footer stays pinned under the scroll area: the total and the save button (as tradebazaar).
 * Rendered in a portal so it never sits inside a parent <label> or <form>.
 */
/** compact: from sm a short centred modal (a dropdown's list of choices) instead of the full-height side panel. */
export function Drawer({ title, onClose, wide, compact, footer, children }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const me = {}
    openDrawers.push(me)
    const esc = (e) => { if (e.key === 'Escape' && openDrawers.at(-1) === me) close.current() }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      openDrawers.splice(openDrawers.indexOf(me), 1)
      if (!openDrawers.length) document.body.style.overflow = ''
    }
  }, [])
  return createPortal(
    <div className={`fixed inset-0 z-40 m-0 flex items-end bg-black/45 ${compact ? 'sm:items-center sm:justify-center sm:p-4' : 'sm:items-stretch sm:justify-end'}`} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
           className={`flex w-full flex-col rounded-t-2xl bg-white ${compact ? 'max-h-[70dvh] sm:max-h-[min(28rem,80dvh)] sm:max-w-sm sm:rounded-2xl sm:shadow-[0_12px_40px_rgb(0_0_0/0.18)]' : `max-h-[92dvh] sm:max-h-none sm:rounded-none ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'}`}`}>
        <div className="flex items-center gap-2 border-b border-line py-1 pr-1 pl-4">
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</h2>
          <button type="button" className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink" aria-label="Close" onClick={onClose}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 ${footer ? '' : 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]'}`}>{children}</div>
        {footer && <div className="border-t border-line bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Phones: the page's main "+ Add" action, floating above the bottom bar (as CBTrading). */
export function Fab({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="btn fixed right-3 m-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 rounded-full pl-3 pr-4 shadow-lg sm:hidden">
      <Plus className="size-4" aria-hidden /> {label}
    </button>
  )
}
