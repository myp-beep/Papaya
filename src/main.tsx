import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ChatProvider } from './data/chatStore'
import { ProfileProvider } from './data/profileStore'
import { AuthProvider } from './data/authStore'
import { FriendsProvider } from './data/friendsStore'
import { LiveProvider } from './data/liveStore'
import { FeedProvider } from './data/feedStore'
import { CallProvider } from './data/callStore'

// PWA: service worker'ı yalnızca üretimde kaydet (offline + kurulabilirlik)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <ProfileProvider>
          <ChatProvider>
            <CallProvider>
            <FriendsProvider>
              <LiveProvider>
                <FeedProvider>
                  <App />
                </FeedProvider>
              </LiveProvider>
            </FriendsProvider>
            </CallProvider>
          </ChatProvider>
        </ProfileProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
