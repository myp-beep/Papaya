import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useChat } from '../data/chatStore'
import { haptic } from '../lib/haptics'
import { sfx } from '../lib/sound'
import { recordGame } from '../data/statsStore'
import type { Peer } from '../types'
import {
  N, COLS, FLEET, type Ship, type BoardState,
  type Orient, type ShotKind,
  idx, shipCells, conflicts, randomFleet, shipAt, allSunk,
} from '../lib/battleshipGame'

interface GameNavState {
  gameId: string
  peer: Peer
  role: 'host' | 'guest'
}

type Phase = 'place' | 'ready' | 'battle' | 'over'

export default function OnlineBattleshipPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { sendEvent, onEvent } = useChat()
  const state = location.state as GameNavState | null

  const role = state?.role
  const peer = state?.peer
  const [phase, setPhase] = useState<Phase>('place')
  const [turn, setTurn] = useState<'host' | 'guest'>('host')
  const [message, setMessage] = useState('Gemilerini yerleştir ve hazır olduğunda "Hazır" de.')

  const [myShips, setMyShips] = useState<Ship[]>([])
  const [opponentShips, setOpponentShips] = useState<Ship[]>([])
  const [myShots, setMyShots] = useState<Record<number, ShotKind>>({})
  const [opponentShots, setOpponentShots] = useState<Record<number, ShotKind>>({})

  const [placing, setPlacing] = useState<Ship[]>([])
  const [orient, setOrient] = useState<Orient>('h')
  const [hoverCells, setHoverCells] = useState<number[]>([])
  const [hoverInvalid, setHoverInvalid] = useState(false)

  const [lastSplash, setLastSplash] = useState<number | null>(null)
  const [sinkCell, setSinkCell] = useState<number | null>(null)
  const [, setOpponentReady] = useState(false)
  const [opponentPlaceConfirmed, setOpponentPlaceConfirmed] = useState(false)

  const nextDef = FLEET[placing.length]
  const done = placing.length >= FLEET.length

  const myBoard: BoardState = { ships: myShips, shots: opponentShots }
  const opponentBoard: BoardState = { ships: opponentShips, shots: myShots }

  const isHost = role === 'host'
  const myTurn = phase === 'battle' && ((isHost && turn === 'host') || (!isHost && turn === 'guest'))
  const playerWon = phase === 'over' && allSunk(opponentBoard)
  const opponentWon = phase === 'over' && allSunk(myBoard)

  // opponent event listeners
  useEffect(() => {
    if (!peer) return

    const offReady = onEvent('game:place', (p) => {
      if (p.gameId !== gameId) return
      setOpponentShips(p.ships as Ship[])
      setOpponentPlaceConfirmed(true)
      if (done) startBattleBoth(p.ships as Ship[])
    })

    const offMove = onEvent('game:move', (p) => {
      if (p.gameId !== gameId) return
      const target = p.target as number
      setOpponentShots((prev) => {
        if (prev[target]) return prev
        const ship = shipAt(myBoard, target)
        const kind: ShotKind = ship ? 'hit' : 'miss'
        if (ship) {
          haptic('medium')
          sfx.fail()
          const updated = { ...ship, hits: ship.hits + 1 }
          setMyShips((prevS) => prevS.map((s) => s.key === ship.key ? { ...s, hits: s.hits + 1 } : s))
          if (updated.hits >= updated.size) {
            setMessage(`${ship.emoji} ${ship.name} gemin battı!`)
          } else {
            setMessage('🔥 Düşman gemine isabet ettirdi!')
          }
        } else {
          haptic('light')
          sfx.tap()
          setMessage('Düşman ıskaladı — sıra sende 🎯')
        }
        return { ...prev, [target]: kind }
      })
      setTurn((t) => t === 'host' ? 'guest' : 'host')
      setLastSplash(target)
    })

    const offReset = onEvent('game:reset', (p) => {
      if (p.gameId !== gameId) return
      resetGame()
    })

    return () => {
      offReady()
      offMove()
      offReset()
    }
  }, [gameId, peer, onEvent, done, myShips])

  // when opponent becomes ready after we already placed
  useEffect(() => {
    if (opponentPlaceConfirmed && done && phase === 'place') {
      startBattleBoth(opponentShips)
    }
  }, [opponentPlaceConfirmed, done, phase])

  const startBattleBoth = (oppShips: Ship[]) => {
    setMyShips([...placing])
    setOpponentShips(oppShips)
    setPhase('battle')
    setTurn('host')
    setMessage('Savaş başladı! Senin sıran 🎯')
    haptic('success')
    sfx.win()
  }

  const confirmPlacement = () => {
    if (!done) return
    haptic('success')
    sfx.tap()
    sendEvent('game:place', { to: peer!.id, gameId, ships: placing })
    if (opponentPlaceConfirmed) {
      startBattleBoth(opponentShips)
    } else {
      setPhase('ready')
      setMessage('Rakibin yerleştirmesi bekleniyor…')
    }
  }

  const fire = useCallback(
    (i: number) => {
      if (!peer || !myTurn || phase !== 'battle') return
      setMyShots((prev) => {
        if (prev[i]) return prev
        const ship = shipAt(opponentBoard, i)
        const kind: ShotKind = ship ? 'hit' : 'miss'
        sfx.tap()
        if (ship) {
          sfx.match()
          haptic('medium')
          const updated = { ...ship, hits: ship.hits + 1 }
          setOpponentShips((prevS) => prevS.map((s) => s.key === ship.key ? { ...s, hits: s.hits + 1 } : s))
          if (updated.hits >= updated.size) {
            setSinkCell(i)
            sfx.fail()
            haptic('heavy')
            setMessage(`${ship.emoji} Düşman ${ship.name} battı!`)
          } else {
            setMessage('🎯 İsabet! Tekrar ateş et.')
          }
          setLastSplash(i)
        } else {
          haptic('light')
          setMessage('💦 Iska. Sıra rakipte.')
          setLastSplash(i)
          setTurn((t) => t === 'host' ? 'guest' : 'host')
        }
        sendEvent('game:move', { to: peer.id, gameId, target: i })
        const next = { ...prev, [i]: kind }
        const newBoard = { ships: opponentShips, shots: next }
        if (allSunk(newBoard)) {
          recordGame({ won: true, xp: 100 })
          setPhase('over')
          setMessage('🏆 Zafer! Düşman donanması yok edildi.')
        }
        return next
      })
    },
    [peer, myTurn, phase, opponentBoard, opponentShips, gameId, sendEvent],
  )

  const rematch = useCallback(() => {
    if (peer) sendEvent('game:reset', { to: peer.id, gameId })
    resetGame()
  }, [peer, gameId, sendEvent])

  function resetGame() {
    setPhase('place')
    setTurn('host')
    setMyShips([])
    setOpponentShips([])
    setMyShots({})
    setOpponentShots({})
    setPlacing([])
    setHoverCells([])
    setOpponentReady(false)
    setOpponentPlaceConfirmed(false)
    setMessage('Gemilerini yerleştir ve hazır olduğunda "Hazır" de.')
  }

  const setHover = (start: number) => {
    if (!nextDef) return setHoverCells([])
    const cells = shipCells(start, nextDef.size, orient)
    if (cells && !conflicts(cells, placing)) {
      setHoverCells(cells)
      setHoverInvalid(false)
    } else {
      setHoverCells(cells ?? [])
      setHoverInvalid(true)
    }
  }

  const tryPlace = (start: number) => {
    if (!nextDef) return
    const cells = shipCells(start, nextDef.size, orient)
    if (!cells || conflicts(cells, placing)) {
      haptic('warning')
      setMessage('Buraya sığmıyor — başka bir yer dene.')
      return
    }
    haptic('light')
    sfx.tap()
    setPlacing((p) => [...p, { ...nextDef, cells, hits: 0 }])
  }

  const clearPlacement = () => {
    setPlacing([])
    setHoverCells([])
    setMessage('Gemilerini yeniden yerleştir.')
  }

  const enemyLeft = opponentShips.filter((s) => s.hits < s.size).length
  const playerLeft = myShips.filter((s) => s.hits < s.size).length

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
    <div className="ocean flex h-full flex-col overflow-y-auto">
      <header className="flex items-center gap-3 border-b border-ink-700/50 bg-ink-800/60 px-3 py-2.5">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <Avatar emoji={peer.avatar} color={peer.color} size={40} online />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">⚓ Amiral Battı · {peer.name}</div>
          <div className="text-xs text-sky-400">Canlı çok oyunculu</div>
        </div>
      </header>

      <div className="mx-3 mb-2 mt-2 flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-950/40 px-4 py-2 backdrop-blur-md">
        <span className="text-lg">
          {phase === 'over' ? (playerWon ? '🏆' : '💥') : phase === 'ready' ? '⏳' : myTurn ? '🎯' : '🤖'}
        </span>
        <span className="text-sm font-semibold text-sky-100">{message}</span>
      </div>

      {phase === 'place' || phase === 'ready' ? (
        <div className="flex flex-col gap-3 px-4 pb-6">
          <div className="flex flex-wrap gap-1.5">
            {FLEET.map((def, i) => {
              const isPlaced = i < placing.length
              const isNext = i === placing.length
              return (
                <div
                  key={def.key}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    isPlaced
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : isNext
                        ? 'border-sky-300/60 bg-sky-500/20 text-sky-100 shadow-glow'
                        : 'border-white/10 bg-white/5 text-white/50'
                  }`}
                >
                  <span>{def.emoji}</span>
                  <span>{def.name}</span>
                  <span className="opacity-50">{'▪'.repeat(def.size)}</span>
                  {isPlaced && <span className="text-emerald-300">✓</span>}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setOrient((o) => (o === 'h' ? 'v' : 'h'))} className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm" disabled={done}>
              {orient === 'h' ? '↔ Yatay' : '↕ Dikey'}
            </button>
            <button onClick={() => { setPlacing(randomFleet()); sfx.flip() }} className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm">
              🔀 Otomatik
            </button>
            <button onClick={clearPlacement} className="btn-ghost flex-1 py-2 text-sm">
              ✕ Temizle
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#04101c]/70 p-2 shadow-card">
            <Grid
              board={{ ships: placing, shots: {} }}
              revealShips
              interactive={!done}
              previewSet={new Set(hoverCells)}
              previewInvalid={hoverInvalid}
              onCell={tryPlace}
              onCellHover={setHover}
              onLeave={() => setHoverCells([])}
            />
          </div>

          {phase === 'ready' ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <span className="animate-pulse">⏳</span>
              Rakibin yerleştirmesi bekleniyor...
            </div>
          ) : (
            <button onClick={confirmPlacement} disabled={!done} className="btn-primary w-full py-3.5 text-base">
              {done ? '⚔️ Hazır — Savaşa Başla' : `${nextDef?.name} yerleştir (${placing.length}/${FLEET.length})`}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-6">
          <section>
            <GridHeader
              title={`${peer.name} Suları`}
              tone="text-rose-300"
              left={enemyLeft}
              total={FLEET.length}
              ships={opponentShips}
              hideShips
            />
            <div className="radar-sweep relative overflow-hidden rounded-2xl border border-rose-400/25 bg-[#04101c]/70 p-2 shadow-card">
              <Grid
                board={opponentBoard}
                revealShips={false}
                interactive={myTurn}
                onCell={fire}
                splash={lastSplash}
                sinkCell={sinkCell}
              />
            </div>
          </section>

          <section>
            <GridHeader
              title="Senin Donanman"
              tone="text-sky-300"
              left={playerLeft}
              total={FLEET.length}
              ships={myShips}
            />
            <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#04101c]/70 p-2 shadow-card">
              <Grid board={myBoard} revealShips interactive={false} />
            </div>
          </section>
        </div>
      )}

      {(playerWon || opponentWon) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030f1d]/80 px-6 backdrop-blur-sm animate-pop-in">
          <div className="glass w-full max-w-xs rounded-3xl border-sky-400/25 p-6 text-center">
            <div className="text-6xl">{playerWon ? '🏆' : '💥'}</div>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              {playerWon ? 'Zafer!' : `${peer.name} kazandı`}
            </h2>
            <p className="mt-1 text-sm text-sky-200/70">
              {playerWon ? 'Düşman donanması dibi boyladı.' : 'Donanman battı — rövanş iste.'}
            </p>
            <button onClick={rematch} className="btn-primary mt-5 w-full px-6 py-3">
              Rövanş
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ——— Izgara başlığı ———
function GridHeader({
  title, tone, left, total, ships, hideShips,
}: {
  title: string
  tone: string
  left: number
  total: number
  ships: Ship[]
  hideShips?: boolean
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-1">
      <h3 className={`text-sm font-bold uppercase tracking-wide ${tone}`}>{title}</h3>
      <div className="flex items-center gap-1.5">
        {!hideShips &&
          ships.map((s) => (
            <span
              key={s.key}
              className={`text-sm transition ${s.hits >= s.size ? 'opacity-25 grayscale' : ''}`}
              title={s.name}
            >
              {s.emoji}
            </span>
          ))}
        <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
          {left}/{total}
        </span>
      </div>
    </div>
  )
}

// ——— Izgara ———
function Grid({
  board, revealShips, interactive, onCell, onCellHover, onLeave,
  previewSet, previewInvalid, splash, sinkCell,
}: {
  board: BoardState
  revealShips: boolean
  interactive: boolean
  onCell?: (i: number) => void
  onCellHover?: (i: number) => void
  onLeave?: () => void
  previewSet?: Set<number>
  previewInvalid?: boolean
  splash?: number | null
  sinkCell?: number | null
}) {
  return (
    <div className="select-none">
      <div className="mb-1 grid grid-cols-[1.1rem_repeat(10,1fr)] gap-[3px]">
        <span />
        {COLS.map((c) => (
          <span key={c} className="text-center text-[9px] font-bold text-white/35">
            {c}
          </span>
        ))}
      </div>
      {Array.from({ length: N }).map((_, r) => (
        <div key={r} className="mb-[3px] grid grid-cols-[1.1rem_repeat(10,1fr)] gap-[3px]">
          <span className="flex items-center justify-center text-[9px] font-bold text-white/35">
            {r + 1}
          </span>
          {Array.from({ length: N }).map((_, c) => {
            const i = idx(r, c)
            const shot = board.shots[i]
            const ship = shipAt(board, i)
            const isShip = !!ship && revealShips
            const isSunkShip = !!ship && ship.hits >= ship.size
            const preview = previewSet?.has(i)

            let cls =
              'relative flex aspect-square items-center justify-center rounded-[5px] text-[11px] transition-all duration-150 '
            let content: string = ''

            if (shot === 'hit') {
              cls += isSunkShip
                ? 'bg-rose-800/80 ring-1 ring-rose-400/60 '
                : 'bg-rose-500/40 ring-1 ring-rose-300/60 '
              content = isSunkShip ? '☠️' : '💥'
            } else if (shot === 'miss') {
              cls += 'bg-sky-400/10 '
              content = '•'
            } else if (preview) {
              cls += previewInvalid
                ? 'bg-rose-500/30 ring-1 ring-rose-400/60 '
                : 'bg-emerald-400/40 ring-1 ring-emerald-300/70 '
            } else if (isShip) {
              cls += 'bg-gradient-to-br from-slate-400/70 to-slate-600/70 ring-1 ring-white/20 '
            } else {
              cls += 'bg-sky-400/[0.07] '
              if (interactive) cls += 'hover:bg-sky-300/25 hover:ring-1 hover:ring-sky-200/50 cursor-crosshair '
            }

            if (i === sinkCell && isSunkShip) cls += 'animate-sink '

            return (
              <button
                key={i}
                disabled={!interactive || shot !== undefined}
                onClick={() => onCell?.(i)}
                onMouseEnter={() => onCellHover?.(i)}
                onMouseLeave={() => onLeave?.()}
                className={cls}
              >
                {content === '•' ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-200/50" />
                ) : (
                  content
                )}
                {splash === i && shot && (
                  <span
                    className={`splash-ring pointer-events-none absolute inset-0 rounded-full ${
                      shot === 'hit' ? 'bg-rose-400/40' : 'bg-sky-300/40'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
