import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Requirement, Link, Project } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { formatDateTime } from '../utils/dateUtils';

interface EditRequirementModalProps {
    isOpen: boolean;
    requirement: Requirement | null;
    allRequirements: Requirement[];
    links: Link[];
    projects: Project[];
    currentProjectId: string;
    onClose: () => void;
    onSubmit: (id: string, updates: Partial<Requirement>) => void;
    onDelete: (id: string) => void;
}

export const EditRequirementModal: React.FC<EditRequirementModalProps> = ({
    isOpen,
    requirement,
    allRequirements,
    links,
    projects,
    currentProjectId,
    onClose,
    onSubmit,
    onDelete
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [text, setText] = useState('');
    const [rationale, setRationale] = useState('');
    const [priority, setPriority] = useState<Requirement['priority']>('medium');
    const [status, setStatus] = useState<Requirement['status']>('draft');
    const [parentIds, setParentIds] = useState<string[]>([]);
    const [author, setAuthor] = useState('');
    const [verificationMethod, setVerificationMethod] = useState('');
    const [comments, setComments] = useState('');

    useEffect(() => {
        if (requirement) {
            setTitle(requirement.title);
            setDescription(requirement.description);
            setText(requirement.text);
            setRationale(requirement.rationale);
            setPriority(requirement.priority);
            setStatus(requirement.status);
            setParentIds(requirement.parentIds || []);
            setAuthor(requirement.author || '');
            setVerificationMethod(requirement.verificationMethod || '');
            setComments(requirement.comments || '');
        }
    }, [requirement]);

    if (!isOpen || !requirement) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: Partial<Requirement> = {
            title,
            description,
            text,
            rationale,
            priority,
            status,
            parentIds,
            author: author || undefined,
            verificationMethod: verificationMethod || undefined,
            comments: comments || undefined,
            lastModified: Date.now()
        };

        // Auto-set approval date when status changes to approved
        if (status === 'approved' && requirement.status !== 'approved') {
            updates.approvalDate = Date.now();
        }

        onSubmit(requirement.id, updates);
        onClose();
    };

    const handleParentToggle = (parentId: string) => {
        setParentIds(prev =>
            prev.includes(parentId)
                ? prev.filter(id => id !== parentId)
                : [...prev, parentId]
        );
    };

    // Recursively find all descendants of a requirement
    const getAllDescendants = (reqId: string, allReqs: Requirement[]): Set<string> => {
        const descendants = new Set<string>();

        const findChildren = (id: string) => {
            // Find all requirements that have this ID as a parent
            allReqs.forEach(req => {
                if (req.parentIds.includes(id) && !descendants.has(req.id)) {
                    descendants.add(req.id);
                    findChildren(req.id); // Recursively find their children
                }
            });
        };

        findChildren(reqId);
        return descendants;
    };

    // Get available parents (exclude self and descendants to prevent circular dependencies)
    const descendants = requirement ? getAllDescendants(requirement.id, allRequirements) : new Set<string>();
    const availableParents = allRequirements.filter(req => req.id !== requirement?.id);

    // Check if a requirement can be selected as a parent
    const canBeParent = (reqId: string): boolean => {
        return !descendants.has(reqId);
    };


    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDelete(requirement.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
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
                    <h3 style={{ fontWeight: 600 }}>Edit Requirement - {requirement.id}</h3>
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
                    {/* ... existing form fields ... */}
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
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Requirement['status'])}
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

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <MarkdownEditor
                            label="Comments"
                            value={comments}
                            onChange={setComments}
                            height={100}
                            placeholder="Add comments with Markdown..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Date Created</label>
                        <input
                            type="text"
                            value={formatDateTime(requirement.dateCreated)}
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

                    {requirement.approvalDate && (
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>Approval Date</label>
                            <input
                                type="text"
                                value={formatDateTime(requirement.approvalDate)}
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
                            Parent Requirements ({parentIds.length} selected)
                        </label>
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '8px',
                            backgroundColor: 'var(--color-bg-app)'
                        }}>
                            {availableParents.length === 0 ? (
                                <div style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    No other requirements available
                                </div>
                            ) : (
                                availableParents.map(req => {
                                    const isDescendant = !canBeParent(req.id);
                                    const isDisabled = isDescendant;

                                    return (
                                        <label
                                            key={req.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '6px 8px',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                borderRadius: '4px',
                                                marginBottom: '2px',
                                                transition: 'background-color 0.1s',
                                                opacity: isDisabled ? 0.5 : 1
                                            }}
                                            onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            title={isDisabled ? `Cannot select: ${req.id} is a descendant of this requirement (would create circular dependency)` : ''}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={parentIds.includes(req.id)}
                                                onChange={() => handleParentToggle(req.id)}
                                                disabled={isDisabled}
                                                style={{ marginRight: '8px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                            />
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--color-accent-light)', marginRight: '8px' }}>
                                                {req.id}
                                            </span>
                                            <span style={{ fontSize: '0.875rem' }}>
                                                {req.title}
                                            </span>
                                            {isDescendant && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    (descendant)
                                                </span>
                                            )}
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Select parent requirements. This requirement will appear under all selected parents.
                        </div>
                    </div>

                    {/* Links Section */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                            Linked Items
                        </label>
                        <div style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '8px',
                            backgroundColor: 'var(--color-bg-app)',
                            minHeight: '50px'
                        }}>
                            {links.filter(l => l.sourceId === requirement.id || l.targetId === requirement.id).length === 0 ? (
                                <div style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    No links found. Use the "Link" button in the main view to create links.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {links.filter(l => l.sourceId === requirement.id || l.targetId === requirement.id).map(link => {
                                        const isSource = link.sourceId === requirement.id;
                                        const otherId = isSource ? link.targetId : link.sourceId;
                                        const otherProjectId = isSource ? link.targetProjectId : link.sourceProjectId;

                                        // Find project name if external
                                        const otherProject = otherProjectId ? projects.find(p => p.id === otherProjectId) : null;
                                        const projectName = otherProject ? otherProject.name : (otherProjectId ? 'Unknown Project' : 'Current Project');
                                        const isExternal = !!otherProjectId && otherProjectId !== currentProjectId;

                                        return (
                                            <div key={link.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '6px 8px',
                                                backgroundColor: 'var(--color-bg-card)',
                                                borderRadius: '4px',
                                                border: '1px solid var(--color-border)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--color-bg-secondary)',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {link.type.replace('_', ' ')}
                                                    </span>
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                                        {isSource ? '→' : '←'}
                                                    </span>
                                                    <span style={{ fontWeight: 500 }}>
                                                        {otherId}
                                                    </span>
                                                    {isExternal && (
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--color-accent)',
                                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px'
                                                        }}>
                                                            {projectName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {showDeleteConfirm ? (
                        // Delete confirmation UI
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
                                Are you sure you want to move this requirement to the trash? You can restore it later from the Trash Bin.
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
                                    onClick={cancelDelete}
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
                            onClick={handleDelete}
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
