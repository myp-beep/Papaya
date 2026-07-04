import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allCards } from '../data/cardStore'
import { Faction, Rarity, CardType } from '../types'

const FACTIONS: (Faction | 'all')[] = ['all', 'nature', 'fire', 'ice', 'shadow', 'holy']
const RARITIES: (Rarity | 'all')[] = ['all', 'common', 'rare', 'epic', 'legendary']
const TYPES: (CardType | 'all')[] = ['all', 'creature', 'spell', 'weapon']

const FACTION_EMOJI: Record<string, string> = { all: '📦', nature: '🌿', fire: '🔥', ice: '❄️', shadow: '👻', holy: '✨' }
const FACTION_COLORS: Record<string, string> = { nature: 'from-emerald-900/60 to-emerald-800/30', fire: 'from-red-900/60 to-red-800/30', ice: 'from-cyan-900/60 to-cyan-800/30', shadow: 'from-purple-900/60 to-purple-800/30', holy: 'from-yellow-900/40 to-amber-800/30' }
const RARITY_BORDERS: Record<string, string> = { common: 'border-white/20', rare: 'border-blue-500/40', epic: 'border-purple-500/40', legendary: 'border-yellow-400/50' }
const RARITY_COLORS: Record<string, string> = { common: 'text-gray-300', rare: 'text-blue-300', epic: 'text-purple-300', legendary: 'text-yellow-300' }

export default function CardGalleryPage() {
  const navigate = useNavigate()
  const [faction, setFaction] = useState<Faction | 'all'>('all')
  const [rarity, setRarity] = useState<Rarity | 'all'>('all')
  const [type, setType] = useState<CardType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const filtered = allCards.filter(c => {
    if (faction !== 'all' && c.faction !== faction) return false
    if (rarity !== 'all' && c.rarity !== rarity) return false
    if (type !== 'all' && c.type !== type) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const card = selectedCard ? allCards.find(c => c.id === selectedCard) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate('/games')} className="text-white/60 hover:text-white text-lg">‹</button>
          <h1 className="text-2xl font-bold text-white">📖 Kart Galerisi</h1>
          <span className="text-white/40 text-sm ml-auto">{allCards.length} kart</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {FACTIONS.map(f => (
            <button key={f} onClick={() => setFaction(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${faction === f ? 'bg-white/20 text-white border border-white/40' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {FACTION_EMOJI[f]} {f === 'all' ? 'Tümü' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {RARITIES.map(r => (
            <button key={r} onClick={() => setRarity(r)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${rarity === r ? 'bg-white/20 text-white border border-white/40' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {r === 'all' ? '📊 Tümü' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${type === t ? 'bg-white/20 text-white border border-white/40' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {t === 'all' ? '🃏 Tümü' : t === 'creature' ? '👾 Yaratık' : t === 'spell' ? '🔮 Büyü' : '🗡️ Silah'}
            </button>
          ))}
          <input
            type="text"
            placeholder="Kart ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xs text-white placeholder-white/30 outline-none focus:border-white/40"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filtered.map(card => (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
              className={`bg-gradient-to-br ${FACTION_COLORS[card.faction || 'nature']} ${RARITY_BORDERS[card.rarity]} rounded-xl p-2 text-center border-2 transition hover:scale-105 ${selectedCard === card.id ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <div className="text-2xl">{card.emoji}</div>
              <div className="text-xs font-bold text-white truncate">{card.name}</div>
              <div className="flex justify-center gap-2 text-[10px] mt-1">
                <span className="text-blue-400">{card.cost}💎</span>
                {card.type === 'creature' && (
                  <><span className="text-red-300">{card.attack}⚔️</span><span className="text-green-300">{card.hp}❤️</span></>
                )}
              </div>
              <div className={`text-[9px] ${RARITY_COLORS[card.rarity]}`}>{card.rarity}</div>
              {card.keywords && (
                <div className="flex gap-0.5 justify-center mt-1 flex-wrap">
                  {card.keywords.map(k => <span key={k} className="text-[8px] bg-white/10 px-1 rounded text-white/60">{k}</span>)}
                </div>
              )}
            </button>
          ))}
        </div>

        {card && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
            <div className="bg-gray-800 rounded-2xl p-6 border border-white/20 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-3">
                <div className={`text-5xl ${FACTION_COLORS[card.faction || 'nature']} bg-gradient-to-br rounded-xl p-3`}>{card.emoji}</div>
                <button onClick={() => setSelectedCard(null)} className="text-white/40 hover:text-white">✕</button>
              </div>
              <h2 className="text-xl font-bold text-white">{card.name}</h2>
              <div className="flex gap-2 mt-1 text-sm">
                <span className="text-blue-400">{card.cost} Mana</span>
                <span className={RARITY_COLORS[card.rarity]}>{card.rarity}</span>
                {card.faction && <span>{FACTION_EMOJI[card.faction]} {card.faction}</span>}
              </div>
              {card.type === 'creature' && (
                <div className="flex gap-4 mt-2 text-lg">
                  <span className="text-red-300">⚔️ {card.attack}</span>
                  <span className="text-green-300">❤️ {card.hp}</span>
                </div>
              )}
              {card.type === 'weapon' && card.effect?.buffAttack && (
                <div className="mt-2 text-orange-300 text-sm">🗡️ +{card.effect.buffAttack} Saldırı</div>
              )}
              <p className="text-white/60 mt-2 text-sm">{card.description}</p>
              {card.effect && (
                <div className="mt-3 bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] uppercase text-white/40 mb-1">Efektler</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(card.effect).map(([key, val]) => (
                      <span key={key} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70">
                        {key}: {typeof val === 'boolean' ? '✓' : JSON.stringify(val)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {card.keywords && (
                <div className="mt-2 flex gap-1">
                  {card.keywords.map(k => <span key={k} className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded">{k}</span>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
