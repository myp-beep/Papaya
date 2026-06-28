import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useChat, userOf } from '../data/chatStore'
import { shortTime } from '../utils/time'

export default function ChatListPage() {
  const { conversations } = useChat()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => userOf(c)?.name.toLowerCase().includes(q))
  }, [conversations, query])

  return (
    <div className="flex flex-1 flex-col">
      {/* Başlık */}
      <header className="sticky top-0 z-10 bg-ink-900/80 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white">
            <span className="text-2xl">🍈</span> Papaya
          </h1>
          <button
            onClick={() => navigate('/new-chat')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-lg text-white/70 transition hover:bg-ink-600"
            title="Yeni sohbet"
          >
            ＋
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sohbetlerde ara…"
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
      </header>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="Sonuç yok" subtitle="Farklı bir isim aramayı dene." />
      ) : (
        <ul className="px-2 pb-4">
          {filtered.map((c) => {
            const user = userOf(c)
            const last = c.messages[c.messages.length - 1]
            const preview = last
              ? (last.senderId === 'me' ? 'Sen: ' : '') + last.text
              : 'Henüz mesaj yok'
            return (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-800 active:scale-[0.99]"
                >
                  <Avatar emoji={user.avatar} color={user.color} online={user.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-white">{user.name}</span>
                      {last && (
                        <span className="shrink-0 text-xs text-white/40">{shortTime(last.sentAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          c.unread > 0 ? 'font-medium text-white/80' : 'text-white/45'
                        }`}
                      >
                        {preview}
                      </span>
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-papaya-500 px-1.5 text-[11px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
