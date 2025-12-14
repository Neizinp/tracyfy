import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Save, Tag, GitCommit } from 'lucide-react';
import type { ProjectBaseline, CommitInfo } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { realGitService } from '../services/realGitService';

interface VersionHistoryProps {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  projectName: string | null;
  onClose: () => void;
  onCreateBaseline: (name: string, message: string) => void;
  onSelectArtifact?: (artifactId: string, artifactType: string) => void;
}

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { SnapshotViewer } from './SnapshotViewer';

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  baselines,
  projectName,
  onClose,
  onCreateBaseline,
  onSelectArtifact,
}) => {
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
  const [activeTab, setActiveTab] = useState<'baselines' | 'commits' | 'global'>('baselines');
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [globalCommits, setGlobalCommits] = useState<CommitInfo[]>([]);
  const [baselineCommitHashes, setBaselineCommitHashes] = useState<Map<string, string[]>>(
    new Map()
  );
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [isLoadingGlobalCommits, setIsLoadingGlobalCommits] = useState(false);
  const [commitFiles, setCommitFiles] = useState<Map<string, string[]>>(new Map());

  // Project-specific baseline helpers
  const projectPrefix = projectName ? `[${projectName}] ` : '';
  const isProjectBaseline = (tagName: string) => projectName && tagName.startsWith(projectPrefix);
  const getVersionFromTag = (tagName: string) =>
    tagName.startsWith(projectPrefix) ? tagName.slice(projectPrefix.length) : tagName;

  // Filter baselines for current project
  const projectBaselines = baselines.filter((b) => isProjectBaseline(b.name));

  // Default name generation (count only project-specific baselines)
  const nextBaselineNumber = `${projectBaselines.length + 1}.0`;

  const [baselineName, setBaselineName] = useState(nextBaselineNumber);
  const [baselineMessage, setBaselineMessage] = useState('');

  const [viewingSnapshot, setViewingSnapshot] = useState<{
    commitHash: string;
    name: string;
    timestamp: number;
  } | null>(null);

  const [tagToCommitHash, setTagToCommitHash] = useState<Map<string, string>>(new Map());

  const loadTags = useCallback(async () => {
    try {
      const tags = await realGitService.getTagsWithDetails();
      console.log('[VersionHistory] Tags loaded:', tags);

      // Map commit hash to array of tag names for the commits view
      const hashToTags = new Map<string, string[]>();
      // Map tag name to commit hash for baseline view lookup
      const tagToHash = new Map<string, string>();

      tags.forEach((tag) => {
        // hash -> tags
        const existing = hashToTags.get(tag.commit) || [];
        existing.push(tag.name);
        hashToTags.set(tag.commit, existing);

        // tag -> hash
        tagToHash.set(tag.name, tag.commit);
      });

      setBaselineCommitHashes(hashToTags);
      setTagToCommitHash(tagToHash);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const loadCommits = useCallback(async () => {
    if (!projectName) return;

    setIsLoadingCommits(true);
    try {
      const projectFilePath = `projects/${projectName}.md`;
      const history = await realGitService.getHistory(projectFilePath);
      setCommits(history);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setIsLoadingCommits(false);
    }
  }, [projectName]);

  // Load tags on open (needed for baseline view buttons)
  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen, loadTags]);

  // Load commits only when tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'commits') {
      loadCommits();
    }
  }, [isOpen, activeTab, loadCommits]);

  // Load global commits when global tab is active
  const loadGlobalCommits = useCallback(async () => {
    setIsLoadingGlobalCommits(true);
    try {
      const history = await realGitService.getHistory(); // No filepath = all commits
      setGlobalCommits(history);

      // Load files for each commit in parallel
      const filesMap = new Map<string, string[]>();
      await Promise.all(
        history.map(async (commit) => {
          const files = await realGitService.getCommitFiles(commit.hash);
          filesMap.set(commit.hash, files);
        })
      );
      setCommitFiles(filesMap);
    } catch (error) {
      console.error('Failed to load global commits:', error);
    } finally {
      setIsLoadingGlobalCommits(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'global') {
      loadGlobalCommits();
    }
  }, [isOpen, activeTab, loadGlobalCommits]);

  // Update default name when modal opens for creating
  const handleStartCreating = () => {
    setBaselineName(`${projectBaselines.length + 1}.0`);
    setBaselineMessage('');
    setIsCreatingBaseline(true);
  };

  const handleCreateBaselineSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (baselineName.trim() && projectName) {
      // Prepend project name to create project-specific baseline
      const fullTagName = `${projectPrefix}${baselineName.trim()}`;
      onCreateBaseline(
        fullTagName,
        baselineMessage.trim() || `Baseline ${baselineName.trim()} for ${projectName}`
      );
      setBaselineName('');
      setBaselineMessage('');
      setIsCreatingBaseline(false);
    }
  };

  useKeyboardShortcuts({
    onSave: isCreatingBaseline ? handleCreateBaselineSubmit : undefined,
    onClose: onClose,
  });

  if (!isOpen) return null;

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
          backgroundColor: 'var(--color-bg-card)',
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
                activeTab === 'baselines' ? '2px solid var(--color-info)' : '2px solid transparent',
              color: activeTab === 'baselines' ? 'var(--color-info)' : 'var(--color-text-muted)',
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
              borderBottom:
                activeTab === 'commits' ? '2px solid var(--color-info)' : '2px solid transparent',
              color: activeTab === 'commits' ? 'var(--color-info)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <GitCommit size={16} />
            {projectName ? `${projectName} Commits` : 'Project Commits'}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === 'global' ? '2px solid var(--color-info)' : '2px solid transparent',
              color: activeTab === 'global' ? 'var(--color-info)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <GitCommit size={16} />
            All Commits
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
                  backgroundColor: 'var(--color-info)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
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
                  placeholder="Name (e.g. 1.0)"
                  autoFocus
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
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
                    fontSize: 'var(--font-size-sm)',
                    width: '200px',
                  }}
                />
                <button
                  type="submit"
                  disabled={!baselineName.trim()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-info)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
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
                    fontSize: 'var(--font-size-sm)',
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
            projectBaselines.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Tag size={48} style={{ opacity: 1, marginBottom: '12px' }} />
                <p>No baselines found for this project.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projectBaselines.map((baseline) => (
                  <div
                    key={baseline.id}
                    style={{
                      padding: 'var(--spacing-md)',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
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
                            fontSize: 'var(--font-size-sm)',
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
                              backgroundColor: 'var(--color-info)',
                              color: 'white',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Tag size={10} />
                            {getVersionFromTag(baseline.name)}
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
                      <button
                        onClick={() => {
                          // Try to find commit hash from tag map first
                          const commitFromTag = tagToCommitHash.get(baseline.version);
                          // Fallback to artifact commit if tag not found (legacy or untagged?)
                          const fallbackCommit = Object.keys(baseline.artifactCommits)[0] || '';

                          setViewingSnapshot({
                            commitHash: commitFromTag || fallbackCommit,
                            name: baseline.version,
                            timestamp: baseline.timestamp,
                          });
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-xs)',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'commits' ? (
            // Project Commits List
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
                          ? '1px solid var(--color-info-bg)'
                          : '1px solid var(--color-border)',
                        backgroundColor: isBaseline
                          ? 'var(--color-info-bg)'
                          : 'var(--color-bg-secondary)',
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
                            {index === 0 && (
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
                            <span
                              style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}
                            >
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
            )
          ) : null}

          {/* Global Commits List */}
          {activeTab === 'global' &&
            (isLoadingGlobalCommits ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <p>Loading all commits...</p>
              </div>
            ) : globalCommits.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <GitCommit size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p>No commits in repository.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {globalCommits.map((commit, index) => {
                  const baselineTags = baselineCommitHashes.get(commit.hash);
                  const isBaseline = baselineTags && baselineTags.length > 0;

                  return (
                    <div
                      key={commit.hash}
                      style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: '6px',
                        border: isBaseline
                          ? '1px solid var(--color-info-bg)'
                          : '1px solid var(--color-border)',
                        backgroundColor: isBaseline
                          ? 'var(--color-info-bg)'
                          : 'var(--color-bg-secondary)',
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
                            {index === 0 && (
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
                            <span
                              style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}
                            >
                              {commit.hash.substring(0, 7)}
                            </span>
                            <span>•</span>
                            <span>{commit.author}</span>
                            <span>•</span>
                            <span>{formatDateTime(commit.timestamp)}</span>
                            <span>•</span>
                            {(() => {
                              const filePath = commitFiles.get(commit.hash)?.[0];
                              if (!commitFiles.has(commit.hash)) {
                                return (
                                  <span style={{ color: 'var(--color-text-muted)' }}>...</span>
                                );
                              }
                              if (!filePath) {
                                return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
                              }
                              const fileName = filePath.split('/').pop()?.replace('.md', '') || '';
                              const artifactType = filePath.split('/')[0]; // e.g., "requirements", "usecases"
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectArtifact) {
                                      onSelectArtifact(fileName, artifactType);
                                      onClose();
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
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {activeTab === 'baselines'
            ? '💡 Tip: Create baselines to save named snapshots of your project (e.g., "v1.0 Release").'
            : activeTab === 'commits'
              ? '💡 Tip: Shows commits to the project file only (project metadata changes).'
              : '💡 Tip: Shows all commits across all files (artifacts, projects, etc.).'}
        </div>
      </div>

      {viewingSnapshot && (
        <SnapshotViewer
          isOpen={true}
          onClose={() => setViewingSnapshot(null)}
          commitHash={viewingSnapshot.commitHash}
          baselineName={viewingSnapshot.name}
          timestamp={viewingSnapshot.timestamp}
        />
      )}
    </div>
  );
};
