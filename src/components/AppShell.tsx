import { Outlet, useLocation } from 'react-router-dom'
import TabBar from './TabBar'

/** Tab bar'lı ekranların ortak kabuğu: kaydırılabilir içerik + alt navigasyon. */
export default function AppShell() {
  const loc = useLocation()
  return (
    <div className="flex h-full flex-col">
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div key={loc.pathname} className="page-in flex min-h-full flex-1 flex-col">
          <Outlet />
        </div>
      </main>
      <TabBar />
    </div>
  )
}
