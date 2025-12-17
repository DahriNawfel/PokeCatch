import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  base: '/PokeCatch/',
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 2,
      }
    },
    {
      urlPattern: /^https:\/\/pokeapi\.co\/api\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pokeapi-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pokemon-sprites',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }
      }
    }
  ]
},
      manifest: false, 
      devOptions: {
        enabled: false
      }
    })
  ]
});
