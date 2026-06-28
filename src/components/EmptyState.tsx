interface EmptyStateProps {
  emoji: string
  title: string
  subtitle?: string
  /** "Yakında" rozeti göster. */
  comingSoon?: boolean
}

export default function EmptyState({ emoji, title, subtitle, comingSoon }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-pop-in">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-ink-700 text-5xl shadow-card">
        {emoji}
      </div>
      {comingSoon && (
        <span className="mb-3 rounded-full bg-papaya-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-papaya-400">
          Yakında
        </span>
      )}
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">{subtitle}</p>}
    </div>
  )
}
