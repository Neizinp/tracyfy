/**
 * Reporting errors from code outside React (services, event handlers that
 * have no store at hand).
 */
import type { AppStore } from './store';

let activeStore: AppStore | null = null;

/** Called by the mounted StoreProvider; returns the cleanup for unmount */
export function setActiveStore(store: AppStore): () => void {
  activeStore = store;
  return () => {
    if (activeStore === store) activeStore = null;
  };
}

/**
 * Report a failure of something the user did: logs it and shows an error
 * toast ("<message>: <reason>").
 */
export function notifyError(message: string, error?: unknown): void {
  console.error(message, error);
  const reason = error instanceof Error ? error.message : error ? String(error) : '';
  activeStore?.getState().showToast(reason ? `${message}: ${reason}` : message, 'error', 8000);
}
