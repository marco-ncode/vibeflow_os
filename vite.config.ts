import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174, // rimuovere server: {...}, dopo il test
  },
  plugins: [react()],
})
