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
        <div className="text-[10px] font-semibold uppercase tracking-wider px-2"
          style={{ color: isOpponent ? '#fca5a5' : '#86efac' }}
        >
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
          const hasTaunt = cr.taunt
          const hasShield = (cr.shield || 0) > 0
          const hasPoison = cr.poison
          const hasFrenzy = cr.frenzy

          let borderCls = 'border-white/10 bg-white/5'
          if (frozen) borderCls = 'border-cyan-500/40 bg-cyan-500/10'
          else if (isOpponent) borderCls = 'border-red-500/30 bg-red-500/5'
          else if (canHit) borderCls = 'border-green-500/40 bg-green-500/10 cursor-pointer hover:bg-green-500/20 active:scale-95'

          return (
            <div
              key={cr.id}
              onClick={() => {
                if (selectable && onTarget) onTarget(cr)
                if (!isOpponent && canHit && onAttack) onAttack(cr)
              }}
              className={`relative flex w-16 flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                hasTaunt ? 'border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)]' : ''
              } ${selectable ? 'cursor-pointer hover:border-papaya-400/50 hover:bg-papaya-500/10' : ''} ${borderCls}`}
            >
              {frozen && (
                <div className="absolute -top-2 -right-2 text-xs animate-pulse">🧊</div>
              )}
              {hasTaunt && (
                <div className="absolute -top-2 -left-2 text-xs">🛡️</div>
              )}
              {hasShield && (
                <div className="absolute -bottom-1 -right-1 text-[9px] bg-blue-500/40 rounded-full px-1 text-blue-200">🛡️{cr.shield}</div>
              )}
              {hasPoison && (
                <div className="absolute -bottom-1 -left-1 text-[9px]">☠️</div>
              )}

              <span className="text-xl">{def.emoji}</span>
              <span className="text-[10px] font-semibold text-white truncate max-w-full">{def.name}</span>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-red-300">⚔️{cr.attack}</span>
                <span className={isDamaged ? 'text-red-400' : 'text-green-300'}>
                  ❤️{cr.hp}
                </span>
              </div>
              {hasFrenzy && (
                <div className="text-[8px] text-orange-300 font-bold uppercase">Frenzy</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
