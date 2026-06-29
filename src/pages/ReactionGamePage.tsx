import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'

const GRID = 9 // 3x3
const ROUND_SEC = 20
const BEST_KEY = 'papaya.reaction.best.v1'

type Phase = 'idle' | 'playing' | 'over'

export default function ReactionGamePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState(-1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC)
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem(BEST_KEY) || 0))
  const moveTimer = useRef<number | null>(null)

  const clearMove = () => {
    if (moveTimer.current) {
      window.clearTimeout(moveTimer.current)
      moveTimer.current = null
    }
  }

  // Hedefi rastgele bir hücreye taşı, hızlanan aralıkla
  const scheduleMove = useCallback((currentScore: number) => {
    clearMove()
    const delay = Math.max(550 - currentScore * 12, 320)
    moveTimer.current = window.setTimeout(() => {
      setTarget((prev) => {
        let next = Math.floor(Math.random() * GRID)
        if (next === prev) next = (next + 1) % GRID
        return next
      })
      scheduleMove(currentScore)
    }, delay)
  }, [])

  const start = useCallback(() => {
    setScore(0)
    setTimeLeft(ROUND_SEC)
    setTarget(Math.floor(Math.random() * GRID))
    setPhase('playing')
    scheduleMove(0)
  }, [scheduleMove])

  // Geri sayım
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  // Süre bitti
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      clearMove()
      setPhase('over')
      setBest((b) => {
        if (score > b) {
          localStorage.setItem(BEST_KEY, String(score))
          return score
        }
        return b
      })
    }
  }, [timeLeft, phase, score])

  useEffect(() => () => clearMove(), [])

  const hit = (index: number) => {
    if (phase !== 'playing' || index !== target) return
    haptic('light')
    setScore((s) => {
      const ns = s + 1
      // hemen yeni konuma taşı ve hızı güncelle
      let next = Math.floor(Math.random() * GRID)
      if (next === index) next = (next + 1) % GRID
      setTarget(next)
      scheduleMove(ns)
      return ns
    })
  }

  const isRecord = phase === 'over' && score > 0 && score >= best

  return (
    <div className="relative flex flex-1 flex-col">
      <Confetti show={isRecord} />
      <header className="flex items-center gap-2 px-4 pb-2 pt-5">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">🎯 Hızlı Dokun</h1>
          <p className="text-xs text-white/45">{ROUND_SEC} saniyede kaç papaya yakalarsın?</p>
        </div>
      </header>

      <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
        <Stat label="Skor" value={String(score)} tone="text-papaya-400" />
        <Stat label="Süre" value={`${timeLeft}s`} tone="text-white" />
      </div>
      <div className="mx-4 mb-3 text-center text-xs text-white/45">En iyi: {best}</div>

      {/* Oyun alanı */}
      <div className="relative px-6">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: GRID }).map((_, i) => {
            const active = i === target && phase === 'playing'
            return (
              <button
                key={i}
                onClick={() => hit(i)}
                disabled={phase !== 'playing'}
                className={`flex aspect-square items-center justify-center rounded-2xl border text-3xl transition-all duration-100 ${
                  active
                    ? 'scale-105 border-papaya-400/60 bg-papaya-500/25 shadow-glow'
                    : 'border-ink-700 bg-ink-800'
                }`}
              >
                {active ? '🍈' : ''}
              </button>
            )
          })}
        </div>

        {/* Başlangıç / bitiş kaplaması */}
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-900/85 backdrop-blur-sm">
            <div className="flex flex-col items-center px-6 text-center animate-pop-in">
              {phase === 'over' ? (
                <>
                  <div className="text-5xl">{score > best || score === best ? '🏆' : '⏰'}</div>
                  <h2 className="mt-2 text-2xl font-extrabold text-white">Süre doldu!</h2>
                  <p className="mt-1 text-sm text-white/60">{score} papaya yakaladın</p>
                </>
              ) : (
                <>
                  <div className="text-5xl">🍈</div>
                  <h2 className="mt-2 text-xl font-bold text-white">Hazır mısın?</h2>
                  <p className="mt-1 text-sm text-white/55">Beliren papayalara hızlıca dokun!</p>
                </>
              )}
              <button
                onClick={start}
                className="mt-5 btn-primary px-6 py-2.5"
              >
                {phase === 'over' ? 'Tekrar oyna' : 'Başla'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-ink-700 bg-ink-800 py-2">
      <span className={`text-lg font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="text-[11px] text-white/45">{label}</span>
    </div>
  )
}
