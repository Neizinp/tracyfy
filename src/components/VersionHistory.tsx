import React, { useState } from 'react';
import { X, Clock, Save, Tag } from 'lucide-react';
import type { ProjectBaseline } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface VersionHistoryProps {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  onClose: () => void;
  onCreateBaseline: (name: string, message: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  baselines,
  onClose,
  onCreateBaseline,
}) => {
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);

  // Default name generation
  const nextBaselineNumber = `v${baselines.length + 1} .0`;

  const [baselineName, setBaselineName] = useState(nextBaselineNumber);
  const [baselineMessage, setBaselineMessage] = useState('');

  // Update default name when modal opens for creating
  const handleStartCreating = () => {
    setBaselineName(`v${baselines.length + 1} .0`);
    setBaselineMessage('');
    setIsCreatingBaseline(true);
  };

  if (!isOpen) return null;

  const handleCreateBaselineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (baselineName.trim()) {
      onCreateBaseline(
        baselineName.trim(),
        baselineMessage.trim() || `Baseline ${baselineName.trim()} `
      );
      setBaselineName('');
      setBaselineMessage('');
      setIsCreatingBaseline(false);
    }
  };

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
        // no blur
      }}
    >
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '800px',
          maxWidth: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} />
            Baselines & History
          </h3>
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

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {!isCreatingBaseline ? (
            <button
              onClick={handleStartCreating}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              <Save size={14} />
              Create Baseline
            </button>
          ) : (
            <form
              onSubmit={handleCreateBaselineSubmit}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                type="text"
                value={baselineName}
                onChange={(e) => setBaselineName(e.target.value)}
                placeholder="Name (e.g. v1.0)"
                autoFocus
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  width: '120px',
                }}
              />
              <input
                type="text"
                value={baselineMessage}
                onChange={(e) => setBaselineMessage(e.target.value)}
                placeholder="Description (optional)"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  width: '200px',
                }}
              />
              <button
                type="submit"
                disabled={!baselineName.trim()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  opacity: baselineName.trim() ? 1 : 0.5,
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingBaseline(false);
                  setBaselineName('');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--spacing-md)',
          }}
        >
          {baselines.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Tag size={48} style={{ opacity: 1, marginBottom: '12px' }} />
              <p>No baselines found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {baselines.map((baseline) => (
                <div
                  key={baseline.id}
                  style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-success)',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {formatDateTime(baseline.timestamp)}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-success)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Tag size={10} />
                          {baseline.version}
                        </span>
                      </div>
                      <div
                        style={{
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {baseline.description || baseline.name}
                      </div>
                    </div>
                    {/* Restore button disabled for now as it requires complex git checkout logic */}
                    {/* <button
                                            onClick={() => handleRestore(baseline.id)}
                                            style={{ ... }}
                                        >
                                            <RotateCcw size={14} />
                                            Restore
                                        </button> */}
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
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          💡 Tip: Create baselines to save named snapshots of your project (e.g., "v1.0 Release").
        </div>
      </div>
    </div>
  );
};
