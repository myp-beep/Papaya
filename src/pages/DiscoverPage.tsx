import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useFeed } from '../data/feedStore'
import { useChat } from '../data/chatStore'
import { resolveAuthor, useProfile } from '../data/profileStore'
import { relativeTime } from '../utils/time'

export default function DiscoverPage() {
  const { posts, toggleLike, addPost } = useFeed()
  const { profile } = useProfile()
  const { startChat } = useChat()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')

  const openChatWith = (authorId: string) => {
    if (authorId === 'me') return
    const a = resolveAuthor(authorId, profile)
    const id = startChat({ id: authorId, name: a.name, avatar: a.avatar, color: a.color, online: true })
    navigate(`/chat/${id}`)
  }

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    addPost(draft)
    setDraft('')
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Keşfet</h1>
        <p className="text-sm text-white/45">Topluluktan neler oluyor 🧭</p>
      </header>

      {/* Gönderi oluştur */}
      <form onSubmit={handlePost} className="mx-5 mt-2 rounded-2xl border border-ink-700 bg-ink-800 p-3">
        <div className="flex gap-3">
          <Avatar emoji={profile.avatar} color={profile.color} size={40} />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Bir şeyler paylaş…"
            rows={2}
            maxLength={280}
            className="flex-1 resize-none bg-transparent text-[15px] text-white placeholder:text-white/35 outline-none"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/30">{draft.length}/280</span>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-papaya-500 px-4 py-1.5 text-sm font-bold text-white shadow-glow transition enabled:hover:bg-papaya-400 disabled:opacity-40"
          >
            Paylaş
          </button>
        </div>
      </form>

      {/* Akış */}
      <div className="mt-4 space-y-3 px-5 pb-6">
        {posts.map((p) => {
          const author = resolveAuthor(p.authorId, profile)
          return (
            <article key={p.id} className="rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-card animate-slide-up">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openChatWith(p.authorId)}
                  disabled={p.authorId === 'me'}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                >
                  <Avatar emoji={author.avatar} color={author.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-semibold text-white">{author.name}</span>
                      <span className="text-xs text-white/40">· {relativeTime(p.createdAt)}</span>
                    </div>
                  </div>
                </button>
                {p.authorId !== 'me' && (
                  <span className="text-xs text-white/30" title="Sohbet başlat">💬</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-[15px] text-white/85">{p.text}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <button
                  onClick={() => toggleLike(p.id)}
                  className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition ${
                    p.likedByMe ? 'text-papaya-400' : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  <span className={p.likedByMe ? 'scale-110 transition' : 'transition'}>
                    {p.likedByMe ? '❤️' : '🤍'}
                  </span>
                  {p.likes}
                </button>
                <span className="flex items-center gap-1.5 text-white/30">💬 0</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
