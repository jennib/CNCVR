import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    // HTTPS is required for WebXR
    basicSsl()
  ],
  server: {
    host: true,
    port: 3000,
    https: true
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'three-mesh-bvh', 'cannon-es']
  }
});
