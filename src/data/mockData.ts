import type { ChatState, User } from '../types'

/** Mevcut (giriş yapmış varsayılan) kullanıcı. */
export const ME: User = {
  id: 'me',
  name: 'Sen',
  avatar: '😎',
  color: '#f95816',
  online: true,
}

export const USERS: Record<string, User> = {
  ela: { id: 'ela', name: 'Ela', avatar: '🦊', color: '#fb7a3c', online: true },
  kaan: { id: 'kaan', name: 'Kaan', avatar: '🐼', color: '#8b5cf6', online: true },
  deniz: { id: 'deniz', name: 'Deniz', avatar: '🐙', color: '#22b8cf', online: false },
  papaya: { id: 'papaya', name: 'Papaya Bot', avatar: '🍈', color: '#f95816', online: true },
  lina: { id: 'lina', name: 'Lina', avatar: '🦄', color: '#e64980', online: false },
}

const now = Date.now()
const min = 60_000

/** İlk açılışta localStorage'a yazılacak başlangıç (seed) verisi. */
export const SEED_STATE: ChatState = {
  conversations: [
    {
      id: 'c-papaya',
      userId: 'papaya',
      unread: 1,
      messages: [
        {
          id: 'm1',
          conversationId: 'c-papaya',
          senderId: 'papaya',
          text: "Papaya'ya hoş geldin! 🍈 Ben asistanınım. Bana bir şeyler yaz, hemen cevap veririm.",
          sentAt: now - 90 * min,
        },
        {
          id: 'm2',
          conversationId: 'c-papaya',
          senderId: 'papaya',
          text: 'Yakında oyunlar ve keşfet sekmesi de gelecek 👀',
          sentAt: now - 4 * min,
        },
      ],
    },
    {
      id: 'c-ela',
      userId: 'ela',
      unread: 2,
      messages: [
        {
          id: 'm3',
          conversationId: 'c-ela',
          senderId: 'ela',
          text: 'Bu akşam oyun var mı? 🎮',
          sentAt: now - 60 * min,
        },
        {
          id: 'm4',
          conversationId: 'c-ela',
          senderId: 'me',
          text: 'Kesinlikle, 21:00 gibi?',
          sentAt: now - 58 * min,
        },
        {
          id: 'm5',
          conversationId: 'c-ela',
          senderId: 'ela',
          text: 'Oldu, diğerlerini de çağırıyorum 🔥',
          sentAt: now - 12 * min,
        },
      ],
    },
    {
      id: 'c-kaan',
      userId: 'kaan',
      unread: 0,
      messages: [
        {
          id: 'm6',
          conversationId: 'c-kaan',
          senderId: 'me',
          text: 'Kaan skor tablosunu gördün mü 😏',
          sentAt: now - 200 * min,
        },
        {
          id: 'm7',
          conversationId: 'c-kaan',
          senderId: 'kaan',
          text: 'Gördüm gördüm, rövanş istiyorum 😤',
          sentAt: now - 195 * min,
        },
      ],
    },
    {
      id: 'c-deniz',
      userId: 'deniz',
      unread: 0,
      messages: [
        {
          id: 'm8',
          conversationId: 'c-deniz',
          senderId: 'deniz',
          text: 'Tasarımı çok temiz olmuş 👏',
          sentAt: now - 1440 * min,
        },
      ],
    },
  ],
}
