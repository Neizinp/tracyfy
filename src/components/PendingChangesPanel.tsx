import { useState, useEffect } from 'react';
import { FileText, GitCommit, AlertCircle } from 'lucide-react';
import type { ArtifactChange } from '../types';

interface PendingChangesPanelProps {
    projectName: string;
    onChange: (changes: ArtifactChange[]) => void;
    onCommit: (artifactId: string, type: string, message: string) => void;
}

export function PendingChangesPanel({ projectName, onChange, onCommit }: PendingChangesPanelProps) {
    const [pendingChanges, setPendingChanges] = useState<ArtifactChange[]>([]);
    const [commitMessages, setCommitMessages] = useState<Record<string, string>>({});
    const [committing, setCommitting] = useState<Record<string, boolean>>({});

    // Load pending changes periodically
    useEffect(() => {
        const loadPendingChanges = async () => {
            try {
                const { gitService } = await import('../services/gitService');
                const fileStatuses = await gitService.getPendingChanges(projectName);

                // Convert file statuses to ArtifactChange objects
                const changes: ArtifactChange[] = fileStatuses
                    .filter(fs => fs.path.endsWith('.md') && fs.status !== 'unchanged')
                    .map(fs => {
                        // Parse path like "projects/ProjectName/requirements/REQ-001.md"
                        const parts = fs.path.split('/');
                        if (parts.length < 2) return null;

                        const filename = parts[parts.length - 1];
                        const typeStr = parts[parts.length - 2];
                        const id = filename.replace('.md', '');

                        // Map folder names to artifact types
                        let type: 'requirement' | 'usecase' | 'testcase' | 'information';
                        if (typeStr === 'requirements') type = 'requirement';
                        else if (typeStr === 'usecases') type = 'usecase';
                        else if (typeStr === 'testcases') type = 'testcase';
                        else if (typeStr === 'information') type = 'information';
                        else return null;

                        const status = fs.status === 'new' ? 'new' : 'modified';

                        return {
                            id,
                            type,
                            title: id, // We'll update this with actual title if needed
                            status: status as 'new' | 'modified',
                            path: fs.path,
                            commitMessage: commitMessages[id] || ''
                        };
                    })
                    .filter(Boolean) as ArtifactChange[];

                // Auto-fill "First commit" for new items
                setCommitMessages(prev => {
                    const next = { ...prev };
                    let hasChanges = false;
                    changes.forEach(change => {
                        if (change.status === 'new' && !next[change.id]) {
                            next[change.id] = 'First commit';
                            hasChanges = true;
                        }
                    });
                    return hasChanges ? next : prev;
                });

                setPendingChanges(changes);
                onChange(changes);
            } catch (error) {
                console.error('Failed to load pending changes:', error);
            }
        };

        loadPendingChanges();

        // Refresh every 5 seconds
        const interval = setInterval(loadPendingChanges, 5000);
        return () => clearInterval(interval);
    }, [projectName, commitMessages, onChange]);

    const handleCommitMessageChange = (id: string, message: string) => {
        setCommitMessages(prev => ({ ...prev, [id]: message }));
    };

    const handleCommit = async (change: ArtifactChange) => {
        const message = commitMessages[change.id];
        if (!message || message.trim() === '') {
            alert('Please enter a commit message');
            return;
        }

        setCommitting(prev => ({ ...prev, [change.id]: true }));

        try {
            await onCommit(change.id, change.type, message);

            // Clear the commit message and remove from pending
            setCommitMessages(prev => {
                const updated = { ...prev };
                delete updated[change.id];
                return updated;
            });

            setPendingChanges(prev => prev.filter(c => c.id !== change.id));
        } catch (error) {
            console.error('Failed to commit:', error);
            alert(`Failed to commit: ${error}`);
        } finally {
            setCommitting(prev => ({ ...prev, [change.id]: false }));
        }
    };

    const getTypeIcon = () => {
        return <FileText size={16} style={{ color: 'var(--color-accent)' }} />;
    };

    const getStatusColor = (status: string) => {
        return status === 'new' ? '#4ade80' : '#facc15'; // Green-400 : Yellow-400
    };

    const getStatusText = (status: string) => {
        return status === 'new' ? 'New' : 'Modified';
    };

    if (pendingChanges.length === 0) {
        return (
            <div style={{ padding: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                No pending changes
            </div>
        );
    }

    // Group by type
    const groupedChanges: Record<string, ArtifactChange[]> = {};
    pendingChanges.forEach(change => {
        const typeName = change.type === 'requirement' ? 'Requirements' :
            change.type === 'usecase' ? 'Use Cases' :
                change.type === 'testcase' ? 'Test Cases' : 'Information';
        if (!groupedChanges[typeName]) {
            groupedChanges[typeName] = [];
        }
        groupedChanges[typeName].push(change);
    });

    return (
        <div style={{ padding: 'var(--spacing-xs) 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {Object.entries(groupedChanges).map(([typeName, changes]) => (
                <div key={typeName}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--spacing-xs)',
                        paddingLeft: 'var(--spacing-xs)'
                    }}>
                        {typeName}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {changes.map(change => (
                            <div
                                key={change.id}
                                style={{
                                    backgroundColor: 'var(--color-bg-card)',
                                    borderRadius: '6px',
                                    padding: 'var(--spacing-sm)',
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                    {getTypeIcon()}
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {change.id}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: getStatusColor(change.status)
                                    }}>
                                        {getStatusText(change.status)}
                                    </span>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Commit message (required)"
                                    value={commitMessages[change.id] || ''}
                                    onChange={(e) => handleCommitMessageChange(change.id, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        backgroundColor: 'var(--color-bg-app)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 'var(--spacing-sm)',
                                        outline: 'none'
                                    }}
                                    disabled={committing[change.id]}
                                />

                                <button
                                    onClick={() => handleCommit(change)}
                                    disabled={committing[change.id] || !commitMessages[change.id]?.trim()}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'white',
                                        backgroundColor: 'var(--color-accent)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: committing[change.id] || !commitMessages[change.id]?.trim() ? 'not-allowed' : 'pointer',
                                        opacity: committing[change.id] || !commitMessages[change.id]?.trim() ? 0.5 : 1
                                    }}
                                >
                                    <GitCommit size={14} />
                                    {committing[change.id] ? 'Committing...' : 'Commit'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)'
            }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    Each file requires its own commit message
                </div>
            </div>
        </div>
    );
}
