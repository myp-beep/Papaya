import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useChat } from '../data/chatStore'

export default function NewChatPage() {
  const navigate = useNavigate()
  const { onlineUsers, startChat, realtime } = useChat()
  const [query, setQuery] = useState('')

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? onlineUsers.filter((u) => u.name.toLowerCase().includes(q)) : onlineUsers
  }, [onlineUsers, query])

  const open = (peerId: string) => {
    const peer = onlineUsers.find((u) => u.id === peerId)
    if (!peer) return
    startChat(peer)
    navigate(`/chat/${peer.id}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-ink-900/80 px-3 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
            aria-label="Geri"
          >
            ‹
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Yeni sohbet</h1>
            {realtime && (
              <p className="text-xs text-emerald-400">{onlineUsers.length} kişi çevrimiçi</p>
            )}
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kişi ara…"
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
      </header>

      {people.length === 0 ? (
        <EmptyState
          emoji="🛰️"
          title="Çevrimiçi kimse yok"
          subtitle="Aynı Papaya bağlantısını başka bir cihazda veya tarayıcı sekmesinde aç — burada anında belirir ve canlı sohbet edebilirsin."
        />
      ) : (
        <ul className="px-2 pb-4">
          {people.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => open(u.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-800 active:scale-[0.99]"
              >
                <Avatar emoji={u.avatar} color={u.color} online={u.online} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{u.name}</div>
                  <div className="text-xs text-white/40">{u.online ? 'çevrimiçi' : 'çevrimdışı'}</div>
                </div>
                <span className="text-papaya-400">💬</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
