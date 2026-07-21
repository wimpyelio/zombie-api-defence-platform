import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'ES2022',
  },
  server: {
    port: 3000,
    open: true,
  },
});