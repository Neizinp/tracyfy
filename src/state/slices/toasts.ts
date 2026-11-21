/**
 * Toasts: short messages to the user.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastsSlice {
  toasts: Toast[];
  /** `duration` 0 keeps the toast until it is closed */
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const createToastsSlice: StateCreator<AppState, [], [], ToastsSlice> = (set) => {
  let counter = 0;
  const removeToast = (id: string) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  return {
    toasts: [],
    showToast: (message, type = 'info', duration = 5000) => {
      const id = `toast-${++counter}`;
      set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
      if (duration > 0) setTimeout(() => removeToast(id), duration);
    },
    removeToast,
  };
};
