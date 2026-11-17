/**
 * VersionHistory Component
 *
 * Displays project baselines and commit history.
 * Uses useVersionHistory hook for state and logic.
 */

import React from 'react';
import { X, Clock, Tag, GitCommit } from 'lucide-react';
import type { ProjectBaseline } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { SnapshotViewer } from './SnapshotViewer';
import { useVersionHistory } from '../hooks/useVersionHistory';
import { CommitCard, CommitFilters, CreateBaselineForm, BaselineCard } from './versionHistory';

interface VersionHistoryProps {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  onClose: () => void;
  onCreateBaseline: (name: string, message: string) => void;
  onSelectArtifact?: (artifactId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  baselines,
  onClose,
  onCreateBaseline,
  onSelectArtifact,
}) => {
  // Use the extracted hook for all state and logic
  const {
    activeTab,
    setActiveTab,
    isCreatingBaseline,
    setIsCreatingBaseline,
    baselineName,
    setBaselineName,
    baselineMessage,
    setBaselineMessage,
    handleStartCreating,
    handleCreateBaselineSubmit,
    commits,
    filteredCommits,
    isLoadingCommits,
    commitFiles,
    baselineCommitHashes,
    selectedTypes,
    handleToggleType,
    handleSelectAll,
    handleDeselectAll,
    viewingSnapshot,
    setViewingSnapshot,
  } = useVersionHistory({
    isOpen,
    baselines,
    onCreateBaseline,
  });

  useKeyboardShortcuts({
    onSave: isCreatingBaseline ? handleCreateBaselineSubmit : undefined,
    onClose: onClose,
  });

  if (!isOpen) return null;

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--color-info)' : '2px solid transparent',
    color: isActive ? 'var(--color-info)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontWeight: 500,
  });

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
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="History"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          width: '800px',
          maxWidth: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        {/* Header */}
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
            History
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
            style={tabStyle(activeTab === 'baselines')}
          >
            <Tag size={16} />
            Baselines
          </button>
          <button onClick={() => setActiveTab('commits')} style={tabStyle(activeTab === 'commits')}>
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
            <CreateBaselineForm
              isCreating={isCreatingBaseline}
              baselineName={baselineName}
              baselineMessage={baselineMessage}
              onStartCreating={handleStartCreating}
              onNameChange={setBaselineName}
              onMessageChange={setBaselineMessage}
              onSubmit={handleCreateBaselineSubmit}
              onCancel={() => {
                setIsCreatingBaseline(false);
                setBaselineName('');
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
          {activeTab === 'baselines' &&
            (baselines.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Tag size={48} style={{ opacity: 1, marginBottom: '12px' }} />
                <p>No baselines yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {baselines.map((baseline) => (
                  <BaselineCard
                    key={baseline.name}
                    baseline={baseline}
                    versionLabel={baseline.name}
                    onView={() => {
                      setViewingSnapshot({
                        commitHash: baseline.commit,
                        name: baseline.name,
                        timestamp: baseline.timestamp,
                      });
                    }}
                  />
                ))}
              </div>
            ))}

          {activeTab === 'commits' &&
            (isLoadingCommits ? (
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
                <p>No commits in repository.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CommitFilters
                  selectedTypes={selectedTypes}
                  onToggleType={handleToggleType}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
                {filteredCommits.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--spacing-xl)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <p>No commits match the selected filters.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredCommits.map((commit, index) => (
                      <CommitCard
                        key={commit.hash}
                        commit={commit}
                        isFirst={index === 0}
                        baselineTags={baselineCommitHashes.get(commit.hash) || []}
                        commitFiles={commitFiles.get(commit.hash)}
                        onSelectArtifact={onSelectArtifact}
                        onClose={onClose}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
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
            : '💡 Tip: Use the filter buttons to show commits for specific artifact types.'}
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
