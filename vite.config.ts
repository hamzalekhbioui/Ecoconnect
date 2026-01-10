/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // This allows the server to be accessible externally
    host: '0.0.0.0',
    // This tells Vite: "Don't block the connection, no matter what the URL is"
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your local backend port
        changeOrigin: true,
        secure: false,
        // Removes '/api' prefix before sending to backend
        // e.g., /api/chat -> /chat
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});