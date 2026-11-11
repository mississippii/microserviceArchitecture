import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Store } from 'lucide-react'
import { api } from '../api'
import { homeFor, useAuth } from '../auth'
import { ErrorMsg, Field } from '../ui'
import AuthLayout, { AuthSwitch } from './AuthLayout'

const ROLES = [
  ['CUSTOMER', 'Buy products', 'Shop from verified sellers', ShoppingBag],
  ['SELLER', 'Sell products', 'Open your shop, free', Store],
]

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'CUSTOMER' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/auth/register', { method: 'POST', body: { ...form, email: form.email.trim() || null } })
      const user = await login(form.phone, form.password)
      navigate(homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute."
                footer={<AuthSwitch label="Have an account?" to="/login" text="Log in" />}>
      <form onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(([value, text, hint, Icon]) => {
              const active = form.role === value
              return (
                <label key={value}
                       className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 transition-colors ${active ? 'border-brand-700 bg-brand-50' : 'border-line hover:border-brand-200'}`}>
                  <input type="radio" name="role" value={value} checked={active} onChange={set('role')} className="sr-only" />
                  <Icon className={`size-5 ${active ? 'text-brand-700' : 'text-muted'}`} aria-hidden />
                  <span className="text-[15px] font-semibold">{text}</span>
                  <span className="text-xs text-muted">{hint}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
        <Field label="Name">
          <input className="input" name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Mobile">
          <input className="input num" name="phone" type="tel" autoComplete="tel-national" required inputMode="numeric" placeholder="01712345678…"
                 pattern="01[3-9][0-9]{8}" title="Bangladeshi mobile number, e.g. 01712345678" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email" hint={form.role === 'SELLER' ? 'For your seller agreement and payment statements.' : undefined}>
          <input className="input" name="email" type="email" autoComplete="email" spellCheck={false} maxLength={150} required={form.role === 'SELLER'}
                 placeholder="you@example.com…" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password">
          <input className="input" name="new-password" type="password" required minLength={8} maxLength={72} placeholder="Min 8 characters" autoComplete="new-password"
                 value={form.password} onChange={set('password')} />
        </Field>
        <ErrorMsg error={error} />
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
