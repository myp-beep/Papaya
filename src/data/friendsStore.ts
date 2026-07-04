import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { FriendRequest, Peer } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useProfile } from './profileStore'
import { USERS } from './mockData'
import type { RealtimeChannel } from '@supabase/supabase-js'

const FRIENDS_KEY = 'papaya.friends.v1'
const REQUESTS_KEY = 'papaya.requests.v1'
const GLOBAL_CHANNEL = 'papaya:global'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadFriends(): Peer[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY)
    if (raw) return JSON.parse(raw) as Peer[]
  } catch { /* yoksay */ }
  return []
}

function loadRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY)
    if (raw) return JSON.parse(raw) as FriendRequest[]
  } catch { /* yoksay */ }
  return []
}

function saveFriends(friends: Peer[]) {
  try { localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends)) } catch { /* yoksay */ }
}

function saveRequests(requests: FriendRequest[]) {
  try { localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests)) } catch { /* yoksay */ }
}

interface FriendsContextValue {
  friends: Peer[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  pendingCount: number
  sendRequest: (userId: string, name: string, avatar: string, color: string) => void
  acceptRequest: (reqId: string) => void
  declineRequest: (reqId: string) => void
  cancelRequest: (reqId: string) => void
  removeFriend: (userId: string) => void
  searchUsers: (query: string) => Peer[]
  isFriend: (userId: string) => boolean
  hasPendingFrom: (userId: string) => boolean
}

const FriendsContext = createContext<FriendsContextValue | null>(null)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { profile, userId: myId } = useProfile()
  const realtime = isSupabaseConfigured
  const channelRef = useRef<RealtimeChannel | null>(null)

  const [friends, setFriends] = useState<Peer[]>(loadFriends)
  const [requests, setRequests] = useState<FriendRequest[]>(loadRequests)

  const incoming = useMemo(
    () => requests.filter((r) => r.status === 'pending' && r.toUserId === myId),
    [requests, myId],
  )
  const outgoing = useMemo(
    () => requests.filter((r) => r.status === 'pending' && r.fromUserId === myId),
    [requests, myId],
  )

  // Kalıcılık
  useEffect(() => { saveFriends(friends) }, [friends])
  useEffect(() => { saveRequests(requests) }, [requests])

  // Realtime: arkadaşlık isteği broadcast dinle
  useEffect(() => {
    if (!realtime || !supabase) return
    const sb = supabase
    const ch = sb.channel(`${GLOBAL_CHANNEL}:friends`, {
      config: { broadcast: { self: false } },
    })

    ch.on('broadcast', { event: 'friend_req' }, ({ payload }) => {
      if (payload.toUserId === myId) {
        const req: FriendRequest = {
          id: payload.id,
          fromUserId: payload.fromUserId,
          toUserId: payload.toUserId,
          status: 'pending',
          createdAt: payload.createdAt,
          fromUser: { name: payload.fromName, avatar: payload.fromAvatar, color: payload.fromColor },
        }
        setRequests((prev) => {
          if (prev.some((r) => r.id === req.id)) return prev
          return [req, ...prev]
        })
      }
    })

    ch.on('broadcast', { event: 'friend_resp' }, ({ payload }) => {
      // İstek kabul/red cevabı — isteği kaldır, kabul edildiyse arkadaş ekle
      setRequests((prev) => prev.filter((r) => r.id !== payload.reqId))
      if (payload.accepted) {
        const peer: Peer = { id: payload.fromUserId, name: payload.fromName, avatar: payload.fromAvatar, color: payload.fromColor, online: true }
        setFriends((prev) => (prev.some((f) => f.id === peer.id) ? prev : [...prev, peer]))
      }
    })

    ch.subscribe()
    channelRef.current = ch
    return () => { sb.removeChannel(ch) }
  }, [realtime, myId])

  const sendRequest = useCallback(
    (userId: string, name: string, avatar: string, color: string) => {
      const id = uid()
      const req: FriendRequest = {
        id,
        fromUserId: myId,
        toUserId: userId,
        status: 'pending',
        createdAt: Date.now(),
        fromUser: { name: profile.name, avatar: profile.avatar, color: profile.color },
        toUser: { name, avatar, color },
      }
      setRequests((prev) => [req, ...prev])

      if (realtime && channelRef.current) {
        void channelRef.current.send({
          type: 'broadcast',
          event: 'friend_req',
          payload: {
            id,
            fromUserId: myId,
            toUserId: userId,
            fromName: profile.name,
            fromAvatar: profile.avatar,
            fromColor: profile.color,
            createdAt: req.createdAt,
          },
        })
      } else {
        // Mock mod: karşı tarafı simüle et (otomatik istek gelsin)
      }
    },
    [myId, profile, realtime],
  )

  const acceptRequest = useCallback(
    (reqId: string) => {
      const req = requests.find((r) => r.id === reqId)
      if (!req) return
      setRequests((prev) => prev.filter((r) => r.id !== reqId))
      const peer: Peer = {
        id: req.fromUserId,
        name: req.fromUser?.name ?? 'Bilinmeyen',
        avatar: req.fromUser?.avatar ?? '👤',
        color: req.fromUser?.color ?? '#888',
        online: true,
      }
      setFriends((prev) => (prev.some((f) => f.id === peer.id) ? prev : [...prev, peer]))

      if (realtime && channelRef.current) {
        void channelRef.current.send({
          type: 'broadcast',
          event: 'friend_resp',
          payload: {
            reqId,
            accepted: true,
            fromUserId: myId,
            fromName: profile.name,
            fromAvatar: profile.avatar,
            fromColor: profile.color,
          },
        })
      }
    },
    [requests, realtime, myId, profile],
  )

  const declineRequest = useCallback(
    (reqId: string) => {
      setRequests((prev) => prev.filter((r) => r.id !== reqId))
      if (realtime && channelRef.current) {
        void channelRef.current.send({
          type: 'broadcast',
          event: 'friend_resp',
          payload: { reqId, accepted: false, fromUserId: myId },
        })
      }
    },
    [realtime, myId],
  )

  const cancelRequest = useCallback(
    (reqId: string) => {
      setRequests((prev) => prev.filter((r) => r.id !== reqId))
    },
    [],
  )

  const removeFriend = useCallback(
    (userId: string) => {
      setFriends((prev) => prev.filter((f) => f.id !== userId))
    },
    [],
  )

  const searchUsers = useCallback(
    (query: string): Peer[] => {
      const q = query.trim().toLowerCase()
      if (!q) return []
      const friendIds = new Set(friends.map((f) => f.id))
      const pendingIds = new Set(requests.map((r) => (r.fromUserId === myId ? r.toUserId : r.fromUserId)))

      const known = realtime
        ? [] // Supabase'de profiles tablosundan çekilir (bu örnekte mock kullan)
        : Object.values(USERS).map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, color: u.color, online: u.online }))

      return known.filter(
        (u) =>
          u.id !== myId &&
          !friendIds.has(u.id) &&
          !pendingIds.has(u.id) &&
          u.name.toLowerCase().includes(q),
      )
    },
    [friends, requests, myId, realtime],
  )

  const isFriend = useCallback((userId: string) => friends.some((f) => f.id === userId), [friends])

  const hasPendingFrom = useCallback(
    (userId: string) => incoming.some((r) => r.fromUserId === userId),
    [incoming],
  )

  const value: FriendsContextValue = {
    friends,
    incoming,
    outgoing,
    pendingCount: incoming.length,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
    searchUsers,
    isFriend,
    hasPendingFrom,
  }

  return createElement(FriendsContext.Provider, { value }, children)
}

export function useFriends() {
  const ctx = useContext(FriendsContext)
  if (!ctx) throw new Error('useFriends must be used within <FriendsProvider>')
  return ctx
}
