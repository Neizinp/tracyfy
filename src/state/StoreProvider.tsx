import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { createAppStore, type AppState, type AppStore } from './store';
import { setActiveStore } from './notify';

const StoreContext = createContext<AppStore | null>(null);

/**
 * Holds the app's store. One store per mount, so a remount (or a test that
 * restarts the app) starts from a clean state, like a reload would.
 */
export const StoreProvider: React.FC<{ children: ReactNode; store?: AppStore }> = ({
  children,
  store: given,
}) => {
  const [store] = useState(() => given ?? createAppStore());

  useEffect(() => setActiveStore(store), [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

/** The store itself, for reading state inside callbacks without subscribing */
export function useAppStoreApi(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useAppStore must be used within a StoreProvider');
  return store;
}

/**
 * Read part of the state. The component re-renders only when the selected
 * value changes (compared with Object.is), so select the smallest piece you
 * need; to select several values at once, wrap the selector in useShallow.
 */
export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(useAppStoreApi(), selector);
}
