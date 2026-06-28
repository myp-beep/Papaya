import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

/** Tab bar'lı ekranların ortak kabuğu: kaydırılabilir içerik + alt navigasyon. */
export default function AppShell() {
  return (
    <div className="flex h-full flex-col">
      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
