/**
 * Render a component inside a real store (no mocked state). Seed the store
 * before rendering, or act on it afterwards, through the returned `store`.
 */
import type { ReactElement } from 'react';
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
