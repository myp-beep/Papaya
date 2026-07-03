import { useEffect, useRef, useState } from 'react'
import { onUnlock, type Achievement } from '../data/statsStore'
import { haptic } from '../lib/haptics'

/** Başarım açıldığında uygulama genelinde beliren kart. */
export default function AchievementToast() {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [current, setCurrent] = useState<Achievement | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => onUnlock((list) => setQueue((q) => [...q, ...list])), [])

  useEffect(() => {
    if (current || queue.length === 0) return
    const [head, ...rest] = queue
    setQueue(rest)
    setCurrent(head)
    haptic('success')
    timer.current = window.setTimeout(() => setCurrent(null), 3200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [queue, current])

  if (!current) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-[60] flex justify-center px-6 animate-slide-up">
      <div className="glass flex items-center gap-3 rounded-2xl border border-papaya-500/40 px-4 py-3 shadow-glow">
        <span className="text-3xl">{current.emoji}</span>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-papaya-400">Başarım açıldı!</div>
          <div className="font-bold text-white">{current.name}</div>
          <div className="text-xs text-white/60">{current.desc}</div>
        </div>
      </div>
    </div>
  )
}
