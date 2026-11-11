import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on the LAN too, so phones on the same Wi-Fi can open the site
    // Dev: browser calls /api on the Vite server, which forwards to Spring Boot. No CORS needed.
    proxy: { '/api': 'http://localhost:8080' },
  },
})
