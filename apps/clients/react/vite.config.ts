import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // PILOTO: el server no tiene CORS, así que Vite reenvía /trpc al backend.
  // Para el browser todo sale del mismo origen y no hay preflight.
  server: {
    proxy: {
      '/trpc': {
        target: `http://127.0.0.1:${process.env.DASHBOARD_SERVER_PORT || 3050}`,
        changeOrigin: true,
      },
    },
  },
});
