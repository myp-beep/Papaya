import type { CardDef } from '../../types'
import CardView from './CardView'

interface CardHandProps {
  cards: CardDef[]
  mana: number
  onPlayCard: (card: CardDef, index: number) => void
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  disabled?: boolean
}

export default function CardHand({ cards, mana, onPlayCard, selectedIndex, onSelect, disabled }: CardHandProps) {
  return (
    <div className="flex items-end gap-2 overflow-x-auto px-2 pb-2 scrollbar-thin">
      {cards.length === 0 && (
        <div className="flex h-28 w-full items-center justify-center text-sm text-white/30">
          Elin boş 🃏
        </div>
      )}
      {cards.map((card, i) => {
        const canPlay = mana >= card.cost && !disabled
        return (
          <div key={card.id + '-' + i} className="flex flex-col items-center gap-1">
            {canPlay && (
              <button
                onClick={() => onPlayCard(card, i)}
                className="rounded-full bg-papaya-500 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-papaya-400 active:scale-90"
              >
                Oyna
              </button>
            )}
            <div onClick={() => !disabled && onSelect(selectedIndex === i ? null : i)}>
              <CardView
                card={card}
                size="sm"
                disabled={!canPlay}
                selected={selectedIndex === i}
              />
            </div>
            <div className="text-[9px] text-white/40">{card.cost} 💎</div>
          </div>
        )
      })}
    </div>
  )
}
