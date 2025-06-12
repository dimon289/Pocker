import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import type { UserConfig } from 'vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
    test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', 
  },
} as UserConfig)
