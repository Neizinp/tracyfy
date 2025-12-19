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
  tabs?: ModalTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  footerActions?: ReactNode;
  children: ReactNode;
  width?: string;
  maxHeight?: string;
  onBack?: () => void;
}

export const BaseArtifactModal: React.FC<BaseArtifactModalProps> = ({
  isOpen,
  onClose,
  title,
  tabs = [],
  activeTab,
  onTabChange,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  footerActions,
  children,
  width = '800px',
  maxHeight = '85vh',
  onBack,
}) => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
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
                  marginLeft: '-8px',
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          </div>
          <button
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
          id="base-artifact-modal-form"
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

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-md)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {footerActions}
          <div style={{ flex: 1 }} />
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
            form="base-artifact-modal-form"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
