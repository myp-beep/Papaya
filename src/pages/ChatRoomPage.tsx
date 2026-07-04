import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useChat } from '../data/chatStore'
import { useProfile } from '../data/profileStore'
import { useCall } from '../data/callStore'
import { clockTime } from '../utils/time'
import { haptic } from '../lib/haptics'

const EMOJIS = ['😀', '😂', '😍', '😎', '🥳', '😭', '🔥', '👍', '❤️', '🎮', '🍈', '🎉', '🙌', '💯', '🤔', '😴']

export default function ChatRoomPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getThread, sendMessage, markRead, notifyTyping, setActiveThread, typing, realtime, sendEvent } = useChat()
  const { profile } = useProfile()
  const [draft, setDraft] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)

  const { startCall } = useCall()
  const thread = getThread(id)
  const isTyping = typing[id]

  // Açık thread'i işaretle + okundu
  useEffect(() => {
    setActiveThread(id)
    if (thread) markRead(id)
    return () => setActiveThread(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Yeni mesaj gelince de okundu say
  useEffect(() => {
    if (thread && thread.unread > 0) markRead(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.messages.length])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread?.messages.length, isTyping])

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-white/60">Sohbet bulunamadı.</p>
        <button onClick={() => navigate('/')} className="rounded-xl bg-papaya-500 px-4 py-2 font-semibold text-white">
          Sohbetlere dön
        </button>
      </div>
    )
  }

  const peer = thread.peer

  const onDraftChange = (v: string) => {
    setDraft(v)
    notifyTyping(id, true)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => notifyTyping(id, false), 1500)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(id, draft)
    setDraft('')
    notifyTyping(id, false)
    haptic('light')
  }

  const canPlayOnline = realtime && peer.online && peer.id !== 'papaya-bot'

  const onPlay = () => {
    if (!canPlayOnline) {
      navigate('/games/tic')
      return
    }
    const gameId = 'g-' + Math.random().toString(36).slice(2, 9)
    sendEvent('game:invite', {
      to: peer.id,
      gameId,
      game: 'tic',
      hostProfile: { name: profile.name, avatar: profile.avatar, color: profile.color },
    })
    navigate(`/play/tic/${gameId}`, { state: { gameId, peer, role: 'host' } })
  }

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <header className="flex items-center gap-3 border-b border-ink-700 bg-ink-800/90 px-3 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <Avatar emoji={peer.avatar} color={peer.color} size={40} online={peer.online} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{peer.name}</div>
          <div className="text-xs text-papaya-400">
            {isTyping ? 'yazıyor…' : peer.online ? 'çevrimiçi' : 'çevrimdışı'}
          </div>
        </div>
        {realtime && peer.id !== 'papaya-bot' && (
          <>
            <button
              onClick={() => startCall({ id: peer.id, name: peer.name, avatar: peer.avatar, color: peer.color }, false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/60 transition hover:bg-ink-700"
              title="Sesli arama"
            >
              📞
            </button>
            <button
              onClick={() => startCall({ id: peer.id, name: peer.name, avatar: peer.avatar, color: peer.color }, true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/60 transition hover:bg-ink-700"
              title="Görüntülü arama"
            >
              📹
            </button>
          </>
        )}
        <button
          onClick={onPlay}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/60 transition hover:bg-ink-700"
          title={canPlayOnline ? 'Canlı XOX oyna' : 'Oyna'}
        >
          🎮
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex animate-stream-in ${m.mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-md ${
                m.mine
                  ? 'rounded-br-md bg-gradient-to-br from-papaya-400 to-papaya-600 text-white shadow-glow'
                  : 'rounded-bl-md border border-white/5 bg-ink-700/80 text-white/90 backdrop-blur'
              }`}
            >
              {m.streaming ? (
                <StreamingBubble text={m.text} />
              ) : (
                <span className="whitespace-pre-wrap break-words">{m.text}</span>
              )}
              <span className={`ml-2 inline-block translate-y-0.5 text-[10px] ${m.mine ? 'text-white/70' : 'text-white/40'}`}>
                {clockTime(m.ts)}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-700 px-4 py-3">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </div>
          </div>
        )}
      </div>

      {showEmoji && (
        <div className="flex flex-wrap gap-1 border-t border-ink-700 bg-ink-800 px-3 py-2 animate-slide-up">
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
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Mesaj yaz…"
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

function Dot({ delay }: { delay: string }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: delay }} />
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {text || <>&nbsp;</>}
      <span className="stream-cursor" />
    </span>
  )
}
