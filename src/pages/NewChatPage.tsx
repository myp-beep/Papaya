import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useChat } from '../data/chatStore'
import { useFriends } from '../data/friendsStore'

export default function NewChatPage() {
  const navigate = useNavigate()
  const { startChat } = useChat()
  const { friends: friendsList } = useFriends()
  const [query, setQuery] = useState('')

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? friendsList.filter((u) => u.name.toLowerCase().includes(q))
      : friendsList
  }, [friendsList, query])

  const open = (peerId: string) => {
    const peer = friendsList.find((u) => u.id === peerId)
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
            <p className="text-xs text-white/40">{friendsList.length} arkadaş</p>
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Arkadaş ara…"
          className="mt-3 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
      </header>

      {people.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Sohbet edecek arkadaşın yok"
          subtitle="Önce Arkadaşlar sekmesinden arkadaş ekle, ardından buradan sohbet başlat!"
          action={friendsList.length === 0 ? { label: 'Arkadaş ekle', to: '/friends/add' } : undefined}
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
                  <div className="text-xs text-white/40">{u.online !== false ? 'çevrimiçi' : 'çevrimdışı'}</div>
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
