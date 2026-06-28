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
