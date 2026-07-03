import { HeroDef } from '../types'

export const heroes: HeroDef[] = [
  {
    id: 'warrior',
    name: 'Savaşçı',
    emoji: '⚔️',
    color: '#ef4444',
    hp: 30,
    powerName: 'Savaş Çığlığı',
    powerDesc: 'Bir yaratığa +2 atak verir',
    powerCost: 2,
    powerEffect: { buffAttack: 2 },
  },
  {
    id: 'mage',
    name: 'Büyücü',
    emoji: '🔮',
    color: '#8b5cf6',
    hp: 25,
    powerName: 'Ateş Topu',
    powerDesc: 'Hedefe 2 hasar verir',
    powerCost: 2,
    powerEffect: { damage: 2 },
  },
  {
    id: 'druid',
    name: 'Druid',
    emoji: '🌿',
    color: '#22c55e',
    hp: 30,
    powerName: 'Doğanın Şifası',
    powerDesc: 'Kahramana 3 can yeniler',
    powerCost: 2,
    powerEffect: { heal: 3 },
  },
  {
    id: 'shadow',
    name: 'Gölge',
    emoji: '👻',
    color: '#a855f7',
    hp: 25,
    powerName: 'Gölge Adımları',
    powerDesc: '1 kart çeker, 1 hasar alır',
    powerCost: 1,
    powerEffect: { draw: 1, damage: 1 },
  },
]

export function getHero(id: string): HeroDef {
  return heroes.find(h => h.id === id) || heroes[0]
}

export function getHeroPowerTargetMode(heroId: string): 'none' | 'enemy_creature' | 'own_creature' | 'hero' | 'all_enemies' {
  switch(heroId) {
    case 'warrior': return 'own_creature'
    case 'mage': return 'enemy_creature'
    case 'druid': return 'hero'
    case 'shadow': return 'none'
    default: return 'none'
  }
}
