// Hafif dokunsal geri bildirim (destekleyen mobil cihazlarda).
type Pattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'select'

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 32,
  select: 5,
  success: [12, 40, 18],
  warning: [20, 30, 20],
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
