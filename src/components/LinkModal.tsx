import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Requirement, Link } from '../types';

interface LinkModalProps {
    isOpen: boolean;
    sourceRequirementId: string | null;
    requirements: Requirement[];
    onClose: () => void;
    onSubmit: (link: Omit<Link, 'id'>) => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({ isOpen, sourceRequirementId, requirements, onClose, onSubmit }) => {
    const [targetId, setTargetId] = useState('');
    const [type, setType] = useState<Link['type']>('relates_to');

    if (!isOpen || !sourceRequirementId) return null;

    // Requirements are already flat, just filter out the source
    const availableTargets = requirements.filter(r => r.id !== sourceRequirementId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetId) {
            onSubmit({
                sourceId: sourceRequirementId,
                targetId,
                type
            });
            setTargetId('');
            setType('relates_to');
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
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{ fontWeight: 600 }}>Create Link</h3>
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

                <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Source Requirement</label>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-bg-sidebar)',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem'
                        }}>
                            {sourceRequirementId}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Target Requirement</label>
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        >
                            <option value="">Select a requirement...</option>
                            {availableTargets.map(req => (
                                <option key={req.id} value={req.id}>
                                    {req.id} - {req.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Link Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as Link['type'])}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        >
                            <option value="relates_to">Relates To</option>
                            <option value="depends_on">Depends On</option>
                            <option value="conflicts_with">Conflicts With</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Create Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
