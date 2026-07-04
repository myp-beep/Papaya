import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { haptic } from '../lib/haptics'
import { isMuted, setMuted, sfx } from '../lib/sound'
import { getStats, levelInfo, ACHIEVEMENTS } from '../data/statsStore'
import { useChat } from '../data/chatStore'
import { useProfile } from '../data/profileStore'
import Avatar from '../components/Avatar'
import type { Peer } from '../types'

interface GameItem {
  emoji: string
  name: string
  desc: string
  to?: string
  online?: boolean
}

const GAMES: GameItem[] = [
  { emoji: '🎴', name: 'Kart Savaşı', desc: 'Strateji kart oyunu', to: '/games/cards' },
  { emoji: '⭕', name: 'XOX', desc: 'Bota karşı', to: '/games/tic' },
  { emoji: '⚓', name: 'Amiral Battı', desc: 'Donanma savaşı', to: '/games/battleship' },
]

const CARD_LINKS: GameItem[] = [
  { emoji: '🃏', name: 'Deste Oluştur', desc: 'Kartlarını seç', to: '/games/cards/deck' },
  { emoji: '💎', name: 'Koleksiyon', desc: 'Kartların ve paketler', to: '/games/cards/collection' },
  { emoji: '📖', name: 'Kart Galerisi', desc: 'Tüm kartlar', to: '/games/cards/gallery' },
]

export default function GamesPage() {
  const navigate = useNavigate()
  const [muted, setMutedState] = useState(isMuted())
  const [showAchievements, setShowAchievements] = useState(false)
  const [showOnlineBattleship, setShowOnlineBattleship] = useState(false)
  const stats = getStats()
  const lvl = levelInfo(stats.xp)
  const { onlineUsers, sendEvent, myId } = useChat()
  const { profile } = useProfile()

  const go = (to: string) => {
    haptic('medium')
    sfx.tap()
    navigate(to)
  }

  const toggleMute = () => {
    const m = !muted
    setMuted(m)
    setMutedState(m)
    if (!m) sfx.tap()
  }

  const inviteToBattleship = (peer: Peer) => {
    haptic('medium')
    sfx.tap()
    const gameId = `battleship-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    sendEvent('game:invite', {
      to: peer.id,
      game: 'battleship',
      gameId,
      from: myId,
      hostProfile: { name: profile.name, avatar: profile.avatar, color: profile.color },
    })
    navigate(`/play/battleship/${gameId}`, {
      state: { gameId, peer, role: 'host' },
    })
    setShowOnlineBattleship(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-5 pb-2 pt-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Oyunlar</h1>
          <p className="text-sm text-white/45">Arkadaşlarınla anlık oyna 🎮</p>
        </div>
        <button
          onClick={toggleMute}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-lg transition active:scale-90"
          title={muted ? 'Sesi aç' : 'Sesi kapat'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* Oyuncu ilerlemesi */}
      <button
        onClick={() => setShowAchievements(true)}
        className="glass mx-5 mt-1 rounded-2xl p-3 text-left transition active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-papaya-400 to-papaya-600 text-xs font-extrabold shadow-glow">
              {lvl.level}
            </span>
            Seviye {lvl.level}
          </span>
          <span className="text-xs text-white/50">
            🏅 {stats.unlocked.length}/{ACHIEVEMENTS.length} başarım ›
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-papaya-400 to-papaya-600 transition-all"
            style={{ width: `${lvl.pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>{lvl.cur}/{lvl.next} XP</span>
          <span>{stats.wins} galibiyet · {stats.plays} oyun</span>
        </div>
      </button>

      {/* Öne çıkan: co-op hikâye macerası */}
      <button
        onClick={() => go('/games/coop')}
        className="relative mx-5 mt-3 flex items-center gap-4 overflow-hidden rounded-3xl border border-grape-500/40 bg-gradient-to-br from-grape-500/25 via-papaya-600/10 to-papaya-500/25 p-5 text-left shadow-card transition active:scale-[0.98]"
      >
        <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-grape-500/25 blur-2xl" />
        <span className="floaty text-5xl drop-shadow-[0_8px_20px_rgba(139,92,246,0.5)]">🏰</span>
        <div className="relative flex-1">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            Papaya Krallığı
            <span className="rounded-full bg-grape-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-grape-300">Co-op · 3D</span>
          </div>
          <p className="text-sm text-white/60">Hikâyeli 3B macera. NPC'ler, görevler, birlikte oyna!</p>
        </div>
        <span className="relative rounded-full bg-gradient-to-br from-grape-400 to-grape-600 px-4 py-1.5 text-sm font-bold text-white shadow-glow">
          Başla
        </span>
      </button>

      <h2 className="px-5 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-white/40">
        Tüm oyunlar
      </h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        {GAMES.map((g) => (
          <button
            key={g.name}
            onClick={() => g.to && go(g.to)}
            className="glass flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl transition active:scale-[0.96] hover:border-papaya-500/40 hover:bg-white/[0.07]"
          >
            <span className="text-4xl drop-shadow-lg">{g.emoji}</span>
            <span className="text-sm font-semibold text-white/80">{g.name}</span>
            <span className="rounded-full bg-papaya-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-papaya-400">
              {g.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Online Amiral Battı */}
      <div className="px-5 pt-3">
        <button
          onClick={() => { haptic('medium'); sfx.tap(); setShowOnlineBattleship(true) }}
          className="w-full rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500/15 to-sky-500/15 p-4 text-left transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <div>
              <div className="flex items-center gap-2 font-bold text-white">
                Online Amiral Battı
                <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">Canlı</span>
              </div>
              <p className="text-sm text-white/50">Arkadaşını davet et, sırayla ateş et!</p>
            </div>
            <span className="ml-auto text-white/40">›</span>
          </div>
        </button>
      </div>

      <h2 className="px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-white/40">
        🎴 Kart Savaşı
      </h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        {CARD_LINKS.map((g) => (
          <button
            key={g.name}
            onClick={() => g.to && go(g.to)}
            className="glass flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl transition active:scale-[0.96] hover:border-papaya-500/40 hover:bg-white/[0.07]"
          >
            <span className="text-4xl drop-shadow-lg">{g.emoji}</span>
            <span className="text-sm font-semibold text-white/80">{g.name}</span>
            <span className="rounded-full bg-papaya-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-papaya-400">
              {g.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Online arkadaş seçme paneli */}
      {showOnlineBattleship && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm animate-pop-in"
          onClick={() => setShowOnlineBattleship(false)}
        >
          <div className="glass max-h-[70%] w-full overflow-y-auto rounded-t-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">⚔️ Online Amiral Battı</h3>
              <button onClick={() => setShowOnlineBattleship(false)} className="text-white/50">✕</button>
            </div>
            <p className="mb-4 text-sm text-white/50">Davet etmek için bir arkadaş seç:</p>
            {onlineUsers.length === 0 ? (
              <div className="rounded-2xl border border-ink-700 bg-ink-800/60 p-6 text-center text-sm text-white/40">
                Çevrimiçi arkadaş bulunamadı. Sayfayı yenile veya daha sonra dene.
              </div>
            ) : (
              <ul className="space-y-2">
                {onlineUsers.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => inviteToBattleship(u)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800/60 p-3 text-left transition hover:border-sky-500/40 hover:bg-ink-700/60"
                    >
                      <Avatar emoji={u.avatar} color={u.color} size={44} online />
                      <div className="flex-1">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-white/40">Çevrimiçi · Amiral Battı davet et</div>
                      </div>
                      <span className="text-xl">⚓</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Başarımlar paneli */}
      {showAchievements && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm animate-pop-in"
          onClick={() => setShowAchievements(false)}
        >
          <div className="glass max-h-[70%] w-full overflow-y-auto rounded-t-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">🏅 Başarımlar</h3>
              <button onClick={() => setShowAchievements(false)} className="text-white/50">✕</button>
            </div>
            <ul className="space-y-2">
              {ACHIEVEMENTS.map((a) => {
                const open = stats.unlocked.includes(a.id)
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      open ? 'border-papaya-500/40 bg-papaya-500/10' : 'border-ink-700 bg-ink-800/60 opacity-60'
                    }`}
                  >
                    <span className={`text-2xl ${open ? '' : 'grayscale'}`}>{a.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{a.name}</div>
                      <div className="text-xs text-white/55">{a.desc}</div>
                    </div>
                    {open && <span className="text-emerald-400">✓</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
