import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Nếu chạy qua Windows NTFS junction / symlink, đồng bộ process.cwd() với realpath
// để Vite dependency optimizer không bị lệch đường dẫn
if (process.cwd() !== import.meta.dirname) {
  process.chdir(import.meta.dirname)
}

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    preserveSymlinks: false,
  },
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['app.tdphihung.id.vn'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-dnd': ['@hello-pangea/dnd'],
          'vendor-realtime': ['@stomp/stompjs', 'sockjs-client'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
