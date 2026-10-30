import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Request ke /api diteruskan ke backend Express
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
