import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'

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
    ],
    server: {
      port: Number(process.env.SHARE_PORT),
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.SHARE_API_ORIGIN || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/files': {
          target: process.env.SHARE_API_ORIGIN || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
    envPrefix: 'SHARE_',
  })
}
