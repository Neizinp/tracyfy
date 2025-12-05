import React, { useEffect, useState } from 'react';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import type { CommitInfo } from '../services/realGitService';
import { formatDateTime } from '../utils/dateUtils';

interface RevisionHistoryTabProps {
  artifactId: string;
  artifactType: 'requirements' | 'usecases' | 'testcases' | 'information';
}

export const RevisionHistoryTab: React.FC<RevisionHistoryTabProps> = ({
  artifactId,
  artifactType,
}) => {
  const [history, setHistory] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { getArtifactHistory, isReady } = useFileSystem();

  useEffect(() => {
    const loadHistory = async () => {
      if (!isReady) return;

      setLoading(true);
      try {
        const commits = await getArtifactHistory(artifactType, artifactId);
        setHistory(commits);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (artifactId && isReady) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [artifactId, artifactType, getArtifactHistory, isReady]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No revision history available.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                textAlign: 'left',
                color: 'var(--color-text-secondary)',
              }}
            >
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Rev</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Author</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Message</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Commit</th>
            </tr>
          </thead>
          <tbody>
            {history.map((commit) => {
              // Extract revision from message if present (e.g. "(Rev 02)")
              const revMatch = commit.message.match(/\(Rev (\d+)\)/);
              const revision = revMatch ? revMatch[1] : '-';

              return (
                <tr
                  key={commit.hash}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.1s',
                  }}
                >
                  <td
                    style={{
                      padding: '12px 8px',
                      color: 'var(--color-text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {revision}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDateTime(commit.timestamp)}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>
                    {commit.author}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>
                    {commit.message}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontFamily: 'monospace',
                      color: 'var(--color-accent-light)',
                    }}
                  >
                    {commit.hash.substring(0, 7)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
