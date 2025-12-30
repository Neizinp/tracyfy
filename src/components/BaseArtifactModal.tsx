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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          width: width,
          maxWidth: '95%',
          maxHeight: maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(to bottom, var(--color-bg-card), var(--color-bg-secondary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {onBack && (
              <button
                onClick={onBack}
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
              style={{
                margin: 0,
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
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
            className="btn-icon"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              padding: '0 var(--spacing-lg)',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color:
                    activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid var(--color-accent)'
                      : '2px solid transparent',
                  transition: 'all 0.2s',
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
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-lg)',
          }}
        >
          {children}
        </form>

        {showDeleteConfirm && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              margin: '0 var(--spacing-lg) var(--spacing-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-status-error)',
              borderRadius: '6px',
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
              <span>⚠️</span> {deleteConfirmTitle || 'Move to Trash'}
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
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--color-status-error)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
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
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {footerLeft}
          <div style={{ flex: 1 }} />
          {footerActions}
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting || isSubmitDisabled}
            className="btn-primary"
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: isSubmitting || isSubmitDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isSubmitting || isSubmitDisabled ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
