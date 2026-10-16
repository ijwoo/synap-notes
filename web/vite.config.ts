import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드 프록시 대상: 기본 8080, 환경에 따라 VITE_PROXY_TARGET 으로 덮어쓰기.
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
    },
  },
});
