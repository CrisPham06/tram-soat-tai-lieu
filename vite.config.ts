import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { existsSync } from 'node:fs';
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'offline' ? [viteSingleFile()] : [])],
  worker: { format: 'iife' },
  build: { outDir: mode === 'offline' ? 'dist-offline' : 'dist', assetsInlineLimit: mode === 'offline' ? 250000 : 0, target: 'es2022', sourcemap: false, rollupOptions: { input: mode === 'offline' ? 'index.html' : { main: 'index.html', ...(process.env.INCLUDE_FEEDBACK === '1' && existsSync('phan-hoi/index.html') ? { feedback: 'phan-hoi/index.html' } : {}) } } },
  server: { host: '127.0.0.1' }
}));
