import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Serveras i roten på Vercel → ingen base-path behövs.
export default defineConfig({
  plugins: [react()],
})
