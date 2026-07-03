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
  /** Darbe alındı. */
  hit: () => beep(120, 0.2, 'sawtooth', 0.1),
  /** Düşman yok edildi. */
  kill: () => { beep(400, 0.1, 'square', 0.07); beep(600, 0.12, 'sine', 0.09, 0.08) },
  /** Balık yakalandı. */
  fishCatch: () => [440, 660, 880].forEach((f, i) => beep(f, 0.1, 'triangle', 0.08, i * 0.06)),
  /** Yeni eşya. */
  item: () => [880, 1100].forEach((f, i) => beep(f, 0.12, 'sine', 0.1, i * 0.08)),
}

// --- Ambient müzik (basit, döngüsel pad) ---
let ambientNodes: OscillatorNode[] | null = null
let ambientGain: GainNode | null = null
let ambientActive = false

const AMBIENT_NOTES = [130.81, 164.81, 196.00, 220.00] // C3, E3, G3, A3

export function startAmbient() {
  if (ambientActive || isMuted()) return
  const a = ac()
  if (!a) return
  ambientActive = true
  ambientGain = a.createGain()
  ambientGain.gain.setValueAtTime(0, a.currentTime)
  ambientGain.gain.linearRampToValueAtTime(0.035, a.currentTime + 2)
  ambientGain.connect(a.destination)

  ambientNodes = AMBIENT_NOTES.map((freq, i) => {
    const o = a.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = a.createGain()
    g.gain.setValueAtTime(0.05 / AMBIENT_NOTES.length, a.currentTime)
    o.connect(g).connect(ambientGain!)
    o.start()
    // slow LFO for movement
    const lfo = a.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08 + i * 0.02
    const lfoGain = a.createGain()
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain).connect(g.gain)
    lfo.start()
    return o
  })
}

export function stopAmbient() {
  if (!ambientActive) return
  ambientActive = false
  const a = ac()
  if (a && ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(0, a.currentTime + 1)
  }
  setTimeout(() => {
    ambientNodes?.forEach((o) => { try { o.stop() } catch {} })
    ambientNodes = null
    ambientGain = null
  }, 1100)
}

export function isAmbientActive() {
  return ambientActive
}
