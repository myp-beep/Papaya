/** Liste için kısa zaman: bugünse saat, dünse "Dün", yoksa gün/ay. */
export function shortTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Dün'
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

/** Sohbet balonu için saat:dakika. */
export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

/** Akış için göreli zaman: "az önce", "5 dk", "2 sa", "Dün", tarih. */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'az önce'
  if (m < 60) return `${m} dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} sa`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Dün'
  if (d < 7) return `${d} gün`
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}
