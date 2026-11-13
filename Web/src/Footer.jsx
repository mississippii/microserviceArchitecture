import { Link } from 'react-router-dom'
import { BRAND } from './brand'
import { Mark } from './ui'


const link = 'inline-flex min-h-9 items-center text-[13px] text-neutral-400 transition-colors hover:text-white sm:min-h-7'

function Column({ title, links }) {
  return (
    <nav aria-label={title} className="min-w-0">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
      <ul className="mt-1">
        {links.map(([label, to]) => <li key={label}><Link to={to} className={link}>{label}</Link></li>)}
      </ul>
    </nav>
  )
}

/** Compact shop footer: brand, three short link columns, a thin legal bar. */
export default function Footer() {
  return (
    <footer className="bg-black text-neutral-400">
      <div className="mx-auto max-w-6xl px-4 pt-7 pb-4 sm:pt-9">
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:gap-x-8">
          <div className="col-span-3 sm:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <Mark inverse className="size-6" />
              <span className="font-display text-[15px] font-semibold tracking-[0.22em] text-white uppercase" translate="no">{BRAND.name}</span>
            </Link>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed">Original products from verified sellers, with a full refund if it isn&apos;t.</p>
          </div>
          <Column title="Shop" links={[['All products', '/products'], ['Cart', '/cart'], ['My orders', '/orders']]} />
          <Column title="Sell" links={[['Open a shop', '/register'], ['Seller Centre', '/login']]} />
          <Column title="Account" links={[['Log in', '/login'], ['Sign up', '/register']]} />
        </div>

        <div className="mt-6 flex flex-col gap-1 border-t border-neutral-800 pt-3 text-xs text-neutral-500 sm:flex-row sm:items-center sm:gap-4">
          <p>© {new Date().getFullYear()} <span translate="no">{BRAND.name}</span> · Made in Bangladesh</p>
          <p className="sm:ml-auto">Verified sellers · Full refund if not original · Cash on delivery</p>
        </div>
      </div>
    </footer>
  )
}
