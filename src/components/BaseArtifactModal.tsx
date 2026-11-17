import React from 'react';
import type { ReactNode } from 'react';
import { X, ArrowLeft } from 'lucide-react';

export interface ModalTab {
  id: string;
  label: string;
}

interface BaseArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  tabs?: ModalTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  footerActions?: ReactNode;
  footerLeft?: ReactNode;
  children: ReactNode;
  width?: string;
  maxHeight?: string;
  onBack?: () => void;
  formId?: string;
  showDeleteConfirm?: boolean;
  onDeleteConfirm?: () => void;
  onDeleteCancel?: () => void;
  deleteConfirmMessage?: string;
  deleteConfirmTitle?: string;
}

export const BaseArtifactModal: React.FC<BaseArtifactModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  tabs = [],
  activeTab,
  onTabChange,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  isSubmitDisabled = false,
  footerActions,
  footerLeft,
  children,
  width = '800px',
  maxHeight = '85vh',
  onBack,
  formId = 'base-artifact-modal-form',
  showDeleteConfirm,
  onDeleteConfirm,
  onDeleteCancel,
  deleteConfirmMessage,
  deleteConfirmTitle,
}) => {
  // Keyboard shortcut: Ctrl+S / Cmd+S to save and close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById(formId) as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-light)',
          width: width,
          maxWidth: '95%',
          maxHeight: maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-dialog)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: tabs.length > 0 ? '16px 18px 6px' : '16px 18px',
            borderBottom: tabs.length > 0 ? 'none' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2
              id={`${formId}-title`}
              style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {icon}
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tf-btn"
            aria-label="Close"
            style={{
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid var(--color-border)',
              padding: '0 12px',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                type="button"
                style={{
                  padding: '8px 8px 9px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color:
                    activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid var(--color-accent)'
                      : '2px solid transparent',
                  position: 'relative',
                  bottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Form Body */}
        <form
          id={formId}
          onSubmit={onSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {children}
        </form>

        {showDeleteConfirm && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              margin: '0 var(--spacing-lg) var(--spacing-lg)',
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                color: 'var(--color-status-error)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {deleteConfirmTitle || 'Move to Trash'}
            </div>
            <div
              style={{
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              {deleteConfirmMessage ||
                'Are you sure you want to move this item to the trash? You can restore it later.'}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                onClick={onDeleteConfirm}
                className="btn-danger"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--color-error)',
                  color: 'var(--color-on-accent)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="tf-btn"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {footerLeft}
          <div style={{ flex: 1 }} />
          {footerActions}
          <button
            type="button"
            onClick={onClose}
            className="tf-btn"
            style={{
              height: '32px',
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting || isSubmitDisabled}
            className="tf-btn-primary"
            style={{
              height: '32px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              cursor: isSubmitting || isSubmitDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              boxShadow: 'var(--shadow-popover)',
              opacity: isSubmitting || isSubmitDisabled ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
