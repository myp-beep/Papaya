import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'
import { sfx } from '../lib/sound'
import { recordGame } from '../data/statsStore'

type Cell = 'X' | 'O' | null
type Difficulty = 'kolay' | 'orta' | 'imkansiz'
const SCORE_KEY = 'papaya.tic.score.v1'
const DIFF_KEY = 'papaya.tic.diff.v1'

const DIFF_LABEL: Record<Difficulty, string> = { kolay: 'Kolay', orta: 'Orta', imkansiz: 'İmkansız' }

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function getWinner(b: Cell[]): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line }
  }
  return null
}

function bestMove(board: Cell[]): number {
  let best = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const next = board.slice()
      next[i] = 'O'
      const score = minimax(next, false)
      if (score > best) { best = score; move = i }
    }
  }
  return move
}

function minimax(board: Cell[], maximizing: boolean): number {
  const win = getWinner(board)
  if (win) return win.player === 'O' ? 10 : -10
  if (board.every((c) => c !== null)) return 0
  if (maximizing) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const next = board.slice(); next[i] = 'O'
        best = Math.max(best, minimax(next, false))
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const next = board.slice(); next[i] = 'X'
        best = Math.min(best, minimax(next, true))
      }
    }
    return best
  }
}

function randomMove(board: Cell[]): number {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0)
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1
}

function chooseMove(board: Cell[], diff: Difficulty): number {
  if (diff === 'kolay') return randomMove(board)
  if (diff === 'orta') return Math.random() < 0.55 ? bestMove(board) : randomMove(board)
  return bestMove(board)
}

function cellCenter(i: number): { x: number; y: number } {
  const S = 300, P = 14, G = 10
  const cellSize = (S - 2 * P - 2 * G) / 3
  const row = Math.floor(i / 3), col = i % 3
  return {
    x: P + col * (cellSize + G) + cellSize / 2,
    y: P + row * (cellSize + G) + cellSize / 2,
  }
}

interface Score {
  win: number
  loss: number
  draw: number
  streak: number
  bestStreak: number
}

function loadScore(): Score {
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    if (raw) return JSON.parse(raw) as Score
  } catch { /* yoksay */ }
  return { win: 0, loss: 0, draw: 0, streak: 0, bestStreak: 0 }
}

export default function TicTacToePage() {
  const navigate = useNavigate()
  const [board, setBoard] = useState<Cell[]>(() => Array(9).fill(null))
  const [botThinking, setBotThinking] = useState(false)
  const [score, setScore] = useState<Score>(loadScore)
  const [diff, setDiff] = useState<Difficulty>(
    () => (localStorage.getItem(DIFF_KEY) as Difficulty) || 'orta',
  )

  const winner = getWinner(board)
  const full = board.every((c) => c !== null)
  const over = !!winner || full

  useEffect(() => {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(score)) } catch { /* yoksay */ }
  }, [score])

  const [recorded, setRecorded] = useState(false)
  useEffect(() => {
    if (!over || recorded) return
    setRecorded(true)
    if (winner?.player === 'X') {
      setScore((s) => ({ ...s, win: s.win + 1, streak: s.streak + 1, bestStreak: Math.max(s.bestStreak, s.streak + 1) }))
      haptic('success')
      sfx.win()
      recordGame({ won: true, achievementIds: diff === 'imkansiz' ? ['tic-impossible'] : [] })
    } else if (winner?.player === 'O') {
      setScore((s) => ({ ...s, loss: s.loss + 1, streak: 0 }))
      sfx.fail()
      recordGame({ won: false })
    } else {
      setScore((s) => ({ ...s, draw: s.draw + 1, streak: 0 }))
      recordGame({ won: false, xp: 15 })
    }
  }, [over, recorded, winner, diff])

  useEffect(() => { localStorage.setItem(DIFF_KEY, diff) }, [diff])

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null))
    setBotThinking(false)
    setRecorded(false)
  }, [])

  const play = useCallback(
    (index: number) => {
      if (board[index] || over || botThinking) return
      const afterPlayer = board.slice()
      afterPlayer[index] = 'X'
      setBoard(afterPlayer)
      haptic('light')
      sfx.tap()

      if (getWinner(afterPlayer) || afterPlayer.every((c) => c !== null)) return

      setBotThinking(true)
      window.setTimeout(() => {
        setBoard((current) => {
          if (getWinner(current) || current.every((c) => c !== null)) return current
          const move = chooseMove(current, diff)
          if (move === -1) return current
          const next = current.slice()
          next[move] = 'O'
          return next
        })
        setBotThinking(false)
      }, 420)
    },
    [board, over, botThinking, diff],
  )

  const statusText = winner
    ? winner.player === 'X'
      ? '🎉 Kazandın!'
      : '🤖 Bot kazandı'
    : full
      ? '🤝 Berabere'
      : botThinking
        ? 'Bot düşünüyor…'
        : 'Senin sıran (X)'

  const lineCoords = useMemo(() => {
    if (!winner) return null
    const first = cellCenter(winner.line[0])
    const last = cellCenter(winner.line[2])
    return { x1: first.x, y1: first.y, x2: last.x, y2: last.y }
  }, [winner])

  return (
    <div className="relative flex flex-1 flex-col">
      <Confetti show={winner?.player === 'X'} />
      <header className="flex items-center gap-2 px-4 pb-2 pt-5">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <span className="text-gradient">XOX</span>
          </h1>
          <p className="text-xs text-white/45">Bota karşı oyna (yenmesi zor!)</p>
        </div>
        <button
          onClick={reset}
          className="rounded-xl bg-ink-700 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-ink-600"
        >
          ↻ Yeni
        </button>
      </header>

      <div className="mx-4 mb-3 grid grid-cols-4 gap-2">
        <Stat label="Galibiyet" value={String(score.win)} tone="text-emerald-400" />
        <Stat label="Beraberlik" value={String(score.draw)} tone="text-white" />
        <Stat label="Mağlubiyet" value={String(score.loss)} tone="text-papaya-400" />
        <Stat label="Seri" value={`${score.streak}`} tone={score.streak >= 3 ? 'text-yellow-400' : 'text-white'} />
      </div>

      {/* Streak göstergesi */}
      {score.streak >= 3 && (
        <div className="mx-4 -mt-2 mb-2 text-center text-xs font-bold text-yellow-400 animate-pop-in">
          🔥 {score.streak} galibiyet serisi! {score.streak >= 5 ? '💀' : score.streak >= 3 ? '⚡' : ''}
        </div>
      )}

      <div className="mx-4 mb-3 flex gap-1 rounded-xl border border-ink-700 bg-ink-800 p-1">
        {(['kolay', 'orta', 'imkansiz'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => { setDiff(d); reset() }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              diff === d ? 'bg-gradient-to-br from-papaya-400 to-papaya-600 text-white shadow-glow' : 'text-white/55 hover:text-white/80'
            }`}
          >
            {DIFF_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-white/80">
        {botThinking && (
          <span className="flex gap-1">
            <Dot delay="0s" /><Dot delay="0.15s" /><Dot delay="0.3s" />
          </span>
        )}
        {statusText}
      </div>

      <div className="px-6">
        <div className="glass relative grid grid-cols-3 gap-2.5 rounded-[1.75rem] p-3 shadow-card">
          <span className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-papaya-500/10 via-transparent to-grape-500/10 blur-xl" />
          {lineCoords && (
            <svg
              viewBox="0 0 300 300"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            >
              <line
                x1={lineCoords.x1} y1={lineCoords.y1} x2={lineCoords.x2} y2={lineCoords.y2}
                stroke={winner?.player === 'X' ? '#f95816' : '#8b5cf6'}
                strokeWidth="3"
                strokeLinecap="round"
                className="mark-stroke"
                pathLength={1}
                style={{ filter: 'drop-shadow(0 0 8px rgba(249,88,22,0.6))' }}
              />
            </svg>
          )}
          {board.map((cell, i) => {
            const isWinning = winner?.line.includes(i)
            const playable = !cell && !over && !botThinking
            return (
              <button
                key={i}
                onClick={() => play(i)}
                disabled={!!cell || over || botThinking}
                className={`group relative flex aspect-square items-center justify-center rounded-2xl border transition ${
                  isWinning
                    ? 'win-pulse border-emerald-400/60 bg-emerald-500/15'
                    : 'border-white/10 bg-gradient-to-br from-ink-900/80 to-ink-800/40 enabled:hover:border-papaya-400/40 enabled:hover:bg-ink-800/70'
                }`}
              >
                {cell === 'X' && <MarkX />}
                {cell === 'O' && <MarkO />}
                {playable && (
                  <span className="text-3xl font-black text-white/0 transition group-hover:text-papaya-400/25">
                    ×
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {over && (
        <div className="mt-5 flex justify-center">
          <button onClick={reset} className="btn-primary px-6 py-2.5">
            Tekrar oyna
          </button>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}

function MarkX() {
  return (
    <svg viewBox="0 0 100 100" className="h-[62%] w-[62%] drop-shadow-[0_2px_10px_rgba(249,88,22,0.5)]">
      <line x1="22" y1="22" x2="78" y2="78" pathLength={1} className="mark-stroke" stroke="url(#xg)" strokeWidth="12" strokeLinecap="round" />
      <line x1="78" y1="22" x2="22" y2="78" pathLength={1} className="mark-stroke s2" stroke="url(#xg)" strokeWidth="12" strokeLinecap="round" />
      <defs>
        <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7a3c" /><stop offset="1" stopColor="#ea3d0c" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function MarkO() {
  return (
    <svg viewBox="0 0 100 100" className="h-[62%] w-[62%] drop-shadow-[0_2px_10px_rgba(139,92,246,0.5)]">
      <circle cx="50" cy="50" r="30" pathLength={1} className="mark-stroke" fill="none" stroke="url(#og)" strokeWidth="12" strokeLinecap="round" />
      <defs>
        <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-papaya-400" style={{ animationDelay: delay }} />
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-ink-700 bg-ink-800 py-2">
      <span className={`text-lg font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="text-[11px] text-white/45">{label}</span>
    </div>
  )
}
