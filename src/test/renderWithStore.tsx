/**
 * Render a component inside a real store (no mocked state). Seed the store
 * before rendering, or act on it afterwards, through the returned `store`.
 */
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { StoreProvider, createAppStore, type AppState, type AppStore } from '../state';

export function renderWithStore(
  ui: ReactElement,
  {
    state,
    store = createAppStore(),
    ...options
  }: RenderOptions & {
    state?: Partial<AppState>;
    store?: AppStore;
  } = {}
) {
  if (state) store.setState(state);
  const result = render(ui, {
    ...options,
    wrapper: ({ children }) => <StoreProvider store={store}>{children}</StoreProvider>,
  });
  return { ...result, store };
}

/** A wrapper for renderHook: a real store, seeded with `state` */
export function storeWrapper(state: Partial<AppState> = {}, store: AppStore = createAppStore()) {
  store.setState(state);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );
  return { wrapper, store };
}
