import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relatif yollar: GitHub Pages gibi alt-yolda (/Papaya/) sorunsuz çalışır.
  base: './',
  server: {
    host: true,
    port: 5173,
  },
})
