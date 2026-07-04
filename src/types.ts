export interface User {
  id: string
  name: string
  /** Emoji avatar (mock için basit ve hızlı). */
  avatar: string
  /** Tema rengi (avatar arka planı). */
  color: string
  online: boolean
}

export interface Message {
  id: string
  conversationId: string
  /** Gönderen kullanıcı id'si. 'me' = mevcut kullanıcı. */
  senderId: string
  text: string
  /** Unix ms. */
  sentAt: number
}

export interface Conversation {
  id: string
  /** Karşıdaki kullanıcının id'si (1-1 sohbet). */
  userId: string
  messages: Message[]
  /** Okunmamış mesaj sayısı (mevcut kullanıcı için). */
  unread: number
}

/** localStorage'da tutulan tüm uygulama durumu. */
export interface ChatState {
  conversations: Conversation[]
}

// --- Realtime-first uniform sohbet modeli ---
export interface Peer {
  id: string
  name: string
  avatar: string
  color: string
  online?: boolean
}

export interface ChatMessage {
  id: string
  mine: boolean
  text: string
  ts: number
  streaming?: boolean
}

export interface LiveRoom {
  id: string
  hostId: string
  hostName: string
  hostAvatar: string
  hostColor: string
  title: string
  status: 'live' | 'ended'
  viewerCount: number
  startedAt: number
}

export interface LiveMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  text: string
  ts: number
}

export interface ChatThread {
  id: string // = peer.id (1-1)
  peer: Peer
  messages: ChatMessage[]
  unread: number
}

export interface Post {
  id: string
  /** Gönderiyi paylaşan kullanıcı id'si ('me' dahil). */
  authorId: string
  text: string
  likes: number
  likedByMe: boolean
  createdAt: number
}

/** Düzenlenebilir profil (localStorage). */
export interface Profile {
  name: string
  avatar: string
  color: string
  status: string
}

// --- Papaya Krallığı ek tipler ---

export interface QuestObjective {
  type: 'collect' | 'defeat' | 'talk' | 'explore' | 'fish'
  targetId: string
  label: string
  current: number
  needed: number
}

export interface Quest {
  id: string
  name: string
  desc: string
  emoji: string
  objectives: QuestObjective[]
  xpReward: number
  itemReward?: string
}

export interface EnemyDef {
  id: string
  name: string
  emoji: string
  color: string
  hp: number
  damage: number
  speed: number
  patrolPath: Vec2[]
  aggroRange: number
}

export interface Vec2 {
  x: number
  z: number
}

export interface MapRegion {
  id: string
  name: string
  emoji: string
  color: string
  center: Vec2
  radius: number
}

export interface FishingSpot {
  id: string
  position: Vec2
}

export interface InventoryItem {
  id: string
  name: string
  emoji: string
  desc: string
}

export interface GameState {
  hp: number
  maxHp: number
  inventory: InventoryItem[]
  quests: Quest[]
  currentQuestIndex: number
  defeatedEnemies: string[]
  discoveredRegions: string[]
}


// --- Kart Savaşı tipleri ---

export type CardType = 'creature' | 'spell' | 'weapon'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type GamePhase = 'mulligan' | 'draw' | 'main' | 'attack' | 'end'
export type Faction = 'nature' | 'fire' | 'ice' | 'shadow' | 'holy'
export type HeroId = 'warrior' | 'mage' | 'druid' | 'shadow'

export interface CardEffect {
  damage?: number
  heal?: number
  draw?: number
  buffAttack?: number
  buffHp?: number
  freeze?: boolean
  taunt?: boolean
  charge?: boolean
  dealToAll?: number
  destroyRandom?: boolean
  stealLife?: boolean
  win?: boolean
  silence?: boolean
  poison?: boolean
  shield?: number
  summon?: { id: string; count: number }
  copyTarget?: boolean
  transform?: string
  frenzy?: boolean
  deathrattle?: { effect: CardEffect }
  combo?: { effect: CardEffect }
  returnToHand?: boolean
  reduceCost?: number
  discover?: boolean
  addToHand?: string
}

export interface CardDef {
  id: string
  name: string
  emoji: string
  cost: number
  type: CardType
  attack?: number
  hp?: number
  description: string
  effect?: CardEffect
  rarity: Rarity
  faction?: Faction
  keywords?: string[]
}

export interface BoardCreature {
  id: string
  cardId: string
  attack: number
  hp: number
  maxHp: number
  canAttack: boolean
  frozen: boolean
  taunt: boolean
  charge: boolean
  silence: boolean
  poison: boolean
  shield: number
  frenzy: boolean
  deathrattle?: { effect: CardEffect }
  summonedThisTurn?: boolean
}

export interface HeroDef {
  id: HeroId
  name: string
  emoji: string
  color: string
  hp: number
  powerName: string
  powerDesc: string
  powerCost: number
  powerEffect: CardEffect
}

export interface PlayerState {
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  deck: string[]
  hand: string[]
  board: BoardCreature[]
  weaponAtk: number
  weaponDurability: number
  hero: HeroId
  heroPowerUsed: boolean
  armor: number
}

export interface CardGameState {
  player: PlayerState
  opponent: PlayerState
  turn: number
  phase: GamePhase
  turnOwner: 0 | 1
  winner: number | null
  turnActions: number
  log: string[]
  botDifficulty: BotLevel
}

export type BotLevel = 'easy' | 'normal' | 'hard'

export interface CardCollection {
  owned: Record<string, number>
  selectedDeck: string[]
  coins: number
  dust: number
  wins: number
  losses: number
  streak: number
  lastDaily: number
  heroXp: Record<string, number>
  heroWins: Record<string, number>
}

export interface CardPackResult {
  cards: CardDef[]
}

// --- Arkadaşlık Sistemi ---

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined'

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: FriendRequestStatus
  createdAt: number
  /** fromUserId kullanıcısının bilgileri (görüntüleme için). */
  fromUser?: { name: string; avatar: string; color: string }
  /** toUserId kullanıcısının bilgileri. */
  toUser?: { name: string; avatar: string; color: string }
}
