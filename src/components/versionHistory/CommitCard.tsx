/**
 * CommitCard Component
 *
 * Reusable component for displaying a single commit in the version history.
 * Used in both "Project Commits" and "All Commits" tabs.
 */

import React from 'react';
import { Tag, GitCommit } from 'lucide-react';
import type { CommitInfo } from '../../services/realGitService';
import { formatDateTime } from '../../utils/dateUtils';
import { getArtifactTypeFromPath } from '../../hooks/useVersionHistory';

interface CommitCardProps {
  commit: CommitInfo;
  isFirst: boolean;
  baselineTags?: string[];
  commitFiles?: string[];
  onSelectArtifact?: (artifactId: string, artifactType: string) => void;
  onClose?: () => void;
}

export const CommitCard: React.FC<CommitCardProps> = ({
  commit,
  isFirst,
  baselineTags = [],
  commitFiles,
  onSelectArtifact,
  onClose,
}) => {
  const isBaseline = baselineTags.length > 0;

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: '6px',
        border: isBaseline ? '1px solid var(--color-info-bg)' : '1px solid var(--color-border)',
        backgroundColor: isBaseline ? 'var(--color-info-bg)' : 'var(--color-bg-secondary)',
        transition: 'background-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ marginTop: '2px' }}>
          {isBaseline ? (
            <Tag size={16} style={{ color: 'var(--color-info)' }} />
          ) : (
            <GitCommit size={16} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {commit.message.split('\n')[0]}
            </span>
            {baselineTags.map((tagName) => (
              <span
                key={tagName}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-info-bg)',
                  color: 'var(--color-info-light)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                }}
              >
                <Tag size={10} />
                {tagName}
              </span>
            ))}
            {isFirst && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-success-bg)',
                  color: 'var(--color-success-light)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                }}
              >
                HEAD
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
              {commit.hash?.substring(0, 7) || 'unknown'}
            </span>
            <span>•</span>
            <span>{commit.author}</span>
            <span>•</span>
            <span>{formatDateTime(commit.timestamp)}</span>
            {commitFiles !== undefined && (
              <>
                <span>•</span>
                {(() => {
                  const filePath = commitFiles[0];
                  if (!filePath) {
                    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
                  }
                  const fileName = filePath.split('/').pop()?.replace('.md', '') || '';
                  const artifactType = getArtifactTypeFromPath(filePath);
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectArtifact) {
                          onSelectArtifact(fileName, artifactType);
                          onClose?.();
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--color-accent)',
                        fontWeight: 500,
                        cursor: onSelectArtifact ? 'pointer' : 'default',
                        textDecoration: onSelectArtifact ? 'underline' : 'none',
                        font: 'inherit',
                      }}
                      disabled={!onSelectArtifact}
                    >
                      {fileName}
                    </button>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
