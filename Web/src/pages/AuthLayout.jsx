import { Link } from 'react-router-dom'
import { Mark } from '../ui'

/** A single centred card: mark, heading, form, then a way across to the other auth page. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="-mx-3 -mt-3 -mb-10 min-h-[calc(100dvh-5rem)] bg-white sm:mx-auto sm:mb-0 sm:min-h-0 sm:mt-8 sm:max-w-[400px] sm:rounded-2xl sm:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_40px_rgb(0_0_0/0.08)] sm:ring-1 sm:ring-line">
      <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
        <Mark className="mx-auto size-9" />
        <h1 className="mt-4 text-center text-[22px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  )
}

/** "New here?" divider and an outlined button to the other auth page. */
export function AuthSwitch({ label, to, text }) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted"><span className="h-px flex-1 bg-line" />{label}<span className="h-px flex-1 bg-line" /></div>
      <Link to={to} className="btn-outline mt-4 w-full font-semibold">{text}</Link>
    </>
  )
}
