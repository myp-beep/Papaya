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
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { LiveMessage, LiveRoom } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getClientId } from '../lib/identity'
import { useProfile } from './profileStore'

const ACTIVE_ROOMS_KEY = 'papaya.live.rooms'
const GLOBAL_INDEX_CHANNEL = 'papaya:live:index'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadRooms(): LiveRoom[] {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LiveRoom[]
      return parsed.filter((r) => r.status === 'live')
    }
  } catch {}
  return []
}

function saveRooms(rooms: LiveRoom[]) {
  try {
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(rooms.filter((r) => r.status === 'live')))
  } catch {}
}

interface LiveContextValue {
  rooms: LiveRoom[]
  myRooms: LiveRoom[]
  myId: string
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  createRoom: (title: string) => string
  endRoom: (roomId: string) => void
  sendMessage: (roomId: string, text: string) => void
  getMessages: (roomId: string) => LiveMessage[]
  getViewerCount: (roomId: string) => number
}

const LiveContext = createContext<LiveContextValue | null>(null)

export function LiveProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const realtime = isSupabaseConfigured
  const myId = useMemo(() => (realtime ? getClientId() : 'live-' + uid()), [realtime])

  const [rooms, setRooms] = useState<LiveRoom[]>(() => loadRooms())
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set())
  // Her oda için mesaj buffer'ı
  const messagesRef = useRef<Record<string, LiveMessage[]>>({})
  const [, forceRender] = useState(0)
  const profileRef = useRef(profile)
  profileRef.current = profile
  const channelRef = useRef<Record<string, RealtimeChannel>>({})
  const indexChannelRef = useRef<RealtimeChannel | null>(null)

  const reindex = useCallback(() => {
    forceRender((n) => n + 1)
  }, [])

  // Oda index kanalı (global) — aktif yayınları yayınla
  useEffect(() => {
    if (!realtime || !supabase) return
    const sb = supabase
    const ch = sb.channel(GLOBAL_INDEX_CHANNEL, {
      config: { broadcast: { self: true } },
    })
    ch.on('broadcast', { event: 'room:update' }, ({ payload }) => {
      const room = payload as LiveRoom
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.id === room.id)
        if (idx === -1) return [room, ...prev]
        const copy = [...prev]
        copy[idx] = room
        return copy
      })
    })
    ch.on('broadcast', { event: 'room:end' }, ({ payload }) => {
      setRooms((prev) => prev.filter((r) => r.id !== payload.id))
    })
    ch.subscribe()
    indexChannelRef.current = ch
    return () => {
      sb.removeChannel(ch)
      indexChannelRef.current = null
    }
  }, [realtime])

  // Bir odaya katıl (channel oluştur, presence & mesaj dinle)
  const joinRoom = useCallback(
    (roomId: string) => {
      if (joinedRooms.has(roomId)) return
      setJoinedRooms((prev) => new Set(prev).add(roomId))

      if (!realtime || !supabase) return
      const sb = supabase
      const p = profileRef.current
      const ch = sb.channel(`papaya:live:${roomId}`, {
        config: { presence: { key: myId }, broadcast: { self: false } },
      })

      ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
        const msg = payload as LiveMessage
        if (!messagesRef.current[roomId]) messagesRef.current[roomId] = []
        // Duplicate kontrol
        if (messagesRef.current[roomId].some((m) => m.id === msg.id)) return
        messagesRef.current[roomId] = [...messagesRef.current[roomId], msg]
        reindex()
      })

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        const count = Object.keys(state).length
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, viewerCount: count } : r)),
        )
        reindex()
      })

      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ id: myId, name: p.name, avatar: p.avatar, color: p.color })
        }
      })

      channelRef.current[roomId] = ch
    },
    [joinedRooms, realtime, myId, reindex],
  )

  // Odadan ayrıl
  const leaveRoom = useCallback(
    (roomId: string) => {
      setJoinedRooms((prev) => {
        const next = new Set(prev)
        next.delete(roomId)
        return next
      })
      if (supabase && channelRef.current[roomId]) {
        supabase.removeChannel(channelRef.current[roomId])
        delete channelRef.current[roomId]
      }
    },
    [],
  )

  // Oda oluştur
  const createRoom = useCallback(
    (title: string) => {
      const p = profileRef.current
      const roomId = 'live-' + uid()
      const room: LiveRoom = {
        id: roomId,
        hostId: myId,
        hostName: p.name,
        hostAvatar: p.avatar,
        hostColor: p.color,
        title: title.trim() || p.name + "'in Yayını",
        status: 'live',
        viewerCount: 0,
        startedAt: Date.now(),
      }
      setRooms((prev) => [room, ...prev])

      // Global index'e duyur
      if (indexChannelRef.current) {
        void indexChannelRef.current.send({
          type: 'broadcast',
          event: 'room:update',
          payload: room,
        })
      }

      // Kendi kanalına join
      joinRoom(roomId)
      return roomId
    },
    [myId, joinRoom],
  )

  // Yayını sonlandır
  const endRoom = useCallback(
    (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
      if (indexChannelRef.current) {
        void indexChannelRef.current.send({
          type: 'broadcast',
          event: 'room:end',
          payload: { id: roomId },
        })
      }
      leaveRoom(roomId)
      delete messagesRef.current[roomId]
      saveRooms(rooms.filter((r) => r.id !== roomId))
    },
    [leaveRoom, rooms],
  )

  // Mesaj gönder
  const sendMessage = useCallback(
    (roomId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const p = profileRef.current
      const msg: LiveMessage = {
        id: uid(),
        senderId: myId,
        senderName: p.name,
        senderAvatar: p.avatar,
        text: trimmed,
        ts: Date.now(),
      }
      if (!messagesRef.current[roomId]) messagesRef.current[roomId] = []
      messagesRef.current[roomId] = [...messagesRef.current[roomId], msg]
      reindex()

      if (channelRef.current[roomId]) {
        void channelRef.current[roomId].send({
          type: 'broadcast',
          event: 'msg',
          payload: msg,
        })
      }
    },
    [myId, reindex],
  )

  const getMessages = useCallback((roomId: string) => {
    return messagesRef.current[roomId] || []
  }, [])

  const getViewerCount = useCallback((roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    return room?.viewerCount ?? 0
  }, [rooms])

  const myRooms = useMemo(
    () => rooms.filter((r) => r.hostId === myId),
    [rooms, myId],
  )

  // Kalıcılık
  useEffect(() => {
    saveRooms(rooms)
  }, [rooms])

  const value: LiveContextValue = {
    rooms,
    myRooms,
    myId,
    joinRoom,
    leaveRoom,
    createRoom,
    endRoom,
    sendMessage,
    getMessages,
    getViewerCount,
  }

  return createElement(LiveContext.Provider, { value }, children)
}

export function useLive() {
  const ctx = useContext(LiveContext)
  if (!ctx) throw new Error('useLive must be used within <LiveProvider>')
  return ctx
}
