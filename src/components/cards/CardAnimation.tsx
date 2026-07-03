import { useState, useEffect } from 'react'

type AnimType = 'play' | 'attack' | 'spell' | 'death' | 'heal' | 'draw' | 'heroPower' | 'none'

interface AnimEvent {
  type: AnimType
  emoji?: string
}

let triggerAnim: (e: AnimEvent) => void = () => {}

export function triggerAnimation(e: AnimEvent) {
  triggerAnim(e)
}

export function CardAnimationOverlay() {
  const [event, setEvent] = useState<AnimEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    triggerAnim = (e: AnimEvent) => {
      setEvent(e)
      setVisible(true)
      setTimeout(() => setVisible(false), 600)
    }
  }, [])

  if (!visible || !event) return null

  const emoji = event.emoji || '⭐'

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-cardPlay text-6xl">{emoji}</div>
    </div>
  )
}

export function CardDrawPile({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-14 h-20 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg border border-white/20 shadow-lg flex items-center justify-center text-white text-2xl font-bold">
          {count}
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      </div>
      <span className="text-xs text-white/60 mt-1">{label}</span>
    </div>
  )
}

export function ManaCrystal({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-4 rounded-sm ${
            i < current ? 'bg-blue-400 shadow-sm shadow-blue-300' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}
