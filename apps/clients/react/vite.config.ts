import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.DASHBOARD_SERVER_PORT || 3050}`,
        changeOrigin: true,
      },
      '/icons': {
        target: `http://127.0.0.1:${process.env.DASHBOARD_SERVER_PORT || 3050}`,
        changeOrigin: true,
      },
    },
  },
});
