import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'
import { ME, USERS } from './mockData'
import { isSupabaseConfigured } from '../lib/supabase'
import { getClientId } from '../lib/identity'

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
  /** Realtime modda cihaz kimliği; mock modda 'me'. */
  userId: string
  ready: boolean
  updateProfile: (patch: Partial<Profile>) => void
  onboarded: boolean
  completeOnboarding: (patch: Partial<Profile>) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [onboarded, setOnboarded] = useState<boolean>(() => localStorage.getItem(ONBOARDED_KEY) === '1')
  const userId = isSupabaseConfigured ? getClientId() : 'me'

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      /* yoksay */
    }
  }, [profile])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const completeOnboarding = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
    localStorage.setItem(ONBOARDED_KEY, '1')
    setOnboarded(true)
  }, [])

  return createElement(
    ProfileContext.Provider,
    { value: { profile, userId, ready: true, updateProfile, onboarded, completeOnboarding } },
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
