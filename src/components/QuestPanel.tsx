import { useState } from 'react'
import type { Quest } from '../types'

interface QuestPanelProps {
  quests: Quest[]
  currentIndex: number
  onSelect: (index: number) => void
}

export default function QuestPanel({ quests, currentIndex, onSelect }: QuestPanelProps) {
  const [open, setOpen] = useState(false)
  const current = quests[currentIndex]

  const allDone = (q: Quest) => q.objectives.every((o) => o.current >= o.needed)

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass absolute right-3 top-14 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition active:scale-90"
        title="Görevler"
      >
        📋
      </button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm animate-pop-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[65%] w-full overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-800/95 p-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">📋 Görevler</h3>
              <button onClick={() => setOpen(false)} className="text-white/50">✕</button>
            </div>

            {quests.length === 0 && (
              <p className="py-6 text-center text-sm text-white/40">Henüz görev yok.</p>
            )}

            <div className="space-y-2">
              {quests.map((q, i) => {
                const done = allDone(q)
                return (
                  <button
                    key={q.id}
                    onClick={() => { onSelect(i); setOpen(false) }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      i === currentIndex
                        ? 'border-papaya-500/50 bg-papaya-500/10'
                        : done
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-ink-700 bg-ink-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{q.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${done ? 'text-emerald-400' : 'text-white'}`}>
                            {q.name}
                          </span>
                          {done && <span className="text-emerald-400 text-xs">✓</span>}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">{q.desc}</div>
                      </div>
                      <span className="text-xs text-papaya-400">{q.xpReward} XP</span>
                    </div>
                    {q.objectives.map((o) => (
                      <div key={o.targetId} className="mt-1.5 flex items-center gap-2 text-xs">
                        <span className={o.current >= o.needed ? 'text-emerald-400' : 'text-white/50'}>
                          {o.current}/{o.needed}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${o.current >= o.needed ? 'bg-emerald-500' : 'bg-papaya-500'}`}
                            style={{ width: `${Math.min(100, (o.current / o.needed) * 100)}%` }}
                          />
                        </div>
                        <span className={o.current >= o.needed ? 'text-emerald-400' : 'text-white/40'}>
                          {o.label}
                        </span>
                      </div>
                    ))}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {!open && current && (
        <div className="absolute left-3 top-14 z-10 max-w-[55%]">
          <div className="glass rounded-full px-3 py-1.5 text-xs text-white/70">
            {current.emoji} {current.name}
            {allDone(current) && ' ✓'}
          </div>
        </div>
      )}
    </>
  )
}
