const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

/** fetch wrapper: adds JWT, sends/receives JSON, throws Error(detail) with .status on failure. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })

  if (res.status === 401 && token) {
    // token expired or invalid: log out
    setToken(null)
    window.location.href = '/login'
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.detail || data?.title || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

/** JWT payload without verification (the server verifies). */
export function decodeToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(part))
  } catch {
    return null
  }
}

export const money = (n) => `৳${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

// How a seller counts a product. KG and LITRE are sold in fractions (2.5 kg).
export const UNITS = {
  PCS: ['pc', 'pcs'], KG: ['kg', 'kg'], LITRE: ['litre', 'litres'], DOZEN: ['dozen', 'dozen'],
  BOX: ['box', 'boxes'], CRATE: ['crate', 'crates'], BAG: ['bag', 'bags'], PACK: ['pack', 'packs'],
}
export const isLoose = (unit) => unit === 'KG' || unit === 'LITRE'
const unitOf = (unit) => UNITS[unit] || UNITS.PCS
/** 2.5 kg · 1 crate · 12 pcs */
export const qty = (n, unit) => {
  const v = Number(n)
  return `${v.toLocaleString('en-BD', { maximumFractionDigits: 3 })} ${unitOf(unit)[v === 1 ? 0 : 1]}`
}
/** "/kg" after a price */
export const per = (unit) => `/${unitOf(unit)[0]}`
