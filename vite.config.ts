import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist/dashboard',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3737',
      '/ws': {
        target: 'ws://localhost:3737',
        ws: true,
      },
    },
  },
});
