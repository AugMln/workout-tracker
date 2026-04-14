import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Configuration PWA pour le mode hors-ligne
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Mise en cache de tous les assets pour le mode hors-ligne
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Workout Tracker',
        short_name: 'WorkoutPro',
        description: 'Tracker de séances de musculation hors-ligne',
        theme_color: '#0D0D0F',
        background_color: '#0D0D0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
