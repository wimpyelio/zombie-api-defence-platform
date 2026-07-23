import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@zad/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
});