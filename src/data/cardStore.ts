import type { CardDef, CardCollection } from '../types'

const COLL_KEY = 'papaya.cards.collection'
const DECK_KEY = 'papaya.cards.deck'

export const ALL_CARDS: CardDef[] = [
  // --- NATURE (yeşil) ---
  { id: 'c1', name: 'Papaya Fidesi', emoji: '🌱', cost: 1, type: 'creature', attack: 1, hp: 2, description: 'Küçük bir başlangıç.', rarity: 'common', faction: 'nature' },
  { id: 'c2', name: 'Sincap', emoji: '🐿️', cost: 2, type: 'creature', attack: 2, hp: 2, description: 'Hızlı ve çevik.', rarity: 'common', faction: 'nature' },
  { id: 'c3', name: 'Orman Muhafızı', emoji: '🧝', cost: 3, type: 'creature', attack: 3, hp: 3, description: 'Ormanı korur.', rarity: 'common', faction: 'nature' },
  { id: 'c4', name: 'Bilge Kaplumbağa', emoji: '🐢', cost: 4, type: 'creature', attack: 2, hp: 7, effect: { taunt: true }, description: 'Kalkan görevi görür.', rarity: 'rare', faction: 'nature' },
  { id: 'c5', name: 'Orman Kraliçesi', emoji: '🌿', cost: 5, type: 'creature', attack: 4, hp: 5, effect: { heal: 3 }, description: 'Oynandığında 3 can verir.', rarity: 'epic', faction: 'nature' },
  { id: 'c6', name: 'Mamut', emoji: '🦣', cost: 6, type: 'creature', attack: 5, hp: 6, effect: { taunt: true }, description: 'Zor yıkılır.', rarity: 'rare', faction: 'nature' },
  { id: 'c7', name: 'Papaya Ejderi', emoji: '🐉', cost: 8, type: 'creature', attack: 8, hp: 8, effect: { charge: true }, description: 'Geldiği an vurur!', rarity: 'legendary', faction: 'nature' },

  // --- FIRE (kırmızı) ---
  { id: 'c8', name: 'Kıvılcım', emoji: '✨', cost: 1, type: 'creature', attack: 2, hp: 1, description: 'Çabuk söner.', rarity: 'common', faction: 'fire' },
  { id: 'c9', name: 'Alev Tilki', emoji: '🦊', cost: 3, type: 'creature', attack: 4, hp: 2, effect: { charge: true }, description: 'Hücum: hemen saldırır.', rarity: 'rare', faction: 'fire' },
  { id: 'c10', name: 'Ateş Ruhu', emoji: '🔥', cost: 2, type: 'creature', attack: 3, hp: 1, description: 'Saf ateş.', rarity: 'common', faction: 'fire' },
  { id: 'c11', name: 'Volkan', emoji: '🌋', cost: 7, type: 'creature', attack: 6, hp: 6, effect: { dealToAll: 2 }, description: 'Her şeye 2 hasar.', rarity: 'epic', faction: 'fire' },
  { id: 'c12', name: 'Savaşçı Ayı', emoji: '🐻', cost: 4, type: 'creature', attack: 4, hp: 4, description: 'Dengeli savaşçı.', rarity: 'common', faction: 'fire' },
  { id: 'c13', name: 'Kükreyen Aslan', emoji: '🦁', cost: 5, type: 'creature', attack: 5, hp: 4, description: 'Korkutucu.', rarity: 'rare', faction: 'fire' },

  // --- ICE (mavi) ---
  { id: 'c14', name: 'Buz Parçası', emoji: '🧊', cost: 1, type: 'creature', attack: 0, hp: 3, effect: { taunt: true }, description: 'Buz duvar.', rarity: 'common', faction: 'ice' },
  { id: 'c15', name: 'Buz Ruhu', emoji: '❄️', cost: 3, type: 'creature', attack: 3, hp: 3, effect: { freeze: true }, description: 'Dondurur.', rarity: 'rare', faction: 'ice' },
  { id: 'c16', name: 'Kar Kaplanı', emoji: '🐯', cost: 4, type: 'creature', attack: 4, hp: 3, description: 'Karda hızlı.', rarity: 'common', faction: 'ice' },
  { id: 'c17', name: 'Buz Devriyesi', emoji: '🗿', cost: 5, type: 'creature', attack: 3, hp: 6, effect: { freeze: true }, description: 'Dondurur ve tutar.', rarity: 'epic', faction: 'ice' },
  { id: 'c18', name: 'Kutup Ejderi', emoji: '🐲', cost: 7, type: 'creature', attack: 7, hp: 7, effect: { freeze: true }, description: 'Her şeyi dondurur.', rarity: 'legendary', faction: 'ice' },

  // --- SHADOW (mor) ---
  { id: 'c19', name: 'Küçük Gölge', emoji: '👻', cost: 1, type: 'creature', attack: 1, hp: 1, description: 'Zayıf ama sinsidir.', rarity: 'common', faction: 'shadow' },
  { id: 'c20', name: 'Gölge Hırsızı', emoji: '🕵️', cost: 3, type: 'creature', attack: 3, hp: 2, effect: { draw: 1 }, description: 'Oynarken kart çeker.', rarity: 'rare', faction: 'shadow' },
  { id: 'c21', name: 'Karanlık Büyücü', emoji: '🧙', cost: 5, type: 'creature', attack: 4, hp: 4, effect: { destroyRandom: true }, description: 'Rastgele bir düşman yaratığını yok eder.', rarity: 'epic', faction: 'shadow' },
  { id: 'c22', name: 'Gölge Het', emoji: '🌑', cost: 6, type: 'creature', attack: 5, hp: 5, effect: { stealLife: true }, description: 'Vurdukça can alır.', rarity: 'legendary', faction: 'shadow' },
  { id: 'c23', name: 'Yarasa Sürüsü', emoji: '🦇', cost: 2, type: 'creature', attack: 2, hp: 1, description: 'Sürü halinde.', rarity: 'common', faction: 'shadow' },

  // --- SPELLS ---
  { id: 's1', name: 'Ateş Topu', emoji: '🔥', cost: 3, type: 'spell', description: '4 hasar verir.', effect: { damage: 4 }, rarity: 'common', faction: 'fire' },
  { id: 's2', name: 'İyileştirme', emoji: '💚', cost: 2, type: 'spell', description: 'Kahramana 3 can verir.', effect: { heal: 3 }, rarity: 'common', faction: 'nature' },
  { id: 's3', name: 'Yıldırım', emoji: '⚡', cost: 5, type: 'spell', description: '6 hasar verir.', effect: { damage: 6 }, rarity: 'rare', faction: 'fire' },
  { id: 's4', name: 'Bilgelik', emoji: '📜', cost: 1, type: 'spell', description: '2 kart çek.', effect: { draw: 2 }, rarity: 'rare', faction: 'holy' },
  { id: 's5', name: 'Karanlık Patlama', emoji: '💥', cost: 4, type: 'spell', description: 'Tüm düşman yaratıklara 2 hasar.', effect: { dealToAll: 2 }, rarity: 'rare', faction: 'shadow' },
  { id: 's6', name: 'Büyük Papaya', emoji: '🍈', cost: 10, type: 'spell', description: 'Anında zafer kazan!', effect: { win: true }, rarity: 'legendary', faction: 'holy' },
  { id: 's7', name: 'Güçlendirme', emoji: '💪', cost: 3, type: 'spell', description: 'Bir yaratığa +2/+2 verir.', effect: { buffAttack: 2, buffHp: 2 }, rarity: 'common', faction: 'nature' },
  { id: 's8', name: 'Sessizlik', emoji: '🤫', cost: 2, type: 'spell', description: 'Bir düşman yaratığını susturur.', effect: { silence: true }, rarity: 'rare', faction: 'holy' },

  // --- WEAPONS ---
  { id: 'w1', name: 'Taş Kılıç', emoji: '🗡️', cost: 2, type: 'weapon', description: '+2 saldırı verir.', effect: { buffAttack: 2 }, rarity: 'common', faction: 'fire' },
  { id: 'w2', name: 'Uzun Yay', emoji: '🏹', cost: 3, type: 'weapon', description: '+3 saldırı verir.', effect: { buffAttack: 3 }, rarity: 'rare', faction: 'nature' },
  { id: 'w3', name: 'Efsanevi Kılıç', emoji: '⚔️', cost: 5, type: 'weapon', description: '+5 saldırı verir.', effect: { buffAttack: 5 }, rarity: 'epic', faction: 'holy' },
]

export const STARTER_DECK = ['c1', 'c1', 'c8', 'c8', 'c14', 'c19', 'c10', 'c10', 'c2', 'c2', 'c3', 'c12', 'c16', 'c23', 'c23', 's1', 's2', 's4', 'w1', 's7']

export function getCard(id: string): CardDef | undefined {
  return ALL_CARDS.find((c) => c.id === id)
}

export function getCards(ids: string[]): CardDef[] {
  return ids.map((id) => getCard(id)).filter((c): c is CardDef => !!c)
}

export function loadCollection(): CardCollection {
  try {
    const raw = localStorage.getItem(COLL_KEY)
    if (raw) return JSON.parse(raw) as CardCollection
  } catch { }
  const owned: Record<string, number> = {}
  STARTER_DECK.forEach((id) => { owned[id] = (owned[id] || 0) + 1 })
  return { owned, selectedDeck: [...STARTER_DECK] }
}

export function saveCollection(c: CardCollection) {
  try { localStorage.setItem(COLL_KEY, JSON.stringify(c)) } catch { }
}

export function saveDeck(deck: string[]) {
  try { localStorage.setItem(DECK_KEY, JSON.stringify(deck)) } catch { }
}

export function loadDeck(): string[] {
  try {
    const raw = localStorage.getItem(DECK_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { }
  return [...STARTER_DECK]
}
