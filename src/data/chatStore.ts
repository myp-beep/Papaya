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
import type { ChatMessage, ChatThread, Peer } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getClientId } from '../lib/identity'
import { useProfile } from './profileStore'
import { USERS } from './mockData'

const THREADS_KEY = 'papaya.threads.v2'
const GLOBAL_CHANNEL = 'papaya:global'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function loadThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY)
    if (raw) return JSON.parse(raw) as ChatThread[]
  } catch {
    /* yoksay */
  }
  return []
}

// Mock mod (anahtarsız): demo sohbetleri + bot cevapları
const MOCK_PEERS: Peer[] = Object.values(USERS).map((u) => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar,
  color: u.color,
  online: u.online,
}))

function seedMockThreads(): ChatThread[] {
  const now = Date.now()
  const peer = (id: string) => MOCK_PEERS.find((p) => p.id === id)!
  return [
    {
      id: 'papaya',
      peer: peer('papaya'),
      unread: 1,
      messages: [
        { id: 'm1', mine: false, text: "Papaya'ya hoş geldin! 🍈 Bana yaz, hemen cevap veririm.", ts: now - 90 * 60000 },
        { id: 'm2', mine: false, text: 'Gerçek arkadaşlarınla da canlı sohbet edebilirsin 👀', ts: now - 4 * 60000 },
      ],
    },
    {
      id: 'ela',
      peer: peer('ela'),
      unread: 0,
      messages: [{ id: 'm3', mine: false, text: 'Bu akşam oyun var mı? 🎮', ts: now - 12 * 60000 }],
    },
  ]
}

const BOT_REPLIES = ['Aynen öyle 😄', 'Haha kesinlikle!', 'Bunu sevdim 🔥', 'Oyuna var mısın? 🎮', 'Papaya çok iyi olmuş 🍈']

// Realtime modda solo kullanıcıya etkileşimli karşılama (gerçek kişiler presence ile gelir)
const BOT_ID = 'papaya-bot'
const BOT_PEER: Peer = { id: BOT_ID, name: 'Papaya Bot', avatar: '🍈', color: '#f95816', online: true }

function seedRealtimeThreads(): ChatThread[] {
  const now = Date.now()
  return [
    {
      id: BOT_ID,
      peer: BOT_PEER,
      unread: 1,
      messages: [
        { id: 'b1', mine: false, text: "Papaya'ya hoş geldin! 🍈 Ben botum, bana yaz.", ts: now - 5 * 60000 },
        { id: 'b2', mine: false, text: '＋ ile çevrimiçi gerçek kişilerle CANLI sohbet et — aynı linki başka bir cihazda aç! 👀', ts: now - 60000 },
      ],
    },
  ]
}

interface ChatContextValue {
  threads: ChatThread[]
  onlineUsers: Peer[]
  realtime: boolean
  myId: string
  getThread: (id: string) => ChatThread | undefined
  startChat: (peer: Peer) => string
  sendMessage: (threadId: string, text: string) => void
  notifyTyping: (threadId: string, isTyping: boolean) => void
  /** Genel realtime olayı yayınla (oyun vb.). */
  sendEvent: (kind: string, payload: Record<string, unknown>) => void
  /** Genel realtime olayına abone ol; aboneliği iptal eden fonksiyon döndürür. */
  onEvent: (kind: string, handler: (p: Record<string, unknown>) => void) => () => void
  markRead: (threadId: string) => void
  setActiveThread: (id: string | null) => void
  typing: Record<string, boolean>
  totalUnread: number
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const realtime = isSupabaseConfigured
  const myId = useMemo(() => (realtime ? getClientId() : 'me'), [realtime])

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    if (!realtime) return seedMockThreads()
    const stored = loadThreads()
    return stored.length ? stored : seedRealtimeThreads()
  })
  const [onlineUsers, setOnlineUsers] = useState<Peer[]>(realtime ? [] : MOCK_PEERS)
  const [typing, setTyping] = useState<Record<string, boolean>>({})

  const channelRef = useRef<RealtimeChannel | null>(null)
  const activeThreadRef = useRef<string | null>(null)
  const profileRef = useRef(profile)
  profileRef.current = profile
  const timers = useRef<number[]>([])
  // Genel realtime olay dinleyicileri (oyunlar vb. için)
  const listenersRef = useRef<Map<string, Set<(p: Record<string, unknown>) => void>>>(new Map())

  // Kalıcılık (gerçek modda yerel geçmiş)
  useEffect(() => {
    if (!realtime) return
    try {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads))
    } catch {
      /* yoksay */
    }
  }, [threads, realtime])

  useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  // Bir mesajı ilgili thread'e ekle (yoksa peer ile oluştur)
  const appendMessage = useCallback(
    (threadId: string, peer: Peer, msg: ChatMessage, bumpUnread: boolean) => {
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === threadId)
        if (idx === -1) {
          return [{ id: threadId, peer, messages: [msg], unread: bumpUnread ? 1 : 0 }, ...prev]
        }
        const copy = [...prev]
        const t = copy[idx]
        copy[idx] = {
          ...t,
          peer: { ...t.peer, ...peer },
          messages: [...t.messages, msg],
          unread: bumpUnread ? t.unread + 1 : t.unread,
        }
        return copy
      })
    },
    [],
  )

  // --- GERÇEK ZAMANLI (Supabase) ---
  useEffect(() => {
    if (!realtime || !supabase) return
    const sb = supabase
    const ch = sb.channel(GLOBAL_CHANNEL, {
      config: { presence: { key: myId }, broadcast: { self: false } },
    })

    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      if (payload.to !== myId) return
      const peer: Peer = { id: payload.from, ...payload.fromProfile, online: true }
      const msg: ChatMessage = { id: payload.id, mine: false, text: payload.text, ts: payload.ts }
      const isActive = activeThreadRef.current === payload.from
      appendMessage(payload.from, peer, msg, !isActive)
      // Bildirim (öndeyüz)
      if (!isActive && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(peer.name, { body: payload.text, icon: './icon-192.png' })
      }
    })

    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.to !== myId) return
      setTyping((p) => ({ ...p, [payload.from]: payload.isTyping }))
      if (payload.isTyping) {
        const t = window.setTimeout(
          () => setTyping((p) => ({ ...p, [payload.from]: false })),
          4000,
        )
        timers.current.push(t)
      }
    })

    // Genel uygulama olayları (oyun davet/hamle vb.)
    ch.on('broadcast', { event: 'app' }, ({ payload }) => {
      const kind = payload?.kind as string | undefined
      if (!kind) return
      // 'to' alanı varsa sadece hedefe
      if (payload.to && payload.to !== myId) return
      listenersRef.current.get(kind)?.forEach((fn) => fn(payload))
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ id: string; name: string; avatar: string; color: string }>()
      const seen = new Map<string, Peer>()
      Object.values(state).forEach((arr) => {
        arr.forEach((m) => {
          if (m.id && m.id !== myId) {
            seen.set(m.id, { id: m.id, name: m.name, avatar: m.avatar, color: m.color, online: true })
          }
        })
      })
      setOnlineUsers([...seen.values()])
      if (import.meta.env.DEV) console.log('[papaya] presence sync, online=', seen.size)
    })

    ch.subscribe(async (status) => {
      if (import.meta.env.DEV) console.log('[papaya] channel status:', status)
      if (status === 'SUBSCRIBED') {
        const p = profileRef.current
        await ch.track({ id: myId, name: p.name, avatar: p.avatar, color: p.color })
      }
    })

    channelRef.current = ch
    return () => {
      sb.removeChannel(ch)
      channelRef.current = null
    }
  }, [realtime, myId, appendMessage])

  // Profil değişince presence'ı güncelle
  useEffect(() => {
    if (!realtime) return
    const ch = channelRef.current
    if (ch) void ch.track({ id: myId, name: profile.name, avatar: profile.avatar, color: profile.color })
  }, [realtime, myId, profile])

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const id = uid()
      const ts = Date.now()
      const existing = threads.find((t) => t.id === threadId)
      const peer: Peer = existing?.peer ?? { id: threadId, name: threadId, avatar: '👤', color: '#888' }
      appendMessage(threadId, peer, { id, mine: true, text: trimmed, ts }, false)

      if (realtime && channelRef.current && threadId !== BOT_ID) {
        const p = profileRef.current
        void channelRef.current.send({
          type: 'broadcast',
          event: 'msg',
          payload: {
            id,
            from: myId,
            fromProfile: { name: p.name, avatar: p.avatar, color: p.color },
            to: threadId,
            text: trimmed,
            ts,
          },
        })
      } else {
        // Mock bot cevabı
        const t1 = window.setTimeout(() => {
          setTyping((p) => ({ ...p, [threadId]: true }))
          const t2 = window.setTimeout(() => {
            setTyping((p) => ({ ...p, [threadId]: false }))
            appendMessage(
              threadId,
              peer,
              {
                id: uid(),
                mine: false,
                text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
                ts: Date.now(),
              },
              activeThreadRef.current !== threadId,
            )
          }, 1100)
          timers.current.push(t2)
        }, 700)
        timers.current.push(t1)
      }
    },
    [threads, realtime, myId, appendMessage],
  )

  const notifyTyping = useCallback(
    (threadId: string, isTyping: boolean) => {
      if (!realtime || !channelRef.current) return
      void channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { from: myId, to: threadId, isTyping },
      })
    },
    [realtime, myId],
  )

  const sendEvent = useCallback(
    (kind: string, payload: Record<string, unknown>) => {
      if (!channelRef.current) return
      void channelRef.current.send({
        type: 'broadcast',
        event: 'app',
        payload: { kind, from: myId, ...payload },
      })
    },
    [myId],
  )

  const onEvent = useCallback((kind: string, handler: (p: Record<string, unknown>) => void) => {
    const map = listenersRef.current
    if (!map.has(kind)) map.set(kind, new Set())
    map.get(kind)!.add(handler)
    return () => map.get(kind)?.delete(handler)
  }, [])

  const startChat = useCallback((peer: Peer) => {
    setThreads((prev) => {
      if (prev.some((t) => t.id === peer.id)) return prev
      return [{ id: peer.id, peer, messages: [], unread: 0 }, ...prev]
    })
    return peer.id
  }, [])

  const markRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId && t.unread !== 0 ? { ...t, unread: 0 } : t)),
    )
  }, [])

  const setActiveThread = useCallback((id: string | null) => {
    activeThreadRef.current = id
  }, [])

  const getThread = useCallback((id: string) => threads.find((t) => t.id === id), [threads])

  const totalUnread = useMemo(() => threads.reduce((s, t) => s + t.unread, 0), [threads])

  const sortedThreads = useMemo(
    () =>
      [...threads].sort((a, b) => {
        const la = a.messages[a.messages.length - 1]?.ts ?? 0
        const lb = b.messages[b.messages.length - 1]?.ts ?? 0
        return lb - la
      }),
    [threads],
  )

  const value: ChatContextValue = {
    threads: sortedThreads,
    onlineUsers,
    realtime,
    myId,
    getThread,
    startChat,
    sendMessage,
    notifyTyping,
    sendEvent,
    onEvent,
    markRead,
    setActiveThread,
    typing,
    totalUnread,
  }

  return createElement(ChatContext.Provider, { value }, children)
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within <ChatProvider>')
  return ctx
}
