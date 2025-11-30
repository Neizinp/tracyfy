import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Information } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';

interface InformationModalProps {
    isOpen: boolean;
    information: Information | null;
    onClose: () => void;
    onSubmit: (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Information> }) => void;
}

type Tab = 'overview' | 'history';

export const InformationModal: React.FC<InformationModalProps> = ({
    isOpen,
    information,
    onClose,
    onSubmit
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<Information['type']>('note');

    useEffect(() => {
        if (information) {
            setTitle(information.title);
            setContent(information.content);
            setType(information.type);
        } else {
            setTitle('');
            setContent('');
            setType('note');
        }
    }, [information, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (information) {
            onSubmit({
                id: information.id,
                updates: { title, content, type }
            });
        } else {
            onSubmit({ title, content, type, revision: '01' });
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
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: '8px',
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-bg-primary)',
                    zIndex: 1
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                        {information ? 'Edit Information' : 'New Information'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)'
                }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'overview' ? 'var(--color-bg-primary)' : 'transparent',
                            color: activeTab === 'overview' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'overview' ? 600 : 400,
                            borderBottom: activeTab === 'overview' ? '2px solid var(--color-accent)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        Overview
                    </button>
                    {information && (
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                backgroundColor: activeTab === 'history' ? 'var(--color-bg-primary)' : 'transparent',
                                color: activeTab === 'history' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'history' ? 600 : 400,
                                borderBottom: activeTab === 'history' ? '2px solid var(--color-accent)' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            Revision History
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{
                    padding: 'var(--spacing-lg)',
                    overflowY: 'auto',
                    flex: 1,
                    minHeight: 0
                }}>
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label htmlFor="info-title" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                    Title
                                </label>
                                <input
                                    id="info-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as Information['type'])}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    <option value="note">Note</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="decision">Decision</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label htmlFor="info-content" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                    Content
                                </label>
                                <textarea
                                    id="info-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows={10}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    {information ? 'Save Changes' : 'Create Information'}
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === 'history' && information && (
                        <RevisionHistoryTab artifactId={information.id} artifactType="information" />
                    )}
                </form>
            </div>
        </div>
    );
};
