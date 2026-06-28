import EmptyState from '../components/EmptyState'

const POSTS = [
  { user: 'Ela 🦊', text: 'Yeni rekor kırdık! 🏆', likes: 42 },
  { user: 'Kaan 🐼', text: 'Bu akşam turnuva var, katılan?', likes: 17 },
  { user: 'Lina 🦄', text: 'Papaya teması çok şık olmuş 🍈', likes: 88 },
]

export default function DiscoverPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Keşfet</h1>
        <p className="text-sm text-white/45">Topluluktan neler oluyor 🧭</p>
      </header>

      <div className="space-y-3 px-5 pt-2">
        {POSTS.map((p, i) => (
          <div key={i} className="rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-card">
            <div className="text-sm font-semibold text-white/90">{p.user}</div>
            <p className="mt-1 text-[15px] text-white/75">{p.text}</p>
            <div className="mt-3 flex items-center gap-1 text-sm text-white/40">
              <span>❤️</span> {p.likes}
            </div>
          </div>
        ))}
      </div>

      <EmptyState
        emoji="🧭"
        title="Sosyal akış yolda"
        subtitle="Gönderi paylaşma, beğeni ve yorumlar bir sonraki sürümde gerçek olacak."
      />
    </div>
  )
}
