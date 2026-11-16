import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { serviceWorker } from './src/pwa/swPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  // serviceWorker() writes dist/sw.js so the installed app opens offline
  plugins: [react(), serviceWorker()],
  // GitHub Pages serves the app from /news-verifier-app/
  base: '/news-verifier-app/',
  server: {
    // Lets VITE_VERIFY_API_URL=/api/verify reach the local proxy in server/
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    environment: 'node',
  },
})
