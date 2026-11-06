import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
