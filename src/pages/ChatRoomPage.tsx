import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useChat, userOf } from '../data/chatStore'
import { clockTime } from '../utils/time'

export default function ChatRoomPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getConversation, sendMessage, markRead, typing } = useChat()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversation = getConversation(id)
  const isTyping = typing[id]

  // Açılışta okundu işaretle.
  useEffect(() => {
    if (conversation) markRead(conversation.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Yeni mesaj / yazıyor durumunda en alta kaydır.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversation?.messages.length, isTyping])

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-white/60">Sohbet bulunamadı.</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-papaya-500 px-4 py-2 font-semibold text-white"
        >
          Sohbetlere dön
        </button>
      </div>
    )
  }

  const user = userOf(conversation)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(conversation.id, draft)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col bg-ink-900">
      {/* Başlık */}
      <header className="flex items-center gap-3 border-b border-ink-700 bg-ink-800/90 px-3 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <Avatar emoji={user.avatar} color={user.color} size={40} online={user.online} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{user.name}</div>
          <div className="text-xs text-papaya-400">
            {isTyping ? 'yazıyor…' : user.online ? 'çevrimiçi' : 'çevrimdışı'}
          </div>
        </div>
      </header>

      {/* Mesajlar */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {conversation.messages.map((m) => {
          const mine = m.senderId === 'me'
          return (
            <div
              key={m.id}
              className={`flex animate-slide-up ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                  mine
                    ? 'rounded-br-md bg-papaya-500 text-white'
                    : 'rounded-bl-md bg-ink-700 text-white/90'
                }`}
              >
                <span className="whitespace-pre-wrap break-words">{m.text}</span>
                <span
                  className={`ml-2 inline-block translate-y-0.5 text-[10px] ${
                    mine ? 'text-white/70' : 'text-white/40'
                  }`}
                >
                  {clockTime(m.sentAt)}
                </span>
              </div>
            </div>
          )
        })}

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

      {/* Mesaj yazma alanı */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-ink-700 bg-ink-800 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-white/50"
      style={{ animationDelay: delay }}
    />
  )
}
