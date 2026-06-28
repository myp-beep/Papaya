import Avatar from '../components/Avatar'
import { ME } from '../data/mockData'

const STATS = [
  { label: 'Oyun', value: '128' },
  { label: 'Arkadaş', value: '64' },
  { label: 'Rozet', value: '12' },
]

const ROWS = [
  { icon: '⚙️', label: 'Ayarlar' },
  { icon: '🔔', label: 'Bildirimler' },
  { icon: '🎨', label: 'Tema' },
  { icon: '🛡️', label: 'Gizlilik' },
  { icon: 'ℹ️', label: 'Hakkında' },
]

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Profil</h1>
      </header>

      {/* Profil kartı */}
      <div className="mx-5 mt-2 flex flex-col items-center rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-800 to-ink-900 p-6 shadow-card">
        <Avatar emoji={ME.avatar} color={ME.color} size={84} online />
        <h2 className="mt-3 text-xl font-bold text-white">{ME.name}</h2>
        <p className="text-sm text-white/45">@papaya_user</p>

        <div className="mt-5 grid w-full grid-cols-3 divide-x divide-ink-600">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{s.value}</span>
              <span className="text-xs text-white/45">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ayar satırları */}
      <ul className="mx-5 mt-4 overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
        {ROWS.map((r, i) => (
          <li key={r.label}>
            <button
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-ink-700 ${
                i !== ROWS.length - 1 ? 'border-b border-ink-700' : ''
              }`}
            >
              <span className="text-lg">{r.icon}</span>
              <span className="flex-1 text-[15px] text-white/85">{r.label}</span>
              <span className="text-white/30">›</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-auto py-6 text-center text-xs text-white/30">Papaya · v0.1.0 (demo)</p>
    </div>
  )
}
