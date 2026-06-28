import { useState } from 'react'
import { useAuth } from '../data/authStore'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const { signIn, signUp, signInMagic } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const res = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (res.error) setError(res.error)
    else if (res.emailSent) setInfo('E-postana onay bağlantısı gönderdik. Kontrol et 📧')
  }

  const magic = async () => {
    if (!email) {
      setError('Önce e-posta gir')
      return
    }
    setError(null)
    setInfo(null)
    setBusy(true)
    const res = await signInMagic(email)
    setBusy(false)
    if (res.error) setError(res.error)
    else setInfo('Sihirli giriş bağlantısı e-postana gönderildi ✨')
  }

  return (
    <div className="flex h-full flex-col justify-center bg-gradient-to-b from-ink-900 to-ink-800 px-8">
      <div className="text-center animate-pop-in">
        <div className="text-6xl">🍈</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Papaya</h1>
        <p className="mt-2 text-sm text-white/55">
          {mode === 'signin' ? 'Tekrar hoş geldin!' : 'Hesabını oluştur'}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-papaya-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          minLength={6}
          className="w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-papaya-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-papaya-500 py-3 text-lg font-bold text-white shadow-glow transition hover:bg-papaya-400 disabled:opacity-50"
        >
          {busy ? '…' : mode === 'signin' ? 'Giriş yap' : 'Kayıt ol'}
        </button>
      </form>

      <button
        onClick={magic}
        disabled={busy}
        className="mt-3 w-full rounded-xl border border-ink-600 py-3 text-sm font-semibold text-white/80 transition hover:bg-ink-700 disabled:opacity-50"
      >
        ✨ Sihirli bağlantı ile gir
      </button>

      <p className="mt-6 text-center text-sm text-white/50">
        {mode === 'signin' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
          className="font-semibold text-papaya-400"
        >
          {mode === 'signin' ? 'Kayıt ol' : 'Giriş yap'}
        </button>
      </p>
    </div>
  )
}
