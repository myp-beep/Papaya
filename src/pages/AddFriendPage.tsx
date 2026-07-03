import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { useFriends } from '../data/friendsStore'
import { haptic } from '../lib/haptics'

export default function AddFriendPage() {
  const navigate = useNavigate()
  const { searchUsers, sendRequest, outgoing } = useFriends()
  const [query, setQuery] = useState('')
  const [sent, setSent] = useState<Set<string>>(new Set())

  const results = searchUsers(query)

  const handleSend = (userId: string, name: string, avatar: string, color: string) => {
    sendRequest(userId, name, avatar, color)
    setSent((prev) => new Set(prev).add(userId))
    haptic('light')
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-ink-900/80 px-3 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/friends')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
            aria-label="Geri"
          >
            ‹
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Arkadaş Ekle</h1>
            <p className="text-xs text-white/40">Kullanıcı adıyla ara</p>
          </div>
        </div>
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim yaz…"
            autoFocus
            className="w-full rounded-xl border border-ink-600 bg-ink-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
          />
        </div>
      </header>

      {/* Bekleyen istekler */}
      {outgoing.length > 0 && (
        <section className="mx-5 mb-3">
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-white/30">
            Gönderilen istekler
          </p>
          {outgoing.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-white/60"
            >
              <Avatar
                emoji={req.toUser?.avatar ?? '👤'}
                color={req.toUser?.color ?? '#888'}
                size={36}
              />
              <span className="flex-1 text-[15px]">{req.toUser?.name ?? 'Bilinmeyen'}</span>
              <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-amber-400">
                Bekliyor
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Arama sonuçları */}
      {query.trim() && (
        <div className="flex-1 px-2 pb-4">
          {results.length === 0 ? (
            <EmptyState
              emoji="🕳️"
              title="Sonuç bulunamadı"
              subtitle="Farklı bir isim dene. Arkadaşların ve istek gönderdiklerin listede görünmez."
            />
          ) : (
            results.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-ink-800/60"
              >
                <Avatar emoji={u.avatar} color={u.color} online={u.online} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{u.name}</div>
                  <div className="text-xs text-white/40">
                    {u.online ? 'çevrimiçi' : 'çevrimdışı'}
                  </div>
                </div>
                <button
                  onClick={() => handleSend(u.id, u.name, u.avatar, u.color)}
                  disabled={sent.has(u.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-90 ${
                    sent.has(u.id)
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'btn-primary'
                  }`}
                >
                  {sent.has(u.id) ? '✓ İstek gönderildi' : '＋ Ekle'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!query.trim() && outgoing.length === 0 && (
        <div className="flex flex-1 items-center justify-center px-5">
          <EmptyState
            emoji="🔍"
            title="Kullanıcı ara"
            subtitle="Yukarıya bir isim yazarak Papaya'daki diğer kullanıcıları bulabilir ve arkadaşlık isteği gönderebilirsin."
          />
        </div>
      )}
    </div>
  )
}
