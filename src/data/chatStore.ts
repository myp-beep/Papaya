import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createElement } from 'react'
import type { ChatState, Conversation, Message } from '../types'
import { SEED_STATE, USERS } from './mockData'

const STORAGE_KEY = 'papaya.chat.v1'

function loadState(): ChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ChatState
  } catch {
    /* bozuk veri -> seed'e dön */
  }
  return structuredClone(SEED_STATE)
}

function saveState(state: ChatState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* kota dolu vs. -> sessiz geç */
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Karşı taraftan gelen sahte cevaplar (mock). */
const BOT_REPLIES = [
  'Aynen öyle 😄',
  'Haha, kesinlikle!',
  'Birazdan yazarım, kahve molası ☕',
  'Bunu sevdim 🔥',
  'Oyuna var mısın? 🎮',
  'Tamamdır, görüşürüz!',
  'Vay be, müthiş 👏',
  'Papaya gerçekten iyi olmuş 🍈',
]

interface ChatContextValue {
  conversations: Conversation[]
  getConversation: (id: string) => Conversation | undefined
  sendMessage: (conversationId: string, text: string) => void
  markRead: (conversationId: string) => void
  /** Kullanıcıyla sohbet başlat (varsa mevcut id'yi döndürür). */
  startConversation: (userId: string) => string
  typing: Record<string, boolean>
  totalUnread: number
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>(loadState)
  const [typing, setTyping] = useState<Record<string, boolean>>({})
  const timers = useRef<number[]>([])

  // Her değişiklikte kalıcı hale getir.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Açık kalan zamanlayıcıları temizle.
  useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  const appendMessage = useCallback((conversationId: string, msg: Message, bumpUnread: boolean) => {
    setState((prev) => ({
      conversations: prev.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], unread: bumpUnread ? c.unread + 1 : c.unread }
          : c,
      ),
    }))
  }, [])

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const myMsg: Message = {
        id: uid(),
        conversationId,
        senderId: 'me',
        text: trimmed,
        sentAt: Date.now(),
      }
      appendMessage(conversationId, myMsg, false)

      // Sahte cevap akışı: kısa gecikme -> "yazıyor…" -> bot mesajı.
      const thinkDelay = 600 + Math.random() * 700
      const typeDelay = 900 + Math.random() * 1100

      const t1 = window.setTimeout(() => {
        setTyping((p) => ({ ...p, [conversationId]: true }))

        const t2 = window.setTimeout(() => {
          setTyping((p) => ({ ...p, [conversationId]: false }))
          const reply: Message = {
            id: uid(),
            conversationId,
            senderId:
              // sohbetteki karşı kullanıcı
              '__peer__',
            text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
            sentAt: Date.now(),
          }
          // senderId'yi gerçek peer ile doldur
          setState((prev) => ({
            conversations: prev.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: [...c.messages, { ...reply, senderId: c.userId }],
                    unread: c.unread + 1,
                  }
                : c,
            ),
          }))
        }, typeDelay)
        timers.current.push(t2)
      }, thinkDelay)
      timers.current.push(t1)
    },
    [appendMessage],
  )

  const startConversation = useCallback(
    (userId: string) => {
      const existing = state.conversations.find((c) => c.userId === userId)
      if (existing) return existing.id
      const id = 'c-' + userId + '-' + uid()
      setState((prev) => ({
        conversations: [{ id, userId, messages: [], unread: 0 }, ...prev.conversations],
      }))
      return id
    },
    [state.conversations],
  )

  const markRead = useCallback((conversationId: string) => {
    setState((prev) => ({
      conversations: prev.conversations.map((c) =>
        c.id === conversationId && c.unread !== 0 ? { ...c, unread: 0 } : c,
      ),
    }))
  }, [])

  const getConversation = useCallback(
    (id: string) => state.conversations.find((c) => c.id === id),
    [state.conversations],
  )

  const totalUnread = useMemo(
    () => state.conversations.reduce((sum, c) => sum + c.unread, 0),
    [state.conversations],
  )

  // En son mesaja göre sıralı konuşmalar.
  const conversations = useMemo(
    () =>
      [...state.conversations].sort((a, b) => {
        const la = a.messages[a.messages.length - 1]?.sentAt ?? 0
        const lb = b.messages[b.messages.length - 1]?.sentAt ?? 0
        return lb - la
      }),
    [state.conversations],
  )

  const value: ChatContextValue = {
    conversations,
    getConversation,
    sendMessage,
    markRead,
    startConversation,
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

export function userOf(conversation: Conversation) {
  return USERS[conversation.userId]
}
