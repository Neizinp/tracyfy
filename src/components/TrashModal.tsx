import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'requirements' | 'usecases' | 'information'>(
    'requirements'
  );

  if (!isOpen) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return formatDateTime(timestamp);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
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
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Trash Bin</h3>
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 var(--spacing-md)',
          }}
        >
          <button
            onClick={() => setActiveTab('requirements')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === 'requirements'
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              color:
                activeTab === 'requirements'
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Requirements ({deletedRequirements.length})
          </button>
          <button
            onClick={() => setActiveTab('usecases')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === 'usecases'
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              color:
                activeTab === 'usecases' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Use Cases ({deletedUseCases.length})
          </button>
          <button
            onClick={() => setActiveTab('information')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === 'information'
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              color:
                activeTab === 'information' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Information ({deletedInformation.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
          {activeTab === 'requirements' &&
            (deletedRequirements.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}
              >
                No deleted requirements
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {deletedRequirements.map((req) => (
                  <div
                    key={req.id}
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
                          {req.id}
                        </span>
                        <span style={{ fontWeight: 500 }}>{req.title}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Deleted: {formatDate(req.deletedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onRestoreRequirement(req.id)}
                        title="Restore"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0',
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
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
                            onPermanentDeleteRequirement(req.id);
                          }
                        }}
                        title="Delete Forever"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #fecaca',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
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
            ))}

          {activeTab === 'usecases' &&
            (deletedUseCases.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}
              >
                No deleted use cases
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {deletedUseCases.map((uc) => (
                  <div
                    key={uc.id}
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
                          {uc.id}
                        </span>
                        <span style={{ fontWeight: 500 }}>{uc.title}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Deleted: {formatDate(uc.deletedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onRestoreUseCase(uc.id)}
                        title="Restore"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0',
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
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
                            onPermanentDeleteUseCase(uc.id);
                          }
                        }}
                        title="Delete Forever"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #fecaca',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
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
            ))}

          {activeTab === 'information' &&
            (deletedInformation.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}
              >
                No deleted information
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {deletedInformation.map((info) => (
                  <div
                    key={info.id}
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
                          {info.id}
                        </span>
                        <span style={{ fontWeight: 500 }}>{info.title}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Deleted: {formatDate(info.deletedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onRestoreInformation(info.id)}
                        title="Restore"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0',
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
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
                            onPermanentDeleteInformation(info.id);
                          }
                        }}
                        title="Delete Forever"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #fecaca',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
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
            ))}
        </div>

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: '0.875rem',
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
