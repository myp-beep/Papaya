import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'
import { ME, USERS } from './mockData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from './authStore'

const PROFILE_KEY = 'papaya.profile.v1'
const ONBOARDED_KEY = 'papaya.onboarded.v1'

const DEFAULT_PROFILE: Profile = {
  name: ME.name,
  avatar: ME.avatar,
  color: ME.color,
  status: 'Papaya’da yeniyim 🍈',
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) }
  } catch {
    /* yoksay */
  }
  return DEFAULT_PROFILE
}

interface ProfileContextValue {
  profile: Profile
  /** Gerçek modda auth kullanıcı id'si; mock modda 'me'. */
  userId: string | null
  /** Profil yüklendi mi (gerçek modda ilk fetch). */
  ready: boolean
  updateProfile: (patch: Partial<Profile>) => void
  onboarded: boolean
  /** Karşılama ekranını tamamla: profili kaydet + bayrağı işaretle. */
  completeOnboarding: (patch: Partial<Profile>) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { configured, session } = useAuth()
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [onboarded, setOnboarded] = useState<boolean>(
    () => !isSupabaseConfigured && localStorage.getItem(ONBOARDED_KEY) === '1',
  )
  const [ready, setReady] = useState<boolean>(!isSupabaseConfigured)

  const userId = configured ? (session?.user.id ?? null) : 'me'

  // MOCK mod: profili localStorage'a yaz
  useEffect(() => {
    if (configured) return
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      /* yoksay */
    }
  }, [profile, configured])

  // GERÇEK mod: oturum değişince profili DB'den yükle (yoksa oluştur)
  useEffect(() => {
    if (!configured || !supabase) return
    if (!session) {
      setReady(true)
      return
    }
    setReady(false)
    let cancelled = false
    const uid = session.user.id
    ;(async () => {
      const cols = 'name,avatar,color,status,onboarded'
      let { data } = await supabase!.from('profiles').select(cols).eq('id', uid).maybeSingle()
      if (!data) {
        // trigger satırı oluşturmadıysa varsayılan ekle
        await supabase!.from('profiles').upsert({ id: uid }).select().maybeSingle()
        const r = await supabase!.from('profiles').select(cols).eq('id', uid).maybeSingle()
        data = r.data
      }
      if (cancelled) return
      if (data) {
        setProfile({ name: data.name, avatar: data.avatar, color: data.color, status: data.status })
        setOnboarded(Boolean(data.onboarded))
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [configured, session])

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => ({ ...prev, ...patch }))
      if (configured && supabase && session) {
        void supabase.from('profiles').update(patch).eq('id', session.user.id)
      }
    },
    [configured, session],
  )

  const completeOnboarding = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => ({ ...prev, ...patch }))
      setOnboarded(true)
      if (configured && supabase && session) {
        void supabase.from('profiles').update({ ...patch, onboarded: true }).eq('id', session.user.id)
      } else {
        localStorage.setItem(ONBOARDED_KEY, '1')
      }
    },
    [configured, session],
  )

  return createElement(
    ProfileContext.Provider,
    { value: { profile, userId, ready, updateProfile, onboarded, completeOnboarding } },
    children,
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>')
  return ctx
}

/** Bir yazar id'sini görüntüleme bilgisine çevirir ('me' -> güncel profil). */
export function resolveAuthor(id: string, profile: Profile) {
  if (id === 'me') return { name: profile.name, avatar: profile.avatar, color: profile.color }
  const u = USERS[id]
  return u
    ? { name: u.name, avatar: u.avatar, color: u.color }
    : { name: 'Bilinmeyen', avatar: '❓', color: '#666' }
}
