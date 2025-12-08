import React, { useEffect, useState } from 'react';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import type { CommitInfo } from '../services/realGitService';
import { formatDateTime } from '../utils/dateUtils';
import { realGitService } from '../services/realGitService';
import {
  markdownToRequirement,
  markdownToUseCase,
  markdownToTestCase,
  markdownToInformation,
} from '../utils/markdownUtils';

interface RevisionHistoryTabProps {
  artifactId: string;
  artifactType: 'requirements' | 'usecases' | 'testcases' | 'information';
}

export const RevisionHistoryTab: React.FC<RevisionHistoryTabProps> = ({
  artifactId,
  artifactType,
}) => {
  const [history, setHistory] = useState<CommitInfo[]>([]);
  const [revisions, setRevisions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { getArtifactHistory, isReady } = useFileSystem();

  useEffect(() => {
    const loadHistory = async () => {
      if (!isReady) return;
      setLoading(true);
      try {
        const commits = await getArtifactHistory(artifactType, artifactId);
        setHistory(commits);
        const filePath = `${artifactType}/${artifactId}.md`;
        const revs: Record<string, string> = {};
        for (const commit of commits) {
          try {
            // Extra debug logging

            console.log('[RevisionHistoryTab][DEBUG] filePath:', filePath, 'commit:', commit.hash);
            const content = await realGitService.readFileAtCommit(filePath, commit.hash);

            console.log(
              '[RevisionHistoryTab][DEBUG] Content for',
              filePath,
              'at',
              commit.hash,
              ':',
              typeof content === 'string' ? content.slice(0, 200) : content
            );
            let revision = '—';
            let parsed = undefined;
            if (content) {
              if (artifactType === 'requirements') {
                parsed = markdownToRequirement(content);
              } else if (artifactType === 'usecases') {
                parsed = markdownToUseCase(content);
              } else if (artifactType === 'testcases') {
                parsed = markdownToTestCase(content);
              } else if (artifactType === 'information') {
                parsed = markdownToInformation(content);
              }
              // Extra debug log

              console.log(
                '[RevisionHistoryTab][DEBUG] commit:',
                commit.hash,
                'parsed:',
                parsed,
                'parsed.revision:',
                parsed?.revision
              );
              if (parsed) {
                revision = parsed.revision || '—';
              }
            } else {
              console.warn(
                '[RevisionHistoryTab][DEBUG] No content for commit',
                commit.hash,
                'at path',
                filePath
              );
            }
            revs[commit.hash] = revision;
          } catch (err) {
            console.error(
              '[RevisionHistoryTab][DEBUG] Error reading/parsing at commit',
              commit.hash,
              'for file',
              filePath,
              err
            );
            revs[commit.hash] = '—';
          }
        }
        setRevisions(revs);
      } catch (error) {
        console.error('[RevisionHistoryTab][DEBUG] Failed to load history:', error);
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
              const revision = revisions[commit.hash] || '—';

              console.log('[RevisionHistoryTab] UI row commit', commit.hash, 'revision:', revision);
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
