import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../state';

/** Icon color per toast type; the toast itself is a neutral raised surface */
const TOAST_ACCENT: Record<'info' | 'warning' | 'error' | 'success', string> = {
  info: '#74a6ff',
  warning: '#f1b54b',
  error: '#ff6b6b',
  success: '#4ad295',
};

const getToastStyles = (type: 'info' | 'warning' | 'error' | 'success') => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: 'var(--radius-lg)',
  // Solid, opaque surface in both themes so toasts stay readable over any content
  backgroundColor: '#26282d',
  border: '1px solid #3a3c42',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
  color: TOAST_ACCENT[type],
  minWidth: '300px',
  maxWidth: '440px',
  fontSize: 'var(--font-size-sm)',
  opacity: 1,
});

const getIcon = (type: 'info' | 'warning' | 'error' | 'success') => {
  switch (type) {
    case 'warning':
      return <AlertTriangle size={18} />;
    case 'error':
      return <XCircle size={18} />;
    case 'success':
      return <CheckCircle size={18} />;
    default:
      return <Info size={18} />;
  }
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

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
          <div style={{ flex: 1, color: '#e8e9ed', lineHeight: 1.45 }}>{toast.message}</div>
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
