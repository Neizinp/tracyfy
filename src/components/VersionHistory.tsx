import React, { useState, useEffect } from 'react';
import { X, Clock, Save, Tag, GitCommit } from 'lucide-react';
import type { ProjectBaseline, CommitInfo } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { realGitService } from '../services/realGitService';

interface VersionHistoryProps {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  projectId: string;
  onClose: () => void;
  onCreateBaseline: (name: string, message: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  baselines,
  projectId,
  onClose,
  onCreateBaseline,
}) => {
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
  const [activeTab, setActiveTab] = useState<'baselines' | 'commits'>('baselines');
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [baselineCommitHashes, setBaselineCommitHashes] = useState<Map<string, string[]>>(
    new Map()
  );
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);

  // Default name generation
  const nextBaselineNumber = `v${baselines.length + 1} .0`;

  const [baselineName, setBaselineName] = useState(nextBaselineNumber);
  const [baselineMessage, setBaselineMessage] = useState('');

  // Load commits when tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'commits') {
      loadCommits();
    }
  }, [isOpen, activeTab]);

  const loadCommits = async () => {
    if (!projectId) {
      console.log('[VersionHistory] No projectId, skipping commit load');
      return;
    }

    setIsLoadingCommits(true);
    try {
      // Get commits ONLY for the current project file
      const projectFilePath = `projects/${projectId}.md`;
      console.log('[VersionHistory] Loading commits for project file:', projectFilePath);
      const history = await realGitService.getHistory(projectFilePath);
      console.log('[VersionHistory] Commits loaded for project:', history.length, history);
      setCommits(history);

      const tags = await realGitService.getTagsWithDetails();
      console.log('[VersionHistory] Tags loaded:', tags);
      // Map commit hash to array of tag names (multiple tags can point to same commit)
      const hashToTagNames = new Map<string, string[]>();
      tags.forEach((tag) => {
        const existing = hashToTagNames.get(tag.commit) || [];
        existing.push(tag.name);
        hashToTagNames.set(tag.commit, existing);
      });
      console.log('[VersionHistory] Hash to tags map:', hashToTagNames);
      setBaselineCommitHashes(hashToTagNames);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setIsLoadingCommits(false);
    }
  };

  // Update default name when modal opens for creating
  const handleStartCreating = () => {
    setBaselineName(`v${baselines.length + 1} .0`);
    setBaselineMessage('');
    setIsCreatingBaseline(true);
  };

  if (!isOpen) return null;

  const handleCreateBaselineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (baselineName.trim()) {
      onCreateBaseline(
        baselineName.trim(),
        baselineMessage.trim() || `Baseline ${baselineName.trim()} `
      );
      setBaselineName('');
      setBaselineMessage('');
      setIsCreatingBaseline(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        // no blur
      }}
    >
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '800px',
          maxWidth: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} />
            Project History
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('baselines')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === 'baselines' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'baselines' ? '#3b82f6' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Tag size={16} />
            Baselines
          </button>
          <button
            onClick={() => setActiveTab('commits')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'commits' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'commits' ? '#3b82f6' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <GitCommit size={16} />
            Commits
          </button>
        </div>

        {/* Create Baseline (only show on baselines tab) */}
        {activeTab === 'baselines' && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {!isCreatingBaseline ? (
              <button
                onClick={handleStartCreating}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500,
                }}
              >
                <Save size={14} />
                Create Baseline
              </button>
            ) : (
              <form
                onSubmit={handleCreateBaselineSubmit}
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <input
                  type="text"
                  value={baselineName}
                  onChange={(e) => setBaselineName(e.target.value)}
                  placeholder="Name (e.g. v1.0)"
                  autoFocus
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    width: '120px',
                  }}
                />
                <input
                  type="text"
                  value={baselineMessage}
                  onChange={(e) => setBaselineMessage(e.target.value)}
                  placeholder="Description (optional)"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    width: '200px',
                  }}
                />
                <button
                  type="submit"
                  disabled={!baselineName.trim()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    opacity: baselineName.trim() ? 1 : 0.5,
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingBaseline(false);
                    setBaselineName('');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--spacing-md)',
          }}
        >
          {activeTab === 'baselines' ? (
            // Baselines List
            baselines.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Tag size={48} style={{ opacity: 1, marginBottom: '12px' }} />
                <p>No baselines found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {baselines.map((baseline) => (
                  <div
                    key={baseline.id}
                    style={{
                      padding: 'var(--spacing-md)',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-success)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {formatDateTime(baseline.timestamp)}
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Tag size={10} />
                            {baseline.version}
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {baseline.description || baseline.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : // Commits List
          isLoadingCommits ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <p>Loading commits...</p>
            </div>
          ) : commits.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <GitCommit size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p>No commits yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {commits.map((commit, index) => {
                const baselineTags = baselineCommitHashes.get(commit.hash);
                const isBaseline = baselineTags && baselineTags.length > 0;

                return (
                  <div
                    key={commit.hash}
                    style={{
                      padding: 'var(--spacing-md)',
                      borderRadius: '6px',
                      border: isBaseline
                        ? '1px solid rgba(59, 130, 246, 0.5)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isBaseline
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'var(--color-bg-secondary)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ marginTop: '2px' }}>
                        {isBaseline ? (
                          <Tag size={16} style={{ color: '#3b82f6' }} />
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
                          {isBaseline &&
                            baselineTags.map((tagName) => (
                              <span
                                key={tagName}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                  color: '#93c5fd',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                }}
                              >
                                <Tag size={10} />
                                {tagName}
                              </span>
                            ))}
                          {index === 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: '#4ade80',
                                fontSize: '0.75rem',
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
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {commit.hash.substring(0, 7)}
                          </span>
                          <span>•</span>
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{formatDateTime(commit.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {activeTab === 'baselines'
            ? '💡 Tip: Create baselines to save named snapshots of your project (e.g., "v1.0 Release").'
            : '💡 Tip: Commits with a tag badge are also baselines.'}
        </div>
      </div>
    </div>
  );
};
