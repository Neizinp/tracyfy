import React, { useState } from 'react';
import { X, RotateCcw, Clock, Save, Tag } from 'lucide-react';
import type { Version } from '../types';

interface VersionHistoryProps {
    isOpen: boolean;
    versions: Version[];
    onClose: () => void;
    onRestore: (versionId: string) => void;
    onCreateBaseline: (name: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ isOpen, versions, onClose, onRestore, onCreateBaseline }) => {
    const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
    const [baselineName, setBaselineName] = useState('');
    const [filter, setFilter] = useState<'all' | 'baseline'>('all');

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

    const handleCreateBaselineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (baselineName.trim()) {
            onCreateBaseline(baselineName.trim());
            setBaselineName('');
            setIsCreatingBaseline(false);
        }
    };

    const filteredVersions = filter === 'all'
        ? versions
        : versions.filter(v => v.type === 'baseline');

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
                width: '800px',
                maxWidth: '90%',
                maxHeight: '85vh',
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
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: filter === 'all' ? 'var(--color-accent)' : 'transparent',
                                color: filter === 'all' ? 'white' : 'var(--color-text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            All History
                        </button>
                        <button
                            onClick={() => setFilter('baseline')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: filter === 'baseline' ? 'var(--color-accent)' : 'transparent',
                                color: filter === 'baseline' ? 'white' : 'var(--color-text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Tag size={14} />
                            Baselines Only
                        </button>
                    </div>

                    {!isCreatingBaseline ? (
                        <button
                            onClick={() => setIsCreatingBaseline(true)}
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
                                fontWeight: 500
                            }}
                        >
                            <Save size={14} />
                            Create Baseline
                        </button>
                    ) : (
                        <form onSubmit={handleCreateBaselineSubmit} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={baselineName}
                                onChange={(e) => setBaselineName(e.target.value)}
                                placeholder="Baseline Name (e.g. v1.0)"
                                autoFocus
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-app)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '0.875rem',
                                    width: '200px'
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
                                    opacity: baselineName.trim() ? 1 : 0.5
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
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 'var(--spacing-md)'
                }}>
                    {filteredVersions.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)',
                            color: 'var(--color-text-muted)'
                        }}>
                            <Clock size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                            <p>No history found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredVersions.map((version, index) => (
                                <div
                                    key={version.id}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: version.type === 'baseline'
                                            ? 'rgba(16, 185, 129, 0.05)'
                                            : (index === 0 && filter === 'all' ? 'rgba(99, 102, 241, 0.05)' : 'var(--color-bg-app)'),
                                        borderColor: version.type === 'baseline' ? 'var(--color-success)' : 'var(--color-border)',
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
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {formatDate(version.timestamp)}
                                                {version.type === 'baseline' && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'var(--color-success)',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Tag size={10} />
                                                        {version.tag || 'Baseline'}
                                                    </span>
                                                )}
                                                {index === 0 && filter === 'all' && (
                                                    <span style={{
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
                    💡 Tip: Create baselines to save named snapshots of your project (e.g., "v1.0 Release").
                </div>
            </div>
        </div>
    );
};
