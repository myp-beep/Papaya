import { useState } from 'react'
import Avatar from '../components/Avatar'
import { useProfile } from '../data/profileStore'
import { USERS } from '../data/mockData'

const AVATAR_CHOICES = ['😎', '🦊', '🐼', '🐙', '🦄', '🐯', '🐸', '🦁', '🐵', '🐧', '🍈', '🔥']
const COLOR_CHOICES = ['#f95816', '#fb7a3c', '#8b5cf6', '#22b8cf', '#e64980', '#22c55e']

const ROWS = [
  { icon: '🔔', label: 'Bildirimler' },
  { icon: '🎨', label: 'Tema' },
  { icon: '🛡️', label: 'Gizlilik' },
  { icon: 'ℹ️', label: 'Hakkında' },
]

export default function ProfilePage() {
  const { profile, updateProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [status, setStatus] = useState(profile.status)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [color, setColor] = useState(profile.color)

  const bestMemory = localStorage.getItem('papaya.memory.best.v1')
  const stats = [
    { label: 'Arkadaş', value: String(Object.keys(USERS).length) },
    { label: 'Oyun', value: bestMemory ? '1' : '0' },
    { label: 'Rozet', value: '3' },
  ]

  const openEdit = () => {
    setName(profile.name)
    setStatus(profile.status)
    setAvatar(profile.avatar)
    setColor(profile.color)
    setEditing(true)
  }

  const save = () => {
    updateProfile({ name: name.trim() || profile.name, status, avatar, color })
    setEditing(false)
  }

  const resetData = () => {
    if (!confirm('Tüm Papaya verileri (sohbet, profil, oyun skorları) silinsin mi?')) return
    Object.keys(localStorage)
      .filter((k) => k.startsWith('papaya.'))
      .forEach((k) => localStorage.removeItem(k))
    location.reload()
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Profil</h1>
        {!editing && (
          <button
            onClick={openEdit}
            className="rounded-xl bg-ink-700 px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:bg-ink-600"
          >
            ✏️ Düzenle
          </button>
        )}
      </header>

      {/* Profil kartı */}
      <div className="mx-5 mt-2 flex flex-col items-center rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-800 to-ink-900 p-6 shadow-card">
        <Avatar emoji={avatar} color={color} size={84} online />
        {editing ? (
          <div className="mt-4 w-full animate-slide-up">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Adın"
              className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-center text-lg font-bold text-white outline-none focus:border-papaya-500"
            />
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              maxLength={60}
              placeholder="Durum"
              className="mt-2 w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-center text-sm text-white/80 outline-none focus:border-papaya-500"
            />

            <p className="mt-4 mb-1 text-xs font-semibold uppercase text-white/40">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_CHOICES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition ${
                    avatar === a ? 'bg-papaya-500/30 ring-2 ring-papaya-400' : 'bg-ink-700 hover:bg-ink-600'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <p className="mt-4 mb-1 text-xs font-semibold uppercase text-white/40">Renk</p>
            <div className="flex gap-2">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`}
                  style={{ background: c }}
                  aria-label={`renk ${c}`}
                />
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-xl bg-ink-700 py-2.5 font-semibold text-white/80 transition hover:bg-ink-600"
              >
                Vazgeç
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-xl bg-papaya-500 py-2.5 font-bold text-white shadow-glow transition hover:bg-papaya-400"
              >
                Kaydet
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-bold text-white">{profile.name}</h2>
            <p className="mt-1 text-sm text-white/55">{profile.status}</p>

            <div className="mt-5 grid w-full grid-cols-3 divide-x divide-ink-600">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{s.value}</span>
                  <span className="text-xs text-white/45">{s.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ayar satırları */}
      {!editing && (
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
      )}

      {!editing && (
        <button
          onClick={resetData}
          className="mx-5 mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          🗑️ Verileri sıfırla
        </button>
      )}

      <p className="mt-auto py-6 text-center text-xs text-white/30">Papaya · v0.1.0 (demo)</p>
    </div>
  )
}
