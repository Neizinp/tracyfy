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

  const isBusy = isSubmitting || isSubmitDisabled;

  return (
    <div className="tf-modal-backdrop" onClick={onClose}>
      <div
        className="tf-modal"
        // Sizes are props, so they stay inline
        style={{ width, maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={tabs.length > 0 ? 'tf-modal-header tf-modal-header-tabs' : 'tf-modal-header'}
        >
          <div className="tf-modal-heading">
            {onBack && (
              <button type="button" onClick={onBack} aria-label="Back" className="tf-modal-back">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 id={`${formId}-title`} className="tf-modal-title">
              {icon}
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tf-btn tf-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {tabs.length > 0 && (
          <div className="tf-modal-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                type="button"
                className="tf-modal-tab"
                data-active={activeTab === tab.id || undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <form id={formId} onSubmit={onSubmit} className="tf-modal-body">
          {children}
        </form>

        {showDeleteConfirm && (
          <div className="tf-modal-confirm">
            <div className="tf-modal-confirm-title">{deleteConfirmTitle || 'Move to Trash'}</div>
            <div className="tf-modal-confirm-message">
              {deleteConfirmMessage ||
                'Are you sure you want to move this item to the trash? You can restore it later.'}
            </div>
            <div className="tf-modal-confirm-actions">
              <button
                type="button"
                onClick={onDeleteConfirm}
                className="tf-modal-button tf-modal-danger"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="tf-btn tf-modal-button tf-modal-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="tf-modal-footer">
          {footerLeft}
          <div className="tf-modal-spacer" />
          {footerActions}
          <button
            type="button"
            onClick={onClose}
            className="tf-btn tf-modal-button tf-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isBusy}
            className="tf-btn-primary tf-modal-button tf-modal-submit"
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
