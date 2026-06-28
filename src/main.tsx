import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ChatProvider } from './data/chatStore'
import { ProfileProvider } from './data/profileStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ProfileProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </ProfileProvider>
    </HashRouter>
  </StrictMode>,
)
