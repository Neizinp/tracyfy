import React from 'react';
import { X, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import type { Requirement, UseCase, Information } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedRequirements: Requirement[];
  deletedUseCases: UseCase[];
  deletedInformation: Information[];
  onRestoreRequirement: (id: string) => void;
  onRestoreUseCase: (id: string) => void;
  onRestoreInformation: (id: string) => void;
  onPermanentDeleteRequirement: (id: string) => void;
  onPermanentDeleteUseCase: (id: string) => void;
  onPermanentDeleteInformation: (id: string) => void;
}

interface DeletedItem {
  id: string;
  title: string;
  type: 'requirement' | 'usecase' | 'information';
  deletedAt?: number;
  onRestore: () => void;
  onDelete: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  deletedRequirements,
  deletedUseCases,
  deletedInformation,
  onRestoreRequirement,
  onRestoreUseCase,
  onRestoreInformation,
  onPermanentDeleteRequirement,
  onPermanentDeleteUseCase,
  onPermanentDeleteInformation,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return formatDateTime(timestamp);
  };

  // Combine all deleted items into a single list
  const allDeletedItems: DeletedItem[] = [
    ...deletedRequirements.map((req) => ({
      id: req.id,
      title: req.title,
      type: 'requirement' as const,
      deletedAt: req.deletedAt,
      onRestore: () => onRestoreRequirement(req.id),
      onDelete: () => onPermanentDeleteRequirement(req.id),
    })),
    ...deletedUseCases.map((uc) => ({
      id: uc.id,
      title: uc.title,
      type: 'usecase' as const,
      deletedAt: uc.deletedAt,
      onRestore: () => onRestoreUseCase(uc.id),
      onDelete: () => onPermanentDeleteUseCase(uc.id),
    })),
    ...deletedInformation.map((info) => ({
      id: info.id,
      title: info.title,
      type: 'information' as const,
      deletedAt: info.deletedAt,
      onRestore: () => onRestoreInformation(info.id),
      onDelete: () => onPermanentDeleteInformation(info.id),
    })),
  ].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0)); // Sort by most recently deleted

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '800px',
          maxWidth: '90%',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Trash2 size={20} color="var(--color-text-secondary)" />
            <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
              Trash Bin ({allDeletedItems.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Single list of all deleted items */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
          {allDeletedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              Trash is empty
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {allDeletedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 'var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-app)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--color-accent)',
                        }}
                      >
                        {item.id}
                      </span>
                      <span style={{ fontWeight: 500 }}>{item.title}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Deleted: {formatDate(item.deletedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={item.onRestore}
                      title="Restore"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-success)',
                        backgroundColor: 'var(--color-success-bg)',
                        color: 'var(--color-success)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                      }}
                    >
                      <RefreshCw size={14} /> Restore
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete permanently? This cannot be undone.')) {
                          item.onDelete();
                        }
                      }}
                      title="Delete Forever"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-error)',
                        backgroundColor: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={14} /> Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          Items in trash are not visible in the main view but are preserved until permanently
          deleted.
        </div>
      </div>
    </div>
  );
};
