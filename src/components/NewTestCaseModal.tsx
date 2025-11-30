import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TestCase, Requirement } from '../types';

interface NewTestCaseModalProps {
    isOpen: boolean;
    requirements: Requirement[];
    onClose: () => void;
    onSubmit: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
}

export const NewTestCaseModal: React.FC<NewTestCaseModalProps> = ({ isOpen, requirements, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TestCase['priority']>('medium');
    const [author, setAuthor] = useState('');
    const [requirementIds, setRequirementIds] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            priority,
            author: author || undefined,
            requirementIds,
            status: 'draft',
            revision: '01'
        });
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
        setAuthor('');
        setRequirementIds([]);
        onClose();
    };

    const handleRequirementToggle = (reqId: string) => {
        setRequirementIds(prev =>
            prev.includes(reqId)
                ? prev.filter(id => id !== reqId)
                : [...prev, reqId]
        );
    };

    const activeRequirements = requirements.filter(r => !r.isDeleted);

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
                maxHeight: '90vh',
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
                    <h3 style={{ fontWeight: 600 }}>New Test Case</h3>
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

                <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)', overflow: 'auto' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label htmlFor="new-test-case-title" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Title</label>
                        <input
                            id="new-test-case-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label htmlFor="new-test-case-description" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Description</label>
                        <textarea
                            id="new-test-case-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label htmlFor="new-test-case-priority" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Priority</label>
                        <select
                            id="new-test-case-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TestCase['priority'])}
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
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label htmlFor="new-test-case-author" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Author</label>
                        <input
                            id="new-test-case-author"
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-app)',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                            Linked Requirements ({requirementIds.length} selected)
                        </label>
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '8px',
                            backgroundColor: 'var(--color-bg-app)'
                        }}>
                            {activeRequirements.length === 0 ? (
                                <div style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    No requirements available
                                </div>
                            ) : (
                                activeRequirements.map(req => (
                                    <label
                                        key={req.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px 8px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            marginBottom: '2px',
                                            transition: 'background-color 0.1s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={requirementIds.includes(req.id)}
                                            onChange={() => handleRequirementToggle(req.id)}
                                            style={{ marginRight: '8px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--color-accent-light)', marginRight: '8px' }}>
                                            {req.id}
                                        </span>
                                        <span style={{ fontSize: '0.875rem' }}>
                                            {req.title}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
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
                            Create Test Case
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
