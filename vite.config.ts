import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      include: ['src/game/**/*.ts'],
      exclude: ['src/game/**/*.test.ts'],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
})
