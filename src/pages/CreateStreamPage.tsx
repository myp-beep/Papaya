import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLive } from '../data/liveStore'
import { useProfile } from '../data/profileStore'
import { haptic } from '../lib/haptics'

export default function CreateStreamPage() {
  const { createRoom } = useLive()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [title, setTitle] = useState(profile.name + "'in Yayını")
  const [starting, setStarting] = useState(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || starting) return
    setStarting(true)
    haptic('medium')
    const roomId = createRoom(title)
    navigate(`/live/${roomId}`)
  }

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <header className="flex items-center gap-3 border-b border-ink-700 bg-ink-800/90 px-3 py-2.5">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-ink-700"
          aria-label="Geri"
        >
          ‹
        </button>
        <span className="font-semibold text-white">Yeni Canlı Yayın</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-4xl shadow-2xl animate-live-pulse">
            📡
          </div>
          <h2 className="text-xl font-bold text-white">Canlı Yayın Başlat</h2>
          <p className="max-w-xs text-center text-sm text-white/50">
            Diğer kullanıcılar yayınına katılıp canlı sohbet edebilir. Görüntülü yayın yakında!
          </p>
        </div>

        <form onSubmit={handleStart} className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Yayın başlığı</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yayın başlığı…"
              maxLength={60}
              autoFocus
              className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-papaya-500"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || starting}
            className="btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            {starting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Başlatılıyor…
              </>
            ) : (
              <>
                <span>📡</span> Yayını Başlat
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
