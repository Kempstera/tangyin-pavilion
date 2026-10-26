import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, hasSupabase } from './supabase'

interface AuthCtx {
  user: User | null
  loading: boolean
  nickname: string
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error?: string; needConfirm?: boolean }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  nickname: '',
  signIn: async () => ({ error: 'unavailable' }),
  signUp: async () => ({ error: 'unavailable' }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setLoading(false)
      return
    }
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'offline' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const signUp = useCallback(async (email: string, password: string, nickname: string) => {
    if (!supabase) return { error: 'offline' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) return { error: error.message }
    // 若开启了邮箱确认，session 为空
    return { needConfirm: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [])

  const nickname =
    (user?.user_metadata?.nickname as string | undefined) ||
    (user?.email ? user.email.split('@')[0] : '')

  return (
    <Ctx.Provider value={{ user, loading, nickname, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  return useContext(Ctx)
}
