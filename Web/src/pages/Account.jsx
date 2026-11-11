import { useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { ErrorMsg, Field, Success, useLoad } from '../ui'

/** Account: profile + password for everyone, saved delivery addresses for customers. */
export default function Account() {
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">My account</h1>
      <Profile />
      {user.role === 'CUSTOMER' && <Addresses />}
      <Password />
    </div>
  )
}

function Profile() {
  const me = useLoad(() => api('/api/auth/me'))
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const f = form ?? (me.data ? { name: me.data.name, email: me.data.email || '' } : null)
  const set = (k) => (e) => { setSaved(false); setForm({ ...f, [k]: e.target.value }) }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/auth/me', { method: 'PUT', body: { name: f.name, email: f.email.trim() || null } })
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3.5 p-4" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="font-semibold">Profile</h2>
      <ErrorMsg error={me.error} />
      {f && (
        <>
          <Field label="Name"><input className="input" name="name" autoComplete="name" required maxLength={100} value={f.name} onChange={set('name')} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile" hint="Used to log in. Contact support to change it.">
              <input className="input num" disabled value={me.data.phone || '—'} />
            </Field>
            <Field label="Email">
              <input className="input" name="email" type="email" autoComplete="email" spellCheck={false} maxLength={150} required={me.data.role === 'SELLER'} value={f.email} onChange={set('email')} />
            </Field>
          </div>
          <ErrorMsg error={error} />
          {saved && <Success>Profile saved.</Success>}
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
        </>
      )}
    </form>
  )
}

const EMPTY = { label: 'Home', recipientName: '', phone: '', address: '', isDefault: false }

function Addresses() {
  const list = useLoad(() => api('/api/addresses'))
  const [form, setForm] = useState(null) // null = closed; {id?} = editing / adding
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { id, ...body } = form
      await api(id ? `/api/addresses/${id}` : '/api/addresses', { method: id ? 'PUT' : 'POST', body })
      setForm(null)
      list.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  const remove = async (a) => {
    if (!confirm(`Delete the address “${a.label}”?`)) return
    try { await api(`/api/addresses/${a.id}`, { method: 'DELETE' }); list.reload() } catch (err) { setError(err) }
  }

  return (
    <section className="panel" aria-labelledby="addresses-heading">
      <div className="flex items-center border-b border-line px-4 py-2.5">
        <h2 id="addresses-heading" className="font-semibold">Delivery addresses</h2>
        {!form && <button className="btn-quiet ml-auto" onClick={() => { setError(null); setForm(EMPTY) }}><Plus className="size-4" aria-hidden /> Add</button>}
      </div>
      <div className="px-4 empty:hidden"><ErrorMsg error={list.error || (!form && error)} /></div>
      {list.data?.length === 0 && !form && <p className="p-4 text-sm text-muted">No saved addresses yet. Add one to check out faster.</p>}
      <ul className="divide-y divide-line">
        {list.data?.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p><span className="font-semibold">{a.label}</span>{a.default && <span className="badge ml-2 bg-ink text-white">Default</span>}</p>
              <p>{a.recipientName} <span className="num text-muted">{a.phone}</span></p>
              <p className="text-muted">{a.address}</p>
            </div>
            <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink" aria-label={`Edit ${a.label}`}
                    onClick={() => { setError(null); setForm({ id: a.id, label: a.label, recipientName: a.recipientName, phone: a.phone, address: a.address, isDefault: a.default }) }}><Pencil className="size-4" aria-hidden /></button>
            <button className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-ink" aria-label={`Delete ${a.label}`} onClick={() => remove(a)}><Trash2 className="size-4" aria-hidden /></button>
          </li>
        ))}
      </ul>
      {form && (
        <form onSubmit={submit} className="space-y-3 border-t border-line p-4">
          <p className="text-sm font-semibold">{form.id ? 'Edit address' : 'New address'}</p>
          <div className="grid gap-3 sm:grid-cols-[130px_1fr_160px]">
            <Field label="Label"><input className="input" required maxLength={30} autoComplete="off" placeholder="Home, Office…" value={form.label} onChange={set('label')} /></Field>
            <Field label="Receiver"><input className="input" name="name" autoComplete="name" required maxLength={100} value={form.recipientName} onChange={set('recipientName')} /></Field>
            <Field label="Mobile"><input className="input num" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="01[3-9][0-9]{8}" title="Bangladeshi mobile number, e.g. 01712345678" placeholder="01712345678…" value={form.phone} onChange={set('phone')} /></Field>
          </div>
          <Field label="Address" hint="House, road, area, city.">
            <textarea className="input" name="street-address" autoComplete="street-address" rows={2} required maxLength={300} value={form.address} onChange={set('address')} />
          </Field>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-black" checked={form.isDefault} onChange={set('isDefault')} /> Use as my default address
          </label>
          <ErrorMsg error={error} />
          <div className="flex gap-2">
            <button type="button" className="btn-quiet" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
          </div>
        </form>
      )}
    </section>
  )
}

function Password() {
  const [form, setForm] = useState({ current: '', next: '' })
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setSaved(false); setForm({ ...form, [k]: e.target.value }) }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/auth/password', { method: 'POST', body: form })
      setForm({ current: '', next: '' })
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3.5 p-4" aria-labelledby="password-heading">
      <h2 id="password-heading" className="font-semibold">Change password</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Current"><input className="input" type="password" name="current-password" autoComplete="current-password" required value={form.current} onChange={set('current')} /></Field>
        <Field label="New password"><input className="input" type="password" name="new-password" autoComplete="new-password" required minLength={8} maxLength={72} placeholder="Min 8 characters" value={form.next} onChange={set('next')} /></Field>
      </div>
      <ErrorMsg error={error} />
      {saved && <Success>Password changed.</Success>}
      <button className="btn-quiet" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  )
}
