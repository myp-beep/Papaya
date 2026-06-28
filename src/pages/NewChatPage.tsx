import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { USERS } from '../data/mockData'
import { useChat } from '../data/chatStore'

export default function NewChatPage() {
  const navigate = useNavigate()
  const { startConversation } = useChat()
  const [query, setQuery] = useState('')

  const people = useMemo(() => {
    const list = Object.values(USERS)
    const q = query.trim().toLowerCase()
    return q ? list.filter((u) => u.name.toLowerCase().includes(q)) : list
  }, [query])

  const open = (userId: string) => {
    const id = startConversation(userId)
    navigate(`/chat/${id}`)
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
          <h1 className="text-xl font-extrabold tracking-tight text-white">Yeni sohbet</h1>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kişi ara…"
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
      </header>

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
    </div>
  )
}
