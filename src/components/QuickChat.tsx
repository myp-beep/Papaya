import { useState } from 'react'

const QUICK_MSGS = [
  { emoji: '📍', text: 'Buraya gel!' },
  { emoji: '🆘', text: 'Yardım et!' },
  { emoji: '👏', text: 'İyi iş!' },
  { emoji: '⚔️', text: 'Düşman var!' },
  { emoji: '🚶', text: 'Peşimden gel' },
  { emoji: '🔥', text: 'Harika!' },
]

interface QuickChatProps {
  onSelect: (msg: string) => void
  onClose: () => void
  recentLog: string[]
}

export default function QuickChat({ onSelect, onClose, recentLog }: QuickChatProps) {
  const [tab, setTab] = useState<'send' | 'log'>('send')

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-pop-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xs rounded-t-3xl border border-ink-600 bg-ink-800/95 p-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('send')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tab === 'send' ? 'bg-papaya-500 text-white' : 'text-white/50'}`}
            >
              Mesaj
            </button>
            <button
              onClick={() => setTab('log')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tab === 'log' ? 'bg-papaya-500 text-white' : 'text-white/50'}`}
            >
              Sohbet
            </button>
          </div>
          <button onClick={onClose} className="text-white/50 text-lg">✕</button>
        </div>

        {tab === 'send' ? (
          <div className="grid grid-cols-2 gap-2">
            {QUICK_MSGS.map((m) => (
              <button
                key={m.text}
                onClick={() => { onSelect(m.text); onClose() }}
                className="glass flex items-center gap-2 rounded-2xl p-3 text-left text-sm font-medium text-white/90 transition active:scale-95 hover:bg-white/[0.08]"
              >
                <span className="text-xl">{m.emoji}</span>
                <span>{m.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {recentLog.length === 0 && (
              <p className="py-4 text-center text-xs text-white/40">Henüz mesaj yok</p>
            )}
            {recentLog.map((msg, i) => (
              <div key={i} className="rounded-xl bg-ink-900/60 px-3 py-2 text-xs text-white/70">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
