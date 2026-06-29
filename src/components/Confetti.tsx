import { useMemo } from 'react'

const COLORS = ['#f95816', '#fb7a3c', '#8b5cf6', '#22b8cf', '#22c55e', '#e64980', '#facc15']

/** Kazanma kutlaması — `show` true olduğunda kısa bir konfeti patlaması. */
export default function Confetti({ show, count = 70 }: { show: boolean; count?: number }) {
  // show değiştikçe yeni parçalar üret (anahtar olarak Math.random kullanımı kasıtlı)
  const pieces = useMemo(() => {
    if (!show) return []
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 1.4,
      color: COLORS[i % COLORS.length],
      size: 0.7 + Math.random() * 0.8,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, count])

  if (!show) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `scale(${p.size})`,
          }}
        />
      ))}
    </div>
  )
}
