import { useState } from 'react'

interface InventoryPanelProps {
  papayasCollected: number
  papayasNeeded: number
  fishCaught: number
  stage: number
  onClose: () => void
}

const ITEMS = [
  { id: 'orb', name: 'Işık Taşı', emoji: '✨', desc: 'Kadim ışık kaynağı', stageRequired: 3 },
  { id: 'portal-key', name: 'Gölge Anahtarı', emoji: '🗝️', desc: 'Gölgeler diyarına açılan kapı', stageRequired: 4 },
  { id: 'crown', name: 'Krallık Tacı', emoji: '👑', desc: 'Papaya Krallığı\'nın sembolü', stageRequired: 6 },
]

export default function InventoryPanel({ papayasCollected, papayasNeeded, fishCaught, stage, onClose }: InventoryPanelProps) {
  const [tab, setTab] = useState<'items' | 'fish'>('items')

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-pop-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xs rounded-t-3xl border border-ink-600 bg-ink-800/95 p-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-white">
            🎒 Envanter
          </h3>
          <button onClick={onClose} className="text-white/50 text-lg">✕</button>
        </div>

        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setTab('items')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tab === 'items' ? 'bg-papaya-500 text-white' : 'text-white/50'}`}
          >
            Eşyalar
          </button>
          <button
            onClick={() => setTab('fish')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tab === 'fish' ? 'bg-papaya-500 text-white' : 'text-white/50'}`}
          >
            Balıklar
          </button>
        </div>

        {tab === 'items' ? (
          <div className="space-y-2">
            {/* Papaya sayacı */}
            <div className="glass flex items-center gap-3 rounded-2xl p-3">
              <span className="text-2xl">🍈</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Sihirli Papaya</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (papayasCollected / papayasNeeded) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-white/60">{papayasCollected}/{papayasNeeded}</span>
                </div>
              </div>
            </div>

            {/* Özel eşyalar */}
            {ITEMS.map((item) => {
              const obtained = stage >= item.stageRequired
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    obtained ? 'border-amber-500/40 bg-amber-500/10' : 'border-ink-700 bg-ink-900/50 opacity-50'
                  }`}
                >
                  <span className={`text-2xl ${obtained ? '' : 'grayscale'}`}>
                    {obtained ? item.emoji : '❓'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{obtained ? item.name : '???'}</div>
                    <div className="text-xs text-white/50">{obtained ? item.desc : 'Henüz keşfedilmedi'}</div>
                  </div>
                  {obtained && <span className="text-emerald-400 text-xs">✓</span>}
                </div>
              )
            })}

            {stage === 0 && papayasCollected === 0 && (
              <p className="py-4 text-center text-xs text-white/40">Henüz bir eşyan yok. Krallığı keşfetmeye başla!</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="glass flex items-center gap-3 rounded-2xl p-3">
              <span className="text-2xl">🐟</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Toplam Balık</div>
                <div className="text-xs text-white/60">{fishCaught} adet yakalandı</div>
              </div>
              <span className="text-lg font-bold text-white">{fishCaught}</span>
            </div>

            {fishCaught > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {Array.from({ length: fishCaught }, (_, i) => (
                  <div key={i} className="glass flex items-center justify-center rounded-xl p-2 text-xl">
                    {['🐟', '🐠', '🐡', '🐬', '🐋', '🦈'][i % 6]}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-white/40">Hiç balık tutmadın. Kristal Göl'e git! 🎣</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
