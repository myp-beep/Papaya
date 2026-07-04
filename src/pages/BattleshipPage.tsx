import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'
import { sfx } from '../lib/sound'
import { recordGame } from '../data/statsStore'
import {
  N, COLS, FLEET, type ShipDef, type Ship, type BoardState,
  type Orient, type GameStats,
  rc, idx, shipCells, conflicts, randomFleet, shipAt, allSunk,
  salvoCount, updateStats, getBotTarget, getBotSalvoTargets,
  getBotHuntQueues, applyFire,
} from '../lib/battleshipGame'

type Phase = 'place' | 'battle' | 'over'
type Turn = 'player' | 'enemy'
type BotDiff = 'kolay' | 'normal' | 'zor'
const BOT_DIFF_KEY = 'papaya.bship.diff.v1'

export default function BattleshipPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('place')
  const [turn, setTurn] = useState<Turn>('player')
  const [message, setMessage] = useState('Donanmanı yerleştir, sonra ateşe başla!')
  const [botDiff, setBotDiff] = useState<BotDiff>(() => (localStorage.getItem(BOT_DIFF_KEY) as BotDiff) || 'normal')

  const [placing, setPlacing] = useState<Ship[]>([])
  const [orient, setOrient] = useState<Orient>('h')
  const [hoverCells, setHoverCells] = useState<number[]>([])
  const [hoverInvalid, setHoverInvalid] = useState(false)
  const [selectedShipIdx, setSelectedShipIdx] = useState<number | null>(null)
  const nextDef = selectedShipIdx !== null ? FLEET[selectedShipIdx] : FLEET[placing.length]

  const [enemy, setEnemy] = useState<BoardState>({ ships: [], shots: {} })
  const [player, setPlayer] = useState<BoardState>({ ships: [], shots: {} })
  const [lastSplash, setLastSplash] = useState<number | null>(null)
  const [sinkCell, setSinkCell] = useState<number | null>(null)
  const [stats, setStats] = useState<GameStats>({ total: 0, hits: 0, misses: 0 })

  const [salvoMode, setSalvoMode] = useState(false)
  const [pendingShots, setPendingShots] = useState<number[]>([])

  const botQueue = useRef<number[]>([])
  const botSalvoQueues = useRef<number[][]>([])
  const timers = useRef<number[]>([])
  const wonRef = useRef(false)

  useEffect(() => { localStorage.setItem(BOT_DIFF_KEY, botDiff) }, [botDiff])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const laterCall = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms)
    timers.current.push(t)
  }

  // ——— Yerleştirme ———
  const tryPlace = (start: number) => {
    if (!nextDef) return
    if (selectedShipIdx !== null && selectedShipIdx < placing.length) {
      setPlacing((prev) => prev.filter((_, i) => i !== selectedShipIdx))
      setSelectedShipIdx(null)
    }
    const cells = shipCells(start, nextDef.size, orient)
    if (!cells || conflicts(cells, placing)) {
      haptic('warning')
      setMessage(`Buraya sığmıyor — başka bir yer dene.`)
      return
    }
    haptic('light')
    sfx.tap()
    setPlacing((p) => [...p, { ...nextDef, cells, hits: 0 }])
    setSelectedShipIdx(null)
  }

  const removeShip = (idx: number) => {
    haptic('light')
    setPlacing((p) => p.filter((_, i) => i !== idx))
    setSelectedShipIdx(null)
  }

  const selectShip = (idx: number) => {
    if (idx >= placing.length) return
    setSelectedShipIdx(idx)
    setMessage(`${placing[idx].emoji} ${placing[idx].name} seçildi. Taşımak için ızgaraya dokun.`)
  }

  const autoPlace = () => {
    haptic('light')
    sfx.flip()
    setPlacing(randomFleet())
    setSelectedShipIdx(null)
    setMessage('Donanma otomatik dizildi. Savaşa hazır mısın?')
  }

  const clearPlacement = () => {
    setPlacing([])
    setHoverCells([])
    setSelectedShipIdx(null)
    setMessage('Donanmanı yerleştir, sonra ateşe başla!')
  }

  const startBattle = () => {
    if (placing.length < FLEET.length) return
    haptic('success')
    sfx.win()
    setPlayer({ ships: placing, shots: {} })
    setEnemy({ ships: randomFleet(), shots: {} })
    botQueue.current = []
    botSalvoQueues.current = getBotHuntQueues()
    wonRef.current = false
    setPhase('battle')
    setTurn('player')
    setPendingShots([])
    setStats({ total: 0, hits: 0, misses: 0 })
    setMessage(salvoMode ? 'Ateş serbest! Her turda kalan gemi sayısı kadar atış yaparsın 🎯' : 'Ateş serbest! Düşman sularına ateş et 🎯')
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

  // ——— Savaş: ateş ———
  const fire = useCallback(
    (targets: number[]) => {
      setEnemy((prev) => {
        const { board, results } = applyFire(prev, targets)
        let newStats = { ...stats }
        let newPhase = phase
        let newTurn: Turn = turn
        let newMsg = message
        let newSinkCell: number | null = null

        for (const r of results) {
          newStats = updateStats(newStats, r.kind)
          if (r.kind === 'hit') {
            if (r.sunk) {
              newSinkCell = r.i
              sfx.fail()
              haptic('heavy')
              const s = board.ships.find((s) => s.key === r.shipKey)
              newMsg = `${s?.emoji} Düşman ${s?.name} battı!`
            } else {
              sfx.match()
              haptic('medium')
              newMsg = '🎯 İsabet!'
            }
            setLastSplash(r.i)
          } else {
            sfx.tap()
            haptic('light')
            newMsg = '💦 Iska.'
            setLastSplash(r.i)
          }
        }

        if (allSunk(board) && !wonRef.current) {
          wonRef.current = true
          const lostShips = player.ships.filter((s) => s.hits >= s.size).length
          const ids = ['admiral', ...(lostShips === 0 ? ['flawless-fleet'] : [])]
          recordGame({ won: true, xp: 80, achievementIds: ids })
          laterCall(() => {
            setPhase('over')
            setMessage('🏆 Zafer! Düşman donanması yok edildi.')
          }, 500)
          newPhase = 'over'
        } else if (!salvoMode) {
          newTurn = 'enemy'
          laterCall(enemyFire, 650)
        } else {
          const pShots = salvoCount(player.ships)
          const remaining = pShots - targets.length
          if (remaining > 0) {
            newMsg = `🎯 ${remaining} atışın kaldı.`
            newTurn = 'player'
          } else {
            newTurn = 'enemy'
            laterCall(enemyFire, 650)
          }
        }

        setStats(newStats)
        if (newPhase !== phase) setPhase(newPhase)
        setTurn(newTurn)
        setMessage(newMsg)
        setSinkCell(newSinkCell)
        return board
      })
    },
    [phase, turn, stats, player.ships, message],
  )

  const playerFire = useCallback(
    (i: number) => {
      if (phase !== 'battle' || turn !== 'player') return
      if (salvoMode) {
        setEnemy((prev) => {
          if (prev.shots[i] !== undefined || pendingShots.includes(i)) return prev
          const newPending = [...pendingShots, i]
          setPendingShots(newPending)
          const shotsPerRound = salvoCount(player.ships)
          if (newPending.length >= shotsPerRound) {
            setPendingShots([])
            laterCall(() => fire(newPending), 100)
          } else {
            setMessage(`🎯 ${newPending.length}/${shotsPerRound} atış yapıldı.`)
          }
          return prev
        })
      } else {
        fire([i])
      }
    },
    [phase, turn, salvoMode, pendingShots, player.ships, fire],
  )

  const randomEnemyFire = useCallback((): number[] => {
    const playerBoard = playerRef.current
    if (!playerBoard) return [-1]
    const empty: number[] = []
    for (let i = 0; i < N * N; i++) {
      if (!playerBoard.shots[i]) empty.push(i)
    }
    if (empty.length === 0) return [-1]
    const shotsCount = salvoMode ? salvoCount(playerBoard.ships) : 1
    const targets: number[] = []
    for (let i = 0; i < shotsCount && empty.length > 0; i++) {
      const idx2 = Math.floor(Math.random() * empty.length)
      targets.push(empty[idx2])
      empty.splice(idx2, 1)
    }
    return targets
  }, [])

  const playerRef = useRef<BoardState | null>(null)

  // ——— Bot ateşi ———
  const enemyFire = useCallback(() => {
    setPlayer((prev) => {
      if (wonRef.current) return prev
      playerRef.current = prev
      const targets = botDiff === 'kolay'
        ? randomEnemyFire()
        : salvoMode
          ? getBotSalvoTargets(prev, botSalvoQueues.current)
          : [getBotTarget(prev, botQueue.current)]
      const validTargets = targets.filter((t) => t >= 0 && prev.shots[t] === undefined)
      if (validTargets.length === 0) {
        setTurn('player')
        return prev
      }
      const { board: nextBoard, results } = applyFire(prev, validTargets)
      let newMsg = ''
      let allMiss = true
      for (const r of results) {
        if (r.kind === 'hit') {
          allMiss = false
          haptic('medium')
          const s = nextBoard.ships.find((s) => s.key === r.shipKey)
          if (r.sunk) {
            botQueue.current = []
            if (salvoMode) botSalvoQueues.current = getBotHuntQueues()
            newMsg = `${s?.emoji} ${s?.name} gemin battı!`
            sfx.fail()
          } else {
            newMsg = '🔥 Düşman gemine isabet ettirdi!'
            if (salvoMode) {
              botSalvoQueues.current[0] = [...(botSalvoQueues.current[0] ?? []), ...getAdjacent(r.i)]
            } else {
              const adj = getAdjacent(r.i)
              for (const a of adj) {
                if (nextBoard.shots[a] === undefined) botQueue.current.push(a)
              }
            }
          }
        }
      }
      if (allMiss) newMsg = 'Düşman ıskaladı — sıra sende 🎯'

      if (allSunk(nextBoard) && !wonRef.current) {
        wonRef.current = true
        recordGame({ won: false, xp: 15 })
        laterCall(() => {
          setPhase('over')
          setMessage('💥 Yenildin — tüm donanman battı.')
        }, 500)
        return nextBoard
      }

      setMessage(newMsg)
      if (salvoMode) {
        const botShipsLeft = salvoCount(nextBoard.ships)
        if (botShipsLeft > 0) {
          laterCall(enemyFire, 800)
          return nextBoard
        }
      }
      if (allMiss || !salvoMode) {
        setTurn('player')
      } else {
        laterCall(enemyFire, 650)
      }
      return nextBoard
    })
  }, [salvoMode, botDiff, randomEnemyFire])

  function getAdjacent(i: number): number[] {
    const [r, c] = rc(i)
    const nb: number[] = []
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) nb.push(idx(rr, cc))
    }
    return nb
  }

  const newGame = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    botQueue.current = []
    botSalvoQueues.current = []
    wonRef.current = false
    setPlacing([])
    setHoverCells([])
    setEnemy({ ships: [], shots: {} })
    setPlayer({ ships: [], shots: {} })
    setTurn('player')
    setPhase('place')
    setPendingShots([])
    setStats({ total: 0, hits: 0, misses: 0 })
    setMessage('Donanmanı yerleştir, sonra ateşe başla!')
  }

  const playerWon = phase === 'over' && allSunk(enemy)
  const enemyLeft = enemy.ships.filter((s) => s.hits < s.size).length
  const playerLeft = player.ships.filter((s) => s.hits < s.size).length
  const accuracy = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0

  return (
    <div className="ocean relative flex flex-1 flex-col overflow-y-auto">
      <Confetti show={playerWon} />
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-[#05192b] to-transparent px-4 pb-3 pt-5">
        <button
          onClick={() => navigate('/games')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-white/10"
          aria-label="Geri"
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <span className="text-sky-300">⚓</span> Amiral Battı
          </h1>
          <p className="text-xs text-sky-200/60">Donanma savaşı · akıllı bota karşı</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-sky-400/20 bg-sky-950/40 p-0.5">
          {(['kolay', 'normal', 'zor'] as BotDiff[]).map((d) => (
            <button
              key={d}
              onClick={() => setBotDiff(d)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                botDiff === d ? 'bg-sky-500/30 text-sky-200' : 'text-sky-300/50 hover:text-sky-200/80'
              }`}
            >
              {d === 'kolay' ? '🟢' : d === 'normal' ? '🟡' : '🔴'} {d.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={newGame} className="btn-ghost border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm">
          ↻ Yeni
        </button>
      </header>

      <div className="mx-4 mb-2 flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-950/40 px-4 py-2.5 backdrop-blur-md">
        <span className="text-lg">
          {phase === 'over' ? (playerWon ? '🏆' : '💥') : turn === 'player' ? '🎯' : '🤖'}
        </span>
        <span className="text-sm font-semibold text-sky-100">{message}</span>
      </div>

      {phase === 'place' ? (
        <PlacementView
          placing={placing}
          nextDef={nextDef}
          orient={orient}
          previewCells={hoverCells}
          previewInvalid={hoverInvalid}
          selectedIdx={selectedShipIdx}
          onOrient={() => setOrient((o) => (o === 'h' ? 'v' : 'h'))}
          onHover={setHover}
          onLeave={() => setHoverCells([])}
          onPlace={tryPlace}
          onAuto={autoPlace}
          onClear={clearPlacement}
          onStart={startBattle}
          onRemoveShip={removeShip}
          onSelectShip={selectShip}
          salvoMode={salvoMode}
          onSalvoToggle={() => setSalvoMode((s) => !s)}
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-6">
          {stats.total > 0 && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-sky-400/15 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-200/70">
              <span>🎯 {stats.hits} isabet</span>
              <span>💦 {stats.misses} ıska</span>
              <span>📊 %{accuracy} doğruluk</span>
            </div>
          )}
          {salvoMode && phase === 'battle' && turn === 'player' && (
            <div className="text-center text-xs text-sky-200/50">
              Kalan atış: {salvoCount(player.ships) - pendingShots.length} / {salvoCount(player.ships)}
            </div>
          )}
          <section>
            <GridHeader
              title="Düşman Suları"
              tone="text-rose-300"
              left={enemyLeft}
              total={FLEET.length}
              ships={enemy.ships}
              hideShips
            />
            <div className="radar-sweep relative overflow-hidden rounded-2xl border border-rose-400/25 bg-[#04101c]/70 p-2 shadow-card">
              <Grid
                board={enemy}
                revealShips={false}
                interactive={phase === 'battle' && turn === 'player'}
                onCell={playerFire}
                splash={lastSplash}
                sinkCell={sinkCell}
                pendingSet={salvoMode && turn === 'player' ? pendingShots : undefined}
              />
            </div>
          </section>

          <section>
            <GridHeader
              title="Senin Donanman"
              tone="text-sky-300"
              left={playerLeft}
              total={FLEET.length}
              ships={player.ships}
            />
            <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#04101c]/70 p-2 shadow-card">
              <Grid board={player} revealShips interactive={false} />
            </div>
          </section>
        </div>
      )}

      {phase === 'over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030f1d]/80 px-6 backdrop-blur-sm animate-pop-in">
          <div className="glass w-full max-w-xs rounded-3xl border-sky-400/25 p-6 text-center">
            <div className="text-6xl">{playerWon ? '🏆' : '💥'}</div>
            <h2 className="mt-2 text-2xl font-extrabold text-white">
              {playerWon ? 'Zafer!' : 'Yenildin'}
            </h2>
            <p className="mt-1 text-sm text-sky-200/70">
              {playerWon ? 'Düşman donanması dibi boyladı.' : 'Donanman battı — tekrar dene.'}
            </p>
            <div className="mt-3 text-xs text-sky-200/50">
              {stats.total} atış · %{accuracy} isabet
            </div>
            <button onClick={newGame} className="btn-primary mt-5 w-full px-6 py-3">
              Yeni savaş
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ——— Yerleştirme görünümü ———
function PlacementView({
  placing, nextDef, orient, previewCells, previewInvalid, selectedIdx,
  onOrient, onHover, onLeave, onPlace, onAuto, onClear, onStart,
  onRemoveShip, onSelectShip, salvoMode, onSalvoToggle,
}: {
  placing: Ship[]
  nextDef: ShipDef | undefined
  orient: Orient
  previewCells: number[]
  previewInvalid: boolean
  selectedIdx: number | null
  onOrient: () => void
  onHover: (start: number) => void
  onLeave: () => void
  onPlace: (start: number) => void
  onAuto: () => void
  onClear: () => void
  onStart: () => void
  onRemoveShip: (idx: number) => void
  onSelectShip: (idx: number) => void
  salvoMode: boolean
  onSalvoToggle: () => void
}) {
  const board: BoardState = { ships: placing, shots: {} }
  const done = placing.length >= FLEET.length
  const previewSet = new Set(previewCells)

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      <div className="flex flex-wrap gap-1.5">
        {FLEET.map((def, i) => {
          const isPlaced = i < placing.length
          const isSelected = i === selectedIdx
          const isNext = i === placing.length && selectedIdx === null
          return (
            <button
              key={def.key}
              onClick={() => isPlaced ? onSelectShip(i) : undefined}
              onContextMenu={(e) => { if (isPlaced) { e.preventDefault(); onRemoveShip(i) } }}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                isSelected
                  ? 'border-amber-300/60 bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/40'
                  : isPlaced
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
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={onOrient} className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm" disabled={done}>
          {orient === 'h' ? '↔ Yatay' : '↕ Dikey'}
        </button>
        <button onClick={onAuto} className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm">
          🔀 Otomatik
        </button>
        <button onClick={onClear} className="btn-ghost flex-1 py-2 text-sm">
          ✕ Temizle
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="text-[11px] text-sky-200/50">Salvo modu</span>
        <button
          onClick={onSalvoToggle}
          className={`relative h-5 w-9 rounded-full transition ${salvoMode ? 'bg-sky-500' : 'bg-white/20'}`}
        >
          <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition ${salvoMode ? 'translate-x-4' : ''}`} />
        </button>
        <span className="text-[10px] text-sky-200/40">(her turda kalan gemi 🚢 kadar atış)</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#04101c]/70 p-2 shadow-card">
        <Grid
          board={board}
          revealShips
          interactive={!done}
          previewSet={previewSet}
          previewInvalid={previewInvalid}
          onCell={onPlace}
          onCellHover={onHover}
          onLeave={onLeave}
        />
      </div>

      <button onClick={onStart} disabled={!done} className="btn-primary w-full py-3.5 text-base">
        {done ? '⚔️ Savaşa Başla' : `${nextDef?.name} yerleştir (${placing.length}/${FLEET.length})`}
      </button>
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
  previewSet, previewInvalid, splash, sinkCell, pendingSet,
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
  pendingSet?: number[]
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
            const isPending = pendingSet?.includes(i)

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
            } else if (isPending) {
              cls += 'bg-amber-400/30 ring-1 ring-amber-300/50 '
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
