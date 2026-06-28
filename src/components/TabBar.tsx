import { NavLink } from 'react-router-dom'
import { useChat } from '../data/chatStore'
import { haptic } from '../lib/haptics'

interface Tab {
  to: string
  label: string
  icon: string
  end?: boolean
}

const TABS: Tab[] = [
  { to: '/', label: 'Sohbet', icon: '💬', end: true },
  { to: '/games', label: 'Oyun', icon: '🎮' },
  { to: '/discover', label: 'Keşfet', icon: '🧭' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

export default function TabBar() {
  const { totalUnread } = useChat()

  return (
    <nav className="z-10 border-t border-white/5 bg-ink-900/70 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              onClick={() => haptic('select')}
              className={({ isActive }) =>
                `group relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-papaya-400' : 'text-white/45 hover:text-white/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Aktif gösterge: yukarıda parlayan çizgi */}
                  <span
                    className={`absolute -top-px h-0.5 rounded-full bg-papaya-400 transition-all duration-300 ${
                      isActive ? 'w-7 opacity-100 shadow-glow' : 'w-0 opacity-0'
                    }`}
                  />
                  <span
                    className={`relative text-xl leading-none transition-transform duration-200 ${
                      isActive ? '-translate-y-0.5 scale-110' : 'group-active:scale-90'
                    }`}
                  >
                    {tab.icon}
                    {tab.to === '/' && totalUnread > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-papaya-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-900">
                        {totalUnread}
                      </span>
                    )}
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
