import { useCallback, useEffect, useState } from 'react'
import type { Post } from '../types'

const FEED_KEY = 'papaya.feed.v1'
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

/** Keşfet akışı durumu (yalnızca DiscoverPage kullandığı için Context'e gerek yok). */
export function useFeed() {
  const [posts, setPosts] = useState<Post[]>(loadPosts)

  useEffect(() => {
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(posts))
    } catch {
      /* yoksay */
    }
  }, [posts])

  const toggleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
          : p,
      ),
    )
  }, [])

  const addPost = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const post: Post = {
      id: uid(),
      authorId: 'me',
      text: trimmed,
      likes: 0,
      likedByMe: false,
      createdAt: Date.now(),
    }
    setPosts((prev) => [post, ...prev])
  }, [])

  return { posts, toggleLike, addPost }
}
