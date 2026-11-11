import { createContext, useContext, useState } from 'react'
import { api, decodeToken, getToken, setToken } from './api'

const AuthContext = createContext(null)

function userFrom(token) {
  const c = token && decodeToken(token)
  if (!c || c.exp * 1000 < Date.now()) return null
  return { id: Number(c.sub), role: c.roles?.[0] }
}

export function AuthProvider({ children }) {
  const [token, setTok] = useState(() => {
    const t = getToken()
    if (t && !userFrom(t)) setToken(null) // drop expired token
    return userFrom(t) ? t : null
  })

  const login = async (login, password) => {
    const { token } = await api('/api/auth/login', { method: 'POST', body: { login, password } })
    setToken(token)
    setTok(token)
    return userFrom(token)
  }

  const logout = () => {
    setToken(null)
    setTok(null)
  }

  return <AuthContext.Provider value={{ user: userFrom(token), login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Where each role lands after login. */
export const homeFor = (role) => ({ SELLER: '/seller', ADMIN: '/admin', VERIFIER: '/admin' })[role] || '/'
