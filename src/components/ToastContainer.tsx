import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../app/providers/ToastProvider';

const getToastStyles = (type: 'info' | 'warning' | 'error' | 'success') => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    minWidth: '320px',
    maxWidth: '450px',
  };

  switch (type) {
    case 'warning':
      return {
        ...baseStyles,
        backgroundColor: 'var(--color-warning-bg, #433422)',
        border: '1px solid var(--color-warning, #f59e0b)',
        color: 'var(--color-warning, #f59e0b)',
      };
    case 'error':
      return {
        ...baseStyles,
        backgroundColor: 'var(--color-error-bg, #422222)',
        border: '1px solid var(--color-error, #ef4444)',
        color: 'var(--color-error, #ef4444)',
      };
    case 'success':
      return {
        ...baseStyles,
        backgroundColor: 'var(--color-success-bg, #224422)',
        border: '1px solid var(--color-success, #22c55e)',
        color: 'var(--color-success, #22c55e)',
      };
    default:
      return {
        ...baseStyles,
        backgroundColor: 'var(--color-bg-card, #2a2a2a)',
        border: '1px solid var(--color-accent, #6366f1)',
        color: 'var(--color-accent, #6366f1)',
      };
  }
};

const getIcon = (type: 'info' | 'warning' | 'error' | 'success') => {
  switch (type) {
    case 'warning':
      return <AlertTriangle size={20} />;
    case 'error':
      return <XCircle size={20} />;
    case 'success':
      return <CheckCircle size={20} />;
    default:
      return <Info size={20} />;
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...getToastStyles(toast.type),
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(toast.type)}</div>
          <div
            style={{ flex: 1, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}
          >
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};
