import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Requirement } from '../types';
import { MarkdownEditor } from './MarkdownEditor';

interface NewRequirementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
}

export const NewRequirementModal: React.FC<NewRequirementModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [text, setText] = useState('');
    const [rationale, setRationale] = useState('');
    const [priority, setPriority] = useState<Requirement['priority']>('medium');
    const [author, setAuthor] = useState('');
    const [verificationMethod, setVerificationMethod] = useState('');
    const [comments, setComments] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            text,
            rationale,
            priority,
            author: author || undefined,
            verificationMethod: verificationMethod || undefined,
            comments: comments || undefined,
            dateCreated: Date.now(),
            status: 'draft',
            parentIds: [] // New requirements start with no parents
        });
        // Reset form
        setTitle('');
        setDescription('');
        setText('');
        setRationale('');
        setPriority('medium');
        setAuthor('');
        setVerificationMethod('');
        setComments('');
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
                    <h3 style={{ fontWeight: 600 }}>New Requirement</h3>
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
                        <MarkdownEditor
                            label="Description"
                            value={description}
                            onChange={setDescription}
                            height={150}
                            placeholder="Enter description with Markdown formatting..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <MarkdownEditor
                            label="Requirement Text"
                            value={text}
                            onChange={setText}
                            height={120}
                            placeholder="Enter detailed requirement text with Markdown..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <MarkdownEditor
                            label="Rationale"
                            value={rationale}
                            onChange={setRationale}
                            height={120}
                            placeholder="Explain the rationale with Markdown..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Requirement['priority'])}
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Verification Method</label>
                        <input
                            type="text"
                            value={verificationMethod}
                            onChange={(e) => setVerificationMethod(e.target.value)}
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
                        <MarkdownEditor
                            label="Comments"
                            value={comments}
                            onChange={setComments}
                            height={100}
                            placeholder="Add comments with Markdown..."
                        />
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
                            Create Requirement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
