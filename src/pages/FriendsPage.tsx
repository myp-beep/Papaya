import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useFriends } from '../data/friendsStore'
import { useChat } from '../data/chatStore'
import { haptic } from '../lib/haptics'

export default function FriendsPage() {
  const navigate = useNavigate()
  const { friends, incoming, pendingCount, acceptRequest, declineRequest, removeFriend } = useFriends()
  const { startChat } = useChat()

  const online = friends.filter((f) => f.online !== false)
  const offline = friends.filter((f) => f.online === false)

  const openChat = (peerId: string) => {
    const peer = friends.find((f) => f.id === peerId)
    if (!peer) return
    startChat(peer)
    navigate(`/chat/${peer.id}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Arkadaşlar</h1>
          <p className="text-sm text-white/45">
            {friends.length} arkadaş · {online.length} çevrimiçi
          </p>
        </div>
        <button
          onClick={() => navigate('/friends/add')}
          className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"
        >
          <span className="text-base">＋</span>
          <span>Ekle</span>
        </button>
      </header>

      {/* Gelen istekler */}
      {incoming.length > 0 && (
        <section className="mx-5 mb-3 overflow-hidden rounded-2xl border border-papaya-500/30 bg-papaya-500/10">
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-papaya-300">
            <span>📩</span>
            <span>{pendingCount} gelen istek</span>
          </div>
          {incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 border-t border-papaya-500/15 px-4 py-3"
            >
              <Avatar
                emoji={req.fromUser?.avatar ?? '👤'}
                color={req.fromUser?.color ?? '#888'}
                size={40}
              />
              <span className="flex-1 font-semibold text-white text-[15px]">
                {req.fromUser?.name ?? 'Bilinmeyen'}
              </span>
              <button
                onClick={() => { acceptRequest(req.id); haptic('light') }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30 active:scale-90"
                title="Kabul et"
              >
                ✓
              </button>
              <button
                onClick={() => { declineRequest(req.id); haptic('light') }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30 active:scale-90"
                title="Reddet"
              >
                ✕
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Arkadaş listesi */}
      {friends.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-5">
          <EmptyState
            emoji="👥"
            title="Henüz arkadaşın yok"
            subtitle="Yukarıdaki ＋ Ekle butonuna tıkla ve kullanıcı ara. Discord gibi arkadaşlarınla bağlantı kur!"
          />
        </div>
      ) : (
        <div className="flex-1 space-y-0.5 px-2 pb-4">
          {online.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">
                Çevrimiçi — {online.length}
              </p>
              {online.map((f) => (
                <FriendRow key={f.id} peer={f} onChat={openChat} onRemove={removeFriend} />
              ))}
            </>
          )}
          {offline.length > 0 && (
            <>
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-white/30">
                Çevrimdışı — {offline.length}
              </p>
              {offline.map((f) => (
                <FriendRow key={f.id} peer={f} onChat={openChat} onRemove={removeFriend} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function FriendRow({
  peer,
  onChat,
  onRemove,
}: {
  peer: { id: string; name: string; avatar: string; color: string; online?: boolean }
  onChat: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink-800/60">
      <button
        onClick={() => onChat(peer.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar emoji={peer.avatar} color={peer.color} online={peer.online} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{peer.name}</div>
          <div className="text-xs text-white/40">
            {peer.online !== false ? 'çevrimiçi' : 'çevrimdışı'}
          </div>
        </div>
      </button>
      <button
        onClick={() => onChat(peer.id)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-papaya-400 opacity-0 transition hover:bg-ink-700 group-hover:opacity-100"
        title="Mesaj at"
      >
        💬
      </button>
      <button
        onClick={() => {
          if (confirm(`${peer.name} arkadaşlıktan çıkarılsın mı?`)) onRemove(peer.id)
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/25 opacity-0 transition hover:bg-ink-700 hover:text-red-400 group-hover:opacity-100"
        title="Arkadaşlıktan çıkar"
      >
        ✕
      </button>
    </div>
  )
}
