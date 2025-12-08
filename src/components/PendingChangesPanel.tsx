import { useState, useEffect } from 'react';
import { FileText, GitCommit, AlertCircle } from 'lucide-react';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import type { ArtifactChange } from '../types';

export function PendingChangesPanel() {
  const { pendingChanges, commitFile } = useFileSystem();
  const [commitMessages, setCommitMessages] = useState<Record<string, string>>({});
  const [committing, setCommitting] = useState<Record<string, boolean>>({});
  const [parsedChanges, setParsedChanges] = useState<ArtifactChange[]>([]);

  useEffect(() => {
    // Convert file statuses to ArtifactChange objects
    const changes: ArtifactChange[] = pendingChanges
      .map((fs) => {
        // Parse path: {type}/{id}.md
        const parts = fs.path.split('/');
        if (parts.length < 2) return null;

        const typeStr = parts[0]; // 'requirements', 'usecases', etc.
        const filename = parts[1];
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
          title: id,
          status: status as 'new' | 'modified',
          path: fs.path,
          commitMessage: commitMessages[id] || '',
        };
      })
      .filter(Boolean) as ArtifactChange[];

    // Auto-fill "First commit" for new items
    setCommitMessages((prev) => {
      const next = { ...prev };
      let hasChanges = false;
      changes.forEach((change) => {
        if (change.status === 'new' && !next[change.id]) {
          next[change.id] = 'First commit';
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });

    setParsedChanges(changes);
  }, [pendingChanges, commitMessages]);

  const handleCommitMessageChange = (id: string, message: string) => {
    setCommitMessages((prev) => ({ ...prev, [id]: message }));
  };

  const handleCommit = async (change: ArtifactChange) => {
    const message = commitMessages[change.id];
    if (!message || message.trim() === '') {
      alert('Please enter a commit message');
      return;
    }

    setCommitting((prev) => ({ ...prev, [change.id]: true }));

    try {
      await commitFile(change.path, message);

      // Clear the commit message
      setCommitMessages((prev) => {
        const updated = { ...prev };
        delete updated[change.id];
        return updated;
      });
    } catch (error) {
      console.error('Failed to commit:', error);
      alert(`Failed to commit: ${error}`);
    } finally {
      setCommitting((prev) => ({ ...prev, [change.id]: false }));
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

  if (parsedChanges.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-sm)',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        No pending changes
      </div>
    );
  }

  // Group by type
  const groupedChanges: Record<string, ArtifactChange[]> = {};
  parsedChanges.forEach((change) => {
    const typeName =
      change.type === 'requirement'
        ? 'Requirements'
        : change.type === 'usecase'
          ? 'Use Cases'
          : change.type === 'testcase'
            ? 'Test Cases'
            : 'Information';
    if (!groupedChanges[typeName]) {
      groupedChanges[typeName] = [];
    }
    groupedChanges[typeName].push(change);
  });

  return (
    <div
      style={{
        padding: 'var(--spacing-xs) 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
      }}
    >
      {Object.entries(groupedChanges).map(([typeName, changes]) => (
        <div key={typeName}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--spacing-xs)',
              paddingLeft: 'var(--spacing-xs)',
            }}
          >
            {typeName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {changes.map((change) => (
              <div
                key={change.id}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '6px',
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  {getTypeIcon()}
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {change.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: getStatusColor(change.status),
                    }}
                  >
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
                    outline: 'none',
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
                    cursor:
                      committing[change.id] || !commitMessages[change.id]?.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: committing[change.id] || !commitMessages[change.id]?.trim() ? 0.5 : 1,
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

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>Changes are saved to disk automatically. Commit each file separately when ready.</div>
      </div>
    </div>
  );
}
