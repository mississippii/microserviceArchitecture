import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, LogOut, Mail, Package, Pencil, Phone, Search, ShoppingCart, UserRound } from 'lucide-react'
import { api } from './api'
import { Mark, initials, timeAgo } from './ui'
import { AuthProvider, homeFor, useAuth } from './auth'
import { BRAND } from './brand'
import Footer from './Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import Shop from './pages/Shop'
import ProductPage from './pages/Product'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Seller from './pages/Seller'
import Admin from './pages/Admin'
import ShopPage from './pages/ShopPage'
import Cart from './pages/Cart'
import Account from './pages/Account'

function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return children
}

/** Login and sign-up are for visitors: a signed-in user who lands on them (say, by swiping back) goes to their own area. */
function GuestOnly({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to={homeFor(user.role)} replace /> : children
}

const ROLE_LABEL = { CUSTOMER: 'Customer', SELLER: 'Seller Centre', ADMIN: 'Admin', VERIFIER: 'Verification' }

function SearchBox({ className = '' }) {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const navigate = useNavigate()
  useEffect(() => setQ(params.get('q') || ''), [params])
  return (
    <form role="search" className={`relative flex min-w-0 ${className}`} onSubmit={(e) => { e.preventDefault(); navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products') }}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" autoComplete="off"
             placeholder="Search products…"
             className="h-10 min-w-0 flex-1 rounded-full border border-line bg-cotton pl-9 pr-3 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-700/15" />
    </form>
  )
}

const countPill = 'num absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-ink px-1 text-center text-[11px] font-semibold leading-5 text-white'

/** Cart icon with the number of lines; refreshes when any page fires the "cart-changed" event. */
function CartLink({ className }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const load = () => api('/api/cart').then((l) => setCount(l.length)).catch(() => {})
    load()
    window.addEventListener('cart-changed', load)
    return () => window.removeEventListener('cart-changed', load)
  }, [])
  return (
    <NavLink to="/cart" className={`relative ${className}`} aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 && <span className={countPill}>{count}</span>}
    </NavLink>
  )
}

/** Bell with unread count; opening the list marks everything read. */
function Notifications({ className }) {
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    const load = () => api('/api/notifications').then(setList).catch(() => {})
    load()
    const t = setInterval(load, 60000) // ponytail: polls once a minute; switch to Web Push when SMS/push is set up
    return () => clearInterval(t)
  }, [])
  const unread = list.filter((n) => !n.readAt).length
  const toggle = () => {
    if (!open && unread) api('/api/notifications/read', { method: 'POST' }).catch(() => {})
    if (open) setList(list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
    setOpen(!open)
  }
  return (
    <div className="relative">
      <button className={`relative ${className}`} onClick={toggle} aria-expanded={open} aria-label={`Notifications, ${unread} unread`}>
        <Bell className="size-5" aria-hidden />
        {unread > 0 && <span className={countPill}>{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={toggle} aria-hidden />
          <section aria-label="Notifications"
                   className="fixed inset-x-3 top-16 z-40 max-h-[70dvh] overflow-y-auto overscroll-contain rounded-xl bg-white shadow-[0_10px_40px_rgb(0_0_0/0.18)] ring-1 ring-line sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80">
            <h2 className="border-b border-line px-4 py-2.5 text-sm font-semibold">Notifications</h2>
            {list.length === 0 && <p className="p-4 text-sm text-muted">Nothing yet. Order updates will show up here.</p>}
            <ul className="divide-y divide-line">
              {list.map((n) => (
                <li key={n.id}>
                  <button className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-brand-50" onClick={() => { toggle(); if (n.link) navigate(n.link) }}>
                    <span className={`text-sm ${n.readAt ? '' : 'font-semibold'}`}>{n.title}</span>
                    {n.body && <span className="line-clamp-2 text-xs text-muted">{n.body}</span>}
                    <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

/** Avatar with the signed-in person's initials; opens My account and Log out. */
function AccountMenu({ onLogout }) {
  const { user } = useAuth()
  const [me, setMe] = useState(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { api('/api/auth/me').then(setMe).catch(() => {}) }, [user.id])
  const close = () => setOpen(false)
  return (
    <div className="relative">
      <button className="ml-1 grid size-9 place-items-center rounded-full bg-ink text-xs font-semibold text-white ring-offset-2 hover:ring-2 hover:ring-line"
              onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Profile">
        {me?.name ? initials(me.name) : <UserRound className="size-4" aria-hidden />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
          <div role="menu" className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-xl bg-white shadow-[0_10px_40px_rgb(0_0_0/0.18)] ring-1 ring-line">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{me?.name ? initials(me.name) : ''}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{me?.name || ' '}</p>
                <p className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>
            {me && (me.phone || me.email) && (
              <dl className="space-y-1.5 border-b border-line px-4 py-3 text-sm">
                {me.phone && <div className="flex items-center gap-3"><dt><Phone className="size-4 text-muted" aria-label="Phone" /></dt><dd className="num truncate">{me.phone}</dd></div>}
                {me.email && <div className="flex items-center gap-3"><dt><Mail className="size-4 text-muted" aria-label="Email" /></dt><dd className="truncate">{me.email}</dd></div>}
              </dl>
            )}
            <Link role="menuitem" to="/account" onClick={close} className="flex min-h-11 items-center gap-3 px-4 text-sm hover:bg-brand-50">
              <Pencil className="size-4" aria-hidden /> Edit profile
            </Link>
            <button role="menuitem" onClick={() => { close(); onLogout() }} className="flex min-h-11 w-full items-center gap-3 border-t border-line px-4 text-sm hover:bg-brand-50">
              <LogOut className="size-4" aria-hidden /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Shop pages get the full footer; login, sign-up, the Seller Centre and Admin stay uncluttered. */
function PublicFooter() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const quiet = ['/login', '/register'].includes(pathname) || pathname.startsWith('/seller') || pathname.startsWith('/admin')
  return quiet || (user && user.role !== 'CUSTOMER') ? null : <Footer />
}

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const workspace = user && user.role !== 'CUSTOMER'
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const out = () => { logout(); navigate('/login', { replace: true }) }
  const iconBtn = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-[15px] font-medium text-ink hover:bg-brand-50 hover:text-brand-800'

  return (
    <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_var(--color-line)]">
      {!workspace && (
        <p className="bg-brand-800 px-4 py-1.5 text-center text-xs font-medium text-brand-50 sm:text-sm">
          Verified sellers only · <span className="font-semibold text-white underline decoration-white/40 underline-offset-2">Not original? Full refund</span><span className="max-sm:hidden"> · Cash on delivery</span>
        </p>
      )}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Link to={workspace ? homeFor(user.role) : '/'} className="flex shrink-0 items-center gap-2.5 rounded-lg">
          <Mark />
          <span className={`text-xl font-semibold tracking-tight text-brand-800 ${workspace || isAuthPage ? '' : 'max-sm:hidden'}`} translate="no">{BRAND.name}</span>
          {workspace && (
            <>
              <span className="h-5 w-px bg-line" aria-hidden />
              <span className="text-[15px] font-medium text-muted">{ROLE_LABEL[user.role]}</span>
            </>
          )}
        </Link>

        {!workspace && !isAuthPage && <SearchBox className="flex-1 sm:mx-auto sm:max-w-md" />}
        {(workspace || isAuthPage) && <span className="flex-1" />}

        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1" aria-label="Account">
          {user?.role === 'CUSTOMER' && (
            <>
              <CartLink className={iconBtn} />
              <NavLink to="/orders" className={iconBtn} aria-label="My orders">
                <Package className="size-5" aria-hidden /><span className="hidden lg:inline">Orders</span>
              </NavLink>
            </>
          )}
          {user && <Notifications className={iconBtn} />}
          {user ? <AccountMenu onLogout={out} /> : isAuthPage ? null : (
            <>
              <Link to="/login" className={iconBtn} aria-label="Log in">
                <UserRound className="size-5" aria-hidden /><span className="hidden sm:inline">Log in</span>
              </Link>
              <Link to="/register" className="hidden min-h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 sm:inline-flex">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:font-semibold focus:text-brand-900">
            Skip to content
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="mx-auto min-h-[60dvh] max-w-6xl px-3 pb-10 pt-3 outline-none sm:px-4 sm:pb-12 sm:pt-5">
            <Routes>
              <Route path="/" element={<Shop />} />
              <Route path="/products" element={<Products />} />
              <Route path="/p/:id" element={<ProductPage />} />
              <Route path="/s/:id" element={<ShopPage />} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
              <Route path="/orders" element={<RequireRole roles={['CUSTOMER']}><Orders /></RequireRole>} />
              <Route path="/cart" element={<RequireRole roles={['CUSTOMER']}><Cart /></RequireRole>} />
              <Route path="/account" element={<RequireRole roles={['CUSTOMER', 'SELLER', 'ADMIN', 'VERIFIER']}><Account /></RequireRole>} />
              <Route path="/seller" element={<RequireRole roles={['SELLER']}><Seller /></RequireRole>} />
              <Route path="/admin" element={<RequireRole roles={['ADMIN', 'VERIFIER']}><Admin /></RequireRole>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <PublicFooter />
        </BrowserRouter>
    </AuthProvider>
  )
}
