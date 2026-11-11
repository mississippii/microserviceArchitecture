import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, UserRound } from 'lucide-react'
import { homeFor, useAuth } from '../auth'
import { ErrorMsg } from '../ui'
import AuthLayout, { AuthSwitch } from './AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await login(form.login.trim(), form.password)
      navigate(homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your account"
                footer={<AuthSwitch label="New here?" to="/register" text="Create an account" />}>
      <form onSubmit={submit} className="space-y-3.5">
        <label className="block">
          <span className="label">Email or phone</span>
          <span className="relative block">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
            <input className="input pl-10" name="username" required autoComplete="username" spellCheck={false} autoCapitalize="none"
                   inputMode="email" placeholder="Email or phone" value={form.login} onChange={set('login')} />
          </span>
        </label>
        <label className="block">
          <span className="label">Password</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
            <input className="input pl-10 pr-11" name="password" type={show ? 'text' : 'password'} required autoComplete="current-password"
                   value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                    className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-ink">
              {show ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
            </button>
          </span>
        </label>
        <ErrorMsg error={error} />
        <button className="btn w-full" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Logging in…</> : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
