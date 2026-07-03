
import { heroes } from '../../data/cardHeroes'
import { HeroId } from '../../types'

interface Props {
  selected: HeroId | null
  onSelect: (id: HeroId) => void
}

export default function HeroSelect({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold text-white">Kahraman Seç</h2>
      <div className="flex gap-4 flex-wrap justify-center">
        {heroes.map((h) => (
          <button
            key={h.id}
            onClick={() => onSelect(h.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[140px] ${
              selected === h.id
                ? 'border-yellow-400 bg-white/20 scale-105 shadow-lg shadow-yellow-400/30'
                : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
            }`}
            style={{ borderColor: selected === h.id ? '#facc15' : undefined }}
          >
            <span className="text-5xl">{h.emoji}</span>
            <span className="text-white font-bold text-lg">{h.name}</span>
            <div className="text-white/70 text-xs text-center">
              <div>❤️ {h.hp} HP</div>
              <div className="mt-1 font-semibold text-white/90">{h.powerName}</div>
              <div className="text-white/60">{h.powerDesc}</div>
              <div className="text-yellow-400 text-xs mt-1">[{h.powerCost} mana]</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
