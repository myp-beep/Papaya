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
