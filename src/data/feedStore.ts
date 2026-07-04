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
import type { Post } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getClientId } from '../lib/identity'
import { useProfile } from './profileStore'

const FEED_KEY = 'papaya.feed.v1'
const FEED_CHANNEL = 'papaya:feed'
const min = 60_000

function seedPosts(): Post[] {
  const now = Date.now()
  return [
    { id: 'p1', authorId: 'ela', text: 'Yeni rekor kırdık! 🏆 Hafıza oyununda 0:42!', likes: 42, likedByMe: false, createdAt: now - 15 * min },
    { id: 'p2', authorId: 'kaan', text: 'Bu akşam turnuva var, katılan? 🎮', likes: 17, likedByMe: false, createdAt: now - 70 * min },
    { id: 'p3', authorId: 'lina', text: 'Papaya teması çok şık olmuş 🍈✨', likes: 88, likedByMe: true, createdAt: now - 180 * min },
    { id: 'p4', authorId: 'deniz', text: 'Sohbet ekranındaki balonlar çok temiz 👏', likes: 23, likedByMe: false, createdAt: now - 1440 * min },
  ]
}

function loadPosts(): Post[] {
  try {
    const raw = localStorage.getItem(FEED_KEY)
    if (raw) return JSON.parse(raw) as Post[]
  } catch {
    /* yoksay */
  }
  return seedPosts()
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export interface AuthorInfo {
  name: string
  avatar: string
  color: string
}

interface FeedContextValue {
  posts: Post[]
  toggleLike: (id: string) => void
  addPost: (text: string) => void
  authorCache: Record<string, AuthorInfo>
}

const FeedContext = createContext<FeedContextValue | null>(null)

export function FeedProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const realtime = isSupabaseConfigured
  const myId = useMemo(() => (realtime ? getClientId() : 'me'), [realtime])

  const [posts, setPosts] = useState<Post[]>(loadPosts)
  const [authorCache, setAuthorCache] = useState<Record<string, AuthorInfo>>({})

  const channelRef = useRef<RealtimeChannel | null>(null)
  const postsRef = useRef(posts)
  postsRef.current = posts
  const profileRef = useRef(profile)
  profileRef.current = profile

  // Kalıcılık (her iki modda da localStorage'a kaydet)
  useEffect(() => {
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(posts))
    } catch {
      /* yoksay */
    }
  }, [posts])

  // --- GERÇEK ZAMANLI (Supabase) ---
  useEffect(() => {
    if (!realtime || !supabase) return
    const sb = supabase
    const ch = sb.channel(FEED_CHANNEL, {
      config: { broadcast: { self: false } },
    })

    // Yeni gönderiler
    ch.on('broadcast', { event: 'feed:post' }, ({ payload }) => {
      setAuthorCache((prev) => ({
        ...prev,
        [payload.authorId]: {
          name: payload.authorName,
          avatar: payload.authorAvatar,
          color: payload.authorColor,
        },
      }))
      setPosts((prev) => {
        if (prev.some((p) => p.id === payload.id)) return prev
        const post: Post = {
          id: payload.id,
          authorId: payload.authorId,
          text: payload.text,
          likes: payload.likes ?? 0,
          likedByMe: false,
          createdAt: payload.createdAt,
        }
        return [post, ...prev]
      })
    })

    // Beğeni değişimi
    ch.on('broadcast', { event: 'feed:like' }, ({ payload }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === payload.postId
            ? { ...p, likes: Math.max(0, p.likes + payload.delta) }
            : p,
        ),
      )
    })

    ch.subscribe((status) => {
      if (import.meta.env.DEV) console.log('[papaya:feed] channel status:', status)
    })

    channelRef.current = ch
    return () => {
      sb.removeChannel(ch)
      channelRef.current = null
    }
  }, [realtime, myId])

  const toggleLike = useCallback(
    (id: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
            : p,
        ),
      )

      if (realtime && channelRef.current) {
        const post = postsRef.current.find((p) => p.id === id)
        if (post) {
          void channelRef.current.send({
            type: 'broadcast',
            event: 'feed:like',
            payload: { postId: id, delta: post.likedByMe ? -1 : 1 },
          })
        }
      }
    },
    [realtime],
  )

  const addPost = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const id = uid()
      const createdAt = Date.now()
      const post: Post = {
        id,
        authorId: 'me',
        text: trimmed,
        likes: 0,
        likedByMe: false,
        createdAt,
      }

      setPosts((prev) => [post, ...prev])

      if (realtime && channelRef.current) {
        const p = profileRef.current
        void channelRef.current.send({
          type: 'broadcast',
          event: 'feed:post',
          payload: {
            id,
            authorId: myId,
            authorName: p.name,
            authorAvatar: p.avatar,
            authorColor: p.color,
            text: trimmed,
            likes: 0,
            createdAt,
          },
        })
      }
    },
    [realtime, myId],
  )

  return createElement(
    FeedContext.Provider,
    { value: { posts, toggleLike, addPost, authorCache } },
    children,
  )
}

export function useFeed() {
  const ctx = useContext(FeedContext)
  if (!ctx) throw new Error('useFeed must be used within <FeedProvider>')
  return ctx
}
