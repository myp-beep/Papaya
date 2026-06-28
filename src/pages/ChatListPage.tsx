import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useChat } from '../data/chatStore'
import { shortTime } from '../utils/time'

export default function ChatListPage() {
  const { threads, realtime, onlineUsers } = useChat()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t) => t.peer.name.toLowerCase().includes(q))
  }, [threads, query])

  return (
    <div className="flex flex-1 flex-col">
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
        {realtime && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {onlineUsers.length > 0
              ? `${onlineUsers.length} kişi çevrimiçi · canlı`
              : 'Canlı bağlı · başka cihazdan giren görünür'}
          </p>
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sohbetlerde ara…"
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
      </header>

      {filtered.length === 0 ? (
        <EmptyState
          emoji={realtime ? '🌐' : '🔍'}
          title={realtime ? 'Henüz sohbet yok' : 'Sonuç yok'}
          subtitle={
            realtime
              ? '＋ ile çevrimiçi birini seç ve canlı sohbete başla. Aynı bağlantıyı başka bir cihazda/sekmede aç, birbirinizi görün!'
              : 'Farklı bir isim aramayı dene.'
          }
        />
      ) : (
        <ul className="px-2 pb-4">
          {filtered.map((t) => {
            const last = t.messages[t.messages.length - 1]
            const preview = last ? (last.mine ? 'Sen: ' : '') + last.text : 'Henüz mesaj yok'
            return (
              <li key={t.id}>
                <button
                  onClick={() => navigate(`/chat/${t.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-800 active:scale-[0.99]"
                >
                  <Avatar emoji={t.peer.avatar} color={t.peer.color} online={t.peer.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-white">{t.peer.name}</span>
                      {last && <span className="shrink-0 text-xs text-white/40">{shortTime(last.ts)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${t.unread > 0 ? 'font-medium text-white/80' : 'text-white/45'}`}
                      >
                        {preview}
                      </span>
                      {t.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-papaya-500 px-1.5 text-[11px] font-bold text-white">
                          {t.unread}
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
