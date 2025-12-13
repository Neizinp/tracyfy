import { useState, useEffect, useRef } from 'react';
import { FileText, GitCommit, AlertCircle } from 'lucide-react';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { useUser } from '../app/providers/UserProvider';
import { useBackgroundTasks } from '../app/providers/BackgroundTasksProvider';
import type { ArtifactChange } from '../types';

export function PendingChangesPanel() {
  const { pendingChanges, commitFile, projects } = useFileSystem();
  const { currentUser } = useUser();
  const { startTask, endTask } = useBackgroundTasks();
  const [commitMessages, setCommitMessages] = useState<Record<string, string>>({});
  const [parsedChanges, setParsedChanges] = useState<ArtifactChange[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusNextId, setFocusNextId] = useState<string | null>(null);

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
        let type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'project';
        if (typeStr === 'requirements') type = 'requirement';
        else if (typeStr === 'usecases') type = 'usecase';
        else if (typeStr === 'testcases') type = 'testcase';
        else if (typeStr === 'information') type = 'information';
        else if (typeStr === 'projects') type = 'project';
        else return null;

        const status = fs.status === 'new' ? 'new' : 'modified';

        // For projects, use the project name instead of ID
        let title = id;
        if (type === 'project') {
          const project = projects.find((p) => p.id === id);
          title = project?.name || id;
        }

        return {
          id,
          type,
          title,
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
  }, [pendingChanges, commitMessages, projects]);

  const handleCommitMessageChange = (id: string, message: string) => {
    setCommitMessages((prev) => ({ ...prev, [id]: message }));
  };

  const handleCommit = async (change: ArtifactChange) => {
    const message = commitMessages[change.id];
    if (!message || message.trim() === '') {
      alert('Please enter a commit message');
      return;
    }

    // Find the index of current change to determine which one to focus next
    const currentIndex = parsedChanges.findIndex((c) => c.id === change.id);
    const remainingChanges = parsedChanges.filter((c) => c.id !== change.id);

    // Determine next change to focus (same position if available, otherwise last)
    const nextChange = remainingChanges[currentIndex] || remainingChanges[currentIndex - 1];
    if (nextChange) {
      setFocusNextId(nextChange.id);
    }

    // Optimistic UI: Clear the commit message immediately so the entry disappears
    // The commit will continue in the background
    setCommitMessages((prev) => {
      const updated = { ...prev };
      delete updated[change.id];
      return updated;
    });

    // Remove from parsed changes immediately for instant feedback
    setParsedChanges(remainingChanges);

    // Clean up the ref for this change
    delete inputRefs.current[change.id];

    // Track the commit operation as a background task
    const taskId = startTask(`Committing ${change.title}...`);

    // Run commit in background (don't await - let it complete asynchronously)
    commitFile(change.path, message, currentUser?.name)
      .catch((error) => {
        console.error('Failed to commit:', error);
        // On error, the user will see the change reappear on next status refresh
      })
      .finally(() => {
        endTask(taskId);
      });
  };

  // Effect to focus the next input after a commit
  useEffect(() => {
    if (focusNextId && inputRefs.current[focusNextId]) {
      inputRefs.current[focusNextId]?.focus();
      setFocusNextId(null);
    }
  }, [focusNextId, parsedChanges]);

  const getTypeIcon = () => {
    return <FileText size={16} style={{ color: 'var(--color-accent)' }} />;
  };

  const getStatusColor = (status: string) => {
    return status === 'new' ? 'var(--color-success-light)' : 'var(--color-warning-light)';
  };

  const getStatusText = (status: string) => {
    return status === 'new' ? 'New' : 'Modified';
  };

  if (parsedChanges.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
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
            : change.type === 'project'
              ? 'Projects'
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
              fontSize: 'var(--font-size-xs)',
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
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {change.title}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: getStatusColor(change.status),
                    }}
                  >
                    {getStatusText(change.status)}
                  </span>
                </div>

                <input
                  ref={(el) => {
                    inputRefs.current[change.id] = el;
                  }}
                  type="text"
                  placeholder="Commit message (required)"
                  value={commitMessages[change.id] || ''}
                  onChange={(e) => handleCommitMessageChange(change.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commitMessages[change.id]?.trim()) {
                      handleCommit(change);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: 'var(--font-size-xs)',
                    backgroundColor: 'var(--color-bg-app)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-sm)',
                    outline: 'none',
                  }}
                />

                <button
                  onClick={() => handleCommit(change)}
                  disabled={!commitMessages[change.id]?.trim()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                    padding: '6px 12px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                    color: 'white',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !commitMessages[change.id]?.trim() ? 'not-allowed' : 'pointer',
                    opacity: !commitMessages[change.id]?.trim() ? 0.5 : 1,
                  }}
                >
                  <GitCommit size={14} />
                  Commit
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
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
        }}
      >
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>Changes are saved to disk automatically. Commit each file separately when ready.</div>
      </div>
    </div>
  );
}
