import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildDate = new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
    __APP_COMMIT_HASH__: JSON.stringify(commitHash),
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
