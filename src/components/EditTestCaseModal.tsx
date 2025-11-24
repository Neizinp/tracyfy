import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TestCase, Requirement } from '../types';

interface EditTestCaseModalProps {
    isOpen: boolean;
    testCase: TestCase | null;
    requirements: Requirement[];
    onClose: () => void;
    onSubmit: (id: string, updates: Partial<TestCase>) => void;
    onDelete: (id: string) => void;
}

export const EditTestCaseModal: React.FC<EditTestCaseModalProps> = ({ isOpen, testCase, requirements, onClose, onSubmit, onDelete }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TestCase['priority']>('medium');
    const [status, setStatus] = useState<TestCase['status']>('draft');
    const [author, setAuthor] = useState('');
    const [requirementIds, setRequirementIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (testCase) {
            setTitle(testCase.title);
            setDescription(testCase.description);
            setPriority(testCase.priority);
            setStatus(testCase.status);
            setAuthor(testCase.author || '');
            setRequirementIds(testCase.requirementIds || []);
        }
    }, [testCase]);

    if (!isOpen || !testCase) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: Partial<TestCase> = {
            title,
            description,
            priority,
            status,
            author: author || undefined,
            requirementIds,
            lastModified: Date.now()
        };

        // Update lastRun when status changes to passed/failed
        if ((status === 'passed' || status === 'failed') && testCase.status !== status) {
            updates.lastRun = Date.now();
        }

        onSubmit(testCase.id, updates);
        onClose();
    };

    const handleRequirementToggle = (reqId: string) => {
        setRequirementIds(prev =>
            prev.includes(reqId)
                ? prev.filter(id => id !== reqId)
                : [...prev, reqId]
        );
    };

    const confirmDelete = () => {
        onDelete(testCase.id);
        setShowDeleteConfirm(false);
        onClose();
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
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--color-bg-card)',
                    zIndex: 1
                }}>
                    <h3 style={{ fontWeight: 600 }}>Edit Test Case - {testCase.id}</h3>
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Title</label>
                        <input
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Description</label>
                        <textarea
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Priority</label>
                        <select
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TestCase['status'])}
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
                            <option value="draft">Draft</option>
                            <option value="approved">Approved</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Author</label>
                        <input
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

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Date Created</label>
                        <input
                            type="text"
                            value={new Date(testCase.dateCreated).toLocaleString()}
                            disabled
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-muted)',
                                outline: 'none',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    {testCase.lastRun && (
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Last Run</label>
                            <input
                                type="text"
                                value={new Date(testCase.lastRun).toLocaleString()}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-muted)',
                                    outline: 'none',
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>
                    )}

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

                    {showDeleteConfirm ? (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <div style={{ color: '#991b1b', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                ⚠️ Move to Trash
                            </div>
                            <div style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                                Are you sure you want to move this test case to the trash?
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    Move to Trash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)' }}>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={showDeleteConfirm}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid #ef4444',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                cursor: showDeleteConfirm ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                                opacity: showDeleteConfirm ? 0.5 : 1
                            }}
                        >
                            Delete
                        </button>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
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
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
