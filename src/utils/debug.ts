/**
 * Debug Logging Utility
 *
 * Provides conditional logging that only outputs when DEBUG mode is enabled.
 * This keeps the console clean in production while allowing verbose logging during development.
 *
 * Enable debug mode by:
 * - Setting localStorage.setItem('DEBUG', 'true') in browser console
 * - Setting window.DEBUG = true in browser console (temporary)
 *
 * Usage:
 *   import { debug } from '../utils/debug';
 *   debug.log('[MyComponent]', 'Some message', data);
 *   debug.warn('[MyComponent]', 'Warning message');  // Also conditional
 *
 * Note: console.error is NOT wrapped - errors should always be visible.
 */

// Check if debug mode is enabled
function isDebugEnabled(): boolean {
  if (typeof window !== 'undefined') {
    // Check window.DEBUG flag (can be set at runtime)
    if ((window as any).DEBUG === true) return true;

    // Check localStorage (persists across sessions)
    try {
      return localStorage.getItem('DEBUG') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Debug logging functions - only output when DEBUG mode is enabled
 */
export const debug = {
  /**
   * Conditional console.log - only logs when DEBUG=true
   */
  log: (...args: any[]): void => {
    if (isDebugEnabled()) {
      console.log(...args);
    }
  },

  /**
   * Conditional console.warn - only warns when DEBUG=true
   * For actual warnings that should always show, use console.warn directly
   */
  warn: (...args: any[]): void => {
    if (isDebugEnabled()) {
      console.warn(...args);
    }
  },

  /**
   * Force log regardless of DEBUG mode (for important info)
   */
  info: (...args: any[]): void => {
    console.log(...args);
  },
};

// Export a helper to check debug mode
export const isDebug = isDebugEnabled;
