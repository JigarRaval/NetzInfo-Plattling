/**
 * vite.config.js — build and dev server.
 *
 * host 0.0.0.0 + allowedHosts: the app must be reachable from a phone on the
 * same Wi-Fi or through a tunnel, not only from localhost.
 * proxy: in development the UI runs on 5173 and the API on 4000; proxying
 * keeps every fetch in the code a relative path, so the same build also works
 * when Express serves it from a single port.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': { target: 'http://localhost:4000', changeOrigin: true },
  '/feed.xml': { target: 'http://localhost:4000', changeOrigin: true },
  '/widget': { target: 'http://localhost:4000', changeOrigin: true }
};

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true, proxy },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true, proxy },
  build: { outDir: 'dist', sourcemap: false }
});
