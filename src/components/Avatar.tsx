interface AvatarProps {
  emoji: string
  color: string
  size?: number
  online?: boolean
}

export default function Avatar({ emoji, color, size = 48, online }: AvatarProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          fontSize: size * 0.5,
        }}
      >
        {emoji}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-900 bg-emerald-400" />
      )}
    </div>
  )
}
