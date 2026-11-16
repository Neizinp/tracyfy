import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildDate = new Date().toISOString();

// Content Security Policy for production builds (web + Electron).
// Not applied in dev because Vite's HMR/React Refresh relies on inline scripts.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Components use inline style attributes extensively
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Remote git operations (browser mode goes through a CORS proxy)
  "connect-src 'self' https:",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],
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
