import type { CardDef, BoardCreature } from '../../types'

interface CardViewProps {
  card: CardDef
  size?: 'sm' | 'md' | 'lg'
  creature?: BoardCreature
  disabled?: boolean
  onClick?: () => void
  selected?: boolean
  inactive?: boolean
}

const RARITY_BORDERS: Record<string, string> = {
  common: 'border-white/20',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-yellow-400/50',
}

const FACTION_GRADIENTS: Record<string, string> = {
  nature: 'from-emerald-900/60 to-emerald-800/30',
  fire: 'from-red-900/60 to-red-800/30',
  ice: 'from-cyan-900/60 to-cyan-800/30',
  shadow: 'from-purple-900/60 to-purple-800/30',
  holy: 'from-yellow-900/40 to-amber-800/30',
}

export default function CardView({ card, size = 'md', creature, disabled, onClick, selected, inactive }: CardViewProps) {
  const isSpell = card.type === 'spell'
  const isWeapon = card.type === 'weapon'
  const isCreature = card.type === 'creature'

  const dims = size === 'sm' ? 'w-20' : size === 'lg' ? 'w-36' : 'w-28'
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'
  const emojiSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'
  const pad = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${dims} shrink-0 rounded-2xl border-2 text-left transition-all duration-200 ${
        selected ? '-translate-y-4 scale-105' : ''
      } ${
        disabled ? 'brightness-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2'
      } ${
        inactive ? 'opacity-50 grayscale' : ''
      } ${RARITY_BORDERS[card.rarity]} bg-gradient-to-b ${FACTION_GRADIENTS[card.faction || 'nature']} backdrop-blur shadow-lg relative overflow-hidden`}
    >
      {card.rarity === 'legendary' && (
        <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-2xl blur-xl pointer-events-none" />
      )}
      <div className={`relative ${pad} flex flex-col gap-1`}>
        {/* Maliyet */}
        <div className="flex items-center justify-between">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/80 text-[10px] font-bold text-papaya-400 shadow-sm">
            {card.cost}
          </span>
          <span className="text-[10px] opacity-60">{card.rarity === 'legendary' ? '🌟' : card.rarity === 'epic' ? '💎' : ''}</span>
        </div>

        {/* Emoji */}
        <div className={`flex items-center justify-center ${emojiSize}`}>
          {card.emoji}
        </div>

        {/* İsim */}
        <div className={`${textSize} font-semibold text-white leading-tight text-center truncate`}>
          {card.name}
        </div>

        {/* Açıklama */}
        <div className={`${textSize === 'text-[10px]' ? 'text-[8px]' : 'text-[10px]'} text-white/50 text-center leading-tight`}>
          {card.description}
        </div>

        {/* Yaratık gücü */}
        {isCreature && (
          <div className="mt-auto flex items-center justify-between">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/30 text-[10px] font-bold text-red-300">
              {creature?.attack ?? card.attack}
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/30 text-[10px] font-bold text-green-300">
              {creature?.hp ?? card.hp}
            </span>
          </div>
        )}

        {/* Silah */}
        {isWeapon && card.effect?.buffAttack && (
          <div className="text-center">
            <span className="rounded-full bg-orange-500/30 px-2 text-[10px] font-bold text-orange-300">
              +{card.effect.buffAttack} ⚔️
            </span>
          </div>
        )}

        {/* Etiket */}
        <div className={`text-[8px] uppercase tracking-wider text-center ${
          isSpell ? 'text-purple-300' : isWeapon ? 'text-orange-300' : 'text-emerald-300'
        }`}>
          {isSpell ? 'Büyü' : isWeapon ? 'Silah' : 'Yaratık'}
        </div>
      </div>
    </button>
  )
}
