/**
 * The Playwright suite runs the app in memory (window.__E2E_TEST_MODE__):
 * no folder, no disk and no git. Only the store and the file service check it.
 */
export const isE2EMode = (): boolean =>
  typeof window !== 'undefined' &&
  !!(window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;
