import { useState } from 'react'
import Avatar from '../components/Avatar'
import { useProfile } from '../data/profileStore'

const AVATARS = ['😎', '🦊', '🐼', '🐙', '🦄', '🐯', '🐸', '🦁', '🐵', '🐧', '🍈', '🔥']
const COLORS = ['#f95816', '#fb7a3c', '#8b5cf6', '#22b8cf', '#e64980', '#22c55e']

export default function WelcomePage() {
  const { completeOnboarding } = useProfile()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('😎')
  const [color, setColor] = useState('#f95816')

  const finish = () => {
    completeOnboarding({
      name: name.trim() || 'Sen',
      avatar,
      color,
      status: 'Papaya’dayım 🍈',
    })
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-ink-900 to-ink-800">
      {step === 0 ? (
        /* Tanıtım */
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-pop-in">
          <div className="text-7xl">🍈</div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">Papaya</h1>
          <p className="mt-3 max-w-xs text-white/60">
            Mesajlaş, oyna, keşfet — hepsi tek uygulamada. Hadi seni tanıyalım!
          </p>
          <div className="mt-8 flex gap-4 text-center text-xs text-white/50">
            <Feature emoji="💬" label="Sohbet" />
            <Feature emoji="🎮" label="Oyun" />
            <Feature emoji="🧭" label="Keşfet" />
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-10 w-full max-w-xs rounded-2xl bg-papaya-500 py-3.5 text-lg font-bold text-white shadow-glow transition hover:bg-papaya-400"
          >
            Başla
          </button>
        </div>
      ) : (
        /* Profil kurulumu */
        <div className="flex flex-1 flex-col px-8 pt-12 animate-slide-up">
          <h2 className="text-2xl font-extrabold text-white">Profilini oluştur</h2>
          <p className="mt-1 text-sm text-white/50">İstediğin zaman değiştirebilirsin.</p>

          <div className="mt-8 flex justify-center">
            <Avatar emoji={avatar} color={color} size={96} online />
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoFocus
            placeholder="Adın ne?"
            className="mt-6 w-full rounded-2xl border border-ink-600 bg-ink-900 px-4 py-3 text-center text-lg font-semibold text-white placeholder:text-white/35 outline-none focus:border-papaya-500"
          />

          <p className="mt-6 mb-2 text-xs font-semibold uppercase text-white/40">Avatar seç</p>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`flex h-11 items-center justify-center rounded-xl text-xl transition ${
                  avatar === a ? 'bg-papaya-500/30 ring-2 ring-papaya-400' : 'bg-ink-700 hover:bg-ink-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <p className="mt-5 mb-2 text-xs font-semibold uppercase text-white/40">Renk</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''
                }`}
                style={{ background: c }}
                aria-label={`renk ${c}`}
              />
            ))}
          </div>

          <div className="mt-auto pb-10 pt-8">
            <button
              onClick={finish}
              className="w-full rounded-2xl bg-papaya-500 py-3.5 text-lg font-bold text-white shadow-glow transition hover:bg-papaya-400"
            >
              Papaya’ya gir 🍈
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Feature({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{emoji}</span>
      {label}
    </div>
  )
}
