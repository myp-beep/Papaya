import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useChat } from '../data/chatStore'
import type { Peer } from '../types'

type Cell = 'X' | 'O' | null
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function winnerOf(b: Cell[]): { player: Cell; line: number[] } | null {
  for (const l of LINES) {
    const [a, c, d] = l
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line: l }
  }
  return null
}

interface GameNavState {
  gameId: string
  peer: Peer
  role: 'host' | 'guest'
}

export default function OnlineTicPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { sendEvent, onEvent } = useChat()
  const state = location.state as GameNavState | null

  const [board, setBoard] = useState<Cell[]>(() => Array(9).fill(null))
  const [turn, setTurn] = useState<'X' | 'O'>('X') // host=X başlar
  const [ready, setReady] = useState<boolean>(state?.role === 'guest')

  const role = state?.role
  const peer = state?.peer
  const mySymbol: 'X' | 'O' = role === 'host' ? 'X' : 'O'
  const myTurn = ready && turn === mySymbol
  const winner = winnerOf(board)
  const full = board.every((c) => c !== null)
  const over = !!winner || full

  // Rakip hamlelerini ve (host için) kabul'ü dinle
  useEffect(() => {
    if (!peer) return
    const offMove = onEvent('game:move', (p) => {
      if (p.gameId !== gameId) return
      const cell = p.cell as number
      const sym = p.symbol as 'X' | 'O'
      setBoard((prev) => {
        if (prev[cell]) return prev
        const next = prev.slice()
        next[cell] = sym
        return next
      })
      setTurn(sym === 'X' ? 'O' : 'X')
    })
    const offAccept = onEvent('game:accept', (p) => {
      if (p.gameId === gameId) setReady(true)
    })
    const offReset = onEvent('game:reset', (p) => {
      if (p.gameId !== gameId) return
      setBoard(Array(9).fill(null))
      setTurn('X')
    })
    return () => {
      offMove()
      offAccept()
      offReset()
    }
  }, [gameId, peer, onEvent])

  const play = useCallback(
    (i: number) => {
      if (!peer || board[i] || over || !myTurn) return
      const next = board.slice()
      next[i] = mySymbol
      setBoard(next)
      setTurn(mySymbol === 'X' ? 'O' : 'X')
      sendEvent('game:move', { to: peer.id, gameId, cell: i, symbol: mySymbol })
    },
    [peer, board, over, myTurn, mySymbol, gameId, sendEvent],
  )

  const rematch = useCallback(() => {
    setBoard(Array(9).fill(null))
    setTurn('X')
    if (peer) sendEvent('game:reset', { to: peer.id, gameId })
  }, [peer, gameId, sendEvent])

  const status = useMemo(() => {
    if (!ready) return 'Rakip bekleniyor…'
    if (winner) return winner.player === mySymbol ? '🎉 Kazandın!' : '😔 Rakip kazandı'
    if (full) return '🤝 Berabere'
    return myTurn ? 'Senin sıran' : `${peer?.name ?? 'Rakip'} oynuyor…`
  }, [ready, winner, full, myTurn, mySymbol, peer])

  if (!state || !peer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-white/60">Oyun oturumu bulunamadı.</p>
        <button onClick={() => navigate('/')} className="rounded-xl bg-papaya-500 px-4 py-2 font-semibold text-white">
          Ana sayfa
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <header className="flex items-center gap-3 border-b border-ink-700 bg-ink-800/90 px-3 py-2.5">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <Avatar emoji={peer.avatar} color={peer.color} size={40} online />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">⭕ XOX · {peer.name}</div>
          <div className="text-xs text-papaya-400">Canlı çok oyunculu · sen {mySymbol}</div>
        </div>
      </header>

      <div className="mb-2 mt-4 text-center text-sm font-semibold text-white/85">{status}</div>

      <div className="px-8">
        <div className="grid grid-cols-3 gap-2.5">
          {board.map((cell, i) => {
            const isWin = winner?.line.includes(i)
            return (
              <button
                key={i}
                onClick={() => play(i)}
                disabled={!!cell || over || !myTurn}
                className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl font-black transition ${
                  isWin ? 'border-emerald-400/60 bg-emerald-500/20' : 'border-ink-600 bg-ink-800 enabled:hover:bg-ink-700'
                } ${cell === 'X' ? 'text-papaya-400' : 'text-grape-400'} ${myTurn && !cell && !over ? 'enabled:active:scale-95' : ''}`}
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
            onClick={rematch}
            className="rounded-xl bg-papaya-500 px-6 py-2.5 font-semibold text-white shadow-glow transition hover:bg-papaya-400"
          >
            Rövanş
          </button>
        </div>
      )}

      <div className="mt-auto p-4 text-center text-xs text-white/30">
        Hamleler Supabase Realtime ile anlık senkron olur.
      </div>
    </div>
  )
}
