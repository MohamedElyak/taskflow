import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8000';

  // The dev server forwards /api and /sanctum to Laravel, so the browser sees a
  // single origin (localhost:5173). That keeps Sanctum's session cookies first-party.
  const proxy = { target: backend, changeOrigin: true };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy: { '/api': proxy, '/sanctum': proxy } },
  };
});
