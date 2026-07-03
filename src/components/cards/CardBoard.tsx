import type { BoardCreature } from '../../types'
import { getCard } from '../../data/cardStore'

interface CardBoardProps {
  creatures: BoardCreature[]
  isOpponent?: boolean
  onAttack?: (creature: BoardCreature) => void
  onTarget?: (creature: BoardCreature) => void
  selectable?: boolean
  title?: string
}

export default function CardBoard({ creatures, isOpponent, onAttack, onTarget, selectable, title }: CardBoardProps) {
  return (
    <div className="flex flex-col gap-1">
      {title && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2">
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-2 px-2 min-h-[80px]">
        {creatures.length === 0 && (
          <div className={`flex w-full items-center justify-center text-xs text-white/20 ${isOpponent ? 'h-16' : 'h-20'}`}>
            {isOpponent ? '---' : 'Boş'}
          </div>
        )}
        {creatures.map((cr) => {
          const def = getCard(cr.cardId)
          if (!def) return null
          const frozen = cr.frozen
          const canHit = cr.canAttack && !frozen && !cr.silence
          const isDamaged = cr.hp < cr.maxHp

          return (
            <div
              key={cr.id}
              onClick={() => {
                if (selectable && onTarget) onTarget(cr)
                if (!isOpponent && canHit && onAttack) onAttack(cr)
              }}
              className={`relative flex w-16 flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                frozen
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : isOpponent
                    ? 'border-red-500/30 bg-red-500/5'
                    : canHit
                      ? 'border-green-500/40 bg-green-500/10 cursor-pointer hover:bg-green-500/20 active:scale-95'
                      : 'border-white/10 bg-white/5'
              } ${selectable ? 'cursor-pointer hover:border-papaya-400/50 hover:bg-papaya-500/10' : ''}`}
            >
              {/* Frozen göstergesi */}
              {frozen && (
                <div className="absolute -top-1.5 -right-1.5 text-xs">🧊</div>
              )}

              <span className="text-xl">{def.emoji}</span>
              <span className="text-[10px] font-semibold text-white truncate max-w-full">{def.name}</span>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-red-300">⚔️{cr.attack}</span>
                <span className={isDamaged ? 'text-red-400' : 'text-green-300'}>
                  ❤️{cr.hp}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
