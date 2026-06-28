import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.papaya.app',
  appName: 'Papaya',
  // Vite build çıktısı. `npm run build` -> dist/ , sonra `npx cap sync`.
  webDir: 'dist',
  backgroundColor: '#0d0b14',
}

export default config
