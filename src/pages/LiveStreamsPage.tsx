import { useNavigate } from 'react-router-dom'
import { useLive } from '../data/liveStore'
import LiveStreamCard from '../components/LiveStreamCard'
import EmptyState from '../components/EmptyState'

export default function LiveStreamsPage() {
  const { rooms } = useLive()
  const navigate = useNavigate()

  const activeRooms = rooms.filter((r) => r.status === 'live')

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <header className="flex items-center gap-3 border-b border-ink-700 bg-ink-800/90 px-3 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <span className="font-semibold text-white">Canlı Yayınlar</span>
        <span className="ml-auto rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
          {activeRooms.length} aktif
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeRooms.length === 0 ? (
          <EmptyState
            emoji="📡"
            title="Henüz canlı yayın yok"
            subtitle="Sağ üstteki ＋ ile yayın açabilir veya arkadaşlarının açmasını bekleyebilirsin."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeRooms.map((room) => (
              <LiveStreamCard
                key={room.id}
                room={room}
                onJoin={(id) => navigate(`/live/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-ink-700 px-4 py-3">
        <button
          onClick={() => navigate('/live/new')}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base"
        >
          <span>📡</span> Yayın Aç
        </button>
      </div>
    </div>
  )
}
