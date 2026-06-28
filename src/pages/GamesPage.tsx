import { useNavigate } from 'react-router-dom'

interface GameItem {
  emoji: string
  name: string
  desc: string
  to?: string
}

const GAMES: GameItem[] = [
  { emoji: '🧠', name: 'Hafıza', desc: 'Çiftleri eşleştir', to: '/games/memory' },
  { emoji: '🎯', name: 'Hedef', desc: 'Yakında' },
  { emoji: '🧩', name: 'Bulmaca', desc: 'Yakında' },
  { emoji: '♟️', name: 'Strateji', desc: 'Yakında' },
]

export default function GamesPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Oyunlar</h1>
        <p className="text-sm text-white/45">Arkadaşlarınla anlık oyna 🎮</p>
      </header>

      {/* Öne çıkan oynanabilir oyun */}
      <button
        onClick={() => navigate('/games/memory')}
        className="mx-5 mt-2 flex items-center gap-4 rounded-3xl border border-papaya-500/30 bg-gradient-to-br from-papaya-500/20 to-grape-500/10 p-5 text-left shadow-card transition active:scale-[0.99]"
      >
        <span className="text-5xl">🧠</span>
        <div className="flex-1">
          <div className="text-lg font-bold text-white">Hafıza Eşleştirme</div>
          <p className="text-sm text-white/55">Çiftleri en kısa sürede bul. Hemen oyna!</p>
        </div>
        <span className="rounded-full bg-papaya-500 px-3 py-1.5 text-sm font-bold text-white shadow-glow">
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
              onClick={() => g.to && navigate(g.to)}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border border-ink-700 bg-ink-800 shadow-card transition ${
                playable ? 'active:scale-[0.97] hover:border-papaya-500/40' : 'opacity-70'
              }`}
            >
              <span className="text-4xl">{g.emoji}</span>
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
