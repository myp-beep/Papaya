import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EMOJIS = ['🍈', '🦊', '🐼', '🐙', '🦄', '🎮', '🔥', '🍓']
const PAIRS = EMOJIS.length // 8 çift = 16 kart
const BEST_KEY = 'papaya.memory.best.v1'

interface Card {
  id: number
  emoji: string
  matched: boolean
}

function buildDeck(): Card[] {
  const deck = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji, matched: false }))
  // Fisher–Yates karıştırma
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function loadBest(): number | null {
  const raw = localStorage.getItem(BEST_KEY)
  return raw ? Number(raw) : null
}

export default function MemoryGamePage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>(buildDeck)
  const [flipped, setFlipped] = useState<number[]>([]) // açık ama eşleşmemiş kart index'leri
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [locked, setLocked] = useState(false)
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [best, setBest] = useState<number | null>(loadBest)
  const flipBackTimer = useRef<number | null>(null)

  const won = matched === PAIRS

  // Süre sayacı
  useEffect(() => {
    if (!started || won) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [started, won])

  // Kazanınca en iyi skoru güncelle
  useEffect(() => {
    if (!won) return
    setBest((prevBest) => {
      if (prevBest == null || elapsed < prevBest) {
        localStorage.setItem(BEST_KEY, String(elapsed))
        return elapsed
      }
      return prevBest
    })
  }, [won, elapsed])

  // Açık kalan zamanlayıcıyı temizle
  useEffect(() => () => {
    if (flipBackTimer.current) window.clearTimeout(flipBackTimer.current)
  }, [])

  const reset = useCallback(() => {
    if (flipBackTimer.current) window.clearTimeout(flipBackTimer.current)
    setCards(buildDeck())
    setFlipped([])
    setMoves(0)
    setMatched(0)
    setLocked(false)
    setStarted(false)
    setElapsed(0)
  }, [])

  const handleFlip = useCallback(
    (index: number) => {
      if (locked || won) return
      const card = cards[index]
      if (card.matched || flipped.includes(index)) return
      if (!started) setStarted(true)

      const next = [...flipped, index]
      setFlipped(next)

      if (next.length === 2) {
        setMoves((m) => m + 1)
        const [a, b] = next
        if (cards[a].emoji === cards[b].emoji) {
          // Eşleşti
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)))
          setMatched((n) => n + 1)
          setFlipped([])
        } else {
          // Eşleşmedi: kısa süre göster, sonra kapat
          setLocked(true)
          flipBackTimer.current = window.setTimeout(() => {
            setFlipped([])
            setLocked(false)
          }, 800)
        }
      }
    },
    [cards, flipped, locked, started, won],
  )

  const timeLabel = useMemo(() => formatTime(elapsed), [elapsed])

  return (
    <div className="flex flex-1 flex-col">
      {/* Başlık */}
      <header className="flex items-center gap-2 px-4 pb-2 pt-5">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">🧠 Hafıza</h1>
          <p className="text-xs text-white/45">Çiftleri eşleştir, en kısa sürede bitir!</p>
        </div>
        <button
          onClick={reset}
          className="rounded-xl bg-ink-700 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-ink-600"
        >
          ↻ Yeni
        </button>
      </header>

      {/* Skor şeridi */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        <Stat label="Süre" value={timeLabel} />
        <Stat label="Hamle" value={String(moves)} />
        <Stat label="En iyi" value={best != null ? formatTime(best) : '—'} />
      </div>

      {/* Kart ızgarası */}
      <div className="relative px-4">
        <div className="grid grid-cols-4 gap-2.5">
          {cards.map((card, index) => {
            const isUp = card.matched || flipped.includes(index)
            return (
              <button
                key={card.id}
                onClick={() => handleFlip(index)}
                disabled={isUp || locked}
                className="relative aspect-square [perspective:800px]"
                aria-label={isUp ? card.emoji : 'kapalı kart'}
              >
                <div
                  className="relative h-full w-full transition-transform duration-300 [transform-style:preserve-3d]"
                  style={{ transform: isUp ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* Arka yüz (kapalı) */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-ink-600 bg-gradient-to-br from-ink-700 to-ink-800 text-2xl text-white/25 [backface-visibility:hidden]">
                    🍈
                  </div>
                  {/* Ön yüz (emoji) */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center rounded-2xl text-3xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                      card.matched
                        ? 'bg-emerald-500/20 ring-2 ring-emerald-400/60'
                        : 'bg-papaya-500/20 ring-2 ring-papaya-400/50'
                    }`}
                  >
                    {card.emoji}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Kazanma ekranı */}
        {won && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-900/85 backdrop-blur-sm animate-pop-in">
            <div className="flex flex-col items-center px-6 text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="mt-2 text-2xl font-extrabold text-white">Kazandın!</h2>
              <p className="mt-1 text-sm text-white/60">
                {timeLabel} · {moves} hamle
              </p>
              {best != null && elapsed <= best && (
                <p className="mt-1 text-sm font-semibold text-papaya-400">🏆 Yeni en iyi skor!</p>
              )}
              <button
                onClick={reset}
                className="mt-5 btn-primary px-6 py-2.5"
              >
                Tekrar oyna
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-ink-700 bg-ink-800 py-2">
      <span className="text-lg font-bold tabular-nums text-white">{value}</span>
      <span className="text-[11px] text-white/45">{label}</span>
    </div>
  )
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
