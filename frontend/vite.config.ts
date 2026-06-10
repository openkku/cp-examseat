/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/vitest-setup.ts',
  },
  build: {
    // Minify using 'terser' or 'esbuild' (default) is already good
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 3. Manual Chunks: Separate vendor libraries from your code
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      // Any request starting with /api goes to Go server
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})