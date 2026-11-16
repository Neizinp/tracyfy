import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

interface ToastActions {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

// The toast list and the actions are separate contexts so that the many
// components calling showToast don't re-render whenever a toast appears/disappears.
const ToastActionsContext = createContext<ToastActions | undefined>(undefined);

/** Set by the mounted ToastProvider so non-React code can report errors */
let activeShowToast: ToastActions['showToast'] | null = null;

/**
 * Report a failure of something the user did: logs it and shows an error
 * toast ("<message>: <reason>"). Usable from components, hooks and services.
 */
export function notifyError(message: string, error?: unknown): void {
  console.error(message, error);
  const reason = error instanceof Error ? error.message : error ? String(error) : '';
  activeShowToast?.(reason ? `${message}: ${reason}` : message, 'error', 8000);
}
const ToastListContext = createContext<Toast[] | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const actions = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  useEffect(() => {
    activeShowToast = showToast;
    return () => {
      if (activeShowToast === showToast) activeShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastListContext.Provider value={toasts}>{children}</ToastListContext.Provider>
    </ToastActionsContext.Provider>
  );
};

/** Stable showToast/removeToast; does not re-render when toasts change. */
export const useToast = (): ToastActions => {
  const context = useContext(ToastActionsContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/** Current toast list (for the toast container). */
export const useToasts = (): Toast[] => {
  const context = useContext(ToastListContext);
  if (context === undefined) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};
