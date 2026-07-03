import { useRef, useEffect } from 'react'
import type { AnimState } from './Character'

const EMOTES: { emoji: string; label: string; anim: AnimState }[] = [
  { emoji: '👋', label: 'Selam', anim: 'Wave' },
  { emoji: '💃', label: 'Dans', anim: 'Dance' },
  { emoji: '🦘', label: 'Zıpla', anim: 'Jump' },
  { emoji: '❤️', label: 'Kalp', anim: 'Wave' },
  { emoji: '😡', label: 'Savaş', anim: 'Wave' },
  { emoji: '📣', label: 'Seslen', anim: 'Wave' },
]

interface EmoteWheelProps {
  onSelect: (emoji: string, anim: AnimState) => void
  onClose: () => void
}

export default function EmoteWheel({ onSelect, onClose }: EmoteWheelProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('pointerdown', handle)
    return () => window.removeEventListener('pointerdown', handle)
  }, [onClose])

  return (
    <div className="absolute bottom-40 right-4 z-30 animate-pop-in" ref={ref}>
      <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-ink-800/90 p-3 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {EMOTES.map((e) => (
          <button
            key={e.emoji}
            onClick={() => { onSelect(e.emoji, e.anim); onClose() }}
            className="flex flex-col items-center gap-0.5 rounded-2xl p-2 transition active:scale-90 hover:bg-white/[0.08]"
          >
            <span className="text-2xl">{e.emoji}</span>
            <span className="text-[9px] text-white/50">{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
