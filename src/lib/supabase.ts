import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public (publishable) anahtar — tasarımı gereği client'ta görünür; güvenlik
// realtime kanallarında ephemeral, hassas veri yok. Env varsa onu kullanır.
// Not: istenirse Supabase panelinden rotate edilebilir.
const DEFAULT_URL = 'https://vqyjoxecmyuksruzccda.supabase.co'
const DEFAULT_ANON = 'sb_publishable_S8SJVp8fQ28Czf7Cv63jVg_f043qJ5f'

// Vite env (GitHub Secrets) > gömülü public varsayılan.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON

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
