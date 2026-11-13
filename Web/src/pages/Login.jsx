import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { homeFor, useAuth } from '../auth'
import { ErrorMsg, Field } from '../ui'
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
        <Field label="Email or phone">
          <input className="input" name="username" required autoComplete="username" spellCheck={false} autoCapitalize="none"
                 inputMode="email" value={form.login} onChange={set('login')} />
        </Field>
        <Field label="Password">
          <input className="input pr-12" name="password" type={show ? 'text' : 'password'} required autoComplete="current-password"
                 value={form.password} onChange={set('password')} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                  className="absolute top-0 right-0 grid size-11 place-items-center rounded-lg text-muted hover:text-ink">
            {show ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          </button>
        </Field>
        <ErrorMsg error={error} />
        <button className="btn w-full" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Logging in…</> : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
