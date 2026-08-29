import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on 0.0.0.0 so other devices on the same Wi-Fi / local network can connect
    host: true,
    // Allow all hosts: required so Cloudflare Tunnel hostnames (*.trycloudflare.com)
    // are not rejected by Vite's host-check middleware.
    allowedHosts: true,
    proxy: {
      // REST API — forwarded to local Express backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Socket.IO — WebSocket upgrade forwarded to local Express/Socket.IO server
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
      // Static uploads — forwarded to local Express static file server
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
