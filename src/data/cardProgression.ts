import { CardCollection, CardDef, CardPackResult, Rarity } from '../types'
import { allCards } from './cardStore'

const STORAGE_KEY = 'papaya_card_collection'

export function defaultCollection(): CardCollection {
  return {
    owned: {},
    selectedDeck: [],
    coins: 0,
    dust: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    lastDaily: 0,
    heroXp: {},
  }
}

export function loadCollection(): CardCollection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return { ...defaultCollection(), ...data }
    }
  } catch {}
  return defaultCollection()
}

export function saveCollection(c: CardCollection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
}

export function addCoins(c: CardCollection, amount: number): CardCollection {
  return { ...c, coins: c.coins + amount }
}

export function addDust(c: CardCollection, amount: number): CardCollection {
  return { ...c, dust: c.dust + amount }
}

export function addCard(c: CardCollection, cardId: string, count = 1): CardCollection {
  const owned = { ...c.owned }
  owned[cardId] = (owned[cardId] || 0) + count
  return { ...c, owned }
}

export function canCraft(rarity: Rarity): number {
  switch (rarity) {
    case 'common': return 40
    case 'rare': return 100
    case 'epic': return 400
    case 'legendary': return 1600
  }
}

export function disenchantValue(rarity: Rarity): number {
  switch (rarity) {
    case 'common': return 5
    case 'rare': return 20
    case 'epic': return 100
    case 'legendary': return 400
  }
}

export function openPack(): CardPackResult {
  const rarities: Rarity[] = ['common', 'common', 'common', 'common']
  const roll = Math.random()
  rarities.push(roll < 0.7 ? 'common' : roll < 0.9 ? 'rare' : roll < 0.99 ? 'epic' : 'legendary')

  const cards: CardDef[] = rarities.map(r => {
    const pool = allCards.filter(c => c.rarity === r)
    return pool[Math.floor(Math.random() * pool.length)]
  })

  return { cards }
}

export function recordWin(c: CardCollection): CardCollection {
  return {
    ...c,
    coins: c.coins + 15,
    wins: c.wins + 1,
    streak: c.streak + 1,
  }
}

export function recordLoss(c: CardCollection): CardCollection {
  return {
    ...c,
    coins: c.coins + 5,
    losses: c.losses + 1,
    streak: 0,
  }
}

export function dailyReward(c: CardCollection): CardCollection | null {
  const today = Math.floor(Date.now() / 86400000)
  if (c.lastDaily === today) return null
  return { ...c, coins: c.coins + 50, lastDaily: today }
}

export function addHeroXp(c: CardCollection, heroId: string, amount: number): CardCollection {
  const heroXp = { ...c.heroXp }
  heroXp[heroId] = (heroXp[heroId] || 0) + amount
  return { ...c, heroXp }
}

export function heroLevel(xp: number): number {
  return Math.min(10, Math.floor(xp / 100) + 1)
}
