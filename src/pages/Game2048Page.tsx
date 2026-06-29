import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'

const BEST_KEY = 'papaya.2048.best.v1'
type Dir = 'left' | 'right' | 'up' | 'down'

function emptyGrid(): number[] {
  return Array(16).fill(0)
}

function spawn(g: number[]): number[] {
  const empty = g.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0)
  if (!empty.length) return g
  const idx = empty[Math.floor(Math.random() * empty.length)]
  const next = g.slice()
  next[idx] = Math.random() < 0.9 ? 2 : 4
  return next
}

function slide(row: number[]): { row: number[]; gained: number } {
  const arr = row.filter((v) => v !== 0)
  let gained = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      gained += arr[i]
      arr.splice(i + 1, 1)
    }
  }
  while (arr.length < 4) arr.push(0)
  return { row: arr, gained }
}

function getRows(g: number[]): number[][] {
  return [0, 1, 2, 3].map((r) => g.slice(r * 4, r * 4 + 4))
}
function fromRows(rows: number[][]): number[] {
  return rows.flat()
}
function transpose(g: number[]): number[] {
  const out = emptyGrid()
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out[c * 4 + r] = g[r * 4 + c]
  return out
}

function move(g: number[], dir: Dir): { grid: number[]; gained: number; changed: boolean } {
  let work = g.slice()
  if (dir === 'up' || dir === 'down') work = transpose(work)
  let rows = getRows(work)
  let gained = 0
  rows = rows.map((row) => {
    const r = dir === 'right' || dir === 'down' ? row.slice().reverse() : row
    const res = slide(r)
    gained += res.gained
    return dir === 'right' || dir === 'down' ? res.row.reverse() : res.row
  })
  let out = fromRows(rows)
  if (dir === 'up' || dir === 'down') out = transpose(out)
  const changed = out.some((v, i) => v !== g[i])
  return { grid: out, gained, changed }
}

function canMove(g: number[]): boolean {
  if (g.some((v) => v === 0)) return true
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const v = g[r * 4 + c]
      if (c < 3 && v === g[r * 4 + c + 1]) return true
      if (r < 3 && v === g[(r + 1) * 4 + c]) return true
    }
  return false
}

const TILE: Record<number, string> = {
  0: 'bg-white/[0.04]',
  2: 'bg-papaya-200 text-ink-900',
  4: 'bg-papaya-300 text-ink-900',
  8: 'bg-papaya-400 text-white',
  16: 'bg-papaya-500 text-white',
  32: 'bg-papaya-600 text-white',
  64: 'bg-papaya-700 text-white',
  128: 'bg-grape-400 text-white',
  256: 'bg-grape-500 text-white',
  512: 'bg-grape-600 text-white',
  1024: 'bg-emerald-500 text-white',
  2048: 'bg-emerald-400 text-ink-900 shadow-glow',
}

function init(): number[] {
  return spawn(spawn(emptyGrid()))
}

export default function Game2048Page() {
  const navigate = useNavigate()
  const [grid, setGrid] = useState<number[]>(init)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem(BEST_KEY) || 0))
  const [won, setWon] = useState(false)
  const [keepGoing, setKeepGoing] = useState(false)
  const gridRef = useRef(grid)
  gridRef.current = grid
  const lost = !canMove(grid)

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem(BEST_KEY, String(score))
    }
  }, [score, best])

  const doMove = useCallback(
    (dir: Dir) => {
      const g = gridRef.current
      const res = move(g, dir)
      if (!res.changed) return
      const next = spawn(res.grid)
      setGrid(next)
      if (res.gained > 0) {
        setScore((s) => s + res.gained)
        haptic('light')
      }
      if (!won && next.includes(2048)) {
        setWon(true)
        haptic('success')
      }
    },
    [won],
  )

  const reset = useCallback(() => {
    setGrid(init())
    setScore(0)
    setWon(false)
    setKeepGoing(false)
  }, [])

  // Klavye
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        doMove(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove])

  // Dokunmatik kaydırma
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left')
    else doMove(dy > 0 ? 'down' : 'up')
  }

  const showWin = won && !keepGoing

  return (
    <div className="relative flex flex-1 flex-col">
      <Confetti show={won} />
      <header className="flex items-center gap-2 px-4 pb-2 pt-5">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">🔢 2048</h1>
          <p className="text-xs text-white/45">Kaydır, eşitleri birleştir, 2048'e ulaş!</p>
        </div>
        <button onClick={reset} className="btn-ghost px-3 py-2 text-sm">
          ↻ Yeni
        </button>
      </header>

      <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
        <Stat label="Skor" value={String(score)} tone="text-papaya-400" />
        <Stat label="En iyi" value={String(best)} tone="text-white" />
      </div>

      <div className="px-5">
        <div
          className="relative grid grid-cols-4 gap-2.5 rounded-2xl bg-ink-800/60 p-2.5 select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {grid.map((v, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-xl font-extrabold tabular-nums transition-all duration-150 ${TILE[v] ?? 'bg-emerald-400 text-ink-900'} ${
                v >= 1024 ? 'text-lg' : v >= 128 ? 'text-xl' : 'text-2xl'
              } ${v ? 'animate-pop-in' : ''}`}
            >
              {v || ''}
            </div>
          ))}

          {(showWin || lost) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-900/85 backdrop-blur-sm animate-pop-in">
              <div className="flex flex-col items-center px-6 text-center">
                <div className="text-5xl">{showWin ? '🏆' : '💥'}</div>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  {showWin ? '2048! Kazandın' : 'Oyun bitti'}
                </h2>
                <p className="mt-1 text-sm text-white/60">Skor: {score}</p>
                <div className="mt-5 flex gap-2">
                  {showWin && (
                    <button onClick={() => setKeepGoing(true)} className="btn-ghost px-5 py-2.5">
                      Devam et
                    </button>
                  )}
                  <button onClick={reset} className="btn-primary px-6 py-2.5">
                    {showWin ? 'Yeni oyun' : 'Tekrar oyna'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobil için yön tuşları (kaydırma alternatifi) */}
      <div className="mx-auto mt-5 grid w-40 grid-cols-3 gap-2">
        <span />
        <ArrowBtn label="▲" onClick={() => doMove('up')} />
        <span />
        <ArrowBtn label="◀" onClick={() => doMove('left')} />
        <ArrowBtn label="▼" onClick={() => doMove('down')} />
        <ArrowBtn label="▶" onClick={() => doMove('right')} />
      </div>

      <div className="h-6" />
    </div>
  )
}

function ArrowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-lg text-white/80 transition hover:bg-ink-700 active:scale-90"
    >
      {label}
    </button>
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
