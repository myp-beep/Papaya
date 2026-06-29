import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'

type Cell = 'X' | 'O' | null
type Difficulty = 'kolay' | 'orta' | 'imkansiz'
const SCORE_KEY = 'papaya.tic.score.v1'
const DIFF_KEY = 'papaya.tic.diff.v1'

const DIFF_LABEL: Record<Difficulty, string> = { kolay: 'Kolay', orta: 'Orta', imkansiz: 'İmkansız' }

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // satırlar
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // sütunlar
  [0, 4, 8], [2, 4, 6], // çaprazlar
]

function getWinner(b: Cell[]): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line }
  }
  return null
}

/** Minimax ile en iyi bot (O) hamlesi. */
function bestMove(board: Cell[]): number {
  let best = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const next = board.slice()
      next[i] = 'O'
      const score = minimax(next, false)
      if (score > best) {
        best = score
        move = i
      }
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
        const next = board.slice()
        next[i] = 'O'
        best = Math.max(best, minimax(next, false))
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const next = board.slice()
        next[i] = 'X'
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

/** Zorluğa göre bot hamlesi. */
function chooseMove(board: Cell[], diff: Difficulty): number {
  if (diff === 'kolay') return randomMove(board)
  if (diff === 'orta') return Math.random() < 0.55 ? bestMove(board) : randomMove(board)
  return bestMove(board)
}

interface Score {
  win: number
  loss: number
  draw: number
}

function loadScore(): Score {
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    if (raw) return JSON.parse(raw) as Score
  } catch {
    /* yoksay */
  }
  return { win: 0, loss: 0, draw: 0 }
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
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(score))
    } catch {
      /* yoksay */
    }
  }, [score])

  // Oyun bitince skoru bir kez güncelle
  const [recorded, setRecorded] = useState(false)
  useEffect(() => {
    if (!over || recorded) return
    setRecorded(true)
    if (winner?.player === 'X') {
      setScore((s) => ({ ...s, win: s.win + 1 }))
      haptic('success')
    } else if (winner?.player === 'O') setScore((s) => ({ ...s, loss: s.loss + 1 }))
    else setScore((s) => ({ ...s, draw: s.draw + 1 }))
  }, [over, recorded, winner])

  useEffect(() => {
    localStorage.setItem(DIFF_KEY, diff)
  }, [diff])

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

      // Oyuncu hamlesi oyunu bitirdiyse bot oynamaz
      if (getWinner(afterPlayer) || afterPlayer.every((c) => c !== null)) return

      setBotThinking(true)
      window.setTimeout(() => {
        setBoard((current) => {
          // güncel tahtaya göre bot hamlesi (zorluğa bağlı)
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
          <h1 className="text-xl font-extrabold tracking-tight text-white">⭕ XOX</h1>
          <p className="text-xs text-white/45">Bota karşı oyna (yenmesi zor!)</p>
        </div>
        <button
          onClick={reset}
          className="rounded-xl bg-ink-700 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-ink-600"
        >
          ↻ Yeni
        </button>
      </header>

      {/* Skor */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        <Stat label="Galibiyet" value={String(score.win)} tone="text-emerald-400" />
        <Stat label="Beraberlik" value={String(score.draw)} tone="text-white" />
        <Stat label="Mağlubiyet" value={String(score.loss)} tone="text-papaya-400" />
      </div>

      {/* Zorluk seçici */}
      <div className="mx-4 mb-3 flex gap-1 rounded-xl border border-ink-700 bg-ink-800 p-1">
        {(['kolay', 'orta', 'imkansiz'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => {
              setDiff(d)
              reset()
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              diff === d ? 'bg-gradient-to-br from-papaya-400 to-papaya-600 text-white shadow-glow' : 'text-white/55 hover:text-white/80'
            }`}
          >
            {DIFF_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Durum */}
      <div className="mb-3 text-center text-sm font-semibold text-white/80">{statusText}</div>

      {/* Tahta */}
      <div className="px-8">
        <div className="grid grid-cols-3 gap-2.5">
          {board.map((cell, i) => {
            const isWinning = winner?.line.includes(i)
            return (
              <button
                key={i}
                onClick={() => play(i)}
                disabled={!!cell || over || botThinking}
                className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl font-black transition ${
                  isWinning
                    ? 'border-emerald-400/60 bg-emerald-500/20'
                    : 'border-ink-600 bg-ink-800 enabled:hover:bg-ink-700'
                } ${cell === 'X' ? 'text-papaya-400' : 'text-grape-400'}`}
              >
                {cell}
              </button>
            )
          })}
        </div>
      </div>

      {over && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={reset}
            className="btn-primary px-6 py-2.5"
          >
            Tekrar oyna
          </button>
        </div>
      )}

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
