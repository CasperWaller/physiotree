import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base = repo-namn för GitHub Pages (https://<user>.github.io/physiotree/)
export default defineConfig({
  base: '/physiotree/',
  plugins: [react()],
})
