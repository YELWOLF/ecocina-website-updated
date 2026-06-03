import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Why proxy /api: avoids CORS in dev and keeps frontend code free of
// hardcoded backend hostnames. In production you'd serve the built frontend
// from Flask or behind nginx.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
