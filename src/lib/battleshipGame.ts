export const N = 10
export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export type Orient = 'h' | 'v'
export type ShotKind = 'hit' | 'miss'

export interface ShipDef {
  key: string
  name: string
  size: number
  emoji: string
}

export const FLEET: ShipDef[] = [
  { key: 'carrier', name: 'Uçak Gemisi', size: 5, emoji: '🛳️' },
  { key: 'battleship', name: 'Zırhlı', size: 4, emoji: '🚢' },
  { key: 'cruiser', name: 'Kruvazör', size: 3, emoji: '🛥️' },
  { key: 'submarine', name: 'Denizaltı', size: 3, emoji: '🤿' },
  { key: 'destroyer', name: 'Muhrip', size: 2, emoji: '⛴️' },
]

export interface Ship {
  key: string
  name: string
  size: number
  emoji: string
  cells: number[]
  hits: number
}

export interface BoardState {
  ships: Ship[]
  shots: Record<number, ShotKind>
}

export interface GameStats {
  total: number
  hits: number
  misses: number
}

export const rc = (i: number): [number, number] => [Math.floor(i / N), i % N]
export const idx = (r: number, c: number) => r * N + c

export function shipCells(start: number, size: number, orient: Orient): number[] | null {
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

export function conflicts(cells: number[], ships: Ship[]): boolean {
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

export function randomFleet(): Ship[] {
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

export function shipAt(board: BoardState, i: number): Ship | undefined {
  return board.ships.find((s) => s.cells.includes(i))
}

export const allSunk = (b: BoardState) => b.ships.every((s) => s.hits >= s.size)

export function salvoCount(ships: Ship[]): number {
  return ships.filter((s) => s.hits < s.size).length
}

export function updateStats(stats: GameStats, kind: ShotKind): GameStats {
  return { total: stats.total + 1, hits: stats.hits + (kind === 'hit' ? 1 : 0), misses: stats.misses + (kind === 'miss' ? 1 : 0) }
}

// ——— Bot AI v2: Olasılık haritası + yön tespiti ———

function buildProbabilityMap(board: BoardState): number[] {
  const probs = new Array(N * N).fill(0)
  const alive = board.ships.filter((s) => s.hits < s.size)
  for (const ship of alive) {
    for (let i = 0; i < N * N; i++) {
      for (const orient of ['h', 'v'] as Orient[]) {
        const cells = shipCells(i, ship.size, orient)
        if (!cells) continue
        if (cells.some((ci) => board.shots[ci] === 'miss')) continue
        if (cells.some((ci) => board.shots[ci] === 'hit' && !board.ships.find((s) => s.cells.includes(ci)))) continue
        for (const ci of cells) {
          if (!board.shots[ci]) probs[ci] += 1
        }
      }
    }
  }
  return probs
}

function detectOrientation(board: BoardState): Map<string, Orient> {
  const ori = new Map<string, Orient>()
  for (const s of board.ships) {
    if (s.hits < 2) continue
    const hitCells = s.cells.filter((c) => board.shots[c] === 'hit')
    if (hitCells.length < 2) continue
    const [r1] = rc(hitCells[0])
    const [r2] = rc(hitCells[1])
    ori.set(s.key, r1 === r2 ? 'h' : 'v')
  }
  return ori
}

export function getBotTarget(board: BoardState, huntQueue: number[]): number {
  const alive = board.ships.filter((s) => s.hits < s.size)
  if (alive.length === 0) return -1

  while (huntQueue.length) {
    const cand = huntQueue.shift()!
    if (board.shots[cand] === undefined) return cand
  }

  const orientation = detectOrientation(board)
  const probs = buildProbabilityMap(board)

  for (const s of alive) {
    if (s.hits > 0) {
      const or = orientation.get(s.key)
      const hitCells = s.cells.filter((c) => board.shots[c] === 'hit')
      if (or && hitCells.length >= 2) {
        const sorted = [...hitCells].sort((a, b) => a - b)
        const [r1, c1] = rc(sorted[0])
        const [r2, c2] = rc(sorted[sorted.length - 1])
        if (or === 'h') {
          const left = idx(r1, c1 - 1)
          const right = idx(r1, c2 + 1)
          for (const ci of [left, right]) {
            if (ci >= 0 && ci < N * N && !board.shots[ci]) return ci
          }
        } else {
          const up = idx(r1 - 1, c1)
          const down = idx(r2 + 1, c2)
          for (const ci of [up, down]) {
            if (ci >= 0 && ci < N * N && !board.shots[ci]) return ci
          }
        }
      }
      for (const hc of hitCells) {
        const [r, c] = rc(hc)
        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            const ni = idx(nr, nc)
            if (!board.shots[ni]) return ni
          }
        }
      }
    }
  }

  let best = -1
  let bestProb = -1
  for (let i = 0; i < N * N; i++) {
    if (!board.shots[i] && probs[i] > bestProb) {
      bestProb = probs[i]
      best = i
    }
  }
  if (best >= 0) return best

  const fallback: number[] = []
  for (let i = 0; i < N * N; i++) {
    if (!board.shots[i]) fallback.push(i)
  }
  return fallback.length ? fallback[Math.floor(Math.random() * fallback.length)] : -1
}

// ——— Salvo bot AI ———

export function getBotSalvoTargets(board: BoardState, huntQueues: number[][]): number[] {
  const count = salvoCount(board.ships)
  const targets: number[] = []
  for (let i = 0; i < count; i++) {
    const queue = huntQueues[i] ?? []
    const target = getBotTarget(board, queue)
    if (target >= 0 && !targets.includes(target)) {
      targets.push(target)
    }
  }
  if (targets.length < count) {
    for (let i = 0; i < N * N && targets.length < count; i++) {
      if (!board.shots[i] && !targets.includes(i)) targets.push(i)
    }
  }
  return targets
}

export function getBotHuntQueues(): number[][] {
  return Array.from({ length: 5 }, () => [])
}

export function applyFire(board: BoardState, targets: number[]): { board: BoardState; results: { i: number; kind: ShotKind; shipKey?: string; sunk: boolean }[] } {
  let ships = [...board.ships]
  const shots = { ...board.shots }
  const results: { i: number; kind: ShotKind; shipKey?: string; sunk: boolean }[] = []

  for (const target of targets) {
    if (shots[target] !== undefined) continue
    const ship = ships.find((s) => s.cells.includes(target))
    const kind: ShotKind = ship ? 'hit' : 'miss'
    shots[target] = kind
    if (ship) {
      ships = ships.map((s) => (s.key === ship.key ? { ...s, hits: s.hits + 1 } : s))
      const updated = ships.find((s) => s.key === ship.key)!
      results.push({ i: target, kind, shipKey: ship.key, sunk: updated.hits >= updated.size })
      if (updated.hits >= updated.size) {
        for (const c of updated.cells) {
          if (shots[c] === undefined) {
            shots[c] = 'hit'
          }
        }
      }
    } else {
      results.push({ i: target, kind, sunk: false })
    }
  }

  return { board: { ships, shots }, results }
}
