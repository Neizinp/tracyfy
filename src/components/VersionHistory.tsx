import React from 'react';
import { X, RotateCcw, Clock } from 'lucide-react';
import type { Version } from '../types';

interface VersionHistoryProps {
    isOpen: boolean;
    versions: Version[];
    onClose: () => void;
    onRestore: (versionId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ isOpen, versions, onClose, onRestore }) => {
    if (!isOpen) return null;

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleRestore = (versionId: string) => {
        if (confirm('Are you sure you want to restore this version? Current unsaved changes will be lost.')) {
            onRestore(versionId);
            onClose();
        }
    };

    return (
        <div style={{
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
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                width: '700px',
                maxWidth: '90%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} />
                        Version History
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 'var(--spacing-md)'
                }}>
                    {versions.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)',
                            color: 'var(--color-text-muted)'
                        }}>
                            <Clock size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                            <p>No version history yet.</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                                Versions are created automatically when you make changes.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: index === 0 ? 'rgba(99, 102, 241, 0.05)' : 'var(--color-bg-app)',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-muted)',
                                                marginBottom: '4px'
                                            }}>
                                                {formatDate(version.timestamp)}
                                                {index === 0 && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'var(--color-accent)',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500
                                                    }}>
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontWeight: 500,
                                                color: 'var(--color-text-primary)'
                                            }}>
                                                {version.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-muted)',
                                                marginTop: '4px'
                                            }}>
                                                {version.data.requirements.length} requirements, {version.data.useCases.length} use cases, {version.data.links.length} links
                                            </div>
                                        </div>
                                        {index !== 0 && (
                                            <button
                                                onClick={() => handleRestore(version.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--color-border)',
                                                    backgroundColor: 'transparent',
                                                    color: 'var(--color-accent)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <RotateCcw size={14} />
                                                Restore
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    padding: 'var(--spacing-md)',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)'
                }}>
                    💡 Tip: Versions are automatically created when you make changes. Restore any previous version to undo changes.
                </div>
            </div>
        </div>
    );
};
