import type { Quest } from '../types'

const SAVE_KEY = 'papaya.kingdom.v1'

export interface KingdomSave {
  stage: number
  collectedIds: number[]
  defeatedEnemies: string[]
  discoveredRegions: string[]
  fishCount: number
  hp: number
  quests: Quest[]
}

export function saveKingdom(data: KingdomSave) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch { }
}

export function loadKingdom(): KingdomSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as KingdomSave
  } catch {
    return null
  }
}

export function clearKingdom() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch { }
}
