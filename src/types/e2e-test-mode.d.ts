// Global type for E2E test mode flag
declare global {
  interface Window {
    __E2E_TEST_MODE__?: boolean;
  }
}

export {};
