import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
// import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), 'SHARE_') }

  return defineConfig({
    plugins: [
      preact({
        babel: {
          plugins: [
            [
              '@babel/plugin-proposal-decorators',
              {
                version: '2023-05',
              },
            ],
          ],
        },
      }),
      // TODO: Add VitePWA plugin after installing vite-plugin-pwa
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      //   manifest: {
      //     name: 'Cloudflare Drop',
      //     short_name: 'CF Drop',
      //     description: 'Secure, Fast, Simple File Sharing Platform',
      //     theme_color: '#1976d2',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     orientation: 'portrait',
      //     scope: '/',
      //     start_url: '/',
      //     icons: [
      //       {
      //         src: 'logo.png',
      //         sizes: '192x192',
      //         type: 'image/png'
      //       },
      //       {
      //         src: 'logo.png',
      //         sizes: '512x512',
      //         type: 'image/png'
      //       },
      //       {
      //         src: 'logo.png',
      //         sizes: '512x512',
      //         type: 'image/png',
      //         purpose: 'any maskable'
      //       }
      //     ]
      //   },
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      //     runtimeCaching: [
      //       {
      //         urlPattern: /^https:\/\/api\./i,
      //         handler: 'NetworkFirst',
      //         options: {
      //           cacheName: 'api-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       }
      //     ]
      //   }
      // })
    ],
    server: {
      port: Number(process.env.SHARE_PORT),
    },
    envPrefix: 'SHARE_',
  })
}
