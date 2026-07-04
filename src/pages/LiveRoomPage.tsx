import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useLive } from '../data/liveStore'
import { clockTime } from '../utils/time'
import { haptic } from '../lib/haptics'

const EMOJIS = ['😀', '😂', '😍', '😎', '🥳', '🔥', '👍', '❤️', '🎮', '🍈', '🎉', '🙌', '💯', '🤔', '😴', '👀']

export default function LiveRoomPage() {
  const { roomId = '' } = useParams()
  const navigate = useNavigate()
  const { joinRoom, leaveRoom, sendMessage, getMessages, getViewerCount, rooms, endRoom, myId } = useLive()
  const [draft, setDraft] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [msgs, setMsgs] = useState<ReturnType<typeof getMessages>>([])

  const room = rooms.find((r) => r.id === roomId)
  const viewerCount = getViewerCount(roomId)
  const isHost = room?.hostId === myId

  // Katıl + mesajları canlı takip
  useEffect(() => {
    joinRoom(roomId)
    const interval = setInterval(() => {
      setMsgs([...getMessages(roomId)])
    }, 200)
    return () => {
      clearInterval(interval)
      leaveRoom(roomId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs.length])

  if (!room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-5xl">📡</span>
        <p className="text-white/60">Yayın bulunamadı veya sona erdi.</p>
        <button onClick={() => navigate('/')} className="rounded-xl bg-papaya-500 px-4 py-2 font-semibold text-white">
          Geri dön
        </button>
      </div>
    )
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(roomId, draft)
    setDraft('')
    haptic('light')
  }

  const handleEnd = () => {
    endRoom(roomId)
    navigate('/')
  }

  const isViewer = !isHost

  return (
    <div className="flex h-full flex-col bg-ink-900">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-red-900/40 bg-gradient-to-r from-red-950/50 to-ink-800/90 px-3 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <Avatar emoji={room.hostAvatar} color={room.hostColor} size={40} online />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">{room.title}</span>
            <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg animate-live-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Canlı
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{room.hostName}</span>
            <span>·</span>
            <span>{viewerCount} izleyici</span>
          </div>
        </div>
        {isHost && (
          <button
            onClick={handleEnd}
            className="rounded-full bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            Sonlandır
          </button>
        )}
      </header>

      {/* Stream area (future: video) */}
      <div className="flex items-center justify-center border-b border-ink-700 bg-gradient-to-b from-ink-800 to-ink-900 px-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar emoji={room.hostAvatar} color={room.hostColor} size={72} online />
          <div className="text-center">
            <div className="text-lg font-bold text-white">{room.hostName}</div>
            <div className="text-sm text-white/50">{room.title}</div>
            <div className="mt-1 flex items-center justify-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {viewerCount} izleyici
              </span>
              <span>·</span>
              <span>{new Date(room.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mesaj akışı (Twitch tarzı) */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {msgs.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
            {isViewer ? 'Henüz mesaj yok. İlk mesajı sen yaz!' : 'Yayın başladı. İzleyiciler burada görünecek.'}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className="flex animate-stream-in items-start gap-2 rounded-xl px-2 py-1 transition hover:bg-white/5">
            <span className="text-lg">{m.senderAvatar}</span>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-papaya-400">{m.senderName}</span>
              <span className="ml-2 text-[15px] text-white/90">{m.text}</span>
              <span className="ml-1.5 text-[10px] text-white/30">{clockTime(m.ts)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="flex flex-wrap gap-1 border-t border-ink-700 bg-ink-800 px-3 py-2 animate-stream-in">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setDraft((d) => d + e)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-ink-700"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-ink-700 bg-ink-800 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition ${
            showEmoji ? 'bg-papaya-500/20 text-papaya-400' : 'text-white/50 hover:bg-ink-700'
          }`}
          aria-label="Emoji"
        >
          😊
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isViewer ? 'Sohbete katıl…' : 'Mesaj yaz…'}
          className="flex-1 rounded-full border border-ink-600 bg-ink-900 px-4 py-2.5 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-papaya-500 text-xl text-white shadow-glow transition enabled:hover:bg-papaya-400 enabled:active:scale-95 disabled:opacity-40"
          aria-label="Gönder"
        >
          ➤
        </button>
      </form>
    </div>
  )
}
