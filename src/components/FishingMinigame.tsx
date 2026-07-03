import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'

interface FishingMinigameProps {
  onCatch: () => void
  onClose: () => void
}

type Phase = 'idle' | 'casting' | 'waiting' | 'biting' | 'reeling' | 'success' | 'fail'

const FISH_EMOJIS = ['🐟', '🐠', '🐡', '🐬', '🐋', '🦈']

export default function FishingMinigame({ onCatch, onClose }: FishingMinigameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [power, setPower] = useState(0)
  const powerRef = useRef(0)
  const [result, setResult] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)
  const bobRef = useRef<HTMLDivElement>(null)

  const cast = () => {
    setPhase('casting')
    sfx.flip()
    let p = 0
    intervalRef.current = window.setInterval(() => {
      p += 0.03
      if (p >= 1) p = 0
      powerRef.current = p
      setPower(p)
    }, 30)
    setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      setPhase('waiting')
      setPower(0)
      const biteDelay = 800 + Math.random() * 2000
      setTimeout(() => {
        if (phase === 'waiting' || phase === 'idle' || true) {
          setPhase('biting')
          haptic('medium')
          sfx.tap()
          if (bobRef.current) {
            bobRef.current.style.animation = 'none'
            void bobRef.current.offsetHeight
            bobRef.current.style.animation = 'bobBite 0.3s ease-in-out 3'
          }
          const reactTimeout = 1200 + Math.random() * 800
          setTimeout(() => {
            setPhase((p) => {
              if (p === 'biting') return 'fail'
              return p
            })
          }, reactTimeout)
        }
      }, biteDelay)
    }, 800)
  }

  const reel = () => {
    if (phase !== 'biting') return
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    const p = powerRef.current
    if (p > 0.45 && p < 0.85) {
      setPhase('success')
      sfx.fishCatch()
      haptic('success')
      const fish = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)]
      setResult(`Yakaladın! ${fish}`)
      onCatch()
    } else {
      setPhase('fail')
      sfx.fail()
      setResult('Balık kaçtı!')
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  const reset = () => {
    setPhase('idle')
    setPower(0)
    setResult(null)
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm animate-pop-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[85%] max-w-xs rounded-3xl border border-ink-600 bg-gradient-to-b from-ink-800 to-ink-900 p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white">🎣 Balık Tutma</h3>
          <button onClick={onClose} className="text-white/50">✕</button>
        </div>

        {/* Göl animasyonu */}
        <div className="relative mb-4 flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-900/40 to-blue-900/60 ocean">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={bobRef}
              className={`text-3xl transition-all ${
                phase === 'waiting' ? 'animate-bob' : ''
              } ${phase === 'biting' ? 'animate-bobBite' : ''}`}
            >
              {phase === 'idle' ? '🎣' : phase === 'casting' ? '🎣' : phase === 'waiting' ? '🎣' : phase === 'biting' ? '🌊' : result?.includes('Yakaladın') ? '🐟' : '💨'}
            </div>
          </div>
        </div>

        {/* Güç göstergesi */}
        {phase === 'casting' && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-white/50">
              <span>Güç</span>
              <span>%{Math.round(power * 100)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${power * 100}%`,
                  background: power > 0.45 && power < 0.85
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #f95816, #dc2626)',
                }}
              />
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex flex-col gap-2">
          {(phase === 'idle' || phase === 'fail' || phase === 'success') && (
            <button
              onClick={phase === 'success' || phase === 'fail' ? reset : cast}
              className="btn-primary w-full py-3 text-sm"
            >
              {phase === 'idle' ? '🎣 Oltayı at' : phase === 'success' || phase === 'fail' ? '🔄 Tekrar dene' : ''}
            </button>
          )}
          {phase === 'waiting' && (
            <div className="py-2 text-center text-sm text-white/50 animate-pulse">Balık bekleniyor...</div>
          )}
          {phase === 'biting' && (
            <button onClick={reel} className="btn-primary w-full py-3 text-sm animate-pulse">
              🎯 Çek! (Hızlı ol!)
            </button>
          )}
        </div>

        {result && (
          <div className={`mt-3 text-center text-sm font-semibold ${result.includes('Yakaladın') ? 'text-emerald-400' : 'text-papaya-400'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}
