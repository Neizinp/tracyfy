import React, { useMemo, useState } from 'react';
import { debug } from '../utils/debug';
import { useParams, Navigate } from 'react-router-dom';
import { BaselineRevisionHistory } from '../components';
import { useBaselines, useProject, useGlobalState } from '../app/providers';
import { activeIds } from '../utils/activeArtifacts';
import type { ProjectBaseline } from '../types';

export const BaselineHistoryPage: React.FC = () => {
  const { baselines } = useBaselines();
  const { project } = useProject();
  const { requirements, useCases, testCases, information } = useGlobalState();
  const { baselineId } = useParams<{ baselineId: string }>();
  const [compareToCurrent, setCompareToCurrent] = useState(false);
  // When this page was opened: the time of the "current state" pseudo-baseline
  const [openedAt] = useState(() => Date.now());

  // Generate a pseudo-baseline for the current state
  // Moved before conditional returns to avoid conditional hook call
  const currentStateBaseline: ProjectBaseline = useMemo(() => {
    const artifactCommits: ProjectBaseline['artifactCommits'] = {};
    // Every artifact in the project folder
    const add = (ids: string[], type: ProjectBaseline['artifactCommits'][string]['type']) =>
      ids.forEach((id) => {
        artifactCommits[id] = { commitHash: '', type };
      });
    add(activeIds(requirements), 'requirement');
    add(activeIds(useCases), 'useCase');
    add(activeIds(testCases), 'testCase');
    add(activeIds(information), 'information');
    // We'll fill commit hashes in BaselineRevisionHistory (it already fetches history)
    return {
      id: 'current-state',
      version: 'Current',
      name: 'Current State',
      description: 'Current project state',
      timestamp: openedAt,
      artifactCommits,
      addedArtifacts: [],
      removedArtifacts: [],
    };
  }, [requirements, useCases, testCases, information, openedAt]);

  if (!baselineId) {
    return <Navigate to="/baselines" replace />;
  }

  const selectedBaseline = baselines.find((b) => b.id === baselineId);
  if (!selectedBaseline) {
    return <Navigate to="/baselines" replace />;
  }

  // Allow user to select comparison target
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button
          onClick={() => setCompareToCurrent(false)}
          style={{
            background: !compareToCurrent ? 'var(--color-accent-bg)' : 'transparent',
            color: !compareToCurrent ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Compare to Previous Baseline
        </button>
        <button
          onClick={() => setCompareToCurrent(true)}
          style={{
            background: compareToCurrent ? 'var(--color-accent-bg)' : 'transparent',
            color: compareToCurrent ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Compare to Current State
        </button>
      </div>
      <BaselineRevisionHistory
        projectName={project.name}
        currentBaseline={compareToCurrent ? currentStateBaseline : selectedBaseline}
        previousBaseline={
          compareToCurrent
            ? selectedBaseline
            : baselines.find(
                (b) =>
                  b.version ===
                  (parseInt(selectedBaseline.version || '0') - 1).toString().padStart(2, '0')
              ) || null
        }
        onViewArtifact={(artifactId: string, commitHash: string) => {
          debug.log('View artifact', artifactId, commitHash);
          alert(`View artifact ${artifactId} at ${commitHash} - Not implemented yet`);
        }}
      />
    </div>
  );
};
