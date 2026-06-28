import { useNavigate } from 'react-router-dom'
import { haptic } from '../lib/haptics'

interface GameItem {
  emoji: string
  name: string
  desc: string
  to?: string
}

const GAMES: GameItem[] = [
  { emoji: '🧠', name: 'Hafıza', desc: 'Çiftleri eşleştir', to: '/games/memory' },
  { emoji: '⭕', name: 'XOX', desc: 'Bota karşı', to: '/games/tic' },
  { emoji: '🎯', name: 'Hızlı Dokun', desc: 'Reaksiyon', to: '/games/reaction' },
  { emoji: '🏎️', name: 'Yarış', desc: 'Yakında' },
]

export default function GamesPage() {
  const navigate = useNavigate()
  const go = (to: string) => {
    haptic('medium')
    navigate(to)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Oyunlar</h1>
        <p className="text-sm text-white/45">Arkadaşlarınla anlık oyna 🎮</p>
      </header>

      {/* Öne çıkan oynanabilir oyun */}
      <button
        onClick={() => go('/games/memory')}
        className="relative mx-5 mt-2 flex items-center gap-4 overflow-hidden rounded-3xl border border-papaya-500/30 bg-gradient-to-br from-papaya-500/25 via-papaya-600/10 to-grape-500/20 p-5 text-left shadow-card transition active:scale-[0.98]"
      >
        <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-papaya-500/20 blur-2xl" />
        <span className="floaty text-5xl drop-shadow-[0_8px_20px_rgba(249,88,22,0.5)]">🧠</span>
        <div className="relative flex-1">
          <div className="text-lg font-bold text-white">Hafıza Eşleştirme</div>
          <p className="text-sm text-white/60">Çiftleri en kısa sürede bul. Hemen oyna!</p>
        </div>
        <span className="relative rounded-full bg-gradient-to-br from-papaya-400 to-papaya-600 px-4 py-1.5 text-sm font-bold text-white shadow-glow">
          Oyna
        </span>
      </button>

      <h2 className="px-5 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-white/40">
        Tüm oyunlar
      </h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        {GAMES.map((g) => {
          const playable = !!g.to
          return (
            <button
              key={g.name}
              disabled={!playable}
              onClick={() => g.to && go(g.to)}
              className={`glass flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl transition ${
                playable ? 'active:scale-[0.96] hover:border-papaya-500/40 hover:bg-white/[0.07]' : 'opacity-60'
              }`}
            >
              <span className="text-4xl drop-shadow-lg">{g.emoji}</span>
              <span className="text-sm font-semibold text-white/80">{g.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  playable
                    ? 'bg-papaya-500/15 text-papaya-400'
                    : 'bg-grape-500/15 text-grape-400'
                }`}
              >
                {playable ? 'Oyna' : 'Yakında'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="h-6" />
    </div>
  )
}
