// Oyunlar-arası ilerleme: XP, seviye, başarımlar (localStorage).
import { sfx } from '../lib/sound'

const KEY = 'papaya.stats.v1'

export interface Achievement {
  id: string
  name: string
  emoji: string
  desc: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-play', name: 'İlk Adım', emoji: '🎮', desc: 'İlk oyununu oyna' },
  { id: 'first-win', name: 'İlk Zafer', emoji: '🏆', desc: 'Herhangi bir oyunu kazan' },
  { id: 'tic-impossible', name: 'İmkansızı Başardın', emoji: '🤖', desc: 'XOX’ta İmkansız botu yen' },
  { id: 'admiral', name: 'Amiral', emoji: '⚓', desc: 'Amiral Battı’da düşman donanmasını batır' },
  { id: 'flawless-fleet', name: 'Kusursuz Donanma', emoji: '🎖️', desc: 'Amiral Battı’yı tek gemi kaybetmeden kazan' },
  { id: 'quest-done', name: 'Krallığın Kahramanı', emoji: '🌅', desc: 'Papaya Krallığı hikâyesini bitir' },
  { id: 'level-5', name: 'Oyun Kurdu', emoji: '🔥', desc: '5. seviyeye ulaş' },
  { id: 'card-first-win', name: 'Kart Ustası', emoji: '🎴', desc: 'Kart Savaşı\'nı ilk kez kazan' },
  { id: 'card-10-wins', name: 'Kart Koleksiyoncusu', emoji: '🃏', desc: 'Kart Savaşı\'nda 10 galibiyet' },
  { id: 'card-50-wins', name: 'Efsanevi Oyuncu', emoji: '👑', desc: 'Kart Savaşı\'nda 50 galibiyet' },
  { id: 'card-all-heroes', name: 'Kahramanlar Meclisi', emoji: '⚔️', desc: 'Tüm kahramanlarla en az 1 galibiyet' },
  { id: 'card-hard-bot', name: 'Kumandan Katili', emoji: '🔴', desc: 'Zor botu yen (Kumandan seviyesi)' },
  { id: 'card-full-collection', name: 'Kartograf', emoji: '🗺️', desc: 'Tüm kartları topla' },
]

export interface Stats {
  xp: number
  plays: number
  wins: number
  unlocked: string[]
}

function load(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { xp: 0, plays: 0, wins: 0, unlocked: [], ...(JSON.parse(raw) as Partial<Stats>) }
  } catch {
    /* yoksay */
  }
  return { xp: 0, plays: 0, wins: 0, unlocked: [] }
}

function save(s: Stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* yoksay */
  }
}

export function getStats(): Stats {
  return load()
}

/** Seviye eğrisi: n. seviye için 60·n² toplam XP. */
export function levelInfo(xp: number): { level: number; cur: number; next: number; pct: number } {
  let level = 1
  while (xp >= 60 * level * level) level++
  const prev = 60 * (level - 1) * (level - 1)
  const next = 60 * level * level
  const pct = Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100))
  return { level, cur: xp - prev, next: next - prev, pct }
}

type UnlockListener = (a: Achievement[]) => void
const listeners = new Set<UnlockListener>()
export function onUnlock(fn: UnlockListener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Oyun sonucu bildir: XP ekler, başarımları açar.
 * `achievementIds`: bu sonuçla hak edilen başarımlar (sayfa karar verir).
 */
export function recordGame(opts: { won?: boolean; xp?: number; achievementIds?: string[] }): void {
  const s = load()
  s.plays += 1
  if (opts.won) s.wins += 1
  s.xp += opts.xp ?? (opts.won ? 25 : 10)

  const earned: string[] = ['first-play', ...(opts.won ? ['first-win'] : []), ...(opts.achievementIds ?? [])]
  const fresh: Achievement[] = []
  for (const id of earned) {
    if (!s.unlocked.includes(id)) {
      const a = ACHIEVEMENTS.find((x) => x.id === id)
      if (a) {
        s.unlocked.push(id)
        fresh.push(a)
      }
    }
  }
  // seviye başarımı
  if (levelInfo(s.xp).level >= 5 && !s.unlocked.includes('level-5')) {
    const a = ACHIEVEMENTS.find((x) => x.id === 'level-5')!
    s.unlocked.push('level-5')
    fresh.push(a)
  }
  save(s)
  if (fresh.length) {
    sfx.achievement()
    listeners.forEach((fn) => fn(fresh))
  }
}
