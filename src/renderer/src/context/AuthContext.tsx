import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import * as authApi from '../api/auth'
import { tokenStore } from '../api/client'
import { AuthContext } from './auth-context'

function persistSession(res: authApi.AuthResponse): void {
  tokenStore.set(res.access_token)
  localStorage.setItem('ft_user', JSON.stringify(res.user))
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<authApi.User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null)

  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    persistSession(res)
    setUser(res.user)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await authApi.register(username, email, password)
    persistSession(res)
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
