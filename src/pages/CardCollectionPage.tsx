import { useState } from 'react'
import { allCards as ALL_CARDS, loadCollection, saveCollection } from '../data/cardStore'
import { openPack, disenchantValue, addCard, addCoins, addDust, canCraft } from '../data/cardProgression'
import { CardDef, Rarity } from '../types'
import { sfx } from '../lib/sound'

const RARITY_COLORS: Record<Rarity, string> = { common: 'text-gray-300', rare: 'text-blue-300', epic: 'text-purple-300', legendary: 'text-yellow-300' }
const RARITY_BG: Record<Rarity, string> = { common: 'from-gray-600 to-gray-700', rare: 'from-blue-700 to-blue-900', epic: 'from-purple-700 to-purple-900', legendary: 'from-yellow-600 to-orange-800' }

export default function CardCollectionPage() {
  const [collection, setCollection] = useState(() => loadCollection())
  const [packResult, setPackResult] = useState<CardDef[] | null>(null)
  const [packReveal, setPackReveal] = useState(-1)
  const [showCraft, setShowCraft] = useState(false)

  function handleOpenPack() {
    if (collection.coins < 100) return
    let c = addCoins(collection, -100)
    const result = openPack()
    result.cards.forEach(card => {
      c = addCard(c, card.id)
    })
    setCollection(c)
    saveCollection(c)
    setPackResult(result.cards)
    setPackReveal(0)
    sfx.packOpen()
    let i = 0
    const interval = setInterval(() => {
      i++
      setPackReveal(i)
      if (i >= result.cards.length) {
        clearInterval(interval)
        result.cards.forEach(card => {
          if (card.rarity === 'legendary' || card.rarity === 'epic') sfx.rarityGlow()
        })
      }
    }, 600)
  }

  function handleDisenchant(id: string) {
    const card = ALL_CARDS.find(c => c.id === id)
    if (!card) return
    const owned = collection.owned[id] || 0
    if (owned <= 1) return
    const dust = disenchantValue(card.rarity)
    let c = addDust(collection, dust)
    const newOwned = { ...c.owned }
    newOwned[id] = (newOwned[id] || 0) - 1
    if (newOwned[id] <= 0) delete newOwned[id]
    c = { ...c, owned: newOwned }
    setCollection(c)
    saveCollection(c)
    sfx.item()
  }

  function handleCraft(id: string) {
    const card = ALL_CARDS.find(c => c.id === id)
    if (!card) return
    const cost = canCraft(card.rarity)
    if (collection.dust < cost) return
    let c = addDust(collection, -cost)
    c = addCard(c, id)
    setCollection(c)
    saveCollection(c)
    sfx.achievement()
  }

  const ownedCards = ALL_CARDS.filter(c => (collection.owned[c.id] || 0) > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-white">💎 Koleksiyon</h1>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">🪙 {collection.coins}</span>
            <span className="text-purple-400">💎 {collection.dust}</span>
            <span className="text-white/60 text-sm">{ownedCards.length}/{ALL_CARDS.length} kart</span>
            <button onClick={() => setShowCraft(!showCraft)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition">
              {showCraft ? '📦 Koleksiyon' : '🔨 Zanaat'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={handleOpenPack}
            disabled={collection.coins < 100}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
              collection.coins >= 100
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            📦 Paket Aç (100 🪙)
          </button>
        </div>

        {packResult && (
          <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3">🎁 Paket Sonucu</h3>
            <div className="grid grid-cols-5 gap-2">
              {packResult.map((card, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${RARITY_BG[card.rarity]} rounded-lg p-2 text-center transition-all ${
                    i <= packReveal ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                >
                  <div className="text-2xl">{card.emoji}</div>
                  <div className={`text-xs font-bold ${RARITY_COLORS[card.rarity]} truncate`}>{card.name}</div>
                  <div className="text-white/40 text-[10px]">{card.rarity}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCraft ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_CARDS.map(card => {
              const owned = collection.owned[card.id] || 0
              const cost = canCraft(card.rarity)
              const canAfford = collection.dust >= cost
              return (
                <div key={card.id} className={`bg-gradient-to-br ${RARITY_BG[card.rarity]} rounded-lg p-2 border border-white/10`}>
                  <div className="text-2xl text-center">{card.emoji}</div>
                  <div className={`text-xs font-bold text-center ${RARITY_COLORS[card.rarity]} truncate`}>{card.name}</div>
                  <div className="text-white/40 text-[10px] text-center">{card.rarity}</div>
                  <div className="text-white/60 text-xs text-center mt-1">
                    {owned > 0 ? `x${owned}` : 'Sahip değil'}
                  </div>
                  <button
                    onClick={() => handleCraft(card.id)}
                    disabled={!canAfford}
                    className={`w-full mt-1 py-1 rounded text-xs font-bold transition ${
                      canAfford
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    💎 {cost}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {ALL_CARDS.map(card => {
              const owned = collection.owned[card.id] || 0
              if (owned === 0) return (
                <div key={card.id} className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 opacity-50">
                  <div className="text-center text-2xl">❓</div>
                  <div className="text-gray-500 text-xs text-center">???</div>
                </div>
              )
              const canDisenchant = owned > 1
              return (
                <div key={card.id} className={`bg-gradient-to-br ${RARITY_BG[card.rarity]} rounded-lg p-2 border border-white/10 relative group`}>
                  <div className="text-2xl text-center">{card.emoji}</div>
                  <div className={`text-xs font-bold text-center ${RARITY_COLORS[card.rarity]} truncate`}>{card.name}</div>
                  <div className="text-white/40 text-[10px] text-center">{card.rarity}</div>
                  <div className="text-white/60 text-xs text-center">x{owned}</div>
                  {canDisenchant && (
                    <button
                      onClick={() => handleDisenchant(card.id)}
                      className="absolute top-1 right-1 text-xs bg-red-600/80 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      title="Tozlaştır"
                    >
                      -
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
