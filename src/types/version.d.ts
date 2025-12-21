// Global constants injected at build time via Vite
declare global {
  const __APP_VERSION__: string;
  const __APP_BUILD_DATE__: string;
  const __APP_COMMIT_HASH__: string;
}

export {};
