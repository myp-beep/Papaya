// Hafif dokunsal geri bildirim (destekleyen mobil cihazlarda).
type Pattern = 'light' | 'medium' | 'success' | 'select'

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 8,
  medium: 18,
  select: 5,
  success: [12, 40, 18],
}

export function haptic(p: Pattern = 'light') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[p])
    }
  } catch {
    /* yoksay */
  }
}
