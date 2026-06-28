import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ChatListPage from './pages/ChatListPage'
import ChatRoomPage from './pages/ChatRoomPage'
import GamesPage from './pages/GamesPage'
import DiscoverPage from './pages/DiscoverPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    // Masaüstünde ortalanmış "telefon" çerçevesi, mobilde tam ekran.
    <div className="flex min-h-full items-center justify-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-ink-900 sm:h-[860px] sm:max-h-[92vh] sm:rounded-[2.2rem] sm:border sm:border-ink-600 sm:shadow-card">
        <Routes>
          {/* Tab bar'lı ana ekranlar */}
          <Route element={<AppShell />}>
            <Route index element={<ChatListPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          {/* Tam ekran sohbet odası (tab bar gizli) */}
          <Route path="chat/:id" element={<ChatRoomPage />} />
        </Routes>
      </div>
    </div>
  )
}
