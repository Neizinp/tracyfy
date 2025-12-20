import React, { useEffect, useState } from 'react';
import { debug } from '../utils/debug';
import { useFileSystem, useRisks } from '../app/providers';
import type { CommitInfo } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import {
  markdownToRequirement,
  markdownToUseCase,
  markdownToTestCase,
  markdownToInformation,
  markdownToRisk,
} from '../utils/markdownUtils';

interface RevisionHistoryTabProps {
  artifactId: string;
  artifactType: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks';
}

export const RevisionHistoryTab: React.FC<RevisionHistoryTabProps> = ({
  artifactId,
  artifactType,
}) => {
  const [history, setHistory] = useState<CommitInfo[]>([]);
  const [revisions, setRevisions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { getArtifactHistory: getFsHistory, readFileAtCommit, isReady } = useFileSystem();
  const { getRiskHistory } = useRisks();

  useEffect(() => {
    const loadHistory = async () => {
      if (!isReady) return;
      setLoading(true);
      try {
        const commits =
          artifactType === 'risks'
            ? await getRiskHistory(artifactId)
            : await getFsHistory(
                artifactType as 'requirements' | 'usecases' | 'testcases' | 'information',
                artifactId
              );
        setHistory(commits);
        const filePath = `${artifactType}/${artifactId}.md`;
        const revs: Record<string, string> = {};
        for (const commit of commits) {
          try {
            // Extra debug logging

            debug.log('[RevisionHistoryTab][DEBUG] filePath:', filePath, 'commit:', commit.hash);
            const content = await readFileAtCommit(filePath, commit.hash);

            debug.log(
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
              } else if (artifactType === 'risks') {
                parsed = markdownToRisk(content);
              }
              // Extra debug log

              debug.log(
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
              debug.warn(
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
  }, [artifactId, artifactType, getFsHistory, getRiskHistory, readFileAtCommit, isReady]);

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
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}
        >
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
            </tr>
          </thead>
          <tbody>
            {history.map((commit) => {
              const revision = revisions[commit.hash] || '—';

              debug.log('[RevisionHistoryTab] UI row commit', commit.hash, 'revision:', revision);
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
