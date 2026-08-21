import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import * as authApi from '../api/auth'
import type { User } from '../api/auth'
import { tokenStore } from '../api/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    tokenStore.set(res.access_token)
    localStorage.setItem('ft_user', JSON.stringify(res.user))
    setUser(res.user)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await authApi.register(username, email, password)
    tokenStore.set(res.access_token)
    localStorage.setItem('ft_user', JSON.stringify(res.user))
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return ctx
}
