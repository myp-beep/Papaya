import EmptyState from '../components/EmptyState'

const GAMES = [
  { emoji: '🎯', name: 'Hedef Vuruşu' },
  { emoji: '🧩', name: 'Bulmaca' },
  { emoji: '♟️', name: 'Strateji' },
  { emoji: '🏎️', name: 'Yarış' },
]

export default function GamesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Oyunlar</h1>
        <p className="text-sm text-white/45">Arkadaşlarınla anlık oyna 🎮</p>
      </header>

      <div className="grid grid-cols-2 gap-3 px-5 pt-2">
        {GAMES.map((g) => (
          <div
            key={g.name}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border border-ink-700 bg-ink-800 shadow-card"
          >
            <span className="text-4xl">{g.emoji}</span>
            <span className="text-sm font-semibold text-white/80">{g.name}</span>
            <span className="rounded-full bg-grape-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-grape-400">
              Yakında
            </span>
          </div>
        ))}
      </div>

      <EmptyState
        emoji="🕹️"
        title="Oyun modülü yolda"
        subtitle="WePlay tarzı çok oyunculu mini oyunlar bir sonraki sürümde geliyor."
      />
    </div>
  )
}
