import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'static',
  server: {
    port: 5173,
    proxy: {
      '/approve': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/api/anamnesis': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
