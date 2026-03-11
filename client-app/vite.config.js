import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Force refresh 1
export default defineConfig({
  plugins: [react()],
})
