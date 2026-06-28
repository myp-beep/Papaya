import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Vite env: build sırasında GitHub Secrets'tan enjekte edilir.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Supabase yapılandırıldı mı? Anahtarlar yoksa uygulama mock (localStorage)
 * fallback ile çalışmaya devam eder — hiçbir şey bozulmaz.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Tek Supabase istemcisi. Yapılandırılmamışsa null.
 * anon key public olacak şekilde tasarlıdır; güvenlik DB tarafında RLS ile sağlanır.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

/** Yapılandırılmışsa istemciyi döndürür, değilse hata fırlatır (gerçek-yol kodu için). */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase yapılandırılmamış. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY gerekli.',
    )
  }
  return supabase
}
