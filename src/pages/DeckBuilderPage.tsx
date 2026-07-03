import { useState } from 'react'
import { allCards, loadCollection, saveCollection } from '../data/cardStore'
import { CardDef, Faction } from '../types'

const FACTIONS: (Faction | 'all')[] = ['all', 'nature', 'fire', 'ice', 'shadow', 'holy']
const FACTION_EMOJI: Record<string, string> = { all: '📦', nature: '🌿', fire: '🔥', ice: '❄️', shadow: '👻', holy: '✨' }

export default function DeckBuilderPage() {
  const [collection, setCollection] = useState(() => loadCollection())
  const [deck, setDeck] = useState<string[]>(collection.selectedDeck)
  const [faction, setFaction] = useState<Faction | 'all'>('all')
  const [costFilter, setCostFilter] = useState<number | null>(null)

  const deckCards = deck.map(id => allCards.find(c => c.id === id)).filter(Boolean) as CardDef[]

  function toggleCard(id: string) {
    const inDeck = deck.filter(d => d === id).length
    const owned = collection.owned[id] || 0

    if (deck.includes(id)) {
      const newDeck = deck.filter((d, i) => {
        if (d === id && deck.indexOf(d) === i) return false
        return true
      })
      setDeck(newDeck)
    } else {
      if (deck.length >= 30) return
      if (inDeck >= owned) return
      setDeck([...deck, id])
    }
  }

  function save() {
    const c = { ...collection, selectedDeck: deck }
    saveCollection(c)
    setCollection(c)
    alert('Deste kaydedildi!')
  }

  const filtered = faction === 'all'
    ? allCards
    : allCards.filter(c => c.faction === faction)

  const costFiltered = costFilter !== null
    ? filtered.filter(c => c.cost === costFilter)
    : filtered

  const pool = costFiltered.filter(c => c.type !== 'weapon' || (collection.owned[c.id] || 0) > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">🃏 Deste Oluşturucu</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/80">{deck.length}/30 kart</span>
            <span className="text-yellow-400">🪙 {collection.coins}</span>
            <span className="text-purple-400">💎 {collection.dust}</span>
            <button onClick={save} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition">
              💾 Kaydet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-3 flex-wrap">
              {FACTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFaction(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    faction === f ? 'bg-white/20 text-white border-white/40 border' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {FACTION_EMOJI[f]} {f === 'all' ? 'Tümü' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-1 mb-3 flex-wrap">
              {[0,1,2,3,4,5,6,7,8,10].map(c => (
                <button
                  key={c}
                  onClick={() => setCostFilter(costFilter === c ? null : c)}
                  className={`w-8 h-8 rounded text-xs font-bold transition ${
                    costFilter === c ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
              {costFilter !== null && (
                <button onClick={() => setCostFilter(null)} className="text-white/40 text-xs ml-2 hover:text-white">✕</button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {pool.map(card => {
                const owned = collection.owned[card.id] || 0
                const inDeck = deck.filter(d => d === card.id).length
                const isFull = inDeck >= owned
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    disabled={!deck.includes(card.id) && isFull}
                    className={`relative p-2 rounded-lg border text-left transition ${
                      deck.includes(card.id)
                        ? 'border-green-500 bg-green-500/20'
                        : isFull
                        ? 'border-gray-700 bg-gray-800/50 opacity-50'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-lg">{card.emoji}</span>
                      <span className="text-xs font-bold text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded">{card.cost}</span>
                    </div>
                    <div className="text-white text-xs font-semibold mt-1 truncate">{card.name}</div>
                    {card.type === 'creature' && (
                      <div className="text-white/60 text-xs">{card.attack}/{card.hp}</div>
                    )}
                    {inDeck > 0 && (
                      <div className="absolute top-1 right-6 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {inDeck}
                      </div>
                    )}
                    <div className="text-white/40 text-[10px] mt-0.5">x{owned}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <h3 className="text-white font-bold mb-2">🃏 Desten ({deck.length})</h3>
            <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto">
              {deck.length === 0 && <div className="text-white/40 text-sm">Henüz kart seçilmedi.</div>}
              {deckCards.map((card, i) => (
                <div key={`${card.id}-${i}`} className="flex items-center gap-2 p-1.5 rounded bg-white/5 hover:bg-white/10 group">
                  <span className="text-lg">{card.emoji}</span>
                  <span className="text-white text-xs flex-1 truncate">{card.name}</span>
                  <span className="text-blue-400 text-xs font-bold">{card.cost}</span>
                  {card.type === 'creature' && <span className="text-white/60 text-xs">{card.attack}/{card.hp}</span>}
                  <button
                    onClick={() => {
                      const newDeck = [...deck]
                      newDeck.splice(deck.findIndex((_d, idx) => idx === i), 1)
                      setDeck(newDeck)
                    }}
                    className="text-red-400 opacity-0 group-hover:opacity-100 text-xs ml-auto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-white/60 text-xs">
              <div>Ortalama mana: {(deckCards.reduce((s, c) => s + c.cost, 0) / Math.max(deck.length, 1)).toFixed(1)}</div>
              <div>Yaratık: {deckCards.filter(c => c.type === 'creature').length}</div>
              <div>Büyü: {deckCards.filter(c => c.type === 'spell').length}</div>
              <div>Silah: {deckCards.filter(c => c.type === 'weapon').length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
