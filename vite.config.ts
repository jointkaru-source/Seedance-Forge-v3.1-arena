import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // @ts-ignore - allowedHosts for e2b preview
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: undefined,
    },
    cors: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    },
    // allow e2b preview hosts
    // @ts-ignore
    allowedHosts: true,
  } as any,
  preview: {
    host: '0.0.0.0',
    port: 4173,
    cors: true,
  } as any,
})
