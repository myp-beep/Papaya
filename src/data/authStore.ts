import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthResult {
  error?: string
  /** Magic link / e-posta onayı gönderildiyse true. */
  emailSent?: boolean
}

interface AuthContextValue {
  /** Supabase anahtarları var mı? Yoksa uygulama mock akışında çalışır. */
  configured: boolean
  loading: boolean
  session: Session | null
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signInMagic: (email: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const redirectTo = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Yapılandırılmamışsa beklemeye gerek yok.
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Supabase yapılandırılmamış' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) return { error: error.message }
    // E-posta onayı açıksa session gelmez
    return { emailSent: !data.session }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Supabase yapılandırılmamış' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const signInMagic = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Supabase yapılandırılmamış' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    return error ? { error: error.message } : { emailSent: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextValue = {
    configured: isSupabaseConfigured,
    loading,
    session,
    signUp,
    signIn,
    signInMagic,
    signOut,
  }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
