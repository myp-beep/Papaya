import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ChatProvider } from './data/chatStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ChatProvider>
        <App />
      </ChatProvider>
    </HashRouter>
  </StrictMode>,
)
