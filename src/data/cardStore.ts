import type { CardDef, CardCollection } from '../types'

export const allCards: CardDef[] = [
  // --- NATURE (yeşil) ---
  { id: 'c1', name: 'Papaya Fidesi', emoji: '🌱', cost: 1, type: 'creature', attack: 1, hp: 2, description: 'Küçük bir başlangıç.', rarity: 'common', faction: 'nature' },
  { id: 'c2', name: 'Sincap', emoji: '🐿️', cost: 2, type: 'creature', attack: 2, hp: 2, description: 'Hızlı ve çevik.', rarity: 'common', faction: 'nature' },
  { id: 'c3', name: 'Orman Muhafızı', emoji: '🧝', cost: 3, type: 'creature', attack: 3, hp: 3, description: 'Ormanı korur.', rarity: 'common', faction: 'nature' },
  { id: 'c4', name: 'Bilge Kaplumbağa', emoji: '🐢', cost: 4, type: 'creature', attack: 2, hp: 7, effect: { taunt: true }, description: 'Kalkan görevi görür.', rarity: 'rare', faction: 'nature' },
  { id: 'c5', name: 'Orman Kraliçesi', emoji: '🌿', cost: 5, type: 'creature', attack: 4, hp: 5, effect: { heal: 3 }, description: 'Oynandığında 3 can verir.', rarity: 'epic', faction: 'nature' },
  { id: 'c6', name: 'Mamut', emoji: '🦣', cost: 6, type: 'creature', attack: 5, hp: 6, effect: { taunt: true }, description: 'Zor yıkılır.', rarity: 'rare', faction: 'nature' },
  { id: 'c7', name: 'Papaya Ejderi', emoji: '🐉', cost: 8, type: 'creature', attack: 8, hp: 8, effect: { charge: true }, description: 'Geldiği an vurur!', rarity: 'legendary', faction: 'nature' },
  { id: 'c24', name: 'Zehirli Sarmaşık', emoji: '🌺', cost: 3, type: 'creature', attack: 2, hp: 3, effect: { poison: true }, description: 'Zehriyle temas edeni yok eder.', rarity: 'common', faction: 'nature', keywords: ['Zehir'] },
  { id: 'c25', name: 'Orman Ruhu', emoji: '🌳', cost: 4, type: 'creature', attack: 3, hp: 2, effect: { deathrattle: { effect: { buffHp: 2, heal: 2 } } }, description: 'Ölünce tüm müttefikleri iyileştirir.', rarity: 'rare', faction: 'nature', keywords: ['Ölüm Çığlığı'] },
  { id: 'c26', name: 'Canavar Ayı', emoji: '🐻', cost: 6, type: 'creature', attack: 5, hp: 5, effect: { frenzy: true }, description: 'Saldırınca +1/+1 kazanır.', rarity: 'rare', faction: 'nature', keywords: ['Çılgınlık'] },
  { id: 'c37', name: 'Müzik Kutusu', emoji: '🎵', cost: 2, type: 'creature', attack: 2, hp: 1, effect: { returnToHand: true }, description: 'Bir düşman yaratığını ele döndürür.', rarity: 'common', faction: 'nature' },

  // --- FIRE (kırmızı) ---
  { id: 'c8', name: 'Kıvılcım', emoji: '✨', cost: 1, type: 'creature', attack: 2, hp: 1, description: 'Çabuk söner.', rarity: 'common', faction: 'fire' },
  { id: 'c9', name: 'Alev Tilki', emoji: '🦊', cost: 3, type: 'creature', attack: 4, hp: 2, effect: { charge: true }, description: 'Hücum: hemen saldırır.', rarity: 'rare', faction: 'fire' },
  { id: 'c10', name: 'Ateş Ruhu', emoji: '🔥', cost: 2, type: 'creature', attack: 3, hp: 1, description: 'Saf ateş.', rarity: 'common', faction: 'fire' },
  { id: 'c11', name: 'Volkan', emoji: '🌋', cost: 7, type: 'creature', attack: 6, hp: 6, effect: { dealToAll: 2 }, description: 'Her şeye 2 hasar.', rarity: 'epic', faction: 'fire' },
  { id: 'c12', name: 'Savaşçı Ayı', emoji: '🐻', cost: 4, type: 'creature', attack: 4, hp: 4, description: 'Dengeli savaşçı.', rarity: 'common', faction: 'fire' },
  { id: 'c13', name: 'Kükreyen Aslan', emoji: '🦁', cost: 5, type: 'creature', attack: 5, hp: 4, description: 'Korkutucu.', rarity: 'rare', faction: 'fire' },
  { id: 'c27', name: 'Ateş Okçu', emoji: '🏹', cost: 3, type: 'creature', attack: 3, hp: 2, effect: { combo: { effect: { damage: 2 } } }, description: 'Komboda 2 hasar verir.', rarity: 'rare', faction: 'fire', keywords: ['Kombo'] },
  { id: 'c28', name: 'Lav Golemi', emoji: '🧟', cost: 5, type: 'creature', attack: 4, hp: 6, effect: { shield: 2 }, description: '2 kalkanı vardır.', rarity: 'epic', faction: 'fire', keywords: ['Kalkan'] },
  { id: 'c29', name: 'Kılıç Ustası', emoji: '⚔️', cost: 4, type: 'creature', attack: 4, hp: 3, effect: { frenzy: true }, description: 'Saldırınca +1/+1.', rarity: 'rare', faction: 'fire', keywords: ['Çılgınlık'] },

  // --- ICE (mavi) ---
  { id: 'c14', name: 'Buz Parçası', emoji: '🧊', cost: 1, type: 'creature', attack: 0, hp: 3, effect: { taunt: true }, description: 'Buz duvar.', rarity: 'common', faction: 'ice' },
  { id: 'c15', name: 'Buz Ruhu', emoji: '❄️', cost: 3, type: 'creature', attack: 3, hp: 3, effect: { freeze: true }, description: 'Dondurur.', rarity: 'rare', faction: 'ice' },
  { id: 'c16', name: 'Kar Kaplanı', emoji: '🐯', cost: 4, type: 'creature', attack: 4, hp: 3, description: 'Karda hızlı.', rarity: 'common', faction: 'ice' },
  { id: 'c17', name: 'Buz Devriyesi', emoji: '🗿', cost: 5, type: 'creature', attack: 3, hp: 6, effect: { freeze: true }, description: 'Dondurur ve tutar.', rarity: 'epic', faction: 'ice' },
  { id: 'c18', name: 'Kutup Ejderi', emoji: '🐲', cost: 7, type: 'creature', attack: 7, hp: 7, effect: { freeze: true }, description: 'Her şeyi dondurur.', rarity: 'legendary', faction: 'ice' },
  { id: 'c30', name: 'Buz Kraker', emoji: '💎', cost: 3, type: 'creature', attack: 2, hp: 3, effect: { deathrattle: { effect: { freeze: true } } }, description: 'Ölünce düşmanı dondurur.', rarity: 'rare', faction: 'ice', keywords: ['Ölüm Çığlığı'] },
  { id: 'c31', name: 'Buz Şövalyesi', emoji: '🛡️', cost: 5, type: 'creature', attack: 4, hp: 4, effect: { shield: 1, taunt: true }, description: 'Kalkanlı ve sağlam.', rarity: 'epic', faction: 'ice', keywords: ['Kalkan'] },

  // --- SHADOW (mor) ---
  { id: 'c19', name: 'Küçük Gölge', emoji: '👻', cost: 1, type: 'creature', attack: 1, hp: 1, description: 'Zayıf ama sinsidir.', rarity: 'common', faction: 'shadow' },
  { id: 'c20', name: 'Gölge Hırsızı', emoji: '🕵️', cost: 3, type: 'creature', attack: 3, hp: 2, effect: { draw: 1 }, description: 'Oynarken kart çeker.', rarity: 'rare', faction: 'shadow' },
  { id: 'c21', name: 'Karanlık Büyücü', emoji: '🧙', cost: 5, type: 'creature', attack: 4, hp: 4, effect: { destroyRandom: true }, description: 'Rastgele bir düşman yaratığını yok eder.', rarity: 'epic', faction: 'shadow' },
  { id: 'c22', name: 'Gölge Het', emoji: '🌑', cost: 6, type: 'creature', attack: 5, hp: 5, effect: { stealLife: true }, description: 'Vurdukça can alır.', rarity: 'legendary', faction: 'shadow' },
  { id: 'c23', name: 'Yarasa Sürüsü', emoji: '🦇', cost: 2, type: 'creature', attack: 2, hp: 1, description: 'Sürü halinde.', rarity: 'common', faction: 'shadow' },
  { id: 'c32', name: 'Ruh Emici', emoji: '🧛', cost: 4, type: 'creature', attack: 3, hp: 4, effect: { stealLife: true }, description: 'Saldırısı can emer.', rarity: 'rare', faction: 'shadow', keywords: ['Can Emme'] },
  { id: 'c33', name: 'Gölge Suikastçisi', emoji: '🗡️', cost: 6, type: 'creature', attack: 5, hp: 5, effect: { combo: { effect: { destroyRandom: true } } }, description: 'Komboda bir düşman yaratığını yok eder.', rarity: 'epic', faction: 'shadow', keywords: ['Kombo'] },

  // --- HOLY (sarı/beyaz) ---
  { id: 'c34', name: 'Işık Şövalyesi', emoji: '🛡️', cost: 4, type: 'creature', attack: 3, hp: 5, effect: { shield: 1 }, description: '1 kalkanı vardır.', rarity: 'rare', faction: 'holy', keywords: ['Kalkan'] },
  { id: 'c35', name: 'Melek', emoji: '👼', cost: 6, type: 'creature', attack: 4, hp: 5, effect: { deathrattle: { effect: { heal: 4 } } }, description: 'Ölünce kahramana 4 can verir.', rarity: 'epic', faction: 'holy', keywords: ['Ölüm Çığlığı'] },
  { id: 'c36', name: 'Zaman Büyücüsü', emoji: '⏳', cost: 5, type: 'creature', attack: 3, hp: 4, effect: { reduceCost: 1 }, description: 'Elindeki tüm kartların maliyeti 1 azalır.', rarity: 'legendary', faction: 'holy', keywords: ['Büyü'] },

  // --- SPELLS ---
  { id: 's1', name: 'Ateş Topu', emoji: '🔥', cost: 3, type: 'spell', description: '4 hasar verir.', effect: { damage: 4 }, rarity: 'common', faction: 'fire' },
  { id: 's2', name: 'İyileştirme', emoji: '💚', cost: 2, type: 'spell', description: 'Kahramana 3 can verir.', effect: { heal: 3 }, rarity: 'common', faction: 'nature' },
  { id: 's3', name: 'Yıldırım', emoji: '⚡', cost: 5, type: 'spell', description: '6 hasar verir.', effect: { damage: 6 }, rarity: 'rare', faction: 'fire' },
  { id: 's4', name: 'Bilgelik', emoji: '📜', cost: 1, type: 'spell', description: '2 kart çek.', effect: { draw: 2 }, rarity: 'rare', faction: 'holy' },
  { id: 's5', name: 'Karanlık Patlama', emoji: '💥', cost: 4, type: 'spell', description: 'Tüm düşman yaratıklara 2 hasar.', effect: { dealToAll: 2 }, rarity: 'rare', faction: 'shadow' },
  { id: 's6', name: 'Büyük Papaya', emoji: '🍈', cost: 10, type: 'spell', description: 'Anında zafer kazan!', effect: { win: true }, rarity: 'legendary', faction: 'holy' },
  { id: 's7', name: 'Güçlendirme', emoji: '💪', cost: 3, type: 'spell', description: 'Bir yaratığa +2/+2 verir.', effect: { buffAttack: 2, buffHp: 2 }, rarity: 'common', faction: 'nature' },
  { id: 's8', name: 'Sessizlik', emoji: '🤫', cost: 2, type: 'spell', description: 'Bir düşman yaratığını susturur.', effect: { silence: true }, rarity: 'rare', faction: 'holy' },
  { id: 's9', name: 'Keşif', emoji: '🔍', cost: 2, type: 'spell', description: '3 rastgele karttan 1 tanesini seçip eline ekle.', effect: { discover: true }, rarity: 'rare', faction: 'holy', keywords: ['Keşif'] },
  { id: 's10', name: 'Dondurucu Bakış', emoji: '🥶', cost: 4, type: 'spell', description: 'Tüm düşman yaratıklarını dondurur.', effect: { freeze: true, dealToAll: 1 }, rarity: 'rare', faction: 'ice', keywords: ['Don'] },
  { id: 's11', name: 'Gölge Kopyası', emoji: '🪞', cost: 3, type: 'spell', description: 'Bir düşman yaratığının kopyasını çıkar.', effect: { copyTarget: true }, rarity: 'rare', faction: 'shadow', keywords: ['Kopya'] },
  { id: 's12', name: 'Karanlık Dönüşüm', emoji: '🔄', cost: 5, type: 'spell', description: 'Bir düşman yaratığını 2/2 kurbağaya dönüştürür.', effect: { transform: 'c_token_frog' }, rarity: 'epic', faction: 'shadow', keywords: ['Dönüşüm'] },

  // --- WEAPONS ---
  { id: 'w1', name: 'Taş Kılıç', emoji: '🗡️', cost: 2, type: 'weapon', description: '+2 saldırı verir.', effect: { buffAttack: 2 }, rarity: 'common', faction: 'fire' },
  { id: 'w2', name: 'Uzun Yay', emoji: '🏹', cost: 3, type: 'weapon', description: '+3 saldırı verir.', effect: { buffAttack: 3 }, rarity: 'rare', faction: 'nature' },
  { id: 'w3', name: 'Efsanevi Kılıç', emoji: '⚔️', cost: 5, type: 'weapon', description: '+5 saldırı verir.', effect: { buffAttack: 5 }, rarity: 'epic', faction: 'holy' },
  { id: 'w4', name: 'Kutsal Mızrak', emoji: '🔱', cost: 4, type: 'weapon', description: '+4 atak. Oynarken 1 kart çek.', effect: { buffAttack: 4, draw: 1 }, rarity: 'epic', faction: 'holy' },
  { id: 'w5', name: 'Gölge Hançer', emoji: '🗡️', cost: 1, type: 'weapon', description: '+1 atak, can emer.', effect: { buffAttack: 1, stealLife: true }, rarity: 'rare', faction: 'shadow' },

  // --- YENİ 10 KART (toplam 60) ---
  // NATURE
  { id: 'c38', name: 'Filiz Büyücüsü', emoji: '🌿', cost: 2, type: 'creature', attack: 1, hp: 3, effect: { buffHp: 1, heal: 1 }, description: 'Oynarken tüm müttefiklere +1 can.', rarity: 'rare', faction: 'nature', keywords: ['İyileştirme'] },
  { id: 'c39', name: 'Kurt Adam', emoji: '🐺', cost: 5, type: 'creature', attack: 4, hp: 4, effect: { frenzy: true, charge: true }, description: 'Hücum + Çılgınlık.', rarity: 'epic', faction: 'nature', keywords: ['Hücum', 'Çılgınlık'] },
  // FIRE
  { id: 'c40', name: 'İskelet Savaşçı', emoji: '💀', cost: 2, type: 'creature', attack: 2, hp: 2, effect: { deathrattle: { effect: { damage: 1 } } }, description: 'Ölünce rakibe 1 hasar.', rarity: 'common', faction: 'fire', keywords: ['Ölüm Çığlığı'] },
  { id: 'c41', name: 'Alev Fırtınası', emoji: '🌪️', cost: 6, type: 'spell', description: 'Tüm yaratıklara 3 hasar.', effect: { dealToAll: 3 }, rarity: 'epic', faction: 'fire' },
  // ICE
  { id: 'c42', name: 'Buz Muhafızı', emoji: '🧊', cost: 3, type: 'creature', attack: 1, hp: 5, effect: { taunt: true, shield: 1 }, description: 'Kalkanlı taunt.', rarity: 'rare', faction: 'ice', keywords: ['Taunt', 'Kalkan'] },
  { id: 'c43', name: 'Kardan Adam', emoji: '⛄', cost: 4, type: 'creature', attack: 3, hp: 4, effect: { freeze: true, poison: true }, description: 'Dondurur ve zehirler.', rarity: 'epic', faction: 'ice', keywords: ['Don', 'Zehir'] },
  // SHADOW
  { id: 'c44', name: 'Gölge Tüccarı', emoji: '🧳', cost: 3, type: 'creature', attack: 2, hp: 3, effect: { addToHand: 's4', draw: 1 }, description: 'Oynarken Bilgelik kartı ekler ve 1 çeker.', rarity: 'rare', faction: 'shadow' },
  { id: 'c45', name: 'Karanlık Ritüel', emoji: '🔮', cost: 2, type: 'spell', description: '2 kart çek, 2 hasar al.', effect: { draw: 2, damage: 2 }, rarity: 'common', faction: 'shadow' },
  // HOLY
  { id: 'c46', name: 'Işık Topu', emoji: '☀️', cost: 1, type: 'spell', description: '2 hasar ver, 1 can yenile.', effect: { damage: 2, heal: 1 }, rarity: 'common', faction: 'holy' },
  { id: 'c47', name: 'Kutsal Şövalye', emoji: '🦄', cost: 7, type: 'creature', attack: 6, hp: 6, effect: { shield: 2, taunt: true, heal: 3 }, description: 'Kalkanlı, tauntlu, oynarken 3 can verir.', rarity: 'legendary', faction: 'holy', keywords: ['Kalkan', 'Taunt'] },
]

export const TOKEN_CARDS: CardDef[] = [
  { id: 'c_token_seedling', name: 'Fide', emoji: '🌱', cost: 0, type: 'creature', attack: 1, hp: 1, description: 'Minik bir fide.', rarity: 'common', faction: 'nature' },
  { id: 'c_token_frog', name: 'Kurbağa', emoji: '🐸', cost: 0, type: 'creature', attack: 2, hp: 2, description: 'Zavallı bir kurbağa.', rarity: 'common' },
]

export const STARTER_DECK = ['c1', 'c1', 'c8', 'c8', 'c14', 'c19', 'c10', 'c10', 'c2', 'c2', 'c3', 'c12', 'c16', 'c23', 'c23', 's1', 's2', 's4', 'w1', 's7']

export function getCard(id: string): CardDef | undefined {
  return allCards.find((c) => c.id === id) || TOKEN_CARDS.find((c) => c.id === id)
}

export function getCards(ids: string[]): CardDef[] {
  return ids.map((id) => getCard(id)).filter((c): c is CardDef => !!c)
}

const COLL_KEY = 'papaya.cards.collection'
const DECK_KEY = 'papaya.cards.deck'

export const ALL_CARDS = allCards

export function loadCollection(): CardCollection {
  try {
    const raw = localStorage.getItem(COLL_KEY)
    if (raw) return JSON.parse(raw) as CardCollection
  } catch { }
  const owned: Record<string, number> = {}
  STARTER_DECK.forEach((id) => { owned[id] = (owned[id] || 0) + 1 })
  return { owned, selectedDeck: [...STARTER_DECK], coins: 200, dust: 0, wins: 0, losses: 0, streak: 0, lastDaily: 0, heroXp: {}, heroWins: {} }
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
