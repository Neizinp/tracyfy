/**
 * The app's single store (docs/DESIGN.md §5): the loaded project, pending
 * changes, selection and UI state, and the actions that change them.
 *
 * It replaces the nested React providers. Components read exactly what they
 * need with a selector (`useAppStore((s) => s.tasks)`), so they re-render
 * only when that part changes. Actions are plain functions on the state and
 * are the only way the UI reaches storage.
 *
 * The state is split into slices (one file each in ./slices); every slice can
 * read and call the others through `get()`.
 */
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createTasksSlice, type TasksSlice } from './slices/tasks';
import { createToastsSlice, type ToastsSlice } from './slices/toasts';

export type AppState = TasksSlice & ToastsSlice;

export type AppStore = StoreApi<AppState>;

/** A new, empty store. The app makes one per mount (see StoreProvider). */
export function createAppStore(): AppStore {
  return createStore<AppState>()((...a) => ({
    ...createTasksSlice(...a),
    ...createToastsSlice(...a),
  }));
}
