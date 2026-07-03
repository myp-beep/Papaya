import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { haptic } from '../lib/haptics'
import { sfx } from '../lib/sound'
import { recordGame } from '../data/statsStore'

// ——— Amiral Battı (Battleship) — okyanus & radar temalı, akıllı bota karşı ———

const N = 10 // 10x10 ızgara
const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

type Orient = 'h' | 'v'
type ShotKind = 'hit' | 'miss'

interface ShipDef {
  key: string
  name: string
  size: number
  emoji: string
}

const FLEET: ShipDef[] = [
  { key: 'carrier', name: 'Uçak Gemisi', size: 5, emoji: '🛳️' },
  { key: 'battleship', name: 'Zırhlı', size: 4, emoji: '🚢' },
  { key: 'cruiser', name: 'Kruvazör', size: 3, emoji: '🛥️' },
  { key: 'submarine', name: 'Denizaltı', size: 3, emoji: '🤿' },
  { key: 'destroyer', name: 'Muhrip', size: 2, emoji: '⛴️' },
]

interface Ship {
  key: string
  name: string
  size: number
  emoji: string
  cells: number[]
  hits: number
}

interface BoardState {
  ships: Ship[]
  shots: Record<number, ShotKind> // atılan hücreler
}

const rc = (i: number): [number, number] => [Math.floor(i / N), i % N]
const idx = (r: number, c: number) => r * N + c

/** Verilen başlangıç + yön için gemi hücrelerini döndür (sınır dışıysa null). */
function shipCells(start: number, size: number, orient: Orient): number[] | null {
  const [r, c] = rc(start)
  const cells: number[] = []
  for (let k = 0; k < size; k++) {
    const rr = orient === 'v' ? r + k : r
    const cc = orient === 'h' ? c + k : c
    if (rr >= N || cc >= N) return null
    cells.push(idx(rr, cc))
  }
  return cells
}

/** Hücreler mevcut donanmayla (komşuluk dahil) çakışıyor mu? */
function conflicts(cells: number[], ships: Ship[]): boolean {
  const taken = new Set<number>()
  for (const s of ships) {
    for (const cell of s.cells) {
      const [r, c] = rc(cell)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr
          const cc = c + dc
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) taken.add(idx(rr, cc))
        }
    }
  }
  return cells.some((c) => taken.has(c))
}

/** Tüm donanmayı rastgele, çakışmadan yerleştir. */
function randomFleet(): Ship[] {
  const ships: Ship[] = []
  for (const def of FLEET) {
    let placed = false
    let guard = 0
    while (!placed && guard++ < 500) {
      const orient: Orient = Math.random() < 0.5 ? 'h' : 'v'
      const start = Math.floor(Math.random() * N * N)
      const cells = shipCells(start, def.size, orient)
      if (cells && !conflicts(cells, ships)) {
        ships.push({ ...def, cells, hits: 0 })
        placed = true
      }
    }
  }
  return ships
}

function shipAt(board: BoardState, i: number): Ship | undefined {
  return board.ships.find((s) => s.cells.includes(i))
}

const allSunk = (b: BoardState) => b.ships.every((s) => s.hits >= s.size)

type Phase = 'place' | 'battle' | 'over'
type Turn = 'player' | 'enemy'

export default function BattleshipPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('place')
  const [turn, setTurn] = useState<Turn>('player')
  const [message, setMessage] = useState('Donanmanı yerleştir, sonra ateşe başla!')

  // Yerleştirme durumu
  const [placing, setPlacing] = useState<Ship[]>([])
  const [orient, setOrient] = useState<Orient>('h')
  const [hoverCells, setHoverCells] = useState<number[]>([])
  const nextDef = FLEET[placing.length] // yerleştirilecek sıradaki gemi

  // Savaş durumu
  const [enemy, setEnemy] = useState<BoardState>({ ships: [], shots: {} })
  const [player, setPlayer] = useState<BoardState>({ ships: [], shots: {} })
  const [lastSplash, setLastSplash] = useState<number | null>(null)
  const [sinkCell, setSinkCell] = useState<number | null>(null)

  // Bot avlanma hafızası
  const botQueue = useRef<number[]>([])
  const timers = useRef<number[]>([])
  const wonRef = useRef(false)

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

  const autoPlace = () => {
    haptic('light')
    sfx.flip()
    setPlacing(randomFleet())
    setMessage('Donanma otomatik dizildi. Savaşa hazır mısın?')
  }

  const clearPlacement = () => {
    setPlacing([])
    setHoverCells([])
    setMessage('Donanmanı yerleştir, sonra ateşe başla!')
  }

  const startBattle = () => {
    if (placing.length < FLEET.length) return
    haptic('success')
    sfx.win()
    setPlayer({ ships: placing, shots: {} })
    setEnemy({ ships: randomFleet(), shots: {} })
    botQueue.current = []
    wonRef.current = false
    setPhase('battle')
    setTurn('player')
    setMessage('Ateş serbest! Düşman sularına ateş et 🎯')
  }

  const setHover = (start: number) => {
    if (!nextDef) return setHoverCells([])
    const cells = shipCells(start, nextDef.size, orient)
    setHoverCells(cells && !conflicts(cells, placing) ? cells : [])
  }

  // ——— Savaş: oyuncu ateşi ———
  const playerFire = useCallback(
    (i: number) => {
      if (phase !== 'battle' || turn !== 'player') return
      setEnemy((prev) => {
        if (prev.shots[i]) return prev
        const ship = shipAt(prev, i)
        const shots = { ...prev.shots, [i]: (ship ? 'hit' : 'miss') as ShotKind }
        let ships = prev.ships
        if (ship) {
          ships = prev.ships.map((s) => (s.key === ship.key ? { ...s, hits: s.hits + 1 } : s))
          const updated = ships.find((s) => s.key === ship.key)!
          if (updated.hits >= updated.size) {
            setSinkCell(i)
            sfx.fail()
            haptic('heavy')
            setMessage(`${ship.emoji} Düşman ${ship.name} battı!`)
          } else {
            sfx.match()
            haptic('medium')
            setMessage('🎯 İsabet! Tekrar ateş et.')
          }
          setLastSplash(i)
        } else {
          sfx.tap()
          haptic('light')
          setMessage('💦 Iska. Sıra düşmanda.')
          setLastSplash(i)
        }
        const next = { ships, shots }
        // Kazanma?
        if (allSunk(next) && !wonRef.current) {
          wonRef.current = true
          const lostShips = player.ships.filter((s) => s.hits >= s.size).length
          const ids = ['admiral', ...(lostShips === 0 ? ['flawless-fleet'] : [])]
          recordGame({ won: true, xp: 80, achievementIds: ids })
          laterCall(() => {
            setPhase('over')
            setMessage('🏆 Zafer! Düşman donanması yok edildi.')
          }, 500)
        } else if (!ship) {
          // Iska → sıra düşmanda
          setTurn('enemy')
          laterCall(enemyFire, 650)
        }
        return next
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, turn, player.ships],
  )

  // ——— Savaş: bot ateşi (avlanma modu) ———
  const enemyFire = useCallback(() => {
    setPlayer((prev) => {
      if (wonRef.current) return prev
      // Hedef seç: kuyruk (hasarlı gemi çevresi) varsa oradan, yoksa dama-deseni tarama
      const shotSet = prev.shots
      let target = -1
      while (botQueue.current.length) {
        const cand = botQueue.current.shift()!
        if (shotSet[cand] === undefined) {
          target = cand
          break
        }
      }
      if (target === -1) {
        const candidates: number[] = []
        for (let i = 0; i < N * N; i++) {
          const [r, c] = rc(i)
          if (shotSet[i] === undefined && (r + c) % 2 === 0) candidates.push(i)
        }
        const pool = candidates.length
          ? candidates
          : Array.from({ length: N * N }, (_, i) => i).filter((i) => shotSet[i] === undefined)
        target = pool[Math.floor(Math.random() * pool.length)]
      }
      if (target === undefined || target < 0) return prev

      const ship = shipAt(prev, target)
      const shots = { ...prev.shots, [target]: (ship ? 'hit' : 'miss') as ShotKind }
      let ships = prev.ships
      if (ship) {
        ships = prev.ships.map((s) => (s.key === ship.key ? { ...s, hits: s.hits + 1 } : s))
        const updated = ships.find((s) => s.key === ship.key)!
        haptic('medium')
        if (updated.hits >= updated.size) {
          // Battı → çevresini kuyruktan temizle
          botQueue.current = []
          setMessage(`${ship.emoji} ${ship.name} gemin battı!`)
        } else {
          // Komşu hücreleri hedef kuyruğuna ekle
          const [r, c] = rc(target)
          const nb = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ]
          for (const [rr, cc] of nb) {
            if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
              const ni = idx(rr, cc)
              if (shots[ni] === undefined) botQueue.current.push(ni)
            }
          }
          setMessage('🔥 Düşman gemine isabet ettirdi!')
        }
        sfx.fail()
      } else {
        setMessage('Düşman ıskaladı — sıra sende 🎯')
      }
      const next = { ships, shots }

      // Bot kazandı mı?
      if (allSunk(next) && !wonRef.current) {
        wonRef.current = true
        recordGame({ won: false, xp: 15 })
        laterCall(() => {
          setPhase('over')
          setMessage('💥 Yenildin — tüm donanman battı.')
        }, 500)
        return next
      }

      // İsabet → bot tekrar ateş eder; ıska → sıra oyuncuda
      if (ship) {
        laterCall(enemyFire, 650)
      } else {
        setTurn('player')
      }
      return next
    })
  }, [])

  const newGame = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    botQueue.current = []
    wonRef.current = false
    setPlacing([])
    setHoverCells([])
    setEnemy({ ships: [], shots: {} })
    setPlayer({ ships: [], shots: {} })
    setTurn('player')
    setPhase('place')
    setMessage('Donanmanı yerleştir, sonra ateşe başla!')
  }

  const playerWon = phase === 'over' && allSunk(enemy)

  // Kalan gemi sayaçları
  const enemyLeft = enemy.ships.filter((s) => s.hits < s.size).length
  const playerLeft = player.ships.filter((s) => s.hits < s.size).length

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
        <button onClick={newGame} className="btn-ghost border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm">
          ↻ Yeni
        </button>
      </header>

      {/* Durum çubuğu */}
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
          onOrient={() => setOrient((o) => (o === 'h' ? 'v' : 'h'))}
          onHover={setHover}
          onLeave={() => setHoverCells([])}
          onPlace={tryPlace}
          onAuto={autoPlace}
          onClear={clearPlacement}
          onStart={startBattle}
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-6">
          {/* Düşman ızgarası (radar) */}
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
              />
            </div>
          </section>

          {/* Oyuncu ızgarası */}
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

      {/* Oyun sonu kaplaması */}
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
  placing,
  nextDef,
  orient,
  previewCells,
  onOrient,
  onHover,
  onLeave,
  onPlace,
  onAuto,
  onClear,
  onStart,
}: {
  placing: Ship[]
  nextDef: ShipDef | undefined
  orient: Orient
  previewCells: number[]
  onOrient: () => void
  onHover: (start: number) => void
  onLeave: () => void
  onPlace: (start: number) => void
  onAuto: () => void
  onClear: () => void
  onStart: () => void
}) {
  const board: BoardState = { ships: placing, shots: {} }
  const done = placing.length >= FLEET.length
  const previewSet = new Set(previewCells)

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      {/* Filo listesi */}
      <div className="flex flex-wrap gap-2">
        {FLEET.map((def, i) => {
          const isPlaced = i < placing.length
          const isNext = i === placing.length
          return (
            <div
              key={def.key}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isPlaced
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : isNext
                    ? 'border-sky-300/60 bg-sky-500/20 text-sky-100 shadow-glow'
                    : 'border-white/10 bg-white/5 text-white/50'
              }`}
            >
              <span>{def.emoji}</span>
              <span>{def.name}</span>
              <span className="opacity-60">{'▪'.repeat(def.size)}</span>
              {isPlaced && <span className="text-emerald-300">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Kontroller */}
      <div className="flex gap-2">
        <button
          onClick={onOrient}
          className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm"
          disabled={done}
        >
          {orient === 'h' ? '↔ Yatay' : '↕ Dikey'}
        </button>
        <button onClick={onAuto} className="btn-ghost flex-1 border-sky-400/30 bg-sky-500/10 py-2 text-sm">
          🔀 Otomatik
        </button>
        <button onClick={onClear} className="btn-ghost flex-1 py-2 text-sm">
          ✕ Temizle
        </button>
      </div>

      {/* Yerleştirme ızgarası */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#04101c]/70 p-2 shadow-card">
        <Grid
          board={board}
          revealShips
          interactive={!done}
          previewSet={previewSet}
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

// ——— Izgara başlığı + kalan gemi rozetleri ———
function GridHeader({
  title,
  tone,
  left,
  total,
  ships,
  hideShips,
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
  board,
  revealShips,
  interactive,
  onCell,
  onCellHover,
  onLeave,
  previewSet,
  splash,
  sinkCell,
}: {
  board: BoardState
  revealShips: boolean
  interactive: boolean
  onCell?: (i: number) => void
  onCellHover?: (i: number) => void
  onLeave?: () => void
  previewSet?: Set<number>
  splash?: number | null
  sinkCell?: number | null
}) {
  return (
    <div className="select-none">
      {/* Sütun etiketleri */}
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
              cls += 'bg-emerald-400/40 ring-1 ring-emerald-300/70 '
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
