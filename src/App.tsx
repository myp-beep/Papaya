import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import WelcomePage from './pages/WelcomePage'
import { useProfile } from './data/profileStore'
import ChatListPage from './pages/ChatListPage'
import ChatRoomPage from './pages/ChatRoomPage'
import NewChatPage from './pages/NewChatPage'
import LiveRoomPage from './pages/LiveRoomPage'
import CreateStreamPage from './pages/CreateStreamPage'
import LiveStreamsPage from './pages/LiveStreamsPage'
import GamesPage from './pages/GamesPage'
import TicTacToePage from './pages/TicTacToePage'
import BattleshipPage from './pages/BattleshipPage'
import OnlineBattleshipPage from './pages/OnlineBattleshipPage'
import OnlineTicPage from './pages/OnlineTicPage'
import CardBattlePage from './pages/CardBattlePage'
import DeckBuilderPage from './pages/DeckBuilderPage'
import CardCollectionPage from './pages/CardCollectionPage'
import CardGalleryPage from './pages/CardGalleryPage'
import AchievementToast from './components/AchievementToast'
import IncomingCall from './components/IncomingCall'
import CallView from './components/CallView'
import DiscoverPage from './pages/DiscoverPage'
import ProfilePage from './pages/ProfilePage'
import FriendsPage from './pages/FriendsPage'
import AddFriendPage from './pages/AddFriendPage'
import GameInviteListener from './components/GameInviteListener'

// 3D oyunlar ağır (three.js) — yalnızca girince yüklensin
const CoopQuestPage = lazy(() => import('./pages/CoopQuestPage'))

export default function App() {
  const { onboarded } = useProfile()

  return (
    // Masaüstünde ortalanmış "telefon" çerçevesi, mobilde tam ekran.
    <div className="flex min-h-full items-center justify-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-ink-900 ring-1 ring-white/5 sm:h-[860px] sm:max-h-[92vh] sm:rounded-[2.6rem] sm:border-4 sm:border-black/60 sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        {/* Dekoratif ışıltı katmanı */}
        <div className="aurora" />

        {/* Masaüstü çerçevesinde premium durum çubuğu (mobilde gizli) */}
        <div className="relative z-20 hidden items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white/70 sm:flex">
          <span>9:41</span>
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black/70" />
          <span className="flex items-center gap-1">
            <span>📶</span>
            <span>🔋</span>
          </span>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {!onboarded ? (
          <WelcomePage />
        ) : (
        <>
        <Routes>
          {/* Tab bar'lı ana ekranlar */}
          <Route element={<AppShell />}>
            <Route index element={<ChatListPage />} />
            <Route path="new-chat" element={<NewChatPage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="games/tic" element={<TicTacToePage />} />
            <Route path="games/battleship" element={<BattleshipPage />} />
            <Route path="games/cards" element={<CardBattlePage />} />
            <Route path="games/cards/gallery" element={<CardGalleryPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          {/* Tam ekran arkadaş ekle (tab bar gizli) */}
          <Route path="friends/add" element={<AddFriendPage />} />
          {/* Tam ekran sohbet odası (tab bar gizli) */}
          <Route path="chat/:id" element={<ChatRoomPage />} />
          {/* Canlı yayın sohbet odaları */}
          <Route path="live/:roomId" element={<LiveRoomPage />} />
          <Route path="live/new" element={<CreateStreamPage />} />
          <Route path="live" element={<LiveStreamsPage />} />
          {/* Canlı çok oyunculu XOX */}
          <Route path="play/tic/:gameId" element={<OnlineTicPage />} />
          {/* Canlı çok oyunculu Amiral Battı */}
          <Route path="play/battleship/:gameId" element={<OnlineBattleshipPage />} />
          {/* Co-op hikâye macerası (3D) */}
          <Route
            path="games/coop"
            element={
              <Suspense fallback={<div className="flex h-full items-center justify-center text-5xl animate-pop-in">🍈</div>}>
                <CoopQuestPage />
              </Suspense>
            }
          />
          <Route path="games/cards/deck" element={<DeckBuilderPage />} />
          <Route path="games/cards/collection" element={<CardCollectionPage />} />
        </Routes>
        {/* Uygulama genelinde gelen oyun davetleri + başarım bildirimleri */}
        <GameInviteListener />
        <AchievementToast />
        <IncomingCall />
        <CallView />
        </>
        )}
        </div>
      </div>
    </div>
  )
}
