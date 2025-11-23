import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UseCase } from '../types';

interface UseCaseModalProps {
    isOpen: boolean;
    useCase?: UseCase | null;
    onClose: () => void;
    onSubmit: (useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }) => void;
}

export const UseCaseModal: React.FC<UseCaseModalProps> = ({ isOpen, useCase, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actor, setActor] = useState('');
    const [preconditions, setPreconditions] = useState('');
    const [postconditions, setPostconditions] = useState('');
    const [mainFlow, setMainFlow] = useState('');
    const [alternativeFlows, setAlternativeFlows] = useState('');
    const [priority, setPriority] = useState<UseCase['priority']>('medium');
    const [status, setStatus] = useState<UseCase['status']>('draft');

    useEffect(() => {
        if (useCase) {
            setTitle(useCase.title);
            setDescription(useCase.description);
            setActor(useCase.actor);
            setPreconditions(useCase.preconditions);
            setPostconditions(useCase.postconditions);
            setMainFlow(useCase.mainFlow);
            setAlternativeFlows(useCase.alternativeFlows || '');
            setPriority(useCase.priority);
            setStatus(useCase.status);
        } else {
            // Reset form for new use case
            setTitle('');
            setDescription('');
            setActor('');
            setPreconditions('');
            setPostconditions('');
            setMainFlow('');
            setAlternativeFlows('');
            setPriority('medium');
            setStatus('draft');
        }
    }, [useCase, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (useCase) {
            // Editing existing use case
            onSubmit({
                id: useCase.id,
                updates: {
                    title,
                    description,
                    actor,
                    preconditions,
                    postconditions,
                    mainFlow,
                    alternativeFlows,
                    priority,
                    status,
                    lastModified: Date.now()
                }
            });
        } else {
            // Creating new use case
            onSubmit({
                title,
                description,
                actor,
                preconditions,
                postconditions,
                mainFlow,
                alternativeFlows,
                priority,
                status
            });
        }
        onClose();
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
                width: '600px',
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
                    <h3 style={{ fontWeight: 600 }}>{useCase ? `Edit Use Case - ${useCase.id}` : 'New Use Case'}</h3>
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                            placeholder="e.g., User Login"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem)' }}>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Brief description of the use case"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Actor *</label>
                        <input
                            type="text"
                            value={actor}
                            onChange={(e) => setActor(e.target.value)}
                            required
                            placeholder="e.g., End User, Administrator, System"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Preconditions</label>
                        <textarea
                            value={preconditions}
                            onChange={(e) => setPreconditions(e.target.value)}
                            rows={2}
                            placeholder="What must be true before this use case can start"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Main Flow *</label>
                        <textarea
                            value={mainFlow}
                            onChange={(e) => setMainFlow(e.target.value)}
                            required
                            rows={5}
                            placeholder="1. User enters credentials&#10;2. System validates credentials&#10;3. System grants access"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Postconditions</label>
                        <textarea
                            value={postconditions}
                            onChange={(e) => setPostconditions(e.target.value)}
                            rows={2}
                            placeholder="What must be true after this use case completes"
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Alternative Flows</label>
                        <textarea
                            value={alternativeFlows}
                            onChange={(e) => setAlternativeFlows(e.target.value)}
                            rows={3}
                            placeholder="Alternative paths or error scenarios"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as UseCase['priority'])}
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

                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as UseCase['status'])}
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
                                <option value="implemented">Implemented</option>
                                <option value="verified">Verified</option>
                            </select>
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
                            {useCase ? 'Save Changes' : 'Create Use Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
