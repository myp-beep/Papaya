// Sentezlenmiş ses efektleri (WebAudio) — dosya/asset gerektirmez.
const MUTE_KEY = 'papaya.mute.v1'

let ctx: AudioContext | null = null
function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === '1'
}
export function setMuted(m: boolean) {
  localStorage.setItem(MUTE_KEY, m ? '1' : '0')
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, delay = 0) {
  if (isMuted()) return
  const a = ac()
  if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const sfx = {
  /** Küçük dokunuş/hamle. */
  tap: () => beep(420, 0.06, 'square', 0.06),
  /** Kart çevirme / kaydırma. */
  flip: () => beep(540, 0.07, 'triangle', 0.09),
  /** Eşleşme / birleşme / yem. */
  match: () => {
    beep(660, 0.08, 'sine', 0.1)
    beep(880, 0.1, 'sine', 0.1, 0.08)
  },
  /** Hata / kayıp. */
  fail: () => beep(160, 0.28, 'sawtooth', 0.07),
  /** Zafer melodisi. */
  win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.16, 'triangle', 0.11, i * 0.11)),
  /** Başarım açıldı. */
  achievement: () => [784, 988, 1319].forEach((f, i) => beep(f, 0.14, 'sine', 0.12, i * 0.09)),
}
