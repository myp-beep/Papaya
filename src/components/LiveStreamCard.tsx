import type { LiveRoom } from '../types'
import Avatar from './Avatar'

interface Props {
  room: LiveRoom
  onJoin: (id: string) => void
}

export default function LiveStreamCard({ room, onJoin }: Props) {
  const elapsed = Math.floor((Date.now() - room.startedAt) / 60000)
  const elapsedLabel = elapsed < 1 ? 'Az önce' : elapsed < 60 ? `${elapsed} dk` : `${Math.floor(elapsed / 60)} sa`

  return (
    <button
      onClick={() => onJoin(room.id)}
      className="group relative flex w-full shrink-0 items-center gap-3 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-900/30 to-ink-800/60 p-3 text-left transition hover:border-red-500/40 active:scale-[0.98]"
    >
      {/* Canlı badge */}
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Canlı
      </div>

      <Avatar emoji={room.hostAvatar} color={room.hostColor} size={44} online />

      <div className="min-w-0 flex-1 pr-12">
        <div className="truncate font-semibold text-white">{room.title}</div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>{room.hostName}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="text-red-400">●</span> {room.viewerCount} izleyici
          </span>
          <span>·</span>
          <span>{elapsedLabel}</span>
        </div>
      </div>
    </button>
  )
}
